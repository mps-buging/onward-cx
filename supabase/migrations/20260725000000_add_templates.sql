-- ============================================================
-- Templates system: templates, template_milestones, template_subtasks
-- ============================================================

CREATE TABLE templates (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE template_milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  title       text NOT NULL,
  position    int  NOT NULL DEFAULT 0
);

CREATE TABLE template_subtasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_milestone_id uuid NOT NULL REFERENCES template_milestones(id) ON DELETE CASCADE,
  title                text NOT NULL,
  position             int  NOT NULL DEFAULT 0
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_subtasks  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Grants (authenticated role has no privileges by default)
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON templates          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_subtasks  TO authenticated;

-- ============================================================
-- RLS policies: templates
-- Access: templates.workspace_id → workspace_members
-- ============================================================

CREATE POLICY "members_select_templates" ON templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = templates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_templates" ON templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = templates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_update_templates" ON templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = templates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_delete_templates" ON templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = templates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS policies: template_milestones
-- Access: template_milestone → template → workspace_members
-- ============================================================

CREATE POLICY "members_select_template_milestones" ON template_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = template_milestones.template_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_template_milestones" ON template_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = template_milestones.template_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_update_template_milestones" ON template_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = template_milestones.template_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_delete_template_milestones" ON template_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = template_milestones.template_id
        AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS policies: template_subtasks
-- Access: template_subtask → template_milestone → template → workspace_members
-- ============================================================

CREATE POLICY "members_select_template_subtasks" ON template_subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM template_milestones tm
      JOIN templates t ON t.id = tm.template_id
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE tm.id = template_subtasks.template_milestone_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_template_subtasks" ON template_subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_milestones tm
      JOIN templates t ON t.id = tm.template_id
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE tm.id = template_subtasks.template_milestone_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_update_template_subtasks" ON template_subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM template_milestones tm
      JOIN templates t ON t.id = tm.template_id
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE tm.id = template_subtasks.template_milestone_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_delete_template_subtasks" ON template_subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM template_milestones tm
      JOIN templates t ON t.id = tm.template_id
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE tm.id = template_subtasks.template_milestone_id
        AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- Seed: "Standard Onboarding" template in the first workspace
-- ============================================================

DO $$
DECLARE
  v_workspace_id        uuid;
  v_template_id         uuid;
  v_kickoff_id          uuid;
  v_setup_id            uuid;
  v_golive_id           uuid;
BEGIN
  SELECT id INTO v_workspace_id FROM workspaces ORDER BY created_at LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RAISE NOTICE 'No workspace found — skipping seed.';
    RETURN;
  END IF;

  INSERT INTO templates (workspace_id, name)
    VALUES (v_workspace_id, 'Standard Onboarding')
    RETURNING id INTO v_template_id;

  -- Milestone 1: Kickoff
  INSERT INTO template_milestones (template_id, title, position)
    VALUES (v_template_id, 'Kickoff', 0)
    RETURNING id INTO v_kickoff_id;
  INSERT INTO template_subtasks (template_milestone_id, title, position) VALUES
    (v_kickoff_id, 'Send welcome email',        0),
    (v_kickoff_id, 'Schedule kickoff call',     1),
    (v_kickoff_id, 'Share onboarding checklist', 2);

  -- Milestone 2: Setup
  INSERT INTO template_milestones (template_id, title, position)
    VALUES (v_template_id, 'Setup', 1)
    RETURNING id INTO v_setup_id;
  INSERT INTO template_subtasks (template_milestone_id, title, position) VALUES
    (v_setup_id, 'Create client account',   0),
    (v_setup_id, 'Configure integrations',  1),
    (v_setup_id, 'Import existing data',    2);

  -- Milestone 3: Go Live
  INSERT INTO template_milestones (template_id, title, position)
    VALUES (v_template_id, 'Go Live', 2)
    RETURNING id INTO v_golive_id;
  INSERT INTO template_subtasks (template_milestone_id, title, position) VALUES
    (v_golive_id, 'Run user acceptance testing', 0),
    (v_golive_id, 'Train end users',             1);

  RAISE NOTICE 'Seeded template id=% in workspace %', v_template_id, v_workspace_id;
END $$;
