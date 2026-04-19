'use client'

import VidyaLandingPageNew from '@/components/Landing/VidyaLandingPageNew'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function LandingPageWrapper({
  forceLandingView = false,
}: {
  forceLandingView?: boolean
}) {
  const router = useRouter()
  const { currentUser, loading } = useAuth()

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && currentUser && !forceLandingView) {
      router.push('/home')
    }
  }, [currentUser, forceLandingView, loading, router])

  const handleLogin = () => {
    router.push('/login')
  }

  const handleNavigateToLoginWithTarget = (targetPage: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('postLoginTarget', targetPage)
    }
    router.push('/login')
  }

  // If auth is already resolved and the user is logged in, show nothing while redirecting
  // unless the user explicitly asked to view the public landing page.
  if (!loading && currentUser && !forceLandingView) {
    return null
  }

  return (
    <VidyaLandingPageNew
      onLogin={handleLogin}
      onNavigateToLoginWithTarget={handleNavigateToLoginWithTarget}
    />
  )
}
