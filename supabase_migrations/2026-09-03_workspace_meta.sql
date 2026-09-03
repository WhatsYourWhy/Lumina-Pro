-- Adds the workspace_meta column used by Lumina Pro v4 to persist:
--   * the client library (saved client snapshots) and the active client id
--   * market research query, grounded sources, and drilldown questions
--   * logistics route and live disruption alerts
--
-- Safe to run more than once. Existing rows keep working; the app falls back
-- to the core columns until this migration has been applied.

alter table public.global_intel
  add column if not exists workspace_meta jsonb default '{}'::jsonb;

-- Reload the PostgREST schema cache so the new column is visible immediately.
notify pgrst, 'reload schema';
