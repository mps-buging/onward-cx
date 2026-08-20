import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/settings/templates", label: "Templates" },
  { to: "/settings/team", label: "Team" },
]

export function SettingsTabs() {
  const { pathname } = useLocation()

  return (
    <nav className="flex gap-4 border-b border-border px-4 md:px-6">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={cn(
            "border-b-2 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(tab.to)
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
