import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
  SITE_CHAT_SERVER_LIMITS,
  isAllowedSiteOrigin,
  prepareSiteMessage,
  validateRequestId,
} from "../_shared/site-chat-core.mjs";

const jsonHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

const errorResponse = (origin: string, status: number, code: string, error: string) =>
  new Response(JSON.stringify({ error, code }), { status, headers: jsonHeaders(origin) });

const userHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin = req.headers.get("origin") ?? "";
  if (!isAllowedSiteOrigin(origin)) return errorResponse(origin, 403, "origin_denied", "Request origin is not allowed.");
  if (req.method !== "POST") return errorResponse(origin, 405, "method_not_allowed", "POST is required.");

  let payload: { body?: unknown; reply_to?: unknown; request_id?: unknown };
  try {
    payload = await req.json();
  } catch {
    return errorResponse(origin, 400, "invalid_json", "Request body must be valid JSON.");
  }

  const userId = String(ctx.userClaims?.sub ?? ctx.userClaims?.id ?? "");
  if (!userId) return errorResponse(origin, 401, "unauthorized", "Sign in is required.");

  const requestId = payload.request_id ? String(payload.request_id) : crypto.randomUUID();
  const requestCheck = validateRequestId(requestId);
  if (!requestCheck.ok) return errorResponse(origin, 400, "invalid_request_id", requestCheck.error);

  const admin = ctx.supabaseAdmin;

  // Retry safety: return the original write for the same authenticated user/request id.
  const { data: existing, error: existingError } = await admin
    .from("site_chat_messages")
    .select("id,created_at")
    .eq("author_id", userId)
    .eq("request_id", requestCheck.value)
    .maybeSingle();
  if (existingError) return errorResponse(origin, 500, "lookup_failed", "Could not verify the message request.");
  if (existing) {
    return new Response(JSON.stringify({ id: existing.id, created_at: existing.created_at, replayed: true }), {
      status: 200,
      headers: jsonHeaders(origin),
    });
  }

  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] = await Promise.all([
    admin.from("site_profiles").select("user_id,is_banned,banned_until,muted_until,last_post_at").eq("user_id", userId).maybeSingle(),
    admin.from("site_chat_settings").select("posting_paused,pause_message").eq("id", true).maybeSingle(),
  ]);
  if (profileError || settingsError) return errorResponse(origin, 500, "state_lookup_failed", "Could not verify chat state.");

  let reply = null;
  if (payload.reply_to != null) {
    const replyId = String(payload.reply_to);
    const { data, error } = await admin.from("site_chat_messages").select("id,deleted_at").eq("id", replyId).maybeSingle();
    if (error) return errorResponse(origin, 500, "reply_lookup_failed", "Could not verify the reply target.");
    reply = data ?? { id: "", deleted_at: null };
  }

  const now = Date.now();
  const prepared = prepareSiteMessage({
    userId,
    profile,
    settings: settings ?? { posting_paused: false },
    body: payload.body,
    reply,
    requestId: requestCheck.value,
    now,
  });
  if (!prepared.ok) return errorResponse(origin, prepared.status, prepared.code, prepared.error);

  // Atomic claim prevents concurrent calls from bypassing the 3-second cooldown.
  const { data: claimed, error: claimError } = await admin.rpc("claim_site_chat_post_slot", {
    p_user_id: userId,
    p_now: new Date(now).toISOString(),
    p_min_spacing: `${SITE_CHAT_SERVER_LIMITS.minSpacingMs} milliseconds`,
  });
  if (claimError) return errorResponse(origin, 500, "rate_limit_failed", "Could not verify posting limits.");
  if (!claimed) return errorResponse(origin, 429, "rate_limited", "Please slow down.");

  const { data: inserted, error: insertError } = await admin
    .from("site_chat_messages")
    .insert(prepared.row)
    .select("id,created_at")
    .single();
  if (insertError || !inserted) return errorResponse(origin, 500, "insert_failed", "Message could not be sent.");

  return new Response(JSON.stringify({ id: inserted.id, created_at: inserted.created_at }), {
    status: 201,
    headers: jsonHeaders(origin),
  });
});

export default {
  async fetch(req: Request) {
    const origin = req.headers.get("origin") ?? "";
    if (req.method === "OPTIONS") {
      if (!isAllowedSiteOrigin(origin)) return errorResponse(origin, 403, "origin_denied", "Request origin is not allowed.");
      return new Response(null, { status: 204, headers: jsonHeaders(origin) });
    }
    return userHandler(req);
  },
};
