import type { Metadata } from 'next'
import MarketingPageShell from '@/components/Landing/MarketingPageShell'

export const metadata: Metadata = {
  title: 'Sample Papers | Vidya AI',
  description: 'Explore AI-generated sample assignments and solutions across various technical subjects',
}

export default function SamplePapersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MarketingPageShell>{children}</MarketingPageShell>
}
