'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockCourses } from '@/data/mockData';

export default function CoursesIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first course or to new course page if no courses exist
    if (mockCourses.length > 0) {
      router.replace(`/courses/${mockCourses[0].id}`);
    } else {
      router.replace('/courses/new');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading courses...</div>
    </div>
  );
}
