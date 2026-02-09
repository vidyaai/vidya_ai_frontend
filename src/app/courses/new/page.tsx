'use client';

import CourseLayout from '@/components/Layout/CourseLayout';
import NewCourseForm from '@/components/Course/NewCourseForm';

export default function NewCoursePage() {
  return (
    <CourseLayout>
      <NewCourseForm />
    </CourseLayout>
  );
}
