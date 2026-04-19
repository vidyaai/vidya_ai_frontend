'use client'

import { useRouter } from 'next/navigation'
import MarketingPageShell from '@/components/Landing/MarketingPageShell'
import { LANDING_ROUTES } from '@/components/Landing/landingCtas'
import PricingPage from '@/components/Pricing/PricingPage'

export default function PricingRoute() {
  const router = useRouter()

  return (
    <MarketingPageShell mainClassName="pt-16 sm:pt-20">
      <PricingPage
        embedded
        onNavigateToHome={() => router.push(LANDING_ROUTES.home)}
        onNavigateToChat={() => router.push('/chat')}
        onNavigateToGallery={() => router.push('/gallery')}
        onNavigateToPricing={() => router.push('/pricing')}
      />
    </MarketingPageShell>
  )
}
