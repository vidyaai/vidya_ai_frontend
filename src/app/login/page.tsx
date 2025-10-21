'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import AuthForm from '@/components/Login/AuthForm'
import { useAuth } from '@/context/AuthContext'
import { useEffect, Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser } = useAuth()
  const returnUrl = searchParams.get('returnUrl')

  useEffect(() => {
    if (currentUser) {
      if (returnUrl) {
        router.push(returnUrl)
      } else {
        const postLoginTarget = sessionStorage.getItem('postLoginTarget')
        if (postLoginTarget) {
          sessionStorage.removeItem('postLoginTarget')
          router.push(`/${postLoginTarget}`)
        } else {
          router.push('/home')
        }
      }
    }
  }, [currentUser, returnUrl, router])

  if (currentUser) {
    return null // Will redirect
  }

  return <AuthForm onNavigateToLanding={() => router.push('/')} returnUrl={returnUrl || undefined} />
}

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>}>
      <LoginContent />
    </Suspense>
  )
}
