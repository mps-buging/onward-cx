-- workspaces was never granted to authenticated in 20260721000001_grant_dml_to_authenticated.sql
-- (only clients/milestones/subtasks/comments/workspace_members were). RLS already
-- restricts rows via members_select_workspace; this just allows the grant PostgREST needs.
GRANT SELECT ON workspaces TO authenticated;
