'use client'

import { useRouter } from 'next/navigation'
import ProtectedRouteWrapper from '@/components/generic/ProtectedRouteWrapper'
import AssignmentManager from '@/components/Assignments/AssignmentManager'

export default function AssignmentsRoute() {
  const router = useRouter()

  return (
    <ProtectedRouteWrapper>
      <AssignmentManager onNavigateToHome={() => router.push('/home')} />
    </ProtectedRouteWrapper>
  )
}
