-- Team invites: workspace_members.user_id requires an existing auth.users row,
-- so invitees who haven't signed up yet go through this pending-invite table
-- and an accept_invite() step instead of a direct workspace_members insert.

CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE UNIQUE INDEX invites_workspace_email_pending_key
  ON invites (workspace_id, lower(email))
  WHERE status = 'pending';

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- authenticated has no privileges by default
GRANT SELECT, INSERT, UPDATE ON invites TO authenticated;

CREATE POLICY "admins_select_invites" ON invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invites.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "admins_insert_invites" ON invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invites.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "admins_update_invites" ON invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invites.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Validates and redeems an invite for the currently-authenticated user.
-- SECURITY DEFINER because the caller isn't a workspace member yet, so the
-- normal admins_insert_workspace_members RLS policy would otherwise reject them.
CREATE OR REPLACE FUNCTION accept_invite(p_invite_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite invites%ROWTYPE;
  v_caller_email text;
BEGIN
  SELECT * INTO v_invite FROM invites WHERE id = p_invite_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invite is no longer valid.';
  END IF;

  SELECT email INTO v_caller_email FROM auth.users WHERE id = auth.uid();

  IF v_caller_email IS NULL OR lower(v_caller_email) <> lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address.';
  END IF;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE invites SET status = 'accepted', accepted_at = now() WHERE id = p_invite_id;

  RETURN v_invite.workspace_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invite(uuid) TO authenticated;

-- Exposes member email (auth.users isn't reachable from the client directly)
-- to fellow members of the same workspace, for the Team settings page.
CREATE OR REPLACE FUNCTION get_workspace_members(p_workspace_id uuid)
RETURNS TABLE (user_id uuid, email text, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = p_workspace_id AND wm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this workspace.';
  END IF;

  RETURN QUERY
    SELECT wm.user_id, u.email, wm.role, wm.created_at
    FROM workspace_members wm
    JOIN auth.users u ON u.id = wm.user_id
    WHERE wm.workspace_id = p_workspace_id
    ORDER BY wm.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION get_workspace_members(uuid) TO authenticated;
