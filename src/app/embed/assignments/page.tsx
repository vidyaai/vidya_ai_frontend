'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import MyAssignments from '@/components/Assignments/MyAssignments'
import AssignedToMe from '@/components/Assignments/AssignedToMe'
import { useEmbedSession } from '@/hooks/useEmbedSession'
import { useEmbedResize } from '@/hooks/useEmbedResize'
import { EmbedLoading, EmbedError } from '@/components/Embed/EmbedStatus'

function EmbedAssignmentsContent() {
  useEmbedResize()
  const searchParams = useSearchParams()
  const session = useEmbedSession()

  const section = searchParams.get('section') ?? undefined
  // `courseId` in the URL wins over whatever the handoff token pre-selected.
  const courseId = searchParams.get('courseId') ?? session.courseId ?? undefined

  if (session.status === 'loading') return <EmbedLoading />
  if (session.status === 'error') return <EmbedError message={session.error} />

  if (session.userType === 'student') {
    return (
      <AssignedToMe
        embed
        initialCourseId={courseId}
        initialSection={section}
      />
    )
  }

  // professor (or any other value) — show My Assignments
  return (
    <MyAssignments
      embed
      initialCourseId={courseId}
      initialSection={section}
    />
  )
}

export default function EmbedAssignmentsRoute() {
  return (
    <Suspense fallback={<EmbedLoading />}>
      <EmbedAssignmentsContent />
    </Suspense>
  )
}
