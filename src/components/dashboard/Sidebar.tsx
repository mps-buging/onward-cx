import { LayoutDashboard, LogOut, Moon, Settings, Sun } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useThemeContext } from "@/context/ThemeContext"

function NavBtn({
  icon: Icon,
  label,
  active,
  to,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
  to?: string
  onClick?: () => void
}) {
  const cls = cn(
    "flex size-8 items-center justify-center rounded-md transition-colors",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
  )

  if (to) {
    return (
      <Link to={to} title={label} className={cls}>
        <Icon className="size-4" />
      </Link>
    )
  }

  return (
    <button type="button" title={label} onClick={onClick} className={cls}>
      <Icon className="size-4" />
    </button>
  )
}

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeContext()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <aside className="hidden md:flex w-11 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-3 gap-1">
      <div className="mb-2 flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold select-none">
        O
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        <NavBtn
          icon={LayoutDashboard}
          label="Dashboard"
          to="/dashboard"
          active={pathname === "/dashboard" || pathname.startsWith("/clients")}
        />
        <NavBtn
          icon={Settings}
          label="Settings"
          to="/settings"
          active={pathname === "/settings"}
        />
      </nav>

      <div className="flex flex-col items-center gap-1">
        <NavBtn
          icon={theme === "dark" ? Sun : Moon}
          label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={toggleTheme}
        />
        <NavBtn icon={LogOut} label="Log out" onClick={handleLogout} />
      </div>
    </aside>
  )
}
