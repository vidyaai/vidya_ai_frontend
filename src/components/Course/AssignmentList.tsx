'use client';

import Link from 'next/link';
import { Plus, FileText, Calendar, Eye, Edit2 } from 'lucide-react';
import { Assignment, getAssignmentsForCourse } from '@/data/mockData';

interface AssignmentListProps {
  courseId: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusBadge(status: Assignment['status']) {
  if (status === 'published') {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30">
        Published
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      Draft
    </span>
  );
}

export default function AssignmentList({ courseId }: AssignmentListProps) {
  const assignments = getAssignmentsForCourse(courseId);

  return (
    <div className="space-y-4">
      {/* Assignment List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {assignments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No assignments yet</h3>
            <p className="text-gray-400 mb-6">Create your first assignment to get started.</p>
            <Link
              href={`/courses/${courseId}/assignments/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create Assignment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-medium truncate">
                        {assignment.title}
                      </h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-400 truncate">
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Due Date */}
                    {assignment.dueDate && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Calendar size={14} />
                        <span>{formatDate(assignment.dueDate)}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Assignment Button */}
      {assignments.length > 0 && (
        <Link
          href={`/courses/${courseId}/assignments/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium rounded-lg border border-gray-700 transition-colors"
        >
          <Plus size={18} />
          New Assignment
        </Link>
      )}
    </div>
  );
}
