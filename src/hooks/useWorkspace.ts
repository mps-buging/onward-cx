import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
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
          const id = ids?.[0] ?? null
          setWorkspaceId(id)

          if (!id) {
            setLoading(false)
            return
          }

          supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", id)
            .eq("user_id", session.user.id)
            .maybeSingle()
            .then(({ data: member, error: roleErr }) => {
              if (roleErr) console.error("useWorkspace:", roleErr.message)
              setRole(member?.role ?? null)
              setLoading(false)
            })
        })
    })
  }, [])

  return { workspaceId, role, loading }
}
