'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import ImprovedYoutubePlayer from '@/components/Chat/ImprovedYouTubePlayer'
import TopBar from '@/components/generic/TopBar'

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
      <div className="min-h-screen bg-zinc-950">
        <TopBar onNavigateToHome={() => router.push('/home')} />
        <div className="max-w-full mx-auto px-6 py-4">
          <ImprovedYoutubePlayer
            onNavigateToHome={() => router.push('/home')}
            onNavigateToGallery={() => router.push('/gallery')}
            onClearVideo={() => router.push('/chat')}
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
