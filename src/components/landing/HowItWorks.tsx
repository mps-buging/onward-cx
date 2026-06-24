const steps = [
  {
    number: "01",
    title: "Map the journey",
    description:
      "Lay out the steps, owners, and resources every new customer needs to go live — once, reusable for every account.",
  },
  {
    number: "02",
    title: "Invite your customer",
    description:
      "Share a branded portal where customers track their own progress, upload assets, and ask questions in context.",
  },
  {
    number: "03",
    title: "Track to activation",
    description:
      "Monitor every account from a single dashboard and get alerted the moment someone needs a hand.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border/60 bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            From kickoff to activation in three steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Onward fits into how your team already works — no rip and replace.
          </p>
        </div>

        <ol className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number}>
              <span className="font-heading text-sm font-semibold text-primary">
                {step.number}
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
