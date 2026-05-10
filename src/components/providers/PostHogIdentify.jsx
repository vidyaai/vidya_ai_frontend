'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { useAuth } from '@/context/AuthContext'

export function PostHogIdentify() {
  const { currentUser } = useAuth()
  const lastIdentifiedUidRef = useRef(null)

  useEffect(() => {
    if (currentUser?.uid) {
      if (lastIdentifiedUidRef.current === currentUser.uid) return
      posthog.identify(currentUser.uid, {
        email: currentUser.email ?? undefined,
        name: currentUser.displayName ?? undefined,
      })
      lastIdentifiedUidRef.current = currentUser.uid
    } else if (lastIdentifiedUidRef.current) {
      posthog.reset()
      lastIdentifiedUidRef.current = null
    }
  }, [currentUser])

  return null
}
