import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowUp, Check, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomNav } from "@/components/dashboard/BottomNav"
import { supabase } from "@/lib/supabase"

// ── types ─────────────────────────────────────────────────────────────────────

type Subtask = { id: string; title: string; position: number; status: string }
type Milestone = { id: string; title: string; position: number; subtasks: Subtask[] }
type Comment = {
  id: string
  content: string
  author: string
  created_at: string
  milestone_id: string | null
  subtask_id: string | null
}
type ClientInfo = { id: string; name: string; company: string | null }
type NoteTarget = { type: "milestone" | "subtask"; id: string } | null

// ── helpers ───────────────────────────────────────────────────────────────────

function calcProgress(milestones: Milestone[]): number {
  const all = milestones.flatMap((m) => m.subtasks)
  if (all.length === 0) return 0
  return Math.round((all.filter((s) => s.status === "complete").length / all.length) * 100)
}

function mProgress(m: Milestone): [number, number] {
  return [m.subtasks.filter((s) => s.status === "complete").length, m.subtasks.length]
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── InlineEdit ────────────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className,
}: {
  value: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    const v = draft.trim()
    if (v && v !== value) onSave(v)
    else setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        className={cn("min-w-0 bg-transparent outline-none border-b border-ring w-full", className)}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit() }
          if (e.key === "Escape") { setDraft(value); setEditing(false) }
        }}
      />
    )
  }

  return (
    <span
      className={cn(
        "cursor-text rounded px-0.5 -mx-0.5 hover:bg-muted/60 transition-colors",
        className
      )}
      onClick={() => { setDraft(value); setEditing(true) }}
    >
      {value}
    </span>
  )
}

// ── InlineNoteInput ───────────────────────────────────────────────────────────

function InlineNoteInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState("")

  return (
    <div className="flex items-center gap-1.5 py-1 pl-6">
      <input
        autoFocus
        className="flex-1 h-7 rounded border border-border bg-muted/40 px-2 text-xs outline-none focus:border-ring transition-colors"
        placeholder="Add a note…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) onSubmit(text.trim())
          if (e.key === "Escape") onCancel()
        }}
      />
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => text.trim() && onSubmit(text.trim())}
        className="text-xs font-medium text-primary disabled:opacity-40 transition-opacity"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

// ── MilestoneCard ─────────────────────────────────────────────────────────────

