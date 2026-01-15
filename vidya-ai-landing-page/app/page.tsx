import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { SolutionSection } from "@/components/solution-section"
import { ComparisonSection } from "@/components/comparison-section"
import { TractionSection } from "@/components/traction-section"
import { TrustedBySection } from "@/components/trusted-by-section"
import { BackedBySection } from "@/components/backed-by-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <TractionSection />
      <TrustedBySection />
      <BackedBySection />
      <CTASection />
      <Footer />
    </main>
  )
}
