'use client';

import { ReactNode } from 'react';
import TopBar from '@/components/generic/TopBar';
import CourseSidebar from './CourseSidebar';

interface CourseLayoutProps {
  children: ReactNode;
  activeCourseId?: string;
}

export default function CourseLayout({ children, activeCourseId }: CourseLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top Navigation */}
      <TopBar onNavigateToHome={() => window.location.href = '/home'} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <CourseSidebar activeCourseId={activeCourseId} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
