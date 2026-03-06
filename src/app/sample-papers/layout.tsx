import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sample Papers | Vidya AI',
  description: 'Explore AI-generated sample assignments and solutions across various technical subjects',
}

export default function SamplePapersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="mb-8">
          <a
            href="/"
            className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Vidya AI
          </a>
        </nav>
        {children}
      </div>
    </div>
  )
}
