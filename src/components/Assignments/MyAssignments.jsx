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
  Loader2
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import AssignmentBuilder from './AssignmentBuilder';
import AIAssignmentGenerator from './AIAssignmentGenerator';
import AssignmentSharingModal from './AssignmentSharingModal';
import AssignmentSubmissions from './AssignmentSubmissions';
import ImportFromDocumentModal from './ImportFromDocumentModal';
import { assignmentApi } from './assignmentApi';

const MyAssignments = ({ onBack, onNavigateToHome }) => {
  const [currentView, setCurrentView] = useState('main');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [parsedAssignmentData, setParsedAssignmentData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Load assignments from API
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentApi.getMyAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Failed to load assignments. Please try again.');
      // Fallback to mock data for development
      setAssignments([
        {
          id: 1,
          title: "Control Systems Design",
          description: "Temperature regulation system with MATLAB implementation, block diagrams, and multi-part analysis including PID controller design and stability analysis",
          created_at: "2024-01-15T00:00:00Z",
          due_date: "2024-02-01T00:00:00Z",
          total_questions: "4",
          total_points: "15",
          shared_count: "25",
          status: "published",
          question_types: ["multiple-choice", "code-writing", "diagram-analysis", "multi-part"],
          engineering_level: "undergraduate"
        },
        {
          id: 2,
          title: "Digital Signal Processing",
          description: "Audio filter design with Python implementation, frequency analysis, and nested multi-part questions covering filter theory and practical implementation",
          created_at: "2024-01-10T00:00:00Z",
          due_date: "2024-01-25T00:00:00Z",
          total_questions: "5",
          total_points: "12",
          shared_count: "18",
          status: "draft",
          question_types: ["code-writing", "multi-part", "numerical"],
          engineering_level: "graduate"
        },
        {
          id: 3,
          title: "Circuit Analysis & Design",
          description: "Comprehensive electrical engineering assignment with circuit diagrams, impedance calculations, and design challenges",
          created_at: "2024-01-05T00:00:00Z",
          due_date: "2024-01-20T00:00:00Z",
          total_questions: "6",
          total_points: "8",
          shared_count: "32",
          status: "published",
          question_types: ["diagram-analysis", "multiple-choice", "numerical"],
          engineering_level: "undergraduate"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
    setParsedAssignmentData(assignmentData);
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

  const handleBackToMain = () => {
    setCurrentView('main');
    setParsedAssignmentData(null); // Clear parsed data when going back
    // Reload assignments when coming back from builder/generator
    loadAssignments();
  };

  if (currentView === 'assignment-builder') {
    return <AssignmentBuilder 
      onBack={handleBackToMain} 
      onNavigateToHome={onNavigateToHome} 
      preloadedData={parsedAssignmentData}
    />;
  }

  if (currentView === 'ai-generator') {
    return <AIAssignmentGenerator onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

  if (currentView === 'submissions') {
    return <AssignmentSubmissions assignment={selectedAssignment} onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

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
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">My Assignments</h1>
                <p className="text-gray-400 mt-2">Create, manage, and share your assignments</p>
              </div>
            </div>
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
                <Plus size={20}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Assignments Yet</h3>
            <p className="text-gray-400 mb-6">Create your first assignment to get started</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
            </div>
          </div>
        )}

        {/* Assignments Grid */}
        {!loading && !error && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg"
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

                <div className="space-y-2 mb-4">
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
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
                    <button
                      onClick={() => handleShareAssignment(assignment)}
                      className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                      title="Share Assignment"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleViewSubmissions(assignment)}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors"
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {sharingModalOpen && (
        <AssignmentSharingModal
          assignment={selectedAssignment}
          onClose={() => setSharingModalOpen(false)}
          onRefresh={loadAssignments}
        />
      )}

      {parseModalOpen && (
        <ImportFromDocumentModal
          onClose={() => setParseModalOpen(false)}
          onParsed={handleParsedAssignment}
        />
      )}
    </div>
  );
};

export default MyAssignments;