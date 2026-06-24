import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { CallToAction } from "@/components/landing/CallToAction"
import { Footer } from "@/components/landing/Footer"

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CallToAction />
      </main>
      <Footer />
    </div>
  )
}

export default App
