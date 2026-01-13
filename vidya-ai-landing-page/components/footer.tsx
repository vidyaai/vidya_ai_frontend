import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-new.png"
              alt="Vidya AI Logo"
              width={100}
              height={32}
              className="h-6 w-auto invert"
            />
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
            <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Problem
            </a>
            <a href="#solution" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Solution
            </a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#traction" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Traction
            </a>
            <a href="#team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Team
            </a>
          </nav>

          <p className="text-sm text-muted-foreground">© 2025 Vidya AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
