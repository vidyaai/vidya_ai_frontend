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
      // Try to get full video metadata from sessionStorage first
      let videoData = null;
      
      // Look for recent video metadata entries in sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`video_metadata_${videoId}_`)) {
          try {
            const storedData = sessionStorage.getItem(key);
            if (storedData) {
              videoData = JSON.parse(storedData);
              // Clean up after retrieval
              sessionStorage.removeItem(key);
              break;
            }
          } catch (e) {
            console.error('Error parsing video metadata from sessionStorage:', e);
          }
        }
      }
      
      // If we found metadata in sessionStorage, use it; otherwise fall back to just videoId
      if (videoData) {
        setSelectedVideo(videoData);
      } else {
        // Fall back to just videoId for direct URLs (source detection will handle this)
        setSelectedVideo({ videoId });
      }
    } else {
      // Clear selected video when no videoId in URL
      setSelectedVideo(null);
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
            selectedVideo={selectedVideo}
          />
        </div>
      </div>
    </ProtectedRouteWrapper>
  )
}

export default function ChatRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>}>
      <ChatContent />
    </Suspense>
  )
}
