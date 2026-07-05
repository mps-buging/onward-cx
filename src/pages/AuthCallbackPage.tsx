import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")

    if (code) {
      // PKCE flow: exchange code for session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        navigate(error ? "/login?error=auth_failed" : "/dashboard", { replace: true })
      })
    } else {
      // Implicit flow: supabase-js processes the hash fragment automatically on init,
      // so getSession() will already have the session by the time this runs
      supabase.auth.getSession().then(({ data: { session } }) => {
        navigate(session ? "/dashboard" : "/login", { replace: true })
      })
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
