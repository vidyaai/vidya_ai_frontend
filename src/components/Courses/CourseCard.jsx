// src/components/Courses/CourseCard.jsx
import { Users, FileText, BookOpen, ChevronRight, Folder, FolderOpen } from 'lucide-react';

const CourseCard = ({ course, onClick, isSelected = false, compact = false, thumbnail = false }) => {
  if (compact) {
    return (
      <button
        onClick={() => onClick?.(course)}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
          isSelected
            ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
            : 'text-gray-300 hover:bg-gray-800 border border-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            {isSelected && <span className="w-2 h-2 bg-teal-400 rounded-full flex-shrink-0" />}
            <span className="truncate text-sm font-medium">
              {course.course_code ? `${course.course_code} – ` : ''}{course.title}
            </span>
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{course.assignment_count}</span>
        </div>
      </button>
    );
  }

  // Thumbnail / folder-style card (Canvas-like)
  if (thumbnail) {
    const isOpen = course.id === null; // "Open Assignments" special card
    return (
      <div
        onClick={() => onClick?.(course)}
        className="group relative bg-gray-900 rounded-2xl border-2 border-gray-700 hover:border-teal-500 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 cursor-pointer overflow-hidden"
      >
        {/* Folder tab accent */}
        <div className="absolute top-0 left-4 w-20 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-b-lg opacity-70 group-hover:opacity-100 transition-opacity" />

        <div className="p-6 pt-5 flex flex-col items-center text-center min-h-[180px] justify-center">
          {/* Folder icon */}
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
            isOpen
              ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20'
              : 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20'
          }`}>
            {isOpen ? (
              <FolderOpen size={32} className="text-orange-400" />
            ) : (
              <Folder size={32} className="text-teal-400 group-hover:text-teal-300" />
            )}
          </div>

          {/* Course code */}
          {course.course_code && (
            <span className="text-sm font-bold text-teal-400 tracking-wide mb-1">
              {course.course_code}
            </span>
          )}

          {/* Title */}
          <h3 className="text-base font-semibold text-white leading-snug mb-1">
            {course.title}
          </h3>

          {/* Semester */}
          {course.semester && (
            <span className="text-xs text-gray-500">{course.semester}</span>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {course.assignment_count ?? 0}
            </span>
            {course.enrollment_count !== undefined && (
              <span className="flex items-center gap-1">
                <Users size={12} />
                {course.enrollment_count}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(course)}
      className="group relative bg-gray-900 rounded-xl border border-gray-800 hover:border-teal-500/40 transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden"
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 pt-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            {course.course_code && (
              <span className="text-xs font-semibold text-teal-400 tracking-wide uppercase mb-1 block">
                {course.course_code}
              </span>
            )}
            <h3 className="text-lg font-bold text-white">{course.title}</h3>
            {course.semester && (
              <span className="text-xs text-gray-500 mt-0.5 block">{course.semester}</span>
            )}
          </div>
          <ChevronRight size={18} className="text-gray-600 group-hover:text-teal-400 transition-colors mt-1" />
        </div>

        {course.description && (
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">{course.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Users size={14} />
            <span>{course.enrollment_count} students</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <FileText size={14} />
            <span>{course.assignment_count} assignments</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <BookOpen size={14} />
            <span>{course.material_count} materials</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
