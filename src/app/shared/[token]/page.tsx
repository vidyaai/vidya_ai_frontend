'use client'

import SharedResourceViewer from '@/components/Sharing/SharedResourceViewer'
import { AuthProvider } from '@/context/AuthContext'

export default function SharedPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <SharedResourceViewer />
        </div>
      </div>
    </AuthProvider>
  )
}
