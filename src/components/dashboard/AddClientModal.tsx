import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
}

export function AddClientModal({ open, onOpenChange, workspaceId, onSuccess }: Props) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !company.trim()) return

    setSaving(true)
    setError(null)

    const { error } = await supabase.from("clients").insert({
      name: name.trim(),
      company: company.trim(),
      status: "on_track",
      workspace_id: workspaceId,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setName("")
    setCompany("")
    onOpenChange(false)
    onSuccess()
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>
            Add a new client to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              placeholder="Sarah Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-company">Company</Label>
            <Input
              id="client-company"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving || !name.trim() || !company.trim()}>
              {saving ? "Adding…" : "Add client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
