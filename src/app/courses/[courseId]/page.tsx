'use client';

import { use } from 'react';
import CourseLayout from '@/components/Layout/CourseLayout';
import CourseDashboard from '@/components/Course/CourseDashboard';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default function CoursePage({ params }: CoursePageProps) {
  const { courseId } = use(params);

  return (
    <CourseLayout activeCourseId={courseId}>
      <CourseDashboard courseId={courseId} />
    </CourseLayout>
  );
}
