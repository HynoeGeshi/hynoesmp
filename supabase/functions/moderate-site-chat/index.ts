import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { containsBlockedChatContent, isAllowedSiteOrigin } from "../_shared/site-chat-core.mjs";
import { validateSiteDisplayName } from "../_shared/site-profile-name-core.mjs";
import {
  isSiteModeratorRole,
  normalizeAnnouncementInput,
  normalizeHelpReviewInput,
  parseModerationUntil,
  validateModerationAction,
} from "../_shared/site-moderation-core.mjs";

const headers = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});
const respond = (origin: string, status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: headers(origin) });

const userHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin = req.headers.get("origin") ?? "";
  if (!isAllowedSiteOrigin(origin)) return respond(origin, 403, { error: "Request origin is not allowed.", code: "origin_denied" });
  if (req.method !== "POST") return respond(origin, 405, { error: "POST is required.", code: "method_not_allowed" });

  const moderatorId = String(ctx.userClaims?.sub ?? ctx.userClaims?.id ?? "");
  if (!moderatorId) return respond(origin, 401, { error: "Sign in is required.", code: "unauthorized" });
  const admin = ctx.supabaseAdmin;
  const { data: moderator, error: moderatorError } = await admin.from("site_profiles").select("user_id,role").eq("user_id", moderatorId).maybeSingle();
  if (moderatorError) return respond(origin, 500, { error: "Could not verify moderator access.", code: "moderator_lookup_failed" });
  if (!isSiteModeratorRole(moderator?.role)) return respond(origin, 403, { error: "Moderator access is required.", code: "forbidden" });

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return respond(origin, 400, { error: "Request body must be valid JSON.", code: "invalid_json" }); }
  const actionCheck = validateModerationAction(payload.action);
  if (!actionCheck.ok) return respond(origin, 400, { error: actionCheck.error, code: "invalid_action" });
  const action = actionCheck.value;

  if (action === "dashboard") {
    const [messages, reports, users, announcements, settings, audit, helpFeedback, nameHistory] = await Promise.all([
      admin.from("site_chat_public_messages").select("*").order("created_at", { ascending: false }).limit(50),
      admin.from("site_chat_reports").select("id,message_id,reporter_id,reason,details,created_at,resolved_at").is("resolved_at", null).order("created_at", { ascending: false }).limit(50),
      admin.from("site_profiles").select("user_id,display_name,role,muted_until,banned_until,is_banned").or(`is_banned.eq.true,muted_until.gt.${new Date().toISOString()}`).limit(100),
      admin.from("site_announcements").select("*").order("created_at", { ascending: false }).limit(20),
      admin.from("site_chat_settings").select("posting_paused,pause_message,updated_at").eq("id", true).maybeSingle(),
      admin.from("site_moderation_audit").select("id,action_type,moderator_id,target_user_id,target_message_id,reason,metadata,created_at").order("created_at", { ascending: false }).limit(50),
      admin.from("site_help_feedback").select("id,user_id,request_id,question,answer_summary,helpful,unanswered,source_ids,mode,confidence,page_path,review_status,review_note,created_at,updated_at").neq("review_status", "resolved").neq("review_status", "ignored").or("unanswered.eq.true,helpful.eq.false").order("created_at", { ascending: false }).limit(100),
      admin.from("site_profile_name_history").select("id,user_id,old_display_name,new_display_name,changed_by,change_type,reason,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    const failed = [messages, reports, users, announcements, settings, audit, helpFeedback, nameHistory].find((r) => r.error);
    if (failed?.error) return respond(origin, 500, { error: "Admin dashboard could not be loaded.", code: "dashboard_failed" });
    return respond(origin, 200, {
      ok: true,
      messages: messages.data ?? [], reports: reports.data ?? [], moderated_users: users.data ?? [],
      announcements: announcements.data ?? [], settings: settings.data ?? null, audit: audit.data ?? [],
      help_feedback: helpFeedback.data ?? [], name_history: nameHistory.data ?? [],
    });
  }

  if (action === "review_help_feedback") {
    const reviewCheck = normalizeHelpReviewInput(payload);
    if (!reviewCheck.ok) return respond(origin, 400, { error: reviewCheck.error, code: "invalid_help_review" });
    const { feedback_id, review_status, review_note } = reviewCheck.value;
    const { data: updated, error: reviewError } = await admin
      .from("site_help_feedback")
      .update({ review_status, review_note, reviewed_by: moderatorId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", feedback_id)
      .select("id,user_id,request_id,review_status")
      .maybeSingle();
    if (reviewError) return respond(origin, 500, { error: "Ask Hynoe review could not be saved.", code: "help_review_failed" });
    if (!updated) return respond(origin, 404, { error: "Ask Hynoe feedback item was not found.", code: "help_feedback_not_found" });
    const { error: auditError } = await admin.from("site_moderation_audit").insert({
      action_type: action, moderator_id: moderatorId, target_user_id: updated.user_id, target_message_id: null,
      reason: review_note, metadata: { feedback_id, request_id: updated.request_id, review_status },
    });
    if (auditError) return respond(origin, 500, { error: "Action succeeded, but audit logging failed.", code: "audit_failed" });
    return respond(origin, 200, { ok: true, feedback_id, review_status });
  }

  const reason = String(payload.reason ?? "").trim().slice(0, 500) || null;
  let targetUserId: string | null = payload.target_user_id ? String(payload.target_user_id) : null;
  let targetMessageId: string | null = payload.target_message_id ? String(payload.target_message_id) : null;
  let metadata: Record<string, unknown> = {};
  let operationError = null;

  if (action === "tombstone_message") {
    if (!targetMessageId) return respond(origin, 400, { error: "Message id is required.", code: "invalid_target" });
    ({ error: operationError } = await admin.from("site_chat_messages").update({ deleted_at: new Date().toISOString(), deleted_by: moderatorId, moderation_reason: reason }).eq("id", targetMessageId));
  } else if (action === "mute_user") {
    if (!targetUserId) return respond(origin, 400, { error: "User id is required.", code: "invalid_target" });
    const until = parseModerationUntil(payload.until, Date.now(), 30);
    if (!until.ok) return respond(origin, 400, { error: until.error, code: "invalid_expiry" });
    metadata = { until: until.value };
    ({ error: operationError } = await admin.from("site_profiles").update({ muted_until: until.value }).eq("user_id", targetUserId));
  } else if (action === "ban_user") {
    if (!targetUserId) return respond(origin, 400, { error: "User id is required.", code: "invalid_target" });
    const until = payload.until ? parseModerationUntil(payload.until, Date.now(), 365) : { ok: true, value: null };
    if (!until.ok) return respond(origin, 400, { error: until.error, code: "invalid_expiry" });
    metadata = { until: until.value };
    ({ error: operationError } = await admin.from("site_profiles").update({ is_banned: true, banned_until: until.value }).eq("user_id", targetUserId));
  } else if (action === "unban_user") {
    if (!targetUserId) return respond(origin, 400, { error: "User id is required.", code: "invalid_target" });
    ({ error: operationError } = await admin.from("site_profiles").update({ is_banned: false, banned_until: null, muted_until: null }).eq("user_id", targetUserId));
  } else if (action === "rename_user") {
    if (!targetUserId) return respond(origin, 400, { error: "User id is required.", code: "invalid_target" });
    const checked = validateSiteDisplayName(payload.display_name);
    if (!checked.ok) return respond(origin, 400, { error: checked.error, code: "invalid_display_name" });
    if (containsBlockedChatContent(checked.value)) return respond(origin, 400, { error: "That display name is not allowed.", code: "filtered_display_name" });
    const renamed = await admin.rpc("rename_site_profile", {
      p_target_user_id: targetUserId,
      p_new_display_name: checked.value,
      p_new_normalized_name: checked.normalized,
      p_actor_user_id: moderatorId,
      p_moderator_override: true,
      p_reason: reason,
    });
    if (renamed.error) {
      if (renamed.error.message?.includes("name_taken")) return respond(origin, 409, { error: "That display name is already taken.", code: "name_taken" });
      return respond(origin, 500, { error: "Moderator name correction failed.", code: "rename_failed" });
    }
    metadata = { display_name: checked.value, cooldown_bypassed: true };
  } else if (action === "resolve_report") {
    const reportId = String(payload.report_id ?? "");
    if (!reportId) return respond(origin, 400, { error: "Report id is required.", code: "invalid_target" });
    metadata = { report_id: reportId };
    ({ error: operationError } = await admin.from("site_chat_reports").update({ resolved_at: new Date().toISOString(), resolved_by: moderatorId }).eq("id", reportId));
  } else if (action === "set_announcement") {
    const announcement = normalizeAnnouncementInput(payload.announcement ?? payload);
    if (!announcement.ok) return respond(origin, 400, { error: announcement.error, code: "invalid_announcement" });
    const result = await admin.from("site_announcements").insert({ ...announcement.value, active: true, created_by: moderatorId }).select("id").single();
    operationError = result.error;
    metadata = { announcement_id: result.data?.id ?? null };
  } else if (action === "deactivate_announcement") {
    const announcementId = String(payload.announcement_id ?? "");
    if (!announcementId) return respond(origin, 400, { error: "Announcement id is required.", code: "invalid_target" });
    metadata = { announcement_id: announcementId };
    ({ error: operationError } = await admin.from("site_announcements").update({ active: false }).eq("id", announcementId));
  } else if (action === "set_chat_pause") {
    const postingPaused = payload.posting_paused === true;
    const pauseMessage = String(payload.pause_message ?? "").trim().slice(0, 300) || null;
    metadata = { posting_paused: postingPaused };
    ({ error: operationError } = await admin.from("site_chat_settings").update({ posting_paused: postingPaused, pause_message: pauseMessage, updated_at: new Date().toISOString(), updated_by: moderatorId }).eq("id", true));
  }

  if (operationError) return respond(origin, 500, { error: "Moderation action failed.", code: "action_failed" });
  const { error: auditError } = await admin.from("site_moderation_audit").insert({
    action_type: action, moderator_id: moderatorId, target_user_id: targetUserId,
    target_message_id: targetMessageId, reason, metadata,
  });
  if (auditError) return respond(origin, 500, { error: "Action completed but audit recording failed.", code: "audit_failed" });
  return respond(origin, 200, { ok: true, action });
});

export default {
  async fetch(req: Request) {
    const origin = req.headers.get("origin") ?? "";
    if (req.method === "OPTIONS") {
      if (!isAllowedSiteOrigin(origin)) return respond(origin, 403, { error: "Request origin is not allowed.", code: "origin_denied" });
      return new Response(null, { status: 204, headers: headers(origin) });
    }
    return userHandler(req);
  },
};