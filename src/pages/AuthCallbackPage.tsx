import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    const inviteId = new URLSearchParams(window.location.search).get("invite")

    async function finish() {
      if (handledRef.current) return
      handledRef.current = true

      if (inviteId) {
        const { error: acceptErr } = await supabase.rpc("accept_invite", { p_invite_id: inviteId })
        if (acceptErr) {
          setError(acceptErr.message)
          return
        }
      }

      navigate("/dashboard", { replace: true })
    }

    // Implicit flow: supabase-js processes the #access_token hash on init and
    // fires SIGNED_IN. Listen for it, then fall back to getSession() for
    // the case where the session was already set before this component mounted.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        finish()
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish()
      else {
        // Give onAuthStateChange a moment to fire before giving up
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) finish()
            else navigate("/login?error=auth_failed", { replace: true })
          })
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard", { replace: true })}
          className="text-sm text-primary underline underline-offset-4"
        >
          Continue to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
