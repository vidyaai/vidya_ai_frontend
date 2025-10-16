'use client'

import VidyaLandingPage from '@/components/Landing/VidyaLandingPage'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function LandingPageWrapper() {
  const router = useRouter()
  const { currentUser, loading } = useAuth()

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/home')
    }
  }, [currentUser, loading, router])

  const handleLogin = () => {
    router.push('/login')
  }

  const handleNavigateToLoginWithTarget = (targetPage: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('postLoginTarget', targetPage)
    }
    router.push('/login')
  }

  // Show loading state briefly
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  // If logged in, show nothing (will redirect)
  if (currentUser) {
    return null
  }

  return (
    <VidyaLandingPage
      onLogin={handleLogin}
      onNavigateToLoginWithTarget={handleNavigateToLoginWithTarget}
    />
  )
}
