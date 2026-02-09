'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen
} from 'lucide-react';
import { mockCourses, getRoleBadgeStyles, getRoleLabel } from '@/data/mockData';

interface CourseSidebarProps {
  activeCourseId?: string;
}

export default function CourseSidebar({ activeCourseId }: CourseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isNewCoursePage = pathname === '/courses/new';

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        bg-gray-900 border-r border-gray-800
        flex flex-col h-full
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Collapse Toggle */}
      <div className="p-3 border-b border-gray-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Courses Header */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Courses
          </h2>
        </div>
      )}

      {/* Course List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {mockCourses.map((course) => {
          const isActive = activeCourseId === course.id;

          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-200
                ${isActive
                  ? 'bg-gray-800 border-l-2 border-teal-500'
                  : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                }
              `}
              title={isCollapsed ? `${course.code} - ${course.name}` : undefined}
            >
              {/* Course Icon/Code */}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-md
                flex items-center justify-center text-xs font-bold
                ${isActive
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'bg-gray-700 text-gray-300'
                }
              `}>
                {course.code.split(' ')[0].substring(0, 2)}
              </div>

              {/* Course Details (hidden when collapsed) */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {course.code}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {course.name}
                  </p>
                </div>
              )}

              {/* Role Badge (hidden when collapsed) */}
              {!isCollapsed && (
                <span className={`
                  flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded border
                  ${getRoleBadgeStyles(course.myRole)}
                `}>
                  {getRoleLabel(course.myRole)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* New Course Button */}
      <div className="p-2 border-t border-gray-800">
        <Link
          href="/courses/new"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-colors duration-200
            ${isNewCoursePage
              ? 'bg-teal-500/20 text-teal-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }
          `}
          title={isCollapsed ? 'New Course' : undefined}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center">
            <Plus size={16} />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium">New Course</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
