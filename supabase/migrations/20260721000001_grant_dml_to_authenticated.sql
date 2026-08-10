GRANT SELECT, INSERT, UPDATE, DELETE ON clients          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON milestones       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subtasks         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comments         TO authenticated;
GRANT SELECT                         ON workspace_members TO authenticated;
