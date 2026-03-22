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
        <div className="max-w-full mx-auto px-6 py-4">
          <Gallery
            onNavigateToChat={(videoData) => {
              if (videoData?.videoId) {
                router.push(`/chat?v=${videoData.videoId}&type=${videoData.sourceType || 'youtube'}`)
              } else {
                router.push('/chat')
              }
            }}
            onNavigateToHome={() => router.push('/home')}
          />
        </div>
      </div>
    </ProtectedRouteWrapper>
  )
}
