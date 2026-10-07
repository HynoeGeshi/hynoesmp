import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { containsBlockedChatContent, isAllowedSiteOrigin } from "../_shared/site-chat-core.mjs";
import { getSiteRenameEligibility, validateSiteDisplayName } from "../_shared/site-profile-name-core.mjs";

const jsonHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

const respond = (origin: string, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders(origin) });

function publicStatus(profile: Record<string, unknown>) {
  const eligibility = getSiteRenameEligibility(profile);
  return {
    display_name: profile.display_name,
    rename_count: Number(profile.rename_count ?? 0),
    last_renamed_at: profile.last_renamed_at ?? null,
    can_rename: eligibility.allowed,
    free_correction: eligibility.free_correction,
    next_allowed_at: eligibility.next_allowed_at,
  };
}

function mapRenameError(message = '') {
  if (message.includes('name_taken')) return { status: 409, code: 'name_taken', error: 'That display name is already taken.' };
  if (message.includes('rename_cooldown')) return { status: 409, code: 'rename_cooldown', error: 'You can only change your name once every 30 days after your free correction.' };
  if (message.includes('profile_not_found')) return { status: 404, code: 'profile_not_found', error: 'Your community profile could not be found.' };
  return { status: 500, code: 'rename_failed', error: 'Display name could not be changed.' };
}

const userHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin = req.headers.get("origin") ?? "";
  if (!isAllowedSiteOrigin(origin)) return respond(origin, 403, { error: 'Request origin is not allowed.', code: 'origin_denied' });
  if (req.method !== 'POST') return respond(origin, 405, { error: 'POST is required.', code: 'method_not_allowed' });

  const userId = String(ctx.userClaims?.sub ?? ctx.userClaims?.id ?? '');
  if (!userId) return respond(origin, 401, { error: 'Sign in is required.', code: 'unauthorized' });

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return respond(origin, 400, { error: 'Request body must be valid JSON.', code: 'invalid_json' }); }

  const admin = ctx.supabaseAdmin;
  const { data: profile, error: profileError } = await admin
    .from('site_profiles')
    .select('user_id,display_name,rename_count,last_renamed_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (profileError) return respond(origin, 500, { error: 'Could not load your community profile.', code: 'profile_lookup_failed' });
  if (!profile) return respond(origin, 404, { error: 'Your community profile could not be found.', code: 'profile_not_found' });

  const action = String(payload.action ?? 'status');
  if (action === 'status') return respond(origin, 200, publicStatus(profile));
  if (action !== 'rename') return respond(origin, 400, { error: 'Unsupported profile action.', code: 'invalid_action' });

  const checked = validateSiteDisplayName(payload.display_name);
  if (!checked.ok) return respond(origin, 400, { error: checked.error, code: 'invalid_display_name' });
  if (containsBlockedChatContent(checked.value)) {
    return respond(origin, 400, { error: 'That display name is not allowed.', code: 'filtered_display_name' });
  }

  const eligibility = getSiteRenameEligibility(profile);
  if (!eligibility.allowed) {
    return respond(origin, 409, {
      error: 'You can only change your name once every 30 days after your free correction.',
      code: 'rename_cooldown',
      next_allowed_at: eligibility.next_allowed_at,
    });
  }

  const { data: renamed, error: renameError } = await admin.rpc('rename_site_profile', {
    p_target_user_id: userId,
    p_new_display_name: checked.value,
    p_new_normalized_name: checked.normalized,
    p_actor_user_id: userId,
    p_moderator_override: false,
    p_reason: null,
  });
  if (renameError) {
    const mapped = mapRenameError(renameError.message || '');
    return respond(origin, mapped.status, mapped);
  }

  const row = Array.isArray(renamed) ? renamed[0] : renamed;
  if (!row) return respond(origin, 500, { error: 'Display name could not be changed.', code: 'rename_failed' });
  return respond(origin, 200, {
    display_name: row.display_name,
    rename_count: row.rename_count,
    last_renamed_at: row.last_renamed_at,
    can_rename: row.next_allowed_at ? Date.parse(row.next_allowed_at) <= Date.now() : true,
    free_correction: Number(row.rename_count ?? 0) === 0,
    next_allowed_at: row.next_allowed_at ?? null,
  });
});

export default {
  async fetch(req: Request) {
    const origin = req.headers.get('origin') ?? '';
    if (req.method === 'OPTIONS') {
      if (!isAllowedSiteOrigin(origin)) return respond(origin, 403, { error: 'Request origin is not allowed.', code: 'origin_denied' });
      return new Response(null, { status: 204, headers: jsonHeaders(origin) });
    }
    return userHandler(req);
  },
};
