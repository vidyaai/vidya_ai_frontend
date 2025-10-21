'use client'

import { useRouter } from 'next/navigation'
import HomePage from '@/components/HomePage/HomePage'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function HomeRoute() {
  const router = useRouter()
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login')
    }
  }, [currentUser, loading, router])

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <HomePage
      onNavigateToChat={(videoData) => {
        if (videoData) {
          router.push(`/chat?v=${videoData.videoId}`)
        } else {
          router.push('/chat')
        }
      }}
      onNavigateToTranslate={() => router.push('/translate')}
      onNavigateToAssignments={() => router.push('/assignments')}
      onNavigateToPricing={() => router.push('/pricing')}
    />
  )
}
