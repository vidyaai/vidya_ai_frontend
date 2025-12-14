import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Vidya AI',
  description: 'Educational insights and guides on using AI for teaching and learning',
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <nav className="mb-8">
          <a
            href="/"
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Vidya AI
          </a>
        </nav>
        <article className="prose prose-invert prose-lg max-w-none">
          {children}
        </article>
      </div>
    </div>
  )
}
