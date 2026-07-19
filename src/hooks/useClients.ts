import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Client, DerivedStatus } from "@/data/mockClients"

type SubtaskRow = { status: string }
type MilestoneRow = { subtasks: SubtaskRow[] }
type DbClient = {
  id: string
  workspace_id: string
  name: string
  company: string | null
  created_at: string
  milestones: MilestoneRow[]
}

function deriveStatus(progress: number): DerivedStatus {
  if (progress === 100) return "complete"
  if (progress > 0) return "in_progress"
  return "not_started"
}

function toClient(row: DbClient): Client {
  const allSubtasks = row.milestones.flatMap((m) => m.subtasks)
  const total = allSubtasks.length
  const completed = allSubtasks.filter((s) => s.status === "complete").length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    company: row.company,
    created_at: row.created_at,
    subtasksCompleted: completed,
    subtasksTotal: total,
    progress,
    status: deriveStatus(progress),
  }
}

export function useClients(workspaceId: string | null) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { data, error } = await supabase
      .from("clients")
      .select("id, workspace_id, name, company, created_at, milestones(subtasks(status))")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setClients((data ?? []).map(toClient))
      setError(null)
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { clients, loading, error, refetch }
}
