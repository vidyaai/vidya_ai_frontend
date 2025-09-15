// src/components/Assignments/AssignedToMe.jsx
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Loader2
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import DoAssignmentModal from './DoAssignmentModal';
import { assignmentApi } from './assignmentApi';

const AssignedToMe = ({ onBack, onNavigateToHome }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [doAssignmentModalOpen, setDoAssignmentModalOpen] = useState(false);
  const [assignedAssignments, setAssignedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load assigned assignments from API
  useEffect(() => {
    loadAssignedAssignments();
  }, []);

  const loadAssignedAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentApi.getAssignedToMeAssignments();
      setAssignedAssignments(data);
    } catch (err) {
      console.error('Failed to load shared assignments:', err);
      setError('Failed to load assignments. Please try again.');
      // Fallback to mock data for development
      setAssignedAssignments([
        {
          id: 1,
          assignment: {
            id: 'assign-1',
            title: "Control Systems Design",
            description: "Temperature regulation system with MATLAB implementation, block diagrams, and multi-part analysis including PID controller design and stability analysis",
            due_date: "2024-02-01T00:00:00Z",
            total_questions: "4",
            total_points: "15",
            question_types: ["multiple-choice", "code-writing", "diagram-analysis", "multi-part"],
            engineering_level: "undergraduate"
          },
          shared_by_user_id: "instructor@example.com",
          permission: "complete",
          status: "not_started",
          progress: 0
        },
        {
          id: 2,
          assignment: {
            id: 'assign-2',
            title: "Digital Signal Processing",
            description: "Audio filter design with Python implementation, frequency analysis, and nested multi-part questions covering filter theory and practical implementation",
            due_date: "2024-01-25T00:00:00Z",
            total_questions: "5",
            total_points: "12",
            question_types: ["code-writing", "multi-part", "numerical"],
            engineering_level: "graduate"
          },
          shared_by_user_id: "prof.smith@university.edu",
          permission: "complete",
          status: "in_progress",
          progress: 60
        },
        {
          id: 3,
          assignment: {
            id: 'assign-3',
            title: "Circuit Analysis & Design",
            description: "Comprehensive electrical engineering assignment with circuit diagrams, impedance calculations, and design challenges",
            due_date: "2024-01-20T00:00:00Z",
            total_questions: "6",
            total_points: "8",
            question_types: ["diagram-analysis", "multiple-choice", "numerical"],
            engineering_level: "undergraduate"
          },
          shared_by_user_id: "dr.johnson@tech.edu",
          permission: "complete",
          status: "completed",
          progress: 100
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setDoAssignmentModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'overdue':
        return <AlertTriangle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-blue-400" />;
    }
  };

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
                <h1 className="text-3xl font-bold text-white">Assigned to Me</h1>
                <p className="text-gray-400 mt-2">Complete assignments shared with you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {!loading && !error && assignedAssignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">{assignedAssignments.length}</p>
                  <p className="text-gray-400">Total Assigned</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">
                    {assignedAssignments.filter(a => (a.assignment || a).status === 'submitted').length}
                  </p>
                  <p className="text-gray-400">Completed</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Clock size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">
                    {assignedAssignments.filter(a => (a.assignment || a).status === 'published' && (a.assignment || a).status !== 'submitted').length}
                  </p>
                  <p className="text-gray-400">In Progress</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">
                    {assignedAssignments.filter(a => {
                      const assignment = a.assignment || a;
                      return assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'submitted';
                    }).length}
                  </p>
                  <p className="text-gray-400">Overdue</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-300">Loading assignments...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-8">
            <div className="text-red-400 font-medium mb-2">Error Loading Assignments</div>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button
              onClick={loadAssignedAssignments}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assignedAssignments.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Assignments Assigned</h3>
            <p className="text-gray-400 mb-6">You don't have any assignments assigned to you yet.</p>
          </div>
        )}

        {/* Assignments Grid */}
        {!loading && !error && assignedAssignments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {assignedAssignments.map((sharedAssignment) => {
              const assignment = sharedAssignment.assignment || sharedAssignment;
              return (
                <div
                  key={sharedAssignment.id || assignment.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-3">{assignment.description}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(assignment.status)}`}>
                        {getStatusIcon(assignment.status)}
                        <span>{assignment.status?.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar size={16} className="mr-2" />
                      <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Users size={16} className="mr-2" />
                      <span>From: {sharedAssignment.owner_id || assignment.user_id}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{assignment.total_questions}</div>
                      <div className="text-xs text-gray-500">Questions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{assignment.total_points}</div>
                      <div className="text-xs text-gray-500">Total Points</div>
                    </div>
                  </div>

                  {/* Progress Bar - Based on assignment status */}
                  {assignment.status && assignment.status !== 'draft' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Status</span>
                        <span>{assignment.status === 'submitted' ? 'Completed' : 'In Progress'}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            assignment.status === 'submitted' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: assignment.status === 'submitted' ? '100%' : '50%' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(assignment.question_types || []).map((type, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      assignment.engineering_level === 'graduate' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {assignment.engineering_level === 'graduate' ? 'Graduate' : 'Undergraduate'}
                    </span>
                    <button
                      onClick={() => handleDoAssignment(assignment)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                    >
                      {sharedAssignment.status === 'completed' ? 'Review Submission' : 'Start Assignment'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Do Assignment Modal */}
      {doAssignmentModalOpen && selectedAssignment && (
        <DoAssignmentModal
          assignment={selectedAssignment}
          onClose={() => setDoAssignmentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AssignedToMe;