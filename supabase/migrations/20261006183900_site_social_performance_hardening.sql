create index if not exists site_announcements_created_by_idx on public.site_announcements(created_by);
create index if not exists site_chat_messages_deleted_by_idx on public.site_chat_messages(deleted_by);
create index if not exists site_chat_reactions_user_id_idx on public.site_chat_reactions(user_id);
create index if not exists site_chat_reports_reporter_id_idx on public.site_chat_reports(reporter_id);
create index if not exists site_chat_reports_resolved_by_idx on public.site_chat_reports(resolved_by);
create index if not exists site_chat_settings_updated_by_idx on public.site_chat_settings(updated_by);
create index if not exists site_help_feedback_reviewed_by_idx on public.site_help_feedback(reviewed_by);
create index if not exists site_moderation_audit_moderator_id_idx on public.site_moderation_audit(moderator_id);
create index if not exists site_moderation_audit_target_message_id_idx on public.site_moderation_audit(target_message_id);
create index if not exists site_moderation_audit_target_user_id_idx on public.site_moderation_audit(target_user_id);

drop policy if exists "site help feedback read own" on public.site_help_feedback;
drop policy if exists "site help feedback staff read" on public.site_help_feedback;
create policy "site help feedback read own or staff"
on public.site_help_feedback
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.site_profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('moderator','admin')
  )
);
