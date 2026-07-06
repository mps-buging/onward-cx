import { Activity, Settings, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

type NavItem = { icon: React.ElementType; label: string; to?: string }

const navItems: NavItem[] = [
  { icon: Users, label: "Clients", to: "/dashboard" },
  { icon: Activity, label: "Activity" },
  { icon: Settings, label: "Settings" },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden flex h-14 shrink-0 items-center justify-around border-t border-border bg-background px-2">
      {navItems.map(({ icon: Icon, label, to }) => {
        const active = to === pathname
        const cls = cn(
          "flex flex-col items-center justify-center gap-0.5 rounded-md p-2 transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )

        return to ? (
          <Link key={label} to={to} className={cls} title={label}>
            <Icon className="size-5" />
          </Link>
        ) : (
          <button key={label} type="button" title={label} className={cls}>
            <Icon className="size-5" />
          </button>
        )
      })}
    </nav>
  )
}
