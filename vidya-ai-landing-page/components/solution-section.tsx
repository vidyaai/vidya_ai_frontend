import { Sparkles, BookOpen, BarChart3, Bot } from "lucide-react"

export function SolutionSection() {
  return (
    <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-accent uppercase tracking-wider">The Solution</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-4 text-balance">
            Vidya AI—Your All-in-One Learning Companion
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            AI-powered tools that transform education for both students and professors.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* For Students */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <BookOpen className="h-4 w-4" />
                For Students
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-4">AI Learning Assistant</h3>
              <p className="text-muted-foreground mb-8">
                Get instant answers, study smarter, and never wait for office hours again.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Bot className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">AI Chat from Video</p>
                    <p className="text-sm text-muted-foreground">Ask questions about lecture content instantly</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Voice-Cloned Translations</p>
                    <p className="text-sm text-muted-foreground">
                      Learn in your native language with professor{"'"}s voice
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Smart Quizzes</p>
                    <p className="text-sm text-muted-foreground">Auto-generated practice tests from your materials</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* For Professors */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <BarChart3 className="h-4 w-4" />
                For Professors
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-4">AI Grading Assistant</h3>
              <p className="text-muted-foreground mb-8">
                Automate assessments, get insights, and reclaim your time for what matters.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Auto-Generate Assignments</p>
                    <p className="text-sm text-muted-foreground">Create relevant homework from course materials</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">AI Grading and Analytics</p>
                    <p className="text-sm text-muted-foreground">Consistent, fair grading with detailed insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Lecture Summaries</p>
                    <p className="text-sm text-muted-foreground">Organized course content for easy reference</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
