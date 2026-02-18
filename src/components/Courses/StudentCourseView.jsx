// src/components/Courses/StudentCourseView.jsx
// Student's course detail view with LEFT SIDEBAR navigation (mirrors professor UI)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  FileText,
  BookOpen,
  Info,
  Video,
  GraduationCap,
  Download,
  ExternalLink,
  Calendar,
  Users,
  Mail,
  Play,
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import { courseApi } from './courseApi';
import { assignmentApi } from '../Assignments/assignmentApi';

// Sidebar sections for students (no Enrolled Students, no manage TAs)
const SECTIONS = [
  { key: 'overview', label: 'Course Overview', icon: Info },
  { key: 'lecture-notes', label: 'Lecture Notes', icon: FileText },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'assignments', label: 'Assignments', icon: BookOpen },
  { key: 'tas', label: 'Teaching Assistants', icon: GraduationCap },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
const StudentCourseView = ({ courseId, onBack, onNavigateToHome, onOpenAssignment, initialSection }) => {
  const [course, setCourse] = useState(null);
  const [activeSection, setActiveSection] = useState(initialSection || 'overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <TopBar onNavigateToHome={onNavigateToHome} />

      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-teal-400">
                {course.course_code ? `${course.course_code} ` : ''}
                <span className="text-white">{course.title}</span>
              </h1>
              {course.semester && <p className="text-gray-500 text-sm mt-0.5">{course.semester}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* BODY: sidebar + content */}
      <div className="flex-1 flex max-w-screen-2xl mx-auto w-full">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-950">
          <nav className="py-4">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-800/70 text-teal-400 border-l-2 border-teal-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border-l-2 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeSection === 'overview' && <OverviewSection course={course} />}
          {activeSection === 'lecture-notes' && <LectureNotesSection courseId={courseId} />}
          {activeSection === 'videos' && <VideosSection courseId={courseId} />}
          {activeSection === 'assignments' && (
            <StudentAssignmentsSection courseId={courseId} onOpenAssignment={onOpenAssignment} />
          )}
          {activeSection === 'tas' && <TAViewSection courseId={courseId} />}
        </main>
      </div>
    </div>
  );
};

