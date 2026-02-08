// src/components/Courses/StudentCourseView.jsx
// Student's read-only course view with Materials and Assignments tabs
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import CourseMaterialsSection from './CourseMaterialsSection';
import { courseApi } from './courseApi';

const TABS = [
  { key: 'assignments', label: 'Assignments', icon: FileText },
  { key: 'materials', label: 'Materials', icon: BookOpen },
];

const StudentCourseView = ({ courseId, onBack, onNavigateToHome, onOpenAssignment }) => {
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'assignments') loadCourseAssignments();
  }, [activeTab, courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseApi.getCourse(courseId);
      setCourse(data);
    } catch (err) {
      setError('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const data = await courseApi.listCourseAssignments(courseId);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const getDueLabel = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Past due', color: 'text-red-400', icon: AlertCircle };
    if (days === 0) return { text: 'Due today', color: 'text-orange-400', icon: Clock };
    if (days <= 3) return { text: `Due in ${days}d`, color: 'text-yellow-400', icon: Clock };
    return { text: `Due ${due.toLocaleDateString()}`, color: 'text-gray-400', icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || 'Course not found.'}</p>
        <button onClick={onBack} className="text-teal-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <TopBar onNavigateToHome={onNavigateToHome} />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                {course.course_code && (
                  <span className="text-sm font-semibold text-teal-400">{course.course_code}</span>
                )}
                <h1 className="text-2xl font-bold text-white">{course.title}</h1>
              </div>
              {course.semester && <p className="text-gray-500 text-sm mt-0.5">{course.semester}</p>}
              {course.description && <p className="text-gray-400 text-sm mt-1">{course.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 transition-colors text-sm font-medium ${
                    activeTab === tab.key
                      ? 'border-teal-500 text-teal-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Assignments ─── */}
        {activeTab === 'assignments' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Your Assignments</h3>

            {loadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-teal-500 animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No assignments posted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const dueInfo = getDueLabel(a.due_date);
                  return (
                    <button
                      key={a.id}
                      onClick={() => onOpenAssignment?.(a)}
                      className="w-full text-left bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-teal-600/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-semibold text-sm group-hover:text-teal-400 transition-colors">
                              {a.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                a.status === 'published'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          {a.description && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{a.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2 flex items-center space-x-4">
                            <span>{a.total_questions} questions • {a.total_points} pts</span>
                            {dueInfo && (
                              <span className={`flex items-center space-x-1 ${dueInfo.color}`}>
                                <dueInfo.icon size={12} />
                                <span>{dueInfo.text}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {a.submission_status === 'submitted' && (
                          <CheckCircle size={20} className="text-green-500 flex-shrink-0 ml-4" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Materials ─── */}
        {activeTab === 'materials' && (
          <CourseMaterialsSection courseId={courseId} isOwner={false} />
        )}
      </main>
    </div>
  );
};

export default StudentCourseView;
