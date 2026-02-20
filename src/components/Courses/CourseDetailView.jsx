// src/components/Courses/CourseDetailView.jsx
// Professor's course detail view with LEFT SIDEBAR navigation
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Users,
  FileText,
  BookOpen,
  Info,
  Save,
  X,
  Video,
  GraduationCap,
  UserPlus,
  Upload,
  Download,
  ExternalLink,
  FolderOpen,
  Clock,
  Plus,
  Play,
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import { courseApi } from './courseApi';
import { assignmentApi } from '../Assignments/assignmentApi';

// Sidebar sections
const SECTIONS = [
  { key: 'overview', label: 'Course Overview', icon: Info },
  { key: 'students', label: 'Enrolled Students', icon: Users },
  { key: 'lecture-notes', label: 'Lecture Notes', icon: FileText },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'assignments', label: 'Assignments', icon: BookOpen },
  { key: 'tas', label: 'Teaching Assistants', icon: GraduationCap },
];

// MAIN COMPONENT
const CourseDetailView = ({
  courseId,
  onBack,
  onNavigateToHome,
  onCreateAssignment,
  onEditAssignment,
  onViewSubmissions,
  onImportDocument,
  onGenerateWithAI,
  initialSection,
}) => {
  const [course, setCourse] = useState(null);
  const [activeSection, setActiveSection] = useState(initialSection || 'overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overview edit
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <TopBar onNavigateToHome={onNavigateToHome} />

      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
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
          {activeSection === 'overview' && (
            <OverviewSection
              course={course}
              editing={editing}
              editData={editData}
              saving={saving}
              onStartEdit={() => {
                setEditData({
                  title: course.title,
                  course_code: course.course_code || '',
                  semester: course.semester || '',
                  description: course.description || '',
                });
                setEditing(true);
              }}
              onCancelEdit={() => setEditing(false)}
              onChangeField={(field, value) => setEditData({ ...editData, [field]: value })}
              onSave={handleSaveOverview}
            />
          )}
          {activeSection === 'students' && (
            <EnrolledStudentsSection courseId={courseId} />
          )}
          {activeSection === 'lecture-notes' && (
            <LectureNotesSection courseId={courseId} />
          )}
          {activeSection === 'videos' && (
            <VideosSection courseId={courseId} />
          )}
          {activeSection === 'assignments' && (
            <AssignmentsSection
              courseId={courseId}
              onCreateAssignment={onCreateAssignment}
              onEditAssignment={onEditAssignment}
              onViewSubmissions={onViewSubmissions}
              onImportDocument={onImportDocument}
              onGenerateWithAI={onGenerateWithAI}
            />
          )}
          {activeSection === 'tas' && (
            <TeachingAssistantsSection courseId={courseId} />
          )}
        </main>
      </div>
    </div>
  );
};

