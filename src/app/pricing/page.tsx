'use client'

import { useRouter } from 'next/navigation'
import PricingPage from '@/components/Pricing/PricingPage'

export default function PricingRoute() {
  const router = useRouter()

  return (
    <PricingPage
      onNavigateToHome={() => router.push('/home')}
      onNavigateToChat={() => router.push('/chat')}
      onNavigateToGallery={() => router.push('/gallery')}
      onNavigateToTranslate={() => router.push('/translate')}
      onNavigateToPricing={() => router.push('/pricing')}
    />
  )
}
