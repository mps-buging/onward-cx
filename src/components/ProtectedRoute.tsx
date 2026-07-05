import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export function ProtectedRoute() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setLoading(false)
    })
  }, [])

  if (loading) return null
  return authed ? <Outlet /> : <Navigate to="/login" replace />
}
