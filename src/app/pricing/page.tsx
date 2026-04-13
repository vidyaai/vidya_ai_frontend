'use client'

import { useRouter } from 'next/navigation'
import MarketingPageShell from '@/components/Landing/MarketingPageShell'
import PricingPage from '@/components/Pricing/PricingPage'

export default function PricingRoute() {
  const router = useRouter()

  return (
    <MarketingPageShell mainClassName="pt-16 sm:pt-20">
      <PricingPage
        embedded
        onNavigateToHome={() => router.push('/home')}
        onNavigateToChat={() => router.push('/chat')}
        onNavigateToGallery={() => router.push('/gallery')}
        onNavigateToTranslate={() => router.push('/translate')}
        onNavigateToPricing={() => router.push('/pricing')}
      />
    </MarketingPageShell>
  )
}
