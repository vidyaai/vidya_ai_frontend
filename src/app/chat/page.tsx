'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import ImprovedYoutubePlayer from '@/components/Chat/ImprovedYouTubePlayer'
import TopBar from '@/components/generic/TopBar'
import PageHeader from '@/components/generic/PageHeader'

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    if (videoId) {
      // You might want to fetch video details here or construct video data
      setSelectedVideo({ videoId })
    }
  }, [videoId])

  return (
    <ProtectedRouteWrapper>
      <div className="min-h-screen bg-gray-950">
        <TopBar onNavigateToHome={() => router.push('/home')} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title={selectedVideo ? "Chat with Video" : "Chat with My Video"}
            onNavigateToChat={() => router.push('/chat')}
            onNavigateToGallery={() => router.push('/gallery')}
            onNavigateToTranslate={() => router.push('/translate')}
            onNavigateToHome={() => router.push('/home')}
            onNavigateToPricing={() => router.push('/pricing')}
          />
          <ImprovedYoutubePlayer
            onNavigateToHome={() => router.push('/home')}
            onNavigateToTranslate={() => router.push('/translate')}
            selectedVideo={selectedVideo}
          />
        </div>
      </div>
    </ProtectedRouteWrapper>
  )
}

export default function ChatRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
