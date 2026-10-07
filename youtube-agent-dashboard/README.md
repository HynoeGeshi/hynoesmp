# Hynoe YouTube Agent Dashboard

Authenticated Shorts review dashboard for Render.

Required runtime environment:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT` (provided by Render)

Run tests: `node --test youtube-agent-dashboard/tests/*.test.mjs`
Start: `node youtube-agent-dashboard/server.mjs`

Only the Supabase project URL and anon/publishable key are exposed to browser code. Never add service-role, worker, wake, OAuth refresh, or signing secrets here.
