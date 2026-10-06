import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { isAllowedSiteOrigin } from "../_shared/site-chat-core.mjs";
import { validateAskInput, answerAskHynoe } from "../_shared/ask-hynoe-engine.mjs";
import { ASK_HYNOE_LIMITS, buildFeedbackRow } from "../_shared/ask-hynoe-core.mjs";

const headers = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

const fail = (origin: string, status: number, code: string, error: string) =>
  new Response(JSON.stringify({ error, code }), { status, headers: headers(origin) });

function configuredProvider() {
  const rawUrl = (Deno.env.get("HYNOE_HELP_PROVIDER_URL") ?? "").trim();
  const token = (Deno.env.get("HYNOE_HELP_PROVIDER_TOKEN") ?? "").trim();
  if (!rawUrl) return null;
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== "https:") return null;

  return {
    async generate(prompt: string, { signal }: { signal?: AbortSignal } = {}) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
        signal,
      });
      if (!response.ok) throw new Error("provider request failed");
      const data = await response.json();
      return { text: data?.answer ?? data?.text ?? data?.output_text ?? "" };
    },
  };
}

const userHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin = req.headers.get("origin") ?? "";
  if (!isAllowedSiteOrigin(origin)) return fail(origin, 403, "origin_denied", "Request origin is not allowed.");
  if (req.method !== "POST") return fail(origin, 405, "method_not_allowed", "POST is required.");

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return fail(origin, 400, "invalid_json", "Request body must be valid JSON."); }

  const userId = String(ctx.userClaims?.sub ?? ctx.userClaims?.id ?? "");
  if (!userId) return fail(origin, 401, "unauthorized", "Sign in is required.");
  const admin = ctx.supabaseAdmin;

  if (payload.action === "feedback") {
    const feedbackRequestId = String(payload.request_id ?? "");
    const helpful = payload.helpful;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(feedbackRequestId) || typeof helpful !== "boolean") {
      return fail(origin, 400, "invalid_feedback", "Feedback request is invalid.");
    }
    const { data: updated, error: updateError } = await admin
      .from("site_help_feedback")
      .update({ helpful, updated_at: new Date().toISOString() })
      .eq("request_id", feedbackRequestId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (updateError) return fail(origin, 500, "feedback_failed", "Feedback could not be saved.");
    if (!updated) return fail(origin, 404, "feedback_not_found", "That Ask Hynoe response was not found for this user.");
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: headers(origin) });
  }

  const checked = validateAskInput(payload);
  if (!checked.ok) return fail(origin, checked.status, checked.code, checked.error);
  const requestId = crypto.randomUUID();
  const started = Date.now();

  // Atomic request limiting is backed by the server-only site_help_request_metrics table.
  const { data: claimed, error: rateError } = await admin.rpc("claim_site_help_request_slot", {
    p_user_id: userId,
    p_request_id: requestId,
    p_now: new Date(started).toISOString(),
    p_window: `${ASK_HYNOE_LIMITS.windowMs} milliseconds`,
    p_max_requests: ASK_HYNOE_LIMITS.maxRequestsPerWindow,
  });
  if (rateError) return fail(origin, 500, "rate_limit_failed", "Could not verify request limits.");
  if (!claimed) return fail(origin, 429, "rate_limited", "Ask Hynoe is getting too many questions from this session. Try again shortly.");

  const { data: knowledge, error: knowledgeError } = await admin
    .from("site_help_knowledge")
    .select("index_json")
    .eq("id", true)
    .maybeSingle();
  if (knowledgeError || !knowledge || !Array.isArray(knowledge.index_json?.chunks)) {
    return fail(origin, 503, "knowledge_unavailable", "Ask Hynoe knowledge is temporarily unavailable.");
  }

  const result = await answerAskHynoe({
    question: checked.value.question,
    history: checked.value.history,
    pagePath: checked.value.page_path,
    chunks: knowledge.index_json.chunks,
    provider: configuredProvider(),
    providerTimeoutMs: 7000,
  });

  const latency = Math.min(120000, Math.max(0, Date.now() - started));
  const unanswered = result.confidence_label === "low" || result.conflict;
  const feedbackRow = buildFeedbackRow({
    userId,
    requestId,
    question: checked.value.question,
    answer: result.answer,
    sources: result.sources,
    mode: result.mode,
    confidence: result.confidence_label,
    pagePath: checked.value.page_path,
    unanswered,
  });

  const [metricWrite, feedbackWrite] = await Promise.all([
    admin.from("site_help_request_metrics").update({
      mode: result.mode,
      confidence: result.confidence_label,
      source_count: result.sources.length,
      latency_ms: latency,
    }).eq("request_id", requestId).eq("user_id", userId),
    admin.from("site_help_feedback").insert([feedbackRow]),
  ]);
  if (metricWrite.error) console.error("ask_hynoe_metric_write_failed", { requestId, code: metricWrite.error.code });
  if (feedbackWrite.error) console.error("ask_hynoe_feedback_write_failed", { requestId, code: feedbackWrite.error.code });

  return new Response(JSON.stringify({
    answer: result.answer,
    sources: result.sources.map(({ label, url }) => ({ label, url })),
    confidence: result.confidence,
    mode: result.mode,
    request_id: requestId,
  }), { status: 200, headers: headers(origin) });
});

Deno.serve((req) => {
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") {
    if (!isAllowedSiteOrigin(origin)) return fail(origin, 403, "origin_denied", "Request origin is not allowed.");
    return new Response(null, { status: 204, headers: headers(origin) });
  }
  return userHandler(req);
});
