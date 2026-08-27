import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

type Mode = "signup" | "login"

const copy = {
  signup: {
    heading: "Get started",
    subheading: "Enter your email and we'll send you a magic link.",
    button: "Send me a magic link",
    bottomText: "Already have an account?",
    bottomLabel: "Log in",
    bottomHref: "/login",
  },
  login: {
    heading: "Welcome back",
    subheading: "Enter your email and we'll send you a magic link.",
    button: "Send me a magic link",
    bottomText: "Don't have an account?",
    bottomLabel: "Sign up",
    bottomHref: "/signup",
  },
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const c = copy[mode]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Supabase dashboard: Authentication → URL Configuration → Redirect URLs
        // Add http://localhost:5173 (dev) and your Cloudflare Pages domain (prod)
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    })

    if (error) {
      // Some failure modes (e.g. an SMTP-level send error) come back from
      // supabase-js without a usable message — fall back to something readable.
      const message = error.message?.trim()
      setError(message && message !== "{}" ? message : "Something went wrong sending the magic link. Please try again.")
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowRight className="size-4" />
            </div>
            <p className="font-heading text-base font-semibold">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <span className="font-medium text-foreground">{email}</span>.
              Click it to sign in — no password needed.
            </p>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowRight className="size-4" />
            </span>
            <span className="font-heading text-sm font-semibold">Onward</span>
          </div>
          <p className="font-heading text-xl font-semibold">{c.heading}</p>
          <p className="text-sm text-muted-foreground">{c.subheading}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : c.button}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {c.bottomText}{" "}
            <Link
              to={c.bottomHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {c.bottomLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
