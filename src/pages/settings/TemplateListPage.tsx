import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomNav } from "@/components/dashboard/BottomNav"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { useWorkspace } from "@/hooks/useWorkspace"
import { supabase } from "@/lib/supabase"
import { SettingsTabs } from "@/components/settings/SettingsTabs"

type TemplateRow = {
  id: string
  name: string
  milestoneCount: number
  subtaskCount: number
}

type RawTemplate = {
  id: string
  name: string
  template_milestones: { id: string; template_subtasks: { id: string }[] }[]
}

export function TemplateListPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<TemplateRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const { data, error: fetchErr } = await supabase
      .from("templates")
      .select("id, name, template_milestones(id, template_subtasks(id))")
      .eq("workspace_id", workspaceId)
      .order("created_at")

    if (fetchErr) {
      setError(fetchErr.message)
    } else {
      setTemplates(
        ((data ?? []) as RawTemplate[]).map((t) => ({
          id: t.id,
          name: t.name,
          milestoneCount: t.template_milestones.length,
          subtaskCount: t.template_milestones.reduce(
            (acc, m) => acc + m.template_subtasks.length,
            0
          ),
        }))
      )
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    if (!wsLoading) fetchTemplates()
  }, [wsLoading, fetchTemplates])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error: delErr } = await supabase
      .from("templates")
      .delete()
      .eq("id", deleteTarget.id)
    setDeleting(false)
    if (delErr) {
      setError(delErr.message)
    } else {
      setDeleteTarget(null)
      fetchTemplates()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <h1 className="font-heading text-base font-semibold">Templates</h1>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/settings/templates/new")}
          >
            <Plus className="size-4" />
            New Template
          </Button>
        </header>

        <SettingsTabs />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading || wsLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : templates.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3">
              <p className="text-sm text-muted-foreground">No templates yet.</p>
              <Button
                size="sm"
                onClick={() => navigate("/settings/templates/new")}
              >
                Create your first template
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Milestones
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Subtasks
                    </th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t, i) => (
                    <tr
                      key={t.id}
                      className={i < templates.length - 1 ? "border-b border-border" : ""}
                    >
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {t.milestoneCount}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {t.subtaskCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit template"
                            onClick={() =>
                              navigate(`/settings/templates/${t.id}/edit`)
                            }
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete template"
                            onClick={() => setDeleteTarget(t)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <BottomNav />
      </div>

      <DialogRoot
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle>
            <DialogDescription>
              Clients already created from this template won't be affected —
              only the template itself is removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}
