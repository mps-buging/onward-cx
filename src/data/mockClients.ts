export type ClientStatus = "on_track" | "behind" | "complete"

export type Client = {
  id: string
  name: string
  company: string
  status: ClientStatus
  workspace_id?: string
  milestonesCompleted?: number
  milestonesTotal?: number
  dueDate?: string
  created_at?: string
}

export const mockClients: Client[] = [
  {
    id: "1",
    name: "Sarah Chen",
    company: "Veritas Analytics",
    status: "on_track",
    milestonesCompleted: 3,
    milestonesTotal: 5,
    dueDate: "2026-08-15",
  },
  {
    id: "2",
    name: "Marcus Williams",
    company: "Bloom Retail",
    status: "behind",
    milestonesCompleted: 1,
    milestonesTotal: 6,
    dueDate: "2026-07-20",
  },
  {
    id: "3",
    name: "Priya Sharma",
    company: "NorthBridge Co.",
    status: "complete",
    milestonesCompleted: 5,
    milestonesTotal: 5,
    dueDate: "2026-06-30",
  },
]
