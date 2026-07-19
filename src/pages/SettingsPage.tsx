import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomNav } from "@/components/dashboard/BottomNav"

export function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-4 md:px-6">
          <h1 className="font-heading text-base font-semibold">Settings</h1>
        </header>

        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Settings coming soon.</p>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
