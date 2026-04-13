'use client'

import VidyaLandingPageNew from '@/components/Landing/VidyaLandingPageNew'
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

  // If auth is already resolved and the user is logged in, show nothing while redirecting.
  // For the public landing page we avoid blocking the initial render behind auth loading,
  // which can otherwise look like a blank page if hydration is delayed in the browser.
  if (!loading && currentUser) {
    return null
  }

  return (
    <VidyaLandingPageNew
      onLogin={handleLogin}
      onNavigateToLoginWithTarget={handleNavigateToLoginWithTarget}
    />
  )
}
