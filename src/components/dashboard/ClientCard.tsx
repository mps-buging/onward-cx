import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { Client, ClientStatus } from "@/data/mockClients"

const statusConfig: Record<ClientStatus, { label: string; className: string }> = {
  on_track: {
    label: "On track",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  behind: {
    label: "Behind",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  complete: {
    label: "Complete",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
}

export function ClientCard({ client }: { client: Client }) {
  const { label, className } = statusConfig[client.status]

  const hasMillestones =
    client.milestonesTotal !== undefined && client.milestonesTotal > 0
  const progress = hasMillestones
    ? Math.round(((client.milestonesCompleted ?? 0) / client.milestonesTotal!) * 100)
    : 0

  const dueDate =
    client.dueDate
      ? new Date(client.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{client.name}</p>
            <p className="truncate text-xs text-muted-foreground">{client.company}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", className)}>
            {label}
          </span>
        </div>

        {hasMillestones && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Milestones</span>
              <span>{client.milestonesCompleted} of {client.milestonesTotal}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {dueDate && <p className="text-xs text-muted-foreground">Due {dueDate}</p>}
      </CardContent>
    </Card>
  )
}
