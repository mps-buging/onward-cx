import { useCallback, useEffect, useState } from "react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomNav } from "@/components/dashboard/BottomNav"
import { InviteMemberModal } from "@/components/dashboard/InviteMemberModal"
import { SettingsTabs } from "@/components/settings/SettingsTabs"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { useWorkspace } from "@/context/WorkspaceContext"
import { supabase, describeFunctionError } from "@/lib/supabase"

type Member = { user_id: string; email: string; role: string; created_at: string }
type Invite = { id: string; email: string; role: string; created_at: string }

export function TeamPage() {
  const { workspaceId, role, loading: wsLoading } = useWorkspace()
  const isAdmin = role === "owner" || role === "admin"

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [removing, setRemoving] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)

    const [membersRes, invitesRes] = await Promise.all([
      supabase.rpc("get_workspace_members", { p_workspace_id: workspaceId }),
      supabase
        .from("invites")
        .select("id, email, role, created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("created_at"),
    ])

    if (membersRes.error) setError(membersRes.error.message)
    else setMembers(membersRes.data ?? [])

    if (invitesRes.error) setError(invitesRes.error.message)
    else setInvites(invitesRes.data ?? [])

    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    if (!wsLoading) fetchAll()
  }, [wsLoading, fetchAll])

  async function handleRemove() {
    if (!removeTarget || !workspaceId) return
    setRemoving(true)
    const { error: delErr } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", removeTarget.user_id)
    setRemoving(false)
    if (delErr) {
      setError(delErr.message)
    } else {
      setRemoveTarget(null)
      fetchAll()
    }
  }

  async function handleRevoke(invite: Invite) {
    setRevokingId(invite.id)
    const { error: revokeErr } = await supabase
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", invite.id)
    setRevokingId(null)
    if (revokeErr) setError(revokeErr.message)
    else fetchAll()
  }

  async function handleResend(invite: Invite) {
    setResendingId(invite.id)
    setResendError(null)
    const { error: sendErr } = await supabase.functions.invoke("send-invite-email", {
      body: { inviteId: invite.id },
    })
    setResendingId(null)
    if (sendErr) setResendError(await describeFunctionError(sendErr))
  }

  const existingEmails = members.map((m) => m.email).concat(invites.map((i) => i.email))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <h1 className="font-heading text-base font-semibold">Team</h1>
          {isAdmin && (
            <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite
            </Button>
          )}
        </header>

        <SettingsTabs />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading || wsLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="flex flex-col gap-8">
              <section>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">Members</h2>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <tr key={m.user_id} className={i < members.length - 1 ? "border-b border-border" : ""}>
                          <td className="px-4 py-3 font-medium">{m.email}</td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">{m.role}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end">
                              {isAdmin && m.role !== "owner" && m.user_id !== currentUserId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => setRemoveTarget(m)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {isAdmin && (
                <section>
                  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Pending invites</h2>
                  {invites.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending invites.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                            <th className="px-4 py-2.5" />
                          </tr>
                        </thead>
                        <tbody>
                          {invites.map((inv, i) => (
                            <tr key={inv.id} className={i < invites.length - 1 ? "border-b border-border" : ""}>
                              <td className="px-4 py-3 font-medium">{inv.email}</td>
                              <td className="px-4 py-3 capitalize text-muted-foreground">{inv.role}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={resendingId === inv.id}
                                    onClick={() => handleResend(inv)}
                                  >
                                    {resendingId === inv.id ? "Sending…" : "Resend"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    disabled={revokingId === inv.id}
                                    onClick={() => handleRevoke(inv)}
                                  >
                                    Revoke
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {resendError && <p className="mt-2 text-sm text-destructive">{resendError}</p>}
                </section>
              )}
            </div>
          )}
        </main>

        <BottomNav />
      </div>

      {workspaceId && (
        <InviteMemberModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          workspaceId={workspaceId}
          existingEmails={existingEmails}
          onSuccess={fetchAll}
        />
      )}

      <DialogRoot
        open={!!removeTarget}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove "{removeTarget?.email}"?</DialogTitle>
            <DialogDescription>
              They'll lose access to this workspace immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={removing}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" disabled={removing} onClick={handleRemove}>
              {removing ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}
