'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SetUserTypePage from '@/components/SetUserType/SetUserTypePage'

export default function SetUserTypeRoute() {
  const router = useRouter()
  const { currentUser, loading, userType, userTypeLoading } = useAuth()

  useEffect(() => {
    if (loading || userTypeLoading) return
    if (!currentUser) {
      router.push('/login?returnUrl=/set-user-type')
      return
    }
    if (userType !== null) {
      router.push('/home')
    }
  }, [currentUser, loading, userType, userTypeLoading, router])

  if (loading || userTypeLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!currentUser || userType !== null) {
    return null // Will redirect
  }

  return <SetUserTypePage />
}
