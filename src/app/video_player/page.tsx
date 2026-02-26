'use client'

import { Suspense } from 'react'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import VideoPlayerContent from '@/components/Courses/VideoPlayerContent'

export default function VideoPlayerPage() {
  return (
    <ProtectedRouteWrapper>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        }
      >
        <VideoPlayerContent />
      </Suspense>
    </ProtectedRouteWrapper>
  )
}
