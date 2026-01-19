'use client';

import { use } from 'react';
import CourseLayout from '@/components/Layout/CourseLayout';
import CourseDashboard from '@/components/Course/CourseDashboard';

interface MembersPageProps {
  params: Promise<{ courseId: string }>;
}

export default function MembersPage({ params }: MembersPageProps) {
  const { courseId } = use(params);

  return (
    <CourseLayout activeCourseId={courseId}>
      <CourseDashboard courseId={courseId} initialTab="members" />
    </CourseLayout>
  );
}
