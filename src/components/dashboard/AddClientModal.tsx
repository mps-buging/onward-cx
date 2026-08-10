import { useEffect, useState } from "react"
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

type Template = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
}

export function AddClientModal({ open, onOpenChange, workspaceId, onSuccess }: Props) {
  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTemplatesLoading(true)
    supabase
      .from("templates")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .order("created_at")
      .then(({ data, error: fetchErr }) => {
        if (!fetchErr && data) {
          setTemplates(data)
          setTemplateId((prev) => prev || data[0]?.id || "")
        }
        setTemplatesLoading(false)
      })
  }, [open, workspaceId])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName("")
      setTemplateId(templates[0]?.id ?? "")
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !templateId) return

    setSaving(true)
    setError(null)

    // 1. Insert client
    const { data: clientData, error: clientErr } = await supabase
      .from("clients")
      .insert({ name: name.trim(), workspace_id: workspaceId })
      .select("id")
      .single()

    if (clientErr || !clientData) {
      setError(clientErr?.message ?? "Failed to create client.")
      setSaving(false)
      return
    }

    const clientId = clientData.id

    // 2. Fetch template milestones for the selected template
    const { data: tMilestones, error: tmErr } = await supabase
      .from("template_milestones")
      .select("id, title, position")
      .eq("template_id", templateId)
      .order("position")

    if (tmErr) {
      setError(`Failed to load template: ${tmErr.message}`)
      setSaving(false)
      return
    }

    if (!tMilestones || tMilestones.length === 0) {
      // Template has no milestones — client created, close normally
      setSaving(false)
      handleOpenChange(false)
      onSuccess()
      return
    }

    // 3. Fetch all template subtasks for those milestones in one query
    const { data: tSubtasks, error: tsErr } = await supabase
      .from("template_subtasks")
      .select("template_milestone_id, title, position")
      .in("template_milestone_id", tMilestones.map((m) => m.id))
      .order("position")

    if (tsErr) {
      setError(`Failed to load template subtasks: ${tsErr.message}`)
      setSaving(false)
      return
    }

    // 4. Insert milestones and their subtasks in order
    for (const tm of tMilestones) {
      const { data: mData, error: mErr } = await supabase
        .from("milestones")
        .insert({ client_id: clientId, title: tm.title, position: tm.position })
        .select("id")
        .single()

      if (mErr || !mData) {
        setError(`Failed to create milestone "${tm.title}": ${mErr?.message ?? "unknown error"}`)
        setSaving(false)
        return
      }

      const subs = (tSubtasks ?? []).filter((s) => s.template_milestone_id === tm.id)
      if (subs.length > 0) {
        const { error: subErr } = await supabase.from("subtasks").insert(
          subs.map((s) => ({
            milestone_id: mData.id,
            title: s.title,
            position: s.position,
          }))
        )
        if (subErr) {
          setError(`Failed to create subtasks for "${tm.title}": ${subErr.message}`)
          setSaving(false)
          return
        }
      }
    }

    setSaving(false)
    handleOpenChange(false)
    onSuccess()
  }

  const noTemplates = !templatesLoading && templates.length === 0
  const canSubmit = !!name.trim() && !!templateId && !noTemplates && !saving

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>
            Add a new client to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-name">Client name</Label>
            <Input
              id="client-name"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template">Template</Label>
            {noTemplates ? (
              <p className="text-sm text-muted-foreground">
                No templates yet — create one before adding clients.
              </p>
            ) : (
              <select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={saving || templatesLoading}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                {templatesLoading ? (
                  <option value="">Loading…</option>
                ) : (
                  templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? "Adding…" : "Add client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
