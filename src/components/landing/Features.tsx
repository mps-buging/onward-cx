import type { LucideIcon } from "lucide-react"
import { LineChart, ListChecks, Plug, Route, Users, Workflow } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Route,
    title: "Guided journeys",
    description:
      "Build step-by-step onboarding flows tailored to each customer segment, role, or plan.",
  },
  {
    icon: ListChecks,
    title: "Smart checklists",
    description:
      "Turn complex setup tasks into bite-sized milestones your customers actually complete.",
  },
  {
    icon: LineChart,
    title: "Activation tracking",
    description:
      "See exactly where customers stall and step in before momentum — and revenue — is lost.",
  },
  {
    icon: Users,
    title: "Team handoffs",
    description:
      "Keep sales, CS, and support in sync with shared visibility into every account's progress.",
  },
  {
    icon: Plug,
    title: "Integrations",
    description:
      "Connect to your CRM, product, and support tools without writing custom code.",
  },
  {
    icon: Workflow,
    title: "Automated nudges",
    description:
      "Trigger emails, in-app messages, and CSM tasks the moment a customer falls behind.",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to onboard with confidence
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          One workspace for every step between "signed" and "activated."
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </span>
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
