// src/components/Courses/CourseDetailView.jsx
// Professor's course detail view with tabs: Overview, Students, Assignments, Materials
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Users,
  FileText,
  BookOpen,
  Settings,
  Save,
  X,
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import StudentEnrollmentManager from './StudentEnrollmentManager';
import CourseMaterialsSection from './CourseMaterialsSection';
import { courseApi } from './courseApi';
import { assignmentApi } from '../Assignments/assignmentApi';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Settings },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'assignments', label: 'Assignments', icon: FileText },
  { key: 'materials', label: 'Materials', icon: BookOpen },
];

const CourseDetailView = ({ courseId, onBack, onNavigateToHome, onCreateAssignment, onEditAssignment, onViewSubmissions }) => {
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overview edit state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Assignments
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

  const handleSaveOverview = async () => {
    try {
      setSaving(true);
      const updated = await courseApi.updateCourse(courseId, editData);
      setCourse(updated);
      setEditing(false);
    } catch (err) {
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure? Assignments will be moved to Open Assignments.')) return;
    try {
      await courseApi.deleteCourse(courseId);
      onBack();
    } catch (err) {
      alert('Failed to delete course.');
    }
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
          <div className="flex items-center justify-between">
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
              </div>
            </div>
            <button
              onClick={handleDeleteCourse}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              title="Delete Course"
            >
              <Trash2 size={20} />
            </button>
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

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Overview ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-2xl">
            {!editing ? (
              <>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white">Course Information</h3>
                    <button
                      onClick={() => {
                        setEditData({
                          title: course.title,
                          course_code: course.course_code || '',
                          semester: course.semester || '',
                          description: course.description || '',
                        });
                        setEditing(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-teal-400 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Title</span>
                      <p className="text-white">{course.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Code</span>
                      <p className="text-white">{course.course_code || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Semester</span>
                      <p className="text-white">{course.semester || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status</span>
                      <p className={course.is_active ? 'text-green-400' : 'text-gray-500'}>
                        {course.is_active ? 'Active' : 'Archived'}
                      </p>
                    </div>
                  </div>
                  {course.description && (
                    <div className="text-sm">
                      <span className="text-gray-500">Description</span>
                      <p className="text-gray-300 mt-1">{course.description}</p>
                    </div>
                  )}
                </div>
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Students', value: course.enrollment_count, icon: Users, color: 'teal' },
                    { label: 'Assignments', value: course.assignment_count, icon: FileText, color: 'blue' },
                    { label: 'Materials', value: course.material_count, icon: BookOpen, color: 'purple' },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${s.color}-500/20`}>
                          <s.icon size={20} className={`text-${s.color}-400`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Edit Course</h3>
                <input
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Title"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={editData.course_code || ''}
                    onChange={(e) => setEditData({ ...editData, course_code: e.target.value })}
                    placeholder="Course Code"
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                  <input
                    value={editData.semester || ''}
                    onChange={(e) => setEditData({ ...editData, semester: e.target.value })}
                    placeholder="Semester"
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveOverview}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Students ─── */}
        {activeTab === 'students' && (
          <StudentEnrollmentManager courseId={courseId} isOwner={true} />
        )}

        {/* ─── Assignments ─── */}
        {activeTab === 'assignments' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Course Assignments</h3>
              <button
                onClick={() => onCreateAssignment?.(courseId)}
                className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
              >
                <FileText size={16} className="mr-1.5" />
                Create Assignment
              </button>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-teal-500 animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No assignments in this course yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold text-sm">{a.title}</h4>
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
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">{a.description}</p>
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div>{a.total_questions} questions • {a.total_points} pts</div>
                      {a.due_date && <div>Due: {new Date(a.due_date).toLocaleDateString()}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditAssignment?.(a)}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                      >
                        Edit
                      </button>
                      {a.status === 'published' && (
                        <button
                          onClick={() => onViewSubmissions?.(a)}
                          className="px-3 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 rounded text-xs transition-colors"
                        >
                          Submissions
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Materials ─── */}
        {activeTab === 'materials' && (
          <CourseMaterialsSection courseId={courseId} isOwner={true} />
        )}
      </main>
    </div>
  );
};

export default CourseDetailView;
