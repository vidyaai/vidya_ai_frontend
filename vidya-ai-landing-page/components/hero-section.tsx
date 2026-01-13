import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-muted-foreground">Backed by NVIDIA Inception & AWS</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 text-balance">
          Education Meets <span className="text-accent">AI</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty leading-relaxed">
          Your all-in-one AI learning companion. Empowering students with instant answers and professors with automated
          grading—transforming education at scale.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-base">
            Request Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-8 h-12 text-base border-border hover:bg-secondary bg-transparent"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Demo
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">33+</div>
            <div className="text-sm text-muted-foreground mt-1">Hours saved weekly</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">500+</div>
            <div className="text-sm text-muted-foreground mt-1">Universities targeted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">$47.8B</div>
            <div className="text-sm text-muted-foreground mt-1">Market opportunity</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-foreground">24/7</div>
            <div className="text-sm text-muted-foreground mt-1">AI availability</div>
          </div>
        </div>
      </div>
    </section>
  )
}
