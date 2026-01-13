"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-new.png"
              alt="Vidya AI Logo"
              width={120}
              height={40}
              className="h-8 w-auto invert"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Problem
            </a>
            <a href="#solution" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Solution
            </a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-sm">
              Log in
            </Button>
            <Button className="text-sm bg-foreground text-background hover:bg-foreground/90">Get Started</Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a href="#problem" className="text-sm text-muted-foreground hover:text-foreground">
                Problem
              </a>
              <a href="#solution" className="text-sm text-muted-foreground hover:text-foreground">
                Solution
              </a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contact Us
              </a>
              <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="text-sm flex-1">
                  Log in
                </Button>
                <Button className="text-sm flex-1 bg-foreground text-background">Get Started</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
