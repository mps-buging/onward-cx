-- ============================================================
-- RLS policies for milestones
-- Access check: milestone → client → workspace_members (user_id = auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "members_select_milestones" ON milestones;
CREATE POLICY "members_select_milestones" ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = milestones.client_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_insert_milestones" ON milestones;
CREATE POLICY "members_insert_milestones" ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = milestones.client_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_update_milestones" ON milestones;
CREATE POLICY "members_update_milestones" ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = milestones.client_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_delete_milestones" ON milestones;
CREATE POLICY "members_delete_milestones" ON milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = milestones.client_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS policies for subtasks
-- Access check: subtask → milestone → client → workspace_members
-- ============================================================

DROP POLICY IF EXISTS "members_select_subtasks" ON subtasks;
CREATE POLICY "members_select_subtasks" ON subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN clients c ON c.id = m.client_id
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE m.id = subtasks.milestone_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_insert_subtasks" ON subtasks;
CREATE POLICY "members_insert_subtasks" ON subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN clients c ON c.id = m.client_id
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE m.id = subtasks.milestone_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_update_subtasks" ON subtasks;
CREATE POLICY "members_update_subtasks" ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN clients c ON c.id = m.client_id
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE m.id = subtasks.milestone_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_delete_subtasks" ON subtasks;
CREATE POLICY "members_delete_subtasks" ON subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN clients c ON c.id = m.client_id
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE m.id = subtasks.milestone_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- Schema changes to comments
-- A comment attaches to exactly one of: a client (general note),
-- a milestone, or a subtask. milestone_id and subtask_id can
-- never both be set on the same row.
-- ============================================================

-- 1. Add client_id nullable first so we can backfill before making it NOT NULL
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 2. Add milestone_id nullable
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE;

-- 3. Make subtask_id nullable
ALTER TABLE comments
  ALTER COLUMN subtask_id DROP NOT NULL;

-- 4. Backfill client_id (and milestone_id) for any rows with subtask_id set
UPDATE comments c
SET
  milestone_id = s.milestone_id,
  client_id    = m.client_id
FROM subtasks s
JOIN milestones m ON m.id = s.milestone_id
WHERE c.subtask_id = s.id
  AND c.client_id IS NULL;

-- 5. Now enforce NOT NULL on client_id
ALTER TABLE comments
  ALTER COLUMN client_id SET NOT NULL;

-- 6. milestone_id and subtask_id cannot both be set
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_single_target;
ALTER TABLE comments
  ADD CONSTRAINT comments_single_target
  CHECK (NOT (milestone_id IS NOT NULL AND subtask_id IS NOT NULL));

-- ============================================================
-- RLS policies for comments
-- Access check: comment → client → workspace_members
-- ============================================================

DROP POLICY IF EXISTS "members_select_comments" ON comments;
CREATE POLICY "members_select_comments" ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = comments.client_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_insert_comments" ON comments;
CREATE POLICY "members_insert_comments" ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = comments.client_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_update_comments" ON comments;
CREATE POLICY "members_update_comments" ON comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = comments.client_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_delete_comments" ON comments;
CREATE POLICY "members_delete_comments" ON comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = comments.client_id AND wm.user_id = auth.uid()
    )
  );
