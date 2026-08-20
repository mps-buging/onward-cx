-- auth.users.email is `character varying`, not `text`. RETURN QUERY requires
-- an exact type match against the declared RETURNS TABLE column types, so the
-- original definition failed with "structure of query does not match
-- function result type". Cast explicitly.
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
    SELECT wm.user_id, u.email::text, wm.role, wm.created_at
    FROM workspace_members wm
    JOIN auth.users u ON u.id = wm.user_id
    WHERE wm.workspace_id = p_workspace_id
    ORDER BY wm.created_at;
END;
$$;
