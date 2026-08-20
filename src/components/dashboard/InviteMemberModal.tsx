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
import { supabase, describeFunctionError } from "@/lib/supabase"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  existingEmails: string[]
  onSuccess: () => void
}

export function InviteMemberModal({ open, onOpenChange, workspaceId, existingEmails, onSuccess }: Props) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"member" | "admin">("member")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEmail("")
      setRole("member")
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    if (existingEmails.some((e) => e.toLowerCase() === normalizedEmail)) {
      setError("This person is already a member of the workspace.")
      return
    }

    setSaving(true)
    setError(null)

    const { data: userRes } = await supabase.auth.getUser()
    const invitedBy = userRes.user?.id
    if (!invitedBy) {
      setError("You must be signed in to send invites.")
      setSaving(false)
      return
    }

    const { data: invite, error: insertErr } = await supabase
      .from("invites")
      .insert({ workspace_id: workspaceId, email: normalizedEmail, role, invited_by: invitedBy })
      .select("id")
      .single()

    if (insertErr || !invite) {
      setError(
        insertErr?.code === "23505"
          ? "An invite is already pending for this email."
          : insertErr?.message ?? "Failed to create invite."
      )
      setSaving(false)
      return
    }

    const { error: emailErr } = await supabase.functions.invoke("send-invite-email", {
      body: { inviteId: invite.id },
    })

    if (emailErr) {
      setError(
        `Invite created, but the email failed to send: ${await describeFunctionError(emailErr)}. You can resend it from the pending invites list.`
      )
      setSaving(false)
      return
    }

    setSaving(false)
    handleOpenChange(false)
    onSuccess()
  }

  const canSubmit = !!email.trim() && !saving

  return (
    <DialogRoot open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>
            Send an invite to join this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              disabled={saving}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
