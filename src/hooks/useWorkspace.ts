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
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          setWorkspaceId(data?.workspace_id ?? null)
          setLoading(false)
        })
    })
  }, [])

  return { workspaceId, loading }
}