// ─── SECTION: Course Overview (read-only) ────────────────────────────────
const OverviewSection = ({ course }) => (
  <div className="max-w-2xl space-y-6">
    <h2 className="text-xl font-bold text-white">Course Overview</h2>

    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
      <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">
        <div>
          <span className="text-gray-500 block mb-1">Title</span>
          <p className="text-white font-medium">{course.title}</p>
        </div>
        <div>
          <span className="text-gray-500 block mb-1">Course Code</span>
          <p className="text-white font-medium">{course.course_code || '\u2014'}</p>
        </div>
        <div>
          <span className="text-gray-500 block mb-1">Semester</span>
          <p className="text-white font-medium">{course.semester || '\u2014'}</p>
        </div>
        <div>
          <span className="text-gray-500 block mb-1">Status</span>
          <p className={course.is_active ? 'text-green-400 font-medium' : 'text-gray-500 font-medium'}>
            {course.is_active ? 'Active' : 'Archived'}
          </p>
        </div>
      </div>
      {course.description && (
        <div className="text-sm border-t border-gray-800 pt-4">
          <span className="text-gray-500 block mb-1">Description</span>
          <p className="text-gray-300 leading-relaxed">{course.description}</p>
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
  </div>
);

// ─── SECTION: Lecture Notes (view + download only, no upload) ────────────
const LectureNotesSection = ({ courseId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotes(); }, [courseId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listLectureNotes(courseId);
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load lecture notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (mat) => {
    try {
      const { download_url } = await courseApi.downloadMaterial(courseId, mat.id);
      window.open(download_url, '_blank');
    } catch (err) {
      alert('Download failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Lecture Notes</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>No lecture notes available yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{mat.title}</p>
                  {mat.description && <p className="text-xs text-gray-500 truncate">{mat.description}</p>}
                  {mat.folder && <p className="text-xs text-gray-600 mt-0.5">{mat.folder}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {mat.s3_key && (
                  <button
                    onClick={() => handleDownload(mat)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SECTION: Videos (view only, thumbnails → /video_player) ─────────────────────────
const VideosSection = ({ courseId }) => {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadVideos(); }, [courseId]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listVideos(courseId);
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVideo = (v) => {
    const title = encodeURIComponent(v.title || 'Video');
    router.push(`/video_player?courseId=${courseId}&materialId=${v.id}&role=student&title=${title}`);
  };

  const formatFileSize = (bytes) => {
    const n = parseInt(bytes, 10);
    if (!n || isNaN(n)) return '';
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Videos</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Video size={32} className="mx-auto mb-2 opacity-50" />
          <p>No videos available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div
              key={v.id}
              className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer"
              onClick={() => v.s3_key && handleOpenVideo(v)}
            >
              {/* Thumbnail / Frame area */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/30 group-hover:scale-110 transition-all duration-200">
                    <Play size={24} className="text-purple-400 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2">
                  <Video size={16} className="text-gray-600" />
                </div>
              </div>
              {/* Info */}
              <div className="px-3 py-2.5">
                <p className="text-sm text-white font-medium truncate">{v.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {v.description && <p className="text-xs text-gray-500 truncate">{v.description}</p>}
                  {v.file_size && <span className="text-xs text-gray-600">{formatFileSize(v.file_size)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SECTION: Assignments (student view + action buttons) ────────────────
const StudentAssignmentsSection = ({ courseId, onOpenAssignment }) => {
  const [assignments, setAssignments] = useState([]);
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  useEffect(() => { loadAssignments(); }, [courseId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listCourseAssignments(courseId);
      setAssignments(data);
      await loadStatuses(data);
    } catch (err) {
      console.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadStatuses = async (list) => {
    const results = await Promise.all(
      list.map(async (a) => {
        try {
          const st = await assignmentApi.getAssignmentStatus(a.id);
          return { id: a.id, status: st };
        } catch {
          return { id: a.id, status: { status: 'not_started', progress: 0, submission: null } };
        }
      })
    );
    const map = {};
    results.forEach((r) => { map[r.id] = r.status; });
    setAssignmentStatuses(map);
  };

  const getStudentStatus = (assignment) => {
    const info = assignmentStatuses[assignment.id];
    if (!info) return { status: 'not_started', progress: 0, displayStatus: 'Not Started', color: 'bg-gray-500/20 text-gray-400' };

    const { status, progress, grade, percentage, is_overdue } = info;
    let displayStatus, color;

    switch (status) {
      case 'not_started':
        if (is_overdue) { displayStatus = 'Overdue'; color = 'bg-red-500/20 text-red-400'; }
        else { displayStatus = 'Not Started'; color = 'bg-gray-500/20 text-gray-400'; }
        break;
      case 'in_progress':
        if (is_overdue) { displayStatus = 'Overdue'; color = 'bg-red-500/20 text-red-400'; }
        else { displayStatus = 'In Progress'; color = 'bg-yellow-500/20 text-yellow-400'; }
        break;
      case 'overdue':
        displayStatus = 'Overdue'; color = 'bg-red-500/20 text-red-400'; break;
      case 'submitted':
        displayStatus = 'Submitted'; color = 'bg-blue-500/20 text-blue-400'; break;
      case 'graded':
        displayStatus = `Graded (${percentage || grade || progress + '%'})`; color = 'bg-green-500/20 text-green-400'; break;
      default:
        displayStatus = 'Unknown'; color = 'bg-gray-500/20 text-gray-400';
    }
    return { status, progress: progress || 0, displayStatus, color, grade, percentage, isOverdue: is_overdue };
  };

  const getButtonText = (a) => {
    const s = getStudentStatus(a);
    switch (s.status) {
      case 'not_started': return s.isOverdue ? 'Start (Overdue)' : 'Start Assignment';
      case 'in_progress': return s.isOverdue ? 'Continue (Overdue)' : 'Continue Assignment';
      case 'overdue': return 'Continue (Overdue)';
      case 'submitted': return 'View Submission';
      case 'graded': return 'View Results';
      default: return 'Open Assignment';
    }
  };

  const getButtonColor = (a) => {
    const s = getStudentStatus(a);
    if (s.status === 'graded') return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700';
    if (s.status === 'submitted') return 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700';
    if (s.isOverdue || s.status === 'overdue') return 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700';
    return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700';
  };

  const handleDownloadPdf = async (assignment) => {
    try {
      setDownloadingPdfId(assignment.id);
      const blobUrl = await assignmentApi.generateAssignmentPDF(assignment.id);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${assignment.title || 'assignment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Assignments</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-1">No Assignments Yet</h3>
          <p className="text-gray-500">Your instructor hasn&apos;t posted any assignments for this course yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assignments.map((a) => {
            const studentStatus = getStudentStatus(a);
            return (
              <div
                key={a.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors"
              >
                {/* Title + status badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm">{a.title}</h4>
                    {a.description && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <span className={`ml-3 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${studentStatus.color}`}>
                    {studentStatus.displayStatus}
                  </span>
                </div>

                {/* Meta */}
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div className="flex items-center gap-1">
                    <FileText size={12} />
                    <span>{a.total_questions} questions {'\u2022'} {a.total_points} pts</span>
                  </div>
                  {a.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {studentStatus.status !== 'not_started' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{studentStatus.status === 'graded' ? 'Grade' : 'Progress'}</span>
                      <span>{Math.round(studentStatus.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          studentStatus.status === 'submitted' || studentStatus.status === 'graded'
                            ? 'bg-green-500'
                            : studentStatus.isOverdue || studentStatus.status === 'overdue'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${studentStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Question type tags */}
                {(a.question_types || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {a.question_types.map((type, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] rounded">
                        {type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                )}

                {/* Export row */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => handleDownloadPdf(a)}
                    disabled={downloadingPdfId === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 rounded-lg text-xs transition-colors"
                    title="Download PDF"
                  >
                    {downloadingPdfId === a.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    <span>{downloadingPdfId === a.id ? 'Downloading...' : 'PDF'}</span>
                  </button>
                  {a.google_form_response_url && (
                    <a
                      href={a.google_form_response_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>Google Form</span>
                    </a>
                  )}
                </div>

                {/* Action button */}
                <div className="pt-3 border-t border-gray-800">
                  <button
                    onClick={() => onOpenAssignment?.(a)}
                    className={`w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-300 ${getButtonColor(a)}`}
                  >
                    {getButtonText(a)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── SECTION: Teaching Assistants (read-only name + email) ───────────────
const TAViewSection = ({ courseId }) => {
  const [tas, setTas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTAs(); }, [courseId]);

  const loadTAs = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listTAs(courseId);
      setTas(data);
    } catch (err) {
      console.error('Failed to load TAs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Teaching Assistants</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        </div>
      ) : tas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
          <p>No teaching assistants assigned to this course</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tas.map((ta) => {
            const email = ta.email || ta.user_id?.replace('pending_', '') || '';
            const name = ta.display_name || ta.name || null;
            return (
              <div
                key={ta.id}
                className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 hover:border-gray-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {(name || email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  {name && <p className="text-sm text-white font-medium truncate">{name}</p>}
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Mail size={12} />
                    <span className="truncate">{email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCourseView;
