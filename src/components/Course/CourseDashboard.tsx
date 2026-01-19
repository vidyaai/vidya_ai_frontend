'use client';

import { useState } from 'react';
import { FileText, Users, Settings } from 'lucide-react';
import { getCourseById, getRoleBadgeStyles, getRoleLabel } from '@/data/mockData';
import AssignmentList from './AssignmentList';
import MemberList from './MemberList';
import CourseSettings from './CourseSettings';

interface CourseDashboardProps {
  courseId: string;
  initialTab?: 'assignments' | 'members' | 'settings';
}

export default function CourseDashboard({ courseId, initialTab = 'assignments' }: CourseDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const course = getCourseById(courseId);

  if (!course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Course not found</h2>
        <p className="text-gray-400">The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'assignments' as const, label: 'Assignments', icon: FileText, count: course.assignmentCount },
    { id: 'members' as const, label: 'Members', icon: Users, count: course.memberCount },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                {course.code}
              </h1>
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleBadgeStyles(course.myRole)}`}>
                {getRoleLabel(course.myRole)}
              </span>
            </div>
            <p className="text-lg text-gray-400">{course.name}</p>
            <p className="text-sm text-gray-500 mt-1">{course.semester}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${isActive
                  ? 'text-teal-400 border-teal-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
                }
              `}
            >
              <Icon size={18} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  ml-1 px-1.5 py-0.5 text-xs rounded
                  ${isActive ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-700 text-gray-400'}
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'assignments' && <AssignmentList courseId={courseId} />}
        {activeTab === 'members' && <MemberList courseId={courseId} />}
        {activeTab === 'settings' && <CourseSettings courseId={courseId} />}
      </div>
    </div>
  );
}
