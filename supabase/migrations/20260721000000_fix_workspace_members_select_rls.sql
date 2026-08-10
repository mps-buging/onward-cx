-- Allow each user to read their own workspace_members row directly.
-- The existing get_user_workspace_ids() policy covers cross-member lookups;
-- this simpler policy ensures the self-lookup always works from the client.
CREATE POLICY "own_membership_select" ON workspace_members FOR SELECT
  USING (user_id = auth.uid());
