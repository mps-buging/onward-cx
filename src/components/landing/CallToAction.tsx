import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to make onboarding your competitive advantage?
        </h2>
        <p className="max-w-xl text-primary-foreground/80">
          Join the teams using Onward to cut time-to-value and turn new
          customers into long-term advocates.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="secondary" className="gap-1.5">
            Get started for free
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            Talk to sales
          </Button>
        </div>
      </div>
    </section>
  )
}
