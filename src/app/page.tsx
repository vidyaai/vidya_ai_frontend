'use client'

import VidyaLandingPage from '@/components/Landing/VidyaLandingPage'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()
  const { currentUser } = useAuth()

  // Redirect to home if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/home')
    }
  }, [currentUser, router])

  const handleLogin = () => {
    router.push('/login')
  }

  const handleNavigateToLoginWithTarget = (targetPage: string) => {
    sessionStorage.setItem('postLoginTarget', targetPage)
    router.push('/login')
  }

  if (currentUser) {
    return null // Will redirect
  }

  return (
    <VidyaLandingPage
      onLogin={handleLogin}
      onNavigateToLoginWithTarget={handleNavigateToLoginWithTarget}
    />
  )
}
