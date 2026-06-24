import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Customers", href: "#customers" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 font-heading text-base font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ArrowRight className="size-4" />
          </span>
          Onward
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button>Get started</Button>
        </div>
      </div>
    </header>
  )
}
