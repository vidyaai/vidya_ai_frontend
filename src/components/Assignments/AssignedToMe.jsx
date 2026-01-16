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
  Loader2,
  Download,
  ExternalLink
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import DoAssignmentModal from './DoAssignmentModal';
import { assignmentApi } from './assignmentApi';

const AssignedToMe = ({ onBack, onNavigateToHome }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [doAssignmentModalOpen, setDoAssignmentModalOpen] = useState(false);
  const [assignedAssignments, setAssignedAssignments] = useState([]);
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

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
      
      // Load status for each assignment
      await loadAssignmentStatuses(data);
    } catch (err) {
      console.error('Failed to load shared assignments:', err);
      setError('Failed to load assignments. Please try again.');
      setAssignedAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentStatuses = async (assignments) => {
    try {
      const statusPromises = assignments.map(async (sharedAssignment) => {
        const assignment = sharedAssignment.assignment || sharedAssignment;
        try {
          const status = await assignmentApi.getAssignmentStatus(assignment.id);
          return { assignmentId: assignment.id, status };
        } catch (error) {
          console.error(`Failed to load status for assignment ${assignment.id}:`, error);
          // Return default status if API fails
          return { 
            assignmentId: assignment.id, 
            status: { 
              status: 'not_started', 
              progress: 0,
              submission: null 
            } 
          };
        }
      });

      const statusResults = await Promise.all(statusPromises);
      const statusMap = {};
      statusResults.forEach(({ assignmentId, status }) => {
        statusMap[assignmentId] = status;
      });
      
      setAssignmentStatuses(statusMap);
    } catch (error) {
      console.error('Failed to load assignment statuses:', error);
    }
  };

  const getStudentStatus = (assignment) => {
    const assignmentId = assignment.id;
    const statusInfo = assignmentStatuses[assignmentId];
    
    if (!statusInfo) {
      // Default status while loading
      return {
        status: 'not_started',
        progress: 0,
        displayStatus: 'Not Started',
        color: 'bg-gray-500/20 text-gray-400'
      };
    }

    const { status, progress, grade, percentage, is_overdue } = statusInfo;
    
    // Map backend status to display status
    let displayStatus, color;
    
    switch (status) {
      case 'not_started':
        if (is_overdue) {
          displayStatus = 'Overdue';
          color = 'bg-red-500/20 text-red-400';
        } else {
          displayStatus = 'Not Started';
          color = 'bg-gray-500/20 text-gray-400';
        }
        break;
      case 'in_progress':
        if (is_overdue) {
          displayStatus = 'Overdue';
          color = 'bg-red-500/20 text-red-400';
        } else {
          displayStatus = 'In Progress';
          color = 'bg-yellow-500/20 text-yellow-400';
        }
        break;
      case 'overdue':
        displayStatus = 'Overdue';
        color = 'bg-red-500/20 text-red-400';
        break;
      case 'submitted':
        displayStatus = 'Submitted';
        color = 'bg-blue-500/20 text-blue-400';
        break;
      case 'graded':
        displayStatus = `Graded (${percentage || grade || progress+'%'})`;
        color = 'bg-green-500/20 text-green-400';
        break;
      default:
        displayStatus = 'Unknown';
        color = 'bg-gray-500/20 text-gray-400';
    }

    return {
      status,
      progress: progress || 0,
      displayStatus,
      color,
      grade,
      percentage,
      isOverdue: is_overdue
    };
  };

  const getButtonText = (assignment) => {
    const studentStatus = getStudentStatus(assignment);
    
    switch (studentStatus.status) {
      case 'not_started':
        return studentStatus.isOverdue ? 'Start (Overdue)' : 'Start Assignment';
      case 'in_progress':
        return studentStatus.isOverdue ? 'Continue (Overdue)' : 'Continue Assignment';
      case 'overdue':
        return 'Continue (Overdue)';
      case 'submitted':
        return 'View Submission';
      case 'graded':
        return 'View Results';
      default:
        return 'Open Assignment';
    }
  };

  const handleDoAssignment = (sharedAssignment) => {
    // Pass the full shared assignment data including owner information
    setSelectedAssignment(sharedAssignment);
    setDoAssignmentModalOpen(true);
  };

  const handleAssignmentUpdate = () => {
    // Reload assignment statuses when assignment is updated
    if (assignedAssignments.length > 0) {
      loadAssignmentStatuses(assignedAssignments);
    }
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
      case 'graded':
        return <CheckCircle size={16} className="text-green-400" />;
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
                    {assignedAssignments.filter(a => {
                      const assignment = a.assignment || a;
                      const studentStatus = getStudentStatus(assignment);
                      return studentStatus.status === 'submitted' || studentStatus.status === 'graded';
                    }).length}
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
                    {assignedAssignments.filter(a => {
                      const assignment = a.assignment || a;
                      const studentStatus = getStudentStatus(assignment);
                      return studentStatus.status === 'in_progress';
                    }).length}
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
                      const studentStatus = getStudentStatus(assignment);
                      return studentStatus.status === 'overdue' || studentStatus.isOverdue;
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
                      {(() => {
                        const studentStatus = getStudentStatus(assignment);
                        return (
                          <>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${studentStatus.color}`}>
                              {getStatusIcon(studentStatus.status)}
                              <span>{studentStatus.displayStatus}</span>
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar size={16} className="mr-2" />
                      <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Users size={16} className="mr-2" />
                      <span>From: {sharedAssignment.owner_name || sharedAssignment.owner_id || assignment.user_id}</span>
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

                  {/* Progress Bar - Based on student status */}
                  {(() => {
                    const studentStatus = getStudentStatus(assignment);
                    if (studentStatus.status === 'not_started') return null;
                    
                    return (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                         <span>{studentStatus.status === 'graded' ? 'Precentage Grade' : 'Progress'}</span>
                          <span>{Math.round(studentStatus.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              studentStatus.status === 'submitted' || studentStatus.status === 'graded' ? 'bg-green-500' : 
                              studentStatus.status === 'overdue' || studentStatus.isOverdue ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${studentStatus.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}

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

                  {/* Export Options - PDF and Google Form */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={async () => {
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
                      }}
                      disabled={downloadingPdfId === assignment.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 rounded-lg text-xs transition-colors"
                      title="Download PDF"
                    >
                      {downloadingPdfId === assignment.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      <span>{downloadingPdfId === assignment.id ? 'Downloading...' : 'PDF'}</span>
                    </button>
                    {(assignment.google_form_response_url) && (
                      <a
                        href={assignment.google_form_response_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs transition-colors"
                        title="Open Google Form"
                      >
                        <ExternalLink size={14} />
                        <span>Google Form</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      assignment.engineering_level === 'graduate' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {assignment.engineering_level === 'graduate' ? 'Graduate' : 'Undergraduate'}
                    </span>
                    <button
                      onClick={() => handleDoAssignment(sharedAssignment)}
                      className={`px-4 py-2 text-white rounded-lg transition-all duration-300 ${
                        (() => {
                          const studentStatus = getStudentStatus(assignment);
                          if (studentStatus.status === 'graded') {
                            return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700';
                          } else if (studentStatus.status === 'submitted') {
                            return 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700';
                          } else if (studentStatus.isOverdue || studentStatus.status === 'overdue') {
                            return 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700';
                          } else {
                            return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700';
                          }
                        })()
                      }`}
                    >
                      {getButtonText(assignment)}
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
          onAssignmentUpdate={handleAssignmentUpdate}
        />
      )}
    </div>
  );
};

export default AssignedToMe;