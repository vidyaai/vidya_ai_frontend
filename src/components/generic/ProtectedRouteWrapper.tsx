'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect, ReactNode } from 'react'

export default function ProtectedRouteWrapper({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    if (!loading && !currentUser) {
      const currentPath = window.location.pathname + window.location.search
      router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`)
    }
  }, [currentUser, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!currentUser) {
    return null // Will redirect
  }

  return <>{children}</>
}
