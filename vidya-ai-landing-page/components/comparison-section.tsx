import { Check, X, Minus } from "lucide-react"

const features = [
  { name: "Video Storage", vidya: true, competitor1: true, competitor2: true, competitor3: true, competitor4: true },
  { name: "AI Chatbot", vidya: true, competitor1: true, competitor2: true, competitor3: false, competitor4: false },
  { name: "AI Quizzes", vidya: true, competitor1: true, competitor2: false, competitor3: false, competitor4: false },
  {
    name: "Live Translation",
    vidya: true,
    competitor1: "partial",
    competitor2: "partial",
    competitor3: "partial",
    competitor4: false,
  },
  {
    name: "AI-based HW Grading",
    vidya: true,
    competitor1: false,
    competitor2: false,
    competitor3: false,
    competitor4: false,
  },
  { name: "AI Avatar", vidya: true, competitor1: false, competitor2: false, competitor3: false, competitor4: false },
]

function StatusIcon({ status }: { status: boolean | string }) {
  if (status === true) {
    return <Check className="h-5 w-5 text-accent" />
  }
  if (status === "partial") {
    return <Minus className="h-5 w-5 text-muted-foreground" />
  }
  return <X className="h-5 w-5 text-muted-foreground/50" />
}

export function ComparisonSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-accent uppercase tracking-wider">Comparison</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-4 text-balance">
            Why choose Vidya AI?
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            The only platform with complete AI-powered education features.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 pr-4 font-medium text-muted-foreground">Feature</th>
                <th className="py-4 px-4 font-semibold text-accent text-center">Vidya AI</th>
                <th className="py-4 px-4 font-medium text-muted-foreground text-center">Others</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-4 pr-4 text-foreground">{feature.name}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon status={feature.vidya} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <StatusIcon status={feature.competitor1} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          <Minus className="h-4 w-4 inline mr-1" /> Partial support (transcripts only)
        </p>
      </div>
    </section>
  )
}
