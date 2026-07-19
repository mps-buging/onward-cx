import { LayoutDashboard, LogOut, Settings } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  const linkCls = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
      active ? "text-foreground" : "text-muted-foreground"
    )

  const dashActive = pathname === "/dashboard" || pathname.startsWith("/clients")

  return (
    <nav className="md:hidden flex h-14 shrink-0 items-center justify-around border-t border-border bg-background px-2">
      <Link to="/dashboard" className={linkCls(dashActive)}>
        <LayoutDashboard className="size-5" />
        <span>Dashboard</span>
      </Link>

      <Link to="/settings" className={linkCls(pathname === "/settings")}>
        <Settings className="size-5" />
        <span>Settings</span>
      </Link>

      <button type="button" onClick={handleLogout} className={linkCls(false)}>
        <LogOut className="size-5" />
        <span>Log out</span>
      </button>
    </nav>
  )
}
