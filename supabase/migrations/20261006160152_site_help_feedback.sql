create table public.site_help_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null unique,
  question text not null check (length(question) between 1 and 600),
  answer_summary text check (answer_summary is null or length(answer_summary) <= 1200),
  helpful boolean,
  unanswered boolean not null default false,
  source_ids text[] not null default '{}'::text[] check (cardinality(source_ids) <= 12),
  mode text not null default 'retrieval' check (mode in ('retrieval','provider','fallback')),
  confidence text not null default 'low' check (confidence in ('low','medium','high')),
  page_path text check (page_path is null or (page_path like '/%' and length(page_path) <= 240)),
  review_status text not null default 'new' check (review_status in ('new','reviewed','resolved','ignored')),
  review_note text check (review_note is null or length(review_note) <= 1000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_help_feedback_user_created_idx
  on public.site_help_feedback (user_id, created_at desc);
create index site_help_feedback_quality_queue_idx
  on public.site_help_feedback (review_status, unanswered desc, helpful, created_at desc);

alter table public.site_help_feedback enable row level security;

revoke all on public.site_help_feedback from anon, authenticated;
grant select (id, user_id, request_id, question, answer_summary, helpful, unanswered, source_ids, mode, confidence, page_path, created_at, updated_at)
  on public.site_help_feedback to authenticated;

create policy "site help feedback read own"
on public.site_help_feedback for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "site help feedback staff read"
on public.site_help_feedback for select
to authenticated
using (
  exists (
    select 1
    from public.site_profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('moderator', 'admin')
  )
);

-- Inserts and updates intentionally remain server-only. ask-hynoe and moderation
-- Edge Functions use the project secret/service role after authenticating the caller.
