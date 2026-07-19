export type DerivedStatus = "not_started" | "in_progress" | "complete"

export type Client = {
  id: string
  name: string
  company: string | null
  workspace_id: string
  created_at: string
  subtasksCompleted: number
  subtasksTotal: number
  progress: number
  status: DerivedStatus
}
