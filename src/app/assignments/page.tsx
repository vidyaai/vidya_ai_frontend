'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import MyAssignments from '@/components/Assignments/MyAssignments'
import AssignedToMe from '@/components/Assignments/AssignedToMe'
import { useAuth } from '@/context/AuthContext'

function AssignmentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userType } = useAuth()

  const section = searchParams.get('section') ?? undefined
  const courseId = searchParams.get('courseId') ?? undefined

  const onBack = () => router.push('/home')
  const onNavigateToHome = () => router.push('/home')

  if (userType === 'student') {
    return (
      <AssignedToMe
        onBack={onBack}
        onNavigateToHome={onNavigateToHome}
        initialCourseId={courseId}
        initialSection={section}
      />
    )
  }

  // professor (or any other value) — show My Assignments
  return (
    <MyAssignments
      onBack={onBack}
      onNavigateToHome={onNavigateToHome}
      initialCourseId={courseId}
      initialSection={section}
    />
  )
}

export default function AssignmentsRoute() {
  return (
    <ProtectedRouteWrapper>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }>
        <AssignmentsContent />
      </Suspense>
    </ProtectedRouteWrapper>
  )
}
