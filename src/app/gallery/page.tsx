'use client'

import { useRouter } from 'next/navigation'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import Gallery from '@/components/Gallery/Gallery'
import TopBar from '@/components/generic/TopBar'
import PageHeader from '@/components/generic/PageHeader'

export default function GalleryRoute() {
  const router = useRouter()

  return (
    <ProtectedRouteWrapper>
      <div className="min-h-screen bg-gray-950">
        <TopBar onNavigateToHome={() => router.push('/home')} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="My Gallery"
            onNavigateToChat={() => router.push('/chat')}
            onNavigateToGallery={() => router.push('/gallery')}
            onNavigateToTranslate={() => router.push('/translate')}
            onNavigateToHome={() => router.push('/home')}
            onNavigateToPricing={() => router.push('/pricing')}
          />
          <Gallery onNavigateToChat={(videoData) => {
            if (videoData?.videoId) {
              router.push(`/chat?v=${videoData.videoId}&type=${videoData.sourceType || 'youtube'}`)
            } else {
              router.push('/chat')
            }
          }} />
        </div>
      </div>
    </ProtectedRouteWrapper>
  )
}
