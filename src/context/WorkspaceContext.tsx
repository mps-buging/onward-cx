import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type WorkspaceSummary = { id: string; name: string }

type WorkspaceContextValue = {
  workspaceId: string | null
  workspaces: WorkspaceSummary[]
  role: string | null
  loading: boolean
  setWorkspaceId: (id: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function getStoredWorkspaceId(): string | null {
  try {
    return localStorage.getItem("workspaceId")
  } catch {
    return null
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Re-fetches on every auth event, not just once on mount — this provider is a
  // long-lived singleton (mounted once in main.tsx, never remounted on route
  // changes), so it has to react to login/logout, and to a same-session invite
  // acceptance adding a new membership without a full page reload.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setWorkspaceIdState(null)
        setWorkspaces([])
        setRole(null)
        setLoading(false)
        return
      }

      supabase
        .rpc("get_user_workspace_ids")
        .then(({ data, error }) => {
          if (error) console.error("WorkspaceContext:", error.message)
          const ids = (data as string[] | null) ?? []

          if (ids.length === 0) {
            setWorkspaces([])
            setWorkspaceIdState(null)
            setRole(null)
            setLoading(false)
            return
          }

          supabase
            .from("workspaces")
            .select("id, name")
            .in("id", ids)
            .order("name")
            .then(({ data: wsData, error: wsErr }) => {
              if (wsErr) console.error("WorkspaceContext:", wsErr.message)
              const list = wsData ?? []
              setWorkspaces(list)

              // Preserve the current selection across refetches (e.g. a background
              // token refresh) as long as it's still valid; only fall back to the
              // stored or first workspace when it isn't.
              setWorkspaceIdState((current) => {
                if (current && list.some((w) => w.id === current)) return current
                const stored = getStoredWorkspaceId()
                if (stored && list.some((w) => w.id === stored)) return stored
                return list[0]?.id ?? null
              })

              setLoading(false)
            })
        })
    })

    return () => subscription.unsubscribe()
  }, [])

  // Role is scoped to whichever workspace is active, so it needs to re-run
  // whenever the selected workspace changes, not just once.
  useEffect(() => {
    if (!workspaceId) {
      setRole(null)
      return
    }

    let cancelled = false

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return

      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data: member, error }) => {
          if (cancelled) return
          if (error) console.error("WorkspaceContext:", error.message)
          setRole(member?.role ?? null)
        })
    })

    return () => {
      cancelled = true
    }
  }, [workspaceId])

  function setWorkspaceId(id: string) {
    setWorkspaceIdState(id)
    try {
      localStorage.setItem("workspaceId", id)
    } catch {
      // ignore — private browsing / storage disabled
    }
  }

  return (
    <WorkspaceContext.Provider value={{ workspaceId, workspaces, role, loading, setWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider")
  return ctx
}
