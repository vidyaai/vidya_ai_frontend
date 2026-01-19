'use client';

import { use } from 'react';
import CourseLayout from '@/components/Layout/CourseLayout';
import NewAssignmentForm from '@/components/Course/NewAssignmentForm';

interface NewAssignmentPageProps {
  params: Promise<{ courseId: string }>;
}

export default function NewAssignmentPage({ params }: NewAssignmentPageProps) {
  const { courseId } = use(params);

  return (
    <CourseLayout activeCourseId={courseId}>
      <NewAssignmentForm courseId={courseId} />
    </CourseLayout>
  );
}
