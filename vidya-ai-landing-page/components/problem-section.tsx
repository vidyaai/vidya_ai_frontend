import { Clock, Users, AlertTriangle, GraduationCap } from "lucide-react"

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-accent uppercase tracking-wider">The Problem</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-4 text-balance">
            Education is broken—for everyone
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Students struggle to get support, while professors drown in grading. The system fails both sides.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Problems */}
          <div className="bg-background rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-destructive/10">
                <GraduationCap className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Limited Student Support</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Only 3 hours per week</p>
                  <p className="text-sm text-muted-foreground">Professors and TAs provide limited office hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Days to clear doubts</p>
                  <p className="text-sm text-muted-foreground">Students wait endlessly for answers to questions</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">45% deadline submissions</p>
                  <p className="text-sm text-muted-foreground">Delayed feedback slows down learning velocity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professor Problems */}
          <div className="bg-background rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Users className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Grading Overload for Professors</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">33 hours/week grading</p>
                  <p className="text-sm text-muted-foreground">Professors and TAs spend excessive time on assessment</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Subjective and uneven</p>
                  <p className="text-sm text-muted-foreground">Human grading introduces inconsistency and bias</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Delayed graduations</p>
                  <p className="text-sm text-muted-foreground">Overworked TAs impact research and student outcomes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
