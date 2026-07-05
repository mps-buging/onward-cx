import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export function DashboardPage() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-lg font-medium">Dashboard coming soon</p>
      <button
        onClick={handleSignOut}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Sign out
      </button>
    </div>
  )
}
