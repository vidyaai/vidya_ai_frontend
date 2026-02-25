// src/components/Assignments/MyAssignments.jsx
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Share2, 
  Edit, 
  Trash2,
  Calendar,
  Users,
  Clock,
  FileText,
  Loader2,
  Download,
  Eye,
  BookOpen
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import AssignmentBuilder from './AssignmentBuilder';
import AIAssignmentGeneratorWizard from './Aiassignmentgeneratorwizard';
import AssignmentSharingModal from './AssignmentSharingModal';
import AssignmentSubmissions from './AssignmentSubmissions';
import ImportFromDocumentModal from './ImportFromDocumentModal';
import { assignmentApi } from './assignmentApi';
import CourseCard from '../Courses/CourseCard';
import CreateCourseModal from '../Courses/CreateCourseModal';
import CourseDetailView from '../Courses/CourseDetailView';
import { courseApi } from '../Courses/courseApi';

const MyAssignments = ({ onBack, onNavigateToHome, initialCourseId, initialSection }) => {
  const [currentView, setCurrentView] = useState(initialCourseId ? 'course-detail' : 'main');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [parsedAssignmentData, setParsedAssignmentData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(null);
  const [downloadingSolutionPDF, setDownloadingSolutionPDF] = useState(null);

  // Course state
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(undefined); // undefined = show courses grid, null = "Open Assignments"
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseDetailId, setCourseDetailId] = useState(initialCourseId || null);
  const [courseDetailReturnSection, setCourseDetailReturnSection] = useState(null);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const data = await courseApi.listCourses('instructor');
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadAssignments = async (courseFilter) => {
    try {
      setLoading(true);
      setError(null);
      // If courseFilter is explicitly passed, use it; otherwise use selectedCourseId state
      const cid = courseFilter !== undefined ? courseFilter : selectedCourseId;
      let data;
      if (cid) {
        // Fetch assignments for specific course
        data = await courseApi.listCourseAssignments(cid);
      } else {
        // Fetch open assignments (no course)
        data = await assignmentApi.getMyAssignments();
        // Filter client-side to only show ones without a course
        data = data.filter(a => !a.course_id);
      }
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Failed to load assignments. Please try again.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload assignments when selected course changes (but not when on the grid)
  useEffect(() => {
    if (selectedCourseId !== undefined) {
      loadAssignments(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleCreateAssignment = () => {
    setCurrentView('assignment-builder');
  };

  const handleGenerateAssignment = () => {
    setCurrentView('ai-generator');
  };

  const handleParseFromDocument = () => {
    setParseModalOpen(true);
  };

  const handleParsedAssignment = (assignmentData) => {
    // Preserve the course_id if we came from a course detail view
    setParsedAssignmentData({ ...assignmentData, course_id: courseDetailId || assignmentData.course_id || null });
    setParseModalOpen(false);
    setCurrentView('assignment-builder');
  };

  const handleShareAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSharingModalOpen(true);
  };

  const handleViewSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView('submissions');
  };

  const handleEditAssignment = async (assignment) => {
    try {
      setLoadingEdit(true);
      console.log('MyAssignments: Editing assignment:', assignment);
      
      // Fetch the full assignment data including questions
      const fullAssignmentData = await assignmentApi.getAssignment(assignment.id);
      console.log('MyAssignments: Fetched full assignment data:', fullAssignmentData);
      
      setParsedAssignmentData(fullAssignmentData);
      setCurrentView('assignment-builder');
    } catch (error) {
      console.error('Failed to load assignment for editing:', error);
      alert('Failed to load assignment for editing. Please try again.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    
    try {
      await assignmentApi.deleteAssignment(assignmentId);
      // Remove from local state
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      alert('Failed to delete assignment. Please try again.');
    }
  };

  const handleDownloadPDF = async (assignment) => {
    try {
      setDownloadingPDF(assignment.id);
      
      // Use the assignmentApi to download PDF
      const response = await assignmentApi.downloadAssignmentPDF(assignment.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Assignment.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
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
      link.download = `${assignment.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Solution_Key.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download solution PDF:', err);
      alert('Failed to download solution PDF. Please try again.');
    } finally {
      setDownloadingSolutionPDF(null);
    }
  };

  const handleContinueFromGenerator = (generatedData) => {
    // Preserve the course_id if we came from a course detail view
    setParsedAssignmentData({ ...generatedData, course_id: courseDetailId || generatedData.course_id || null });
    setCurrentView('assignment-builder');
  };

  const handleBackToMain = () => {
    // If we were in a course detail view, go back to it instead of the courses grid
    if (courseDetailId && (currentView === 'assignment-builder' || currentView === 'ai-generator' || currentView === 'submissions')) {
      setCourseDetailReturnSection('assignments');
      setCurrentView('course-detail');
      setParsedAssignmentData(null);
      return;
    }
    setCurrentView('main');
    setParsedAssignmentData(null);
    setCourseDetailId(null);
    setSelectedCourseId(undefined); // Go back to courses grid
    loadCourses();
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setCourseDetailId(null);
  };

  const handleOpenCourseDetail = (courseId) => {
    setCourseDetailId(courseId);
    setCourseDetailReturnSection(null);
    setCurrentView('course-detail');
  };

  const handleCourseCreated = (newCourse) => {
    setShowCreateCourse(false);
    loadCourses();
    // Navigate into the newly created course
    setSelectedCourseId(newCourse.id);
  };

  const handleCreateAssignmentForCourse = (courseId) => {
    // Pre-load course_id into the assignment data so the builder includes it
    setParsedAssignmentData({ course_id: courseId });
    setCurrentView('assignment-builder');
  };

  if (currentView === 'assignment-builder') {
    return <AssignmentBuilder 
      onBack={handleBackToMain} 
      onNavigateToHome={onNavigateToHome} 
      preloadedData={parsedAssignmentData}
    />;
  }

  if (currentView === 'ai-generator') {
    return <AIAssignmentGeneratorWizard 
      onBack={handleBackToMain} 
      onNavigateToHome={onNavigateToHome} 
      onContinueToBuilder={handleContinueFromGenerator}
      inCourseContext={!!courseDetailId}
      courseId={courseDetailId || null}
    />;
  }

  if (currentView === 'submissions') {
    return <AssignmentSubmissions assignment={selectedAssignment} onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

  if (currentView === 'course-detail' && courseDetailId) {
    return (
      <>
        <CourseDetailView
          courseId={courseDetailId}
          onBack={handleBackToMain}
          onNavigateToHome={onNavigateToHome}
          onCreateAssignment={handleCreateAssignmentForCourse}
          onEditAssignment={(a) => handleEditAssignment(a)}
          onViewSubmissions={(a) => handleViewSubmissions(a)}
          onImportDocument={handleParseFromDocument}
          onGenerateWithAI={handleGenerateAssignment}
          initialSection={courseDetailReturnSection || (courseDetailId === initialCourseId ? initialSection : null)}
        />
        {parseModalOpen && (
          <ImportFromDocumentModal
            onClose={() => setParseModalOpen(false)}
            onParsed={handleParsedAssignment}
          />
        )}
      </>
    );
  }

  // Determine the label for the currently selected course
  const selectedCourseLabel = selectedCourseId === null
    ? 'Open Assignments'
    : (() => {
        const c = courses.find(c => c.id === selectedCourseId);
        return c ? (c.course_code ? `${c.course_code} – ${c.title}` : c.title) : 'Course';
      })();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation */}
      <TopBar onNavigateToHome={onNavigateToHome} />
      
      {/* Page Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectedCourseId !== undefined ? () => setSelectedCourseId(undefined) : onBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                {selectedCourseId !== undefined ? (
                  <>
                    <h1 className="text-3xl font-bold text-white">{selectedCourseLabel}</h1>
                    <p className="text-gray-400 mt-1">Assignments in this course</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white">My Courses</h1>
                    <p className="text-gray-400 mt-1">Select a course to view and manage assignments</p>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons — only shown when inside a course */}
            {selectedCourseId !== undefined && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleParseFromDocument}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
                >
                  <FileText size={20} className="mr-2" />
                  Import from Document
                </button>
                <button
                  onClick={handleGenerateAssignment}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  <Sparkles size={20} className="mr-2" />
                  Generate with AI
                </button>
                <button
                  onClick={handleCreateAssignment}
                  className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}

            {/* Create course button — only shown on courses grid */}
            {selectedCourseId === undefined && (
              <button
                onClick={() => setShowCreateCourse(true)}
                className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                <Plus size={20} className="mr-2" />
                New Course
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── COURSES GRID (when no course is selected) ─── */}
      {selectedCourseId === undefined && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loadingCourses ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="text-teal-500 animate-spin" />
              <span className="ml-3 text-gray-300">Loading courses...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* "Open Assignments" card */}
              <CourseCard
                thumbnail={true}
                course={{
                  id: null,
                  title: 'Non Course Assignments',
                  course_code: 'Open Assignments',
                  assignment_count: '—',
                }}
                onClick={() => handleSelectCourse(null)}
              />

              {/* Actual courses */}
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  thumbnail={true}
                  course={course}
                  onClick={() => handleOpenCourseDetail(course.id)}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* ─── ASSIGNMENTS INSIDE A COURSE ─── */}
      {selectedCourseId !== undefined && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          {!loading && !error && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">{assignments.length}</p>
                    <p className="text-gray-400">Total Assignments</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">
                      {assignments.reduce((sum, assignment) => sum + parseInt(assignment.shared_count || 0), 0)}
                    </p>
                    <p className="text-gray-400">Students Reached</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Calendar size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">
                      {assignments.filter(a => a.status === 'published').length}
                    </p>
                    <p className="text-gray-400">Published</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">
                      {assignments.filter(a => a.status === 'draft').length}
                    </p>
                    <p className="text-gray-400">Drafts</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-teal-500 animate-spin" />
              <span className="ml-3 text-gray-300">Loading assignments...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-8">
              <div className="text-red-400 font-medium mb-2">Error Loading Assignments</div>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <button
                onClick={loadAssignments}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && assignments.length === 0 && (
            <div className="text-center py-16">
              <FileText size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Assignments Yet</h3>
              <p className="text-gray-400 mb-6">Create your first assignment in this course</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleParseFromDocument}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
                >
                  <FileText size={20} className="mr-2" />
                  Import from Document
                </button>
                <button
                  onClick={handleGenerateAssignment}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  <Sparkles size={20} className="mr-2" />
                  Generate with AI
                </button>
              </div>
            </div>
          )}

          {/* Assignments Grid */}
          {!loading && !error && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{assignment.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'published' 
                        ? 'bg-green-500/20 text-green-400' 
                        : assignment.status === 'draft'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar size={16} className="mr-2" />
                      <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                    </div>
                    {assignment.due_date && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock size={16} className="mr-2" />
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-400">
                      <Plus size={16} className="mr-2" />
                      <span>{assignment.total_questions} questions ({assignment.total_points} points)</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Users size={16} className="mr-2" />
                      <span>{assignment.shared_count || 0} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.engineering_level === 'graduate' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {assignment.engineering_level === 'graduate' ? 'Graduate' : 'Undergraduate'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(assignment.question_types || []).map((type, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-auto">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditAssignment(assignment)}
                        disabled={loadingEdit}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit Assignment"
                      >
                        {loadingEdit ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Edit size={16} />
                        )}
                      </button>
                      {/* Share only for standalone (non-course) published assignments */}
                      {!assignment.course_id && assignment.status === 'published' && (
                        <button
                          onClick={() => handleShareAssignment(assignment)}
                          className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                          title="Share Assignment"
                        >
                          <Share2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {!assignment.course_id && assignment.status === 'published' && (<div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewSubmissions(assignment)}
                        className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                        title="View Submissions"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(assignment)}
                        disabled={downloadingPDF === assignment.id}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download assignment PDF"
                      >
                        {downloadingPDF === assignment.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadSolutionPDF(assignment)}
                        disabled={downloadingSolutionPDF === assignment.id}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download solutions PDF"
                      >
                        {downloadingSolutionPDF === assignment.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <BookOpen size={16} />
                        )}
                      </button>
                    </div>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Modals */}
      {sharingModalOpen && (
        <AssignmentSharingModal
          assignment={selectedAssignment}
          onClose={() => setSharingModalOpen(false)}
          onRefresh={() => loadAssignments(selectedCourseId)}
        />
      )}

      {parseModalOpen && (
        <ImportFromDocumentModal
          onClose={() => setParseModalOpen(false)}
          onParsed={handleParsedAssignment}
        />
      )}

      {showCreateCourse && (
        <CreateCourseModal
          onClose={() => setShowCreateCourse(false)}
          onCreated={handleCourseCreated}
        />
      )}
    </div>
  );
};

export default MyAssignments;