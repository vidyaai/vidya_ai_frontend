import { Award, Cloud, Cpu, Mic } from "lucide-react"

const accelerators = [
  {
    icon: Award,
    name: "Beta University",
    description: "Selected for the world's largest pre-accelerator program.",
  },
  {
    icon: Cloud,
    name: "AWS Activate",
    description: "Startup credits and cloud resources unlocked.",
  },
  {
    icon: Mic,
    name: "ElevenLabs Grant",
    description: "Credits for advanced voice cloning and dubbing technology.",
  },
  {
    icon: Cpu,
    name: "NVIDIA Inception",
    description: "Accepted into NVIDIA's global startup accelerator.",
  },
]

export function TractionSection() {
  return (
    <section id="traction" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Backed by industry leaders
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Recognized and supported by top accelerators and technology partners.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {accelerators.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-background border border-border hover:border-accent/30 transition-colors"
            >
              <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4">
                <item.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
