import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { Client, DerivedStatus } from "@/data/mockClients"

const statusConfig: Record<DerivedStatus, { label: string; className: string }> = {
  not_started: {
    label: "Not Started",
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
}

export function ClientCard({ client }: { client: Client }) {
  const navigate = useNavigate()
  const { label, className } = statusConfig[client.status]

  return (
    <Card
      className="shadow-none cursor-pointer transition-shadow hover:shadow-sm"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{client.name}</p>
            {client.company && (
              <p className="truncate text-xs text-muted-foreground">{client.company}</p>
            )}
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", className)}>
            {label}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{client.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${client.progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
