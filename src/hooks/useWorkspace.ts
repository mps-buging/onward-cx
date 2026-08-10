import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false)
        return
      }

      supabase
        .rpc("get_user_workspace_ids")
        .then(({ data, error }) => {
          if (error) console.error("useWorkspace:", error.message)
          const ids = data as string[] | null
          setWorkspaceId(ids?.[0] ?? null)
          setLoading(false)
        })
    })
  }, [])

  return { workspaceId, loading }
}
