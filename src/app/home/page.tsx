'use client'

import { useRouter } from 'next/navigation'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import HomePage from '@/components/HomePage/HomePage'

export default function HomeRoute() {
  const router = useRouter()

  return (
    <ProtectedRouteWrapper>
      <HomePage
        onNavigateToChat={(videoData) => {
          if (videoData) {
            router.push(`/chat?v=${videoData.videoId}`)
          } else {
            router.push('/chat')
          }
        }}
        onNavigateToGallery={() => router.push('/gallery')}
        onNavigateToAssignments={(section?: string) => {
          if (section === 'ai-generator') {
            router.push('/assignments?section=ai-generator')
          } else {
            router.push('/assignments')
          }
        }}
        onNavigateToPricing={() => router.push('/pricing')}
      />
    </ProtectedRouteWrapper>
  )
}
