import { Activity, Moon, Settings, Sun, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Theme } from "@/hooks/useTheme"

type NavItem = { icon: React.ElementType; label: string; to?: string }

const navItems: NavItem[] = [
  { icon: Users, label: "Clients", to: "/dashboard" },
  { icon: Activity, label: "Activity" },
]

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

export function Sidebar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { pathname } = useLocation()

  return (
    <aside className="hidden md:flex w-11 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-3 gap-1">
      <div className="mb-2 flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold select-none">
        O
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ icon, label, to }) => (
          <NavBtn key={label} icon={icon} label={label} to={to} active={to === pathname} />
        ))}
      </nav>

      <div className="flex flex-col items-center gap-1">
        <NavBtn icon={Settings} label="Settings" />
        <NavBtn
          icon={theme === "dark" ? Sun : Moon}
          label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={onToggleTheme}
        />
      </div>
    </aside>
  )
}