// SECTION: Course Overview
const OverviewSection = ({ course, editing, editData, saving, onStartEdit, onCancelEdit, onChangeField, onSave }) => {
  if (editing) {
    return (
      <div className="max-w-2xl space-y-5">
        <h2 className="text-xl font-bold text-white mb-4">Edit Course Information</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
          <input
            value={editData.title || ''}
            onChange={(e) => onChangeField('title', e.target.value)}
            placeholder="Title"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              value={editData.course_code || ''}
              onChange={(e) => onChangeField('course_code', e.target.value)}
              placeholder="Course Code"
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            />
            <input
              value={editData.semester || ''}
              onChange={(e) => onChangeField('semester', e.target.value)}
              placeholder="Semester"
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
          <textarea
            value={editData.description || ''}
            onChange={(e) => onChangeField('description', e.target.value)}
            placeholder="Description"
            rows={4}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              Save
            </button>
            <button onClick={onCancelEdit} className="px-4 py-2 text-gray-400 hover:text-white text-sm" disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Course Overview</h2>
        <button
          onClick={onStartEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-teal-400 border border-gray-700 hover:border-teal-500/50 rounded-lg transition-colors"
        >
          <Edit size={14} />
          Edit
        </button>
      </div>

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
};

// SECTION: Enrolled Students
const EnrolledStudentsSection = ({ courseId }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadEnrollments(); }, [courseId]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listEnrollments(courseId, null, 'student');
      setEnrollments(data);
    } catch (err) {
      console.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddByEmail = async (e) => {
    e.preventDefault();
    const emails = emailInput.split(/[,;\n]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!emails.length) return;
    try {
      setEnrolling(true);
      setMessage(null);
      const result = await courseApi.enrollStudents(courseId, emails.map((email) => ({ email })), 'student');
      setMessage({
        type: 'success',
        text: `Enrolled ${result.enrolled}, pending ${result.pending}${result.failed.length ? `, failed: ${result.failed.join(', ')}` : ''}`,
      });
      setEmailInput('');
      loadEnrollments();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to enroll students.' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setMessage(null);
      const result = await courseApi.enrollStudentsCSV(courseId, file);
      setMessage({
        type: 'success',
        text: `CSV: ${result.enrolled} enrolled, ${result.pending} pending${result.failed.length ? `, ${result.failed.length} failed` : ''}`,
      });
      loadEnrollments();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to process CSV.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (enrollmentId) => {
    if (!window.confirm('Remove this student from the course?')) return;
    try {
      await courseApi.removeEnrollment(courseId, enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } catch (err) {
      alert('Failed to remove student.');
    }
  };

  const activeCount = enrollments.filter((e) => e.status === 'active').length;
  const pendingCount = enrollments.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Enrolled Students</h2>

      <div className="flex items-center space-x-6 text-sm text-gray-400">
        <span className="flex items-center gap-1"><Users size={14} /> {activeCount} active</span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-yellow-400"><Clock size={14} /> {pendingCount} pending</span>
        )}
      </div>

      <div className="space-y-3">
        <form onSubmit={handleAddByEmail} className="flex gap-2">
          <input
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter emails (comma or line separated)"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
          />
          <button
            type="submit"
            disabled={enrolling || !emailInput.trim()}
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
          >
            {enrolling ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            <span className="ml-1.5">Add</span>
          </button>
        </form>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Upload size={16} className="mr-1.5" />}
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          <span className="text-xs text-gray-500">CSV with "email" column</span>
        </div>
      </div>

      {message && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="text-teal-500 animate-spin" /></div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-8 text-gray-500"><Users size={32} className="mx-auto mb-2 opacity-50" /><p>No students enrolled yet</p></div>
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {enrollments.map((en) => (
                <tr key={en.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-white">{en.email || en.user_id.replace('pending_', '')}</td>
                  <td className="px-4 py-2.5">
                    {en.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-yellow-400 text-xs"><Clock size={12} />Pending</span>
                    ) : (
                      <span className="text-green-400 text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleRemove(en.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// SECTION: Lecture Notes
const LectureNotesSection = ({ courseId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|pptx)$/i)) {
      setMessage({ type: 'error', text: 'Only PDF, DOCX, and PPTX files are supported.' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File must be under 50 MB.' });
      return;
    }
    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setShowUploadForm(true);
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadFolder('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;
    try {
      setUploading(true);
      setMessage(null);
      await courseApi.uploadMaterial(
        courseId, uploadFile, uploadTitle.trim(), uploadDescription.trim() || null,
        'lecture_notes', uploadFolder.trim() || null,
        (ev) => setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
      );
      setMessage({ type: 'success', text: 'Lecture notes uploaded!' });
      resetForm();
      loadNotes();
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed.' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await courseApi.deleteMaterial(courseId, id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Lecture Notes</h2>
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx" onChange={handleFileSelect} className="hidden" />
        {!showUploadForm && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
          >
            <Upload size={16} className="mr-1.5" />
            Upload Notes
          </button>
        )}
      </div>

      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
          <div className="text-sm text-gray-300">File: <span className="text-white font-medium">{uploadFile?.name}</span></div>
          <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Title *"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500" required />
          <input type="text" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500" />
          <input type="text" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="Folder / Section (e.g. Week 1)"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500" />
          {uploading && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={uploading || !uploadTitle.trim()}
              className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors">
              {uploading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Upload size={16} className="mr-1.5" />}
              {uploading ? `${uploadProgress}%` : 'Upload'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-400 hover:text-white text-sm" disabled={uploading}>Cancel</button>
          </div>
        </form>
      )}

      {message && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="text-teal-500 animate-spin" /></div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500"><FileText size={32} className="mx-auto mb-2 opacity-50" /><p>No lecture notes yet</p></div>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div key={mat.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-700 transition-colors">
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
                  <button onClick={() => handleDownload(mat)} className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors" title="Download">
                    <Download size={14} />
                  </button>
                )}
                <button onClick={() => handleDelete(mat.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// SECTION: Videos
const VideosSection = ({ courseId }) => {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedExts = /\.(mp4|webm|mov|avi|mkv|ogg)$/i;
    if (!file.type.startsWith('video/') && !file.name.match(allowedExts)) {
      setMessage({ type: 'error', text: 'Only video files (MP4, WebM, MOV, AVI, MKV, OGG) are supported.' });
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Video must be under 500 MB.' });
      return;
    }
    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setShowUploadForm(true);
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;
    try {
      setUploading(true);
      setMessage(null);
      await courseApi.uploadMaterial(
        courseId, uploadFile, uploadTitle.trim(), uploadDescription.trim() || null,
        'video', null,
        (ev) => setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
      );
      setMessage({ type: 'success', text: 'Video uploaded successfully!' });
      resetForm();
      loadVideos();
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.detail || 'Upload failed.' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleOpenVideo = (v) => {
    const title = encodeURIComponent(v.title || 'Video');
    router.push(`/video_player?courseId=${courseId}&materialId=${v.id}&role=professor&title=${title}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this video from the course?')) return;
    try {
      await courseApi.deleteMaterial(courseId, id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert('Failed to remove video.');
    }
  };

  const formatFileSize = (bytes) => {
    const n = parseInt(bytes, 10);
    if (!n || isNaN(n)) return '';
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Videos</h2>
        <input ref={fileInputRef} type="file" accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.ogg" onChange={handleFileSelect} className="hidden" />
        {!showUploadForm && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
          >
            <Upload size={16} className="mr-1.5" />
            Upload Video
          </button>
        )}
      </div>

      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
          <div className="text-sm text-gray-300">File: <span className="text-white font-medium">{uploadFile?.name}</span>
            {uploadFile && <span className="text-gray-500 ml-2">({formatFileSize(uploadFile.size)})</span>}
          </div>
          <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Title *"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500" required />
          <input type="text" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500" />
          {uploading && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={uploading || !uploadTitle.trim()}
              className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors">
              {uploading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Upload size={16} className="mr-1.5" />}
              {uploading ? `${uploadProgress}%` : 'Upload'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-400 hover:text-white text-sm" disabled={uploading}>Cancel</button>
          </div>
        </form>
      )}

      {message && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="text-teal-500 animate-spin" /></div>
      ) : videos.length === 0 ? (
        <div className="text-center py-8 text-gray-500"><Video size={32} className="mx-auto mb-2 opacity-50" /><p>No videos uploaded yet</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-purple-500/5">
              {/* Thumbnail / Frame area */}
              <div
                className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer"
                onClick={() => v.s3_key && handleOpenVideo(v)}
              >
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
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {v.description && <p className="text-xs text-gray-500 truncate">{v.description}</p>}
                    {v.file_size && <span className="text-xs text-gray-600 flex-shrink-0">{formatFileSize(v.file_size)}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 ml-2" title="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// SECTION: Assignments
const AssignmentsSection = ({ courseId, onCreateAssignment, onEditAssignment, onViewSubmissions, onImportDocument, onGenerateWithAI }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(null);
  const [downloadingSolutionPDF, setDownloadingSolutionPDF] = useState(null);

  useEffect(() => { loadAssignments(); }, [courseId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listCourseAssignments(courseId);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (assignment) => {
    try {
      setDownloadingPDF(assignment.id);
      const response = await assignmentApi.downloadAssignmentPDF(assignment.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Assignment.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download assignment PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleDownloadSolutionPDF = async (assignment) => {
    try {
      setDownloadingSolutionPDF(assignment.id);
      const response = await assignmentApi.downloadSolutionPDF(assignment.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Solutions.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download solutions PDF. Please try again.');
    } finally {
      setDownloadingSolutionPDF(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Assignments</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onImportDocument}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg text-sm transition-all"
          >
            <FileText size={16} className="mr-1.5" />
            Import from Document
          </button>
          <button
            onClick={onGenerateWithAI}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm transition-all"
          >
            <GraduationCap size={16} className="mr-1.5" />
            Generate with AI
          </button>
          <button
            onClick={() => onCreateAssignment?.(courseId)}
            className="inline-flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            title="Create blank assignment"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="text-teal-500 animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-1">No Assignments Yet</h3>
          <p className="text-gray-500">Use the buttons above to create your first assignment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-semibold text-sm">{a.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {a.status}
                </span>
              </div>
              <p className="text-gray-500 text-xs mb-3 line-clamp-2">{a.description}</p>
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <div>{a.total_questions} questions {'\u2022'} {a.total_points} pts</div>
                {a.due_date && <div>Due: {new Date(a.due_date).toLocaleDateString()}</div>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onEditAssignment?.(a)}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                >Edit</button>
                <button
                  onClick={() => onViewSubmissions?.(a)}
                  className="px-3 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 rounded text-xs transition-colors"
                >Submissions</button>
                <button
                  onClick={() => handleDownloadPDF(a)}
                  disabled={downloadingPDF === a.id}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download assignment PDF"
                >
                  {downloadingPDF === a.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                </button>
                <button
                  onClick={() => handleDownloadSolutionPDF(a)}
                  disabled={downloadingSolutionPDF === a.id}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download solutions PDF"
                >
                  {downloadingSolutionPDF === a.id ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// SECTION: Teaching Assistants
const TeachingAssistantsSection = ({ courseId }) => {
  const [tas, setTas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

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

  const handleAddTA = async (e) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    try {
      setAdding(true);
      setMessage(null);
      const result = await courseApi.addTA(courseId, email);
      setMessage({
        type: 'success',
        text: `TA added: ${result.enrolled} active, ${result.pending} pending${result.failed.length ? `, failed: ${result.failed.join(', ')}` : ''}`,
      });
      setEmailInput('');
      loadTAs();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add TA.' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (enrollmentId) => {
    if (!window.confirm('Remove this teaching assistant?')) return;
    try {
      await courseApi.removeTA(courseId, enrollmentId);
      setTas((prev) => prev.filter((t) => t.id !== enrollmentId));
    } catch (err) {
      alert('Failed to remove TA.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Teaching Assistants</h2>

      <form onSubmit={handleAddTA} className="flex gap-2">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="TA email address"
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
        />
        <button
          type="submit"
          disabled={adding || !emailInput.trim()}
          className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          <span className="ml-1.5">Add TA</span>
        </button>
      </form>

      {message && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="text-teal-500 animate-spin" /></div>
      ) : tas.length === 0 ? (
        <div className="text-center py-8 text-gray-500"><GraduationCap size={32} className="mx-auto mb-2 opacity-50" /><p>No teaching assistants added yet</p></div>
      ) : (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tas.map((ta) => (
                <tr key={ta.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-white">{ta.email || ta.user_id.replace('pending_', '')}</td>
                  <td className="px-4 py-2.5">
                    {ta.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 text-yellow-400 text-xs"><Clock size={12} />Pending</span>
                    ) : (
                      <span className="text-green-400 text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleRemove(ta.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourseDetailView;
