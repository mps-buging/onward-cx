import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export function ProtectedRoute() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null
  return authed ? <Outlet /> : <Navigate to="/login" replace />
}
