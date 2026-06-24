const columns = [
  {
    title: "Product",
    links: ["Features", "How it works", "Integrations", "Pricing"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers"],
  },
  {
    title: "Resources",
    links: ["Help center", "Blog", "API docs"],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-base font-semibold">Onward</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              The onboarding workspace that turns new customers into long-term
              advocates.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-medium">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Onward. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
