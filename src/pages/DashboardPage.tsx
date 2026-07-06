import { Moon, Plus, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomNav } from "@/components/dashboard/BottomNav"
import { ClientCard } from "@/components/dashboard/ClientCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { mockClients } from "@/data/mockClients"
import { useTheme } from "@/hooks/useTheme"

export function DashboardPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <h1 className="font-heading text-base font-semibold">Clients</h1>
          <div className="flex items-center gap-2">
            {/* Theme toggle — mobile only (desktop uses sidebar) */}
            <button
              type="button"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onClick={toggleTheme}
              className="md:hidden flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add client
            </Button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {mockClients.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
            >
              {mockClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
