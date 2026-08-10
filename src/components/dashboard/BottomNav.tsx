import { LayoutDashboard, LogOut, Moon, Settings, Sun } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useThemeContext } from "@/context/ThemeContext"

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeContext()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  const btnCls = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
      active ? "text-foreground" : "text-muted-foreground"
    )

  const dashActive = pathname === "/dashboard" || pathname.startsWith("/clients")

  return (
    <nav className="md:hidden flex h-14 shrink-0 items-center justify-around border-t border-border bg-background px-2">
      <Link to="/dashboard" className={btnCls(dashActive)}>
        <LayoutDashboard className="size-5" />
        <span>Dashboard</span>
      </Link>

      <Link to="/settings/templates" className={btnCls(pathname.startsWith("/settings"))}>
        <Settings className="size-5" />
        <span>Settings</span>
      </Link>

      <button type="button" onClick={toggleTheme} className={btnCls(false)}>
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        <span>Theme</span>
      </button>

      <button type="button" onClick={handleLogout} className={btnCls(false)}>
        <LogOut className="size-5" />
        <span>Log out</span>
      </button>
    </nav>
  )
}
