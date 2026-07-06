import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Client, ClientStatus } from "@/data/mockClients"

type DbClient = {
  id: string
  workspace_id: string
  name: string
  company: string
  status: ClientStatus
  created_at: string
}

function toClient(row: DbClient): Client {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    company: row.company,
    status: row.status,
    created_at: row.created_at,
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
      .select("id, workspace_id, name, company, status, created_at")
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

  useEffect(() => { refetch() }, [refetch])

  return { clients, loading, error, refetch }
}
