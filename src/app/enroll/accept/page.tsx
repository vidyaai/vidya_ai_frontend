'use client'

import { Suspense } from 'react'
import EnrollAcceptPage from '@/components/EnrollAccept/EnrollAcceptPage'

export default function EnrollAcceptRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }
    >
      <EnrollAcceptPage />
    </Suspense>
  )
}
