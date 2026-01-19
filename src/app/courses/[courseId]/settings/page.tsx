'use client';

import { use } from 'react';
import CourseLayout from '@/components/Layout/CourseLayout';
import CourseDashboard from '@/components/Course/CourseDashboard';

interface SettingsPageProps {
  params: Promise<{ courseId: string }>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { courseId } = use(params);

  return (
    <CourseLayout activeCourseId={courseId}>
      <CourseDashboard courseId={courseId} initialTab="settings" />
    </CourseLayout>
  );
}