function MilestoneCard({
  milestone,
  noteFor,
  onToggleSubtask,
  onSaveMilestoneTitle,
  onSaveSubtaskTitle,
  onNoteTarget,
  onNoteSubmit,
  onNoteCancel,
  onDeleteMilestone,
  onDeleteSubtask,
}: {
  milestone: Milestone
  noteFor: NoteTarget
  onToggleSubtask: (milestoneId: string, subtaskId: string, currentStatus: string) => void
  onSaveMilestoneTitle: (milestoneId: string, title: string) => void
  onSaveSubtaskTitle: (milestoneId: string, subtaskId: string, title: string) => void
  onNoteTarget: (type: "milestone" | "subtask", id: string) => void
  onNoteSubmit: (text: string) => void
  onNoteCancel: () => void
  onDeleteMilestone: (milestone: Milestone) => void
  onDeleteSubtask: (milestoneId: string, subtaskId: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(true)
  const [done, total] = mProgress(milestone)
  const isMilestoneNoteOpen =
    noteFor?.type === "milestone" && noteFor.id === milestone.id

  return (
    <div className="rounded-lg border border-border">
      {/* Milestone header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded
            ? <ChevronDown className="size-4" />
            : <ChevronRight className="size-4" />}
        </button>

        <InlineEdit
          value={milestone.title}
          onSave={(t) => onSaveMilestoneTitle(milestone.id, t)}
          className="flex-1 text-sm font-medium"
        />

        {total > 0 && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {done}/{total}
          </span>
        )}

        <button
          type="button"
          onClick={() => onNoteTarget("milestone", milestone.id)}
          className={cn(
            "shrink-0 text-xs transition-colors",
            isMilestoneNoteOpen
              ? "text-foreground"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
        >
          + note
        </button>

        <button
          type="button"
          title="Delete milestone"
          onClick={() => onDeleteMilestone(milestone)}
          className="shrink-0 text-muted-foreground/60 transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Subtasks */}
      {expanded && (
        <div className="border-t border-border pb-2 pt-1">
          {milestone.subtasks.length === 0 ? (
            <p className="px-10 py-1.5 text-xs text-muted-foreground">No subtasks.</p>
          ) : (
            milestone.subtasks.map((subtask) => (
              <SubtaskRow
                key={subtask.id}
                milestoneId={milestone.id}
                subtask={subtask}
                isNoteOpen={noteFor?.type === "subtask" && noteFor.id === subtask.id}
                onToggle={() =>
                  onToggleSubtask(milestone.id, subtask.id, subtask.status)
                }
                onSaveTitle={(t) => onSaveSubtaskTitle(milestone.id, subtask.id, t)}
                onNoteTarget={() => onNoteTarget("subtask", subtask.id)}
                onNoteSubmit={onNoteSubmit}
                onNoteCancel={onNoteCancel}
                onDelete={() => onDeleteSubtask(milestone.id, subtask.id)}
              />
            ))
          )}

          {isMilestoneNoteOpen && (
            <div className="px-3 pt-1">
              <InlineNoteInput onSubmit={onNoteSubmit} onCancel={onNoteCancel} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SubtaskRow ────────────────────────────────────────────────────────────────
// Owns its own lightweight inline delete-confirm state — deleting a subtask
// is low-stakes/reversible-feeling, so it doesn't warrant a full modal.

function SubtaskRow({
  subtask,
  isNoteOpen,
  onToggle,
  onSaveTitle,
  onNoteTarget,
  onNoteSubmit,
  onNoteCancel,
  onDelete,
}: {
  milestoneId: string
  subtask: Subtask
  isNoteOpen: boolean
  onToggle: () => void
  onSaveTitle: (title: string) => void
  onNoteTarget: () => void
  onNoteSubmit: (text: string) => void
  onNoteCancel: () => void
  onDelete: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const done = subtask.status === "complete"

  if (confirming) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 pl-9">
        <span className="flex-1 text-xs text-muted-foreground">
          Delete "{subtask.title}"?
        </span>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true)
            await onDelete()
          }}
          className="text-xs font-medium text-destructive disabled:opacity-40 transition-opacity"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="group flex items-center gap-2 px-3 py-1.5">
        {/* Custom checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onClick={onToggle}
          className={cn(
            "flex shrink-0 size-4 items-center justify-center rounded border transition-colors",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary/60"
          )}
        >
          {done && <Check className="size-2.5 stroke-[3]" />}
        </button>

        <InlineEdit
          value={subtask.title}
          onSave={onSaveTitle}
          className={cn("flex-1 text-sm", done && "line-through text-muted-foreground")}
        />

        <button
          type="button"
          onClick={onNoteTarget}
          className={cn(
            "shrink-0 text-xs transition-all",
            isNoteOpen
              ? "text-foreground"
              : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-muted-foreground"
          )}
        >
          + note
        </button>

        <button
          type="button"
          title="Delete subtask"
          onClick={() => setConfirming(true)}
          className="shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {isNoteOpen && <InlineNoteInput onSubmit={onNoteSubmit} onCancel={onNoteCancel} />}
    </div>
  )
}

// ── DeleteMilestoneDialog ────────────────────────────────────────────────────

function DeleteMilestoneDialog({
  milestone,
  onOpenChange,
  onConfirm,
}: {
  milestone: Milestone | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(open: boolean) {
    if (!open) setError(null)
    onOpenChange(open)
  }

  async function handleConfirm() {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete milestone.")
    } finally {
      setDeleting(false)
    }
  }

  const subtaskCount = milestone?.subtasks.length ?? 0

  return (
    <DialogRoot open={!!milestone} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete milestone</DialogTitle>
          <DialogDescription>
            This will permanently delete "{milestone?.title}"
            {subtaskCount > 0
              ? `, its ${subtaskCount} subtask${subtaskCount === 1 ? "" : "s"}`
              : ""}
            , and all comments attached to them. This can't be undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting…" : "Delete milestone"}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}

// ── DeleteClientDialog ────────────────────────────────────────────────────────

function DeleteClientDialog({
  client,
  open,
  onOpenChange,
  onConfirm,
}: {
  client: ClientInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}) {
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmText("")
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleConfirm() {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete client.")
      setDeleting(false)
    }
  }

  const canConfirm = !!client && confirmText.trim() === client.name && !deleting

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete client</DialogTitle>
          <DialogDescription>
            This will permanently delete "{client?.name}" and all of its milestones,
            subtasks, and comments. This can't be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-client-name">
            Type <span className="font-medium text-foreground">{client?.name}</span> to
            confirm
          </Label>
          <Input
            id="confirm-client-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
            autoFocus
            autoComplete="off"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting…" : "Delete client"}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}

// ── PageShell ─────────────────────────────────────────────────────────────────
// Must live outside ClientDetailPage — defining a component inside another
// component's render gives it a new identity every render, which unmounts and
// remounts its subtree (and kills focus) on every state change.

function PageShell({
  client,
  progress,
  onSaveClientName,
  onDeleteClient,
  children,
}: {
  client: ClientInfo | null
  progress: number
  onSaveClientName: (name: string) => void
  onDeleteClient: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          {client ? (
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <InlineEdit
                  value={client.name}
                  onSave={onSaveClientName}
                  className="font-heading text-base font-semibold leading-tight"
                />
                {client.company && (
                  <span className="truncate text-xs text-muted-foreground">
                    {client.company}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-28 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {progress}%
                </span>
              </div>
            </div>
          ) : (
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          )}

          {client && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete client"
              onClick={onDeleteClient}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </header>

        {children}
        <BottomNav />
      </div>
    </div>
  )
}

// ── ClientDetailPage ──────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id: clientId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [noteFor, setNoteFor] = useState<NoteTarget>(null)
  const [generalDraft, setGeneralDraft] = useState("")
  const [deleteMilestoneTarget, setDeleteMilestoneTarget] = useState<Milestone | null>(null)
  const [deleteClientOpen, setDeleteClientOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "")
    })
  }, [])

  useEffect(() => {
    if (!clientId) return
    setLoading(true)

    supabase
      .from("clients")
      .select(
        "id, name, company, milestones(id, title, position, subtasks(id, title, position, status)), comments(id, content, author, created_at, milestone_id, subtask_id)"
      )
      .eq("id", clientId)
      .single()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr || !data) {
          setError(fetchErr?.message ?? "Client not found.")
          setLoading(false)
          return
        }

        setClient({ id: data.id, name: data.name, company: data.company })

        const sorted = (data.milestones as Milestone[])
          .sort((a, b) => a.position - b.position)
          .map((m) => ({
            ...m,
            subtasks: [...m.subtasks].sort((a, b) => a.position - b.position),
          }))
        setMilestones(sorted)

        setComments(
          (data.comments as Comment[]).sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        )
        setLoading(false)
      })
  }, [clientId])

  // ── mutations ─────────────────────────────────────────────────────────────

  function saveClientName(name: string) {
    setClient((c) => (c ? { ...c, name } : c))
    supabase.from("clients").update({ name }).eq("id", clientId!).then()
  }

  function saveMilestoneTitle(milestoneId: string, title: string) {
    setMilestones((ms) =>
      ms.map((m) => (m.id === milestoneId ? { ...m, title } : m))
    )
    supabase.from("milestones").update({ title }).eq("id", milestoneId).then()
  }

  function saveSubtaskTitle(milestoneId: string, subtaskId: string, title: string) {
    setMilestones((ms) =>
      ms.map((m) =>
        m.id === milestoneId
          ? { ...m, subtasks: m.subtasks.map((s) => (s.id === subtaskId ? { ...s, title } : s)) }
          : m
      )
    )
    supabase.from("subtasks").update({ title }).eq("id", subtaskId).then()
  }

  async function toggleSubtask(
    milestoneId: string,
    subtaskId: string,
    currentStatus: string
  ) {
    const next = currentStatus === "complete" ? "not_started" : "complete"

    setMilestones((ms) =>
      ms.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              subtasks: m.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, status: next } : s
              ),
            }
          : m
      )
    )

    const { error } = await supabase
      .from("subtasks")
      .update({ status: next })
      .eq("id", subtaskId)

    if (error) {
      // Roll back on failure
      setMilestones((ms) =>
        ms.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                subtasks: m.subtasks.map((s) =>
                  s.id === subtaskId ? { ...s, status: currentStatus } : s
                ),
              }
            : m
        )
      )
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  async function deleteSubtask(milestoneId: string, subtaskId: string) {
    const prevMilestones = milestones
    const prevComments = comments

    setMilestones((ms) =>
      ms.map((m) =>
        m.id === milestoneId
          ? { ...m, subtasks: m.subtasks.filter((s) => s.id !== subtaskId) }
          : m
      )
    )
    setComments((cs) => cs.filter((c) => c.subtask_id !== subtaskId))

    const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId)
    if (error) {
      setMilestones(prevMilestones)
      setComments(prevComments)
      throw error
    }
  }

  async function confirmDeleteMilestone() {
    if (!deleteMilestoneTarget) return
    const target = deleteMilestoneTarget
    const subtaskIds = new Set(target.subtasks.map((s) => s.id))
    const prevMilestones = milestones
    const prevComments = comments

    setMilestones((ms) => ms.filter((m) => m.id !== target.id))
    setComments((cs) =>
      cs.filter((c) => c.milestone_id !== target.id && !(c.subtask_id && subtaskIds.has(c.subtask_id)))
    )

    const { error } = await supabase.from("milestones").delete().eq("id", target.id)
    if (error) {
      setMilestones(prevMilestones)
      setComments(prevComments)
      throw error
    }
    setDeleteMilestoneTarget(null)
  }

  async function deleteClient() {
    if (!clientId) return
    const { error } = await supabase.from("clients").delete().eq("id", clientId)
    if (error) throw error
    navigate("/dashboard")
  }

  // ── comments ──────────────────────────────────────────────────────────────

  function handleNoteTarget(type: "milestone" | "subtask", id: string) {
    setNoteFor((prev) => (prev?.id === id ? null : { type, id }))
  }

  async function submitNote(text: string) {
    if (!clientId || !noteFor) return
    const now = new Date().toISOString()
    const optimistic: Comment = {
      id: crypto.randomUUID(),
      content: text,
      author: userEmail,
      created_at: now,
      milestone_id: noteFor.type === "milestone" ? noteFor.id : null,
      subtask_id: noteFor.type === "subtask" ? noteFor.id : null,
    }
    setComments((cs) => [optimistic, ...cs])
    setNoteFor(null)
    await supabase.from("comments").insert({
      client_id: clientId,
      content: text,
      author: userEmail,
      milestone_id: optimistic.milestone_id,
      subtask_id: optimistic.subtask_id,
    })
  }

  async function submitGeneral() {
    if (!clientId || !generalDraft.trim()) return
    const text = generalDraft.trim()
    const now = new Date().toISOString()
    setComments((cs) => [
      {
        id: crypto.randomUUID(),
        content: text,
        author: userEmail,
        created_at: now,
        milestone_id: null,
        subtask_id: null,
      },
      ...cs,
    ])
    setGeneralDraft("")
    await supabase.from("comments").insert({
      client_id: clientId,
      content: text,
      author: userEmail,
      milestone_id: null,
      subtask_id: null,
    })
  }

  // ── comment context tag lookup ─────────────────────────────────────────────

  const milestoneMap = new Map(milestones.map((m) => [m.id, m.title]))
  const subtaskMap = new Map(
    milestones.flatMap((m) => m.subtasks.map((s) => [s.id, s.title]))
  )

  function commentTag(c: Comment): string | null {
    if (c.subtask_id) return subtaskMap.get(c.subtask_id) ?? null
    if (c.milestone_id) return milestoneMap.get(c.milestone_id) ?? null
    return null
  }

  // ── render ────────────────────────────────────────────────────────────────

  const progress = calcProgress(milestones)

  if (loading) {
    return (
      <PageShell
        client={null}
        progress={0}
        onSaveClientName={saveClientName}
        onDeleteClient={() => setDeleteClientOpen(true)}
      >
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell
        client={null}
        progress={0}
        onSaveClientName={saveClientName}
        onDeleteClient={() => setDeleteClientOpen(true)}
      >
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-destructive">{error}</p>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell
      client={client}
      progress={progress}
      onSaveClientName={saveClientName}
      onDeleteClient={() => setDeleteClientOpen(true)}
    >
      <DeleteMilestoneDialog
        milestone={deleteMilestoneTarget}
        onOpenChange={(open) => !open && setDeleteMilestoneTarget(null)}
        onConfirm={confirmDeleteMilestone}
      />
      <DeleteClientDialog
        client={client}
        open={deleteClientOpen}
        onOpenChange={setDeleteClientOpen}
        onConfirm={deleteClient}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-4 md:p-6">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">

            {/* ── Milestones ──────────────────────────────────────────── */}
            <section className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Milestones
              </p>

              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet.</p>
              ) : (
                milestones.map((m) => (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    noteFor={noteFor}
                    onToggleSubtask={toggleSubtask}
                    onSaveMilestoneTitle={saveMilestoneTitle}
                    onSaveSubtaskTitle={saveSubtaskTitle}
                    onNoteTarget={handleNoteTarget}
                    onNoteSubmit={submitNote}
                    onNoteCancel={() => setNoteFor(null)}
                    onDeleteMilestone={setDeleteMilestoneTarget}
                    onDeleteSubtask={deleteSubtask}
                  />
                ))
              )}
            </section>

            {/* ── Notes / Comments ────────────────────────────────────── */}
            <section className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Notes
              </p>

              {/* General note input */}
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:border-ring transition-colors"
                  placeholder="Add a note…"
                  value={generalDraft}
                  onChange={(e) => setGeneralDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitGeneral()
                  }}
                />
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!generalDraft.trim()}
                  onClick={submitGeneral}
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>

              {/* Feed */}
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {comments.map((c) => {
                    const tag = commentTag(c)
                    return (
                      <div key={c.id} className="flex flex-col gap-1.5 py-3 first:pt-1">
                        <p className="text-sm leading-relaxed">{c.content}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {tag && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              on: {tag}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(c.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  )
}
