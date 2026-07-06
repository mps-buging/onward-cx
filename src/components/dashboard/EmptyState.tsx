import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Users className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No clients yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first client to get started.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onAdd}>
        Add your first client
      </Button>
    </div>
  )
}
