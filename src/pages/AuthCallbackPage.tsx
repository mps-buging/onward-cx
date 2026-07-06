import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Implicit flow: supabase-js processes the #access_token hash on init and
    // fires SIGNED_IN. Listen for it, then fall back to getSession() for
    // the case where the session was already set before this component mounted.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true })
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true })
      else {
        // Give onAuthStateChange a moment to fire before giving up
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            navigate(session ? "/dashboard" : "/login?error=auth_failed", { replace: true })
          })
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
