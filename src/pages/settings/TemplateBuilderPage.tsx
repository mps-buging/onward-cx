import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomNav } from "@/components/dashboard/BottomNav"
import { useWorkspace } from "@/hooks/useWorkspace"
import { supabase } from "@/lib/supabase"

type SubtaskDraft = { key: string; title: string }
type MilestoneDraft = { key: string; title: string; subtasks: SubtaskDraft[] }

type RawMilestone = {
  id: string
  title: string
  position: number
  template_subtasks: { id: string; title: string; position: number }[]
}

function uid() {
  return Math.random().toString(36).slice(2)
}

function moveItem<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { workspaceId, loading: wsLoading } = useWorkspace()

  const [templateName, setTemplateName] = useState("")
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { key: uid(), title: "", subtasks: [] },
  ])
  const [loadingData, setLoadingData] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    supabase
      .from("templates")
      .select(
        "id, name, template_milestones(id, title, position, template_subtasks(id, title, position))"
      )
      .eq("id", id)
      .single()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr || !data) {
          setError(fetchErr?.message ?? "Template not found.")
          setLoadingData(false)
          return
        }
        setTemplateName(data.name)
        const sorted = [...(data.template_milestones as RawMilestone[])].sort(
          (a, b) => a.position - b.position
        )
        setMilestones(
          sorted.map((m) => ({
            key: m.id,
            title: m.title,
            subtasks: [...m.template_subtasks]
              .sort((a, b) => a.position - b.position)
              .map((s) => ({ key: s.id, title: s.title })),
          }))
        )
        setLoadingData(false)
      })
  }, [isEdit, id])

  // ── milestone helpers ──────────────────────────────────────────────────────

  function addMilestone() {
    setMilestones((ms) => [...ms, { key: uid(), title: "", subtasks: [] }])
  }

  function removeMilestone(i: number) {
    setMilestones((ms) => ms.filter((_, idx) => idx !== i))
  }

  function updateMilestoneTitle(i: number, title: string) {
    setMilestones((ms) =>
      ms.map((m, idx) => (idx === i ? { ...m, title } : m))
    )
  }

  function moveMilestone(i: number, dir: -1 | 1) {
    setMilestones((ms) => moveItem(ms, i, dir))
  }

  // ── subtask helpers ────────────────────────────────────────────────────────

  function addSubtask(mi: number) {
    setMilestones((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? { ...m, subtasks: [...m.subtasks, { key: uid(), title: "" }] }
          : m
      )
    )
  }

  function removeSubtask(mi: number, si: number) {
    setMilestones((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? { ...m, subtasks: m.subtasks.filter((_, sidx) => sidx !== si) }
          : m
      )
    )
  }

  function updateSubtaskTitle(mi: number, si: number, title: string) {
    setMilestones((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? {
              ...m,
              subtasks: m.subtasks.map((s, sidx) =>
                sidx === si ? { ...s, title } : s
              ),
            }
          : m
      )
    )
  }

  function moveSubtask(mi: number, si: number, dir: -1 | 1) {
    setMilestones((ms) =>
      ms.map((m, idx) =>
        idx === mi ? { ...m, subtasks: moveItem(m.subtasks, si, dir) } : m
      )
    )
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId || !templateName.trim()) return

    setSaving(true)
    setError(null)

    let tplId: string

    if (isEdit && id) {
      const { error: updateErr } = await supabase
        .from("templates")
        .update({ name: templateName.trim() })
        .eq("id", id)
      if (updateErr) {
        setError(updateErr.message)
        setSaving(false)
        return
      }

      // Delete all milestones — cascade removes their subtasks
      const { error: deleteErr } = await supabase
        .from("template_milestones")
        .delete()
        .eq("template_id", id)
      if (deleteErr) {
        setError(deleteErr.message)
        setSaving(false)
        return
      }

      tplId = id
    } else {
      const { data: tData, error: insertErr } = await supabase
        .from("templates")
        .insert({ workspace_id: workspaceId, name: templateName.trim() })
        .select("id")
        .single()
      if (insertErr || !tData) {
        setError(insertErr?.message ?? "Failed to create template.")
        setSaving(false)
        return
      }
      tplId = tData.id
    }

    for (let mi = 0; mi < milestones.length; mi++) {
      const m = milestones[mi]
      if (!m.title.trim()) continue

      const { data: mData, error: mErr } = await supabase
        .from("template_milestones")
        .insert({ template_id: tplId, title: m.title.trim(), position: mi })
        .select("id")
        .single()
      if (mErr || !mData) {
        setError(
          `Failed to save milestone "${m.title}": ${mErr?.message ?? "unknown error"}`
        )
        setSaving(false)
        return
      }

      const validSubs = m.subtasks.filter((s) => s.title.trim())
      if (validSubs.length > 0) {
        const { error: subErr } = await supabase
          .from("template_subtasks")
          .insert(
            validSubs.map((s, si) => ({
              template_milestone_id: mData.id,
              title: s.title.trim(),
              position: si,
            }))
          )
        if (subErr) {
          setError(
            `Failed to save subtasks for "${m.title}": ${subErr.message}`
          )
          setSaving(false)
          return
        }
      }
    }

    setSaving(false)
    navigate("/settings/templates")
  }

  // ── layout ─────────────────────────────────────────────────────────────────

  const pageShell = (content: React.ReactNode) => (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <h1 className="font-heading text-base font-semibold">
            {isEdit ? "Edit Template" : "New Template"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => navigate("/settings/templates")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="template-form"
              size="sm"
              disabled={saving || !templateName.trim()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </header>
        {content}
        <BottomNav />
      </div>
    </div>
  )

  if (wsLoading || loadingData) {
    return pageShell(
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    )
  }

  return pageShell(
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <form
        id="template-form"
        onSubmit={handleSave}
        className="flex max-w-2xl flex-col gap-6"
      >
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Template name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template-name">Template name</Label>
          <Input
            id="template-name"
            placeholder="e.g. Standard Onboarding"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
            autoFocus
            disabled={saving}
          />
        </div>

        {/* Milestones */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Milestones</p>

          {milestones.map((m, mi) => (
            <div key={m.key} className="rounded-lg border border-border">
              {/* Milestone header row */}
              <div className="flex items-center gap-2 border-b border-border p-3">
                <ReorderButtons
                  onUp={() => moveMilestone(mi, -1)}
                  onDown={() => moveMilestone(mi, 1)}
                  disableUp={mi === 0}
                  disableDown={mi === milestones.length - 1}
                  disabled={saving}
                />

                <Input
                  placeholder={`Milestone ${mi + 1}`}
                  value={m.title}
                  onChange={(e) => updateMilestoneTitle(mi, e.target.value)}
                  disabled={saving}
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Remove milestone"
                  disabled={saving}
                  onClick={() => removeMilestone(mi)}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>

              {/* Subtask list */}
              <div className="flex flex-col gap-0 px-3 py-2">
                {m.subtasks.map((s, si) => (
                  <div key={s.key} className="flex items-center gap-2 py-1.5 pl-4">
                    <ReorderButtons
                      size="xs"
                      onUp={() => moveSubtask(mi, si, -1)}
                      onDown={() => moveSubtask(mi, si, 1)}
                      disableUp={si === 0}
                      disableDown={si === m.subtasks.length - 1}
                      disabled={saving}
                    />

                    <Input
                      placeholder={`Subtask ${si + 1}`}
                      value={s.title}
                      onChange={(e) => updateSubtaskTitle(mi, si, e.target.value)}
                      disabled={saving}
                      className="flex-1 h-8 text-xs"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Remove subtask"
                      disabled={saving}
                      onClick={() => removeSubtask(mi, si)}
                    >
                      <Trash2 className="size-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="mt-1 w-fit text-muted-foreground"
                  disabled={saving}
                  onClick={() => addSubtask(mi)}
                >
                  <Plus className="size-3" />
                  Add subtask
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            disabled={saving}
            onClick={addMilestone}
          >
            <Plus className="size-4" />
            Add milestone
          </Button>
        </div>
      </form>
    </main>
  )
}

// ── small helper component for up/down reorder buttons ──────────────────────

function ReorderButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
  disabled,
  size = "sm",
}: {
  onUp: () => void
  onDown: () => void
  disableUp: boolean
  disableDown: boolean
  disabled: boolean
  size?: "sm" | "xs"
}) {
  const btnCls =
    size === "xs"
      ? "flex items-center justify-center size-4 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
      : "flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
  const iconCls = size === "xs" ? "size-3" : "size-3.5"

  return (
    <div className="flex shrink-0 flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disableUp || disabled}
        className={btnCls}
      >
        <ChevronUp className={iconCls} />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disableDown || disabled}
        className={btnCls}
      >
        <ChevronDown className={iconCls} />
      </button>
    </div>
  )
}
