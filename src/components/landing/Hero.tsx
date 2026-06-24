import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const checklist = [
  { label: "Account provisioned", done: true },
  { label: "Team invited", done: true },
  { label: "Data imported", done: true },
  { label: "First workflow live", done: false },
]

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="size-3.5" />
            Customer onboarding, reimagined
          </div>

          <h1 className="mt-5 font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Turn new customers into power users — faster.
          </h1>

          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Onward helps your team design guided onboarding journeys, track
            activation in real time, and turn first impressions into lasting
            adoption.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="gap-1.5">
              Start onboarding smarter
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline">
              Watch demo
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required &middot; Set up in minutes
          </p>
        </div>

        <Card className="p-2 ring-1 ring-foreground/10">
          <div className="rounded-lg bg-muted p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Acme Corp onboarding</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                75% complete
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>

            <ul className="mt-5 space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <CheckCircle2
                    className={
                      item.done
                        ? "size-4 text-primary"
                        : "size-4 text-muted-foreground/40"
                    }
                  />
                  <span className={item.done ? "" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </section>
  )
}
