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
  const sourceType = searchParams.get('type') || 'youtube' // Default to youtube for backward compatibility
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    if (videoId) {
      // Construct video data with proper sourceType
      const videoData = {
        videoId,
        sourceType,
        source: sourceType === 'youtube' 
          ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=https://vidyaai.co&controls=0`
          : '',
        title: '', // Will be fetched by ImprovedYouTubePlayer
        videoUrl: '' // Will be fetched for uploaded videos
      }
      setSelectedVideo(videoData)
    } else {
      // No video in URL - clear selection
      setSelectedVideo(null)
    }
  }, [videoId, sourceType])

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
