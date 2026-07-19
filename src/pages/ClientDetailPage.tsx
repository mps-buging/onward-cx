import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function ClientDetailPage() {
  const { id } = useParams()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:px-6">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-base font-semibold">Client detail</h1>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Client detail coming soon{id ? ` (id: ${id})` : ""}.
        </p>
      </main>
    </div>
  )
}
