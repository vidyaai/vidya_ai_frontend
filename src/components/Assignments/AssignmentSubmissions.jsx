// src/components/Assignments/AssignmentSubmissions.jsx
import { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Send,
  Filter,
  Search
} from 'lucide-react';
import TopBar from '../generic/TopBar';

const AssignmentSubmissions = ({ assignment, onBack, onNavigateToHome }) => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, submitted, graded, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedForGrading, setSelectedForGrading] = useState([]);

  // Mock submission data
  const [submissions] = useState([
    {
      id: 1,
      studentName: "Alice Johnson",
      studentEmail: "alice.johnson@university.edu",
      submittedAt: "2024-01-20T14:30:00",
      submissionType: "in-app",
      status: "submitted",
      score: null,
      answers: {
        1: "Mathematics",
        2: "true",
        3: "The key concepts include differential calculus, integral calculus, and the fundamental theorem of calculus.",
        4: "5",
        5: "Calculus is a branch of mathematics that studies continuous change..."
      },
      gradingStatus: "pending"
    },
    {
      id: 2,
      studentName: "Bob Smith",
      studentEmail: "bob.smith@university.edu", 
      submittedAt: "2024-01-21T09:15:00",
      submissionType: "pdf",
      status: "submitted",
      score: 85,
      pdfUrl: "/submissions/bob_smith_assignment.pdf",
      gradingStatus: "graded"
    },
    {
      id: 3,
      studentName: "Carol Davis",
      studentEmail: "carol.davis@university.edu",
      submittedAt: "2024-01-21T16:45:00", 
      submissionType: "in-app",
      status: "submitted",
      score: null,
      answers: {
        1: "Physics",
        2: "false",
        3: "The content covers basic principles of motion and energy conservation.",
        4: "7",
        5: "Physics deals with matter, energy, and their interactions in the universe..."
      },
      gradingStatus: "pending"
    },
    {
      id: 4,
      studentName: "David Wilson",
      studentEmail: "david.wilson@university.edu",
      submittedAt: "2024-01-22T11:20:00",
      submissionType: "pdf",
      status: "submitted", 
      score: 92,
      pdfUrl: "/submissions/david_wilson_assignment.pdf",
      gradingStatus: "graded"
    }
  ]);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'submitted' && submission.status === 'submitted') ||
      (filterStatus === 'graded' && submission.gradingStatus === 'graded') ||
      (filterStatus === 'pending' && submission.gradingStatus === 'pending');
    
    const matchesSearch = submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  const handleSelectForGrading = (submissionId) => {
    setSelectedForGrading(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSendForAIGrading = () => {
    if (selectedForGrading.length === 0) {
      alert('Please select at least one submission to grade');
      return;
    }
    setGradingModalOpen(true);
  };

  const confirmAIGrading = () => {
    // TODO: Implement AI grading API call
    console.log('Sending submissions for AI grading:', selectedForGrading);
    setGradingModalOpen(false);
    setSelectedForGrading([]);
    // Show success message
    alert(`${selectedForGrading.length} submissions sent for AI grading`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  // Submission Detail Modal
  const SubmissionDetailModal = ({ submission, onClose }) => {
    if (!submission) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-2xl font-bold text-white">{submission.studentName}</h2>
              <p className="text-gray-400 mt-1">{submission.studentEmail}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.gradingStatus)}`}>
                {submission.gradingStatus}
              </span>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Eye size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar size={16} className="text-teal-400" />
                  <span className="text-gray-300 text-sm">Submitted</span>
                </div>
                <p className="text-white font-medium">{formatDate(submission.submittedAt)}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={16} className="text-teal-400" />
                  <span className="text-gray-300 text-sm">Type</span>
                </div>
                <p className="text-white font-medium capitalize">{submission.submissionType}</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle size={16} className="text-teal-400" />
                  <span className="text-gray-300 text-sm">Score</span>
                </div>
                <p className="text-white font-medium">
                  {submission.score ? `${submission.score}/100` : 'Not graded'}
                </p>
              </div>
            </div>

            {/* Submission Content */}
            {submission.submissionType === 'in-app' ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Answers</h3>
                {Object.entries(submission.answers).map(([questionId, answer]) => (
                  <div key={questionId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-white font-medium mb-3">Question {questionId}</h4>
                    <div className="bg-gray-700 rounded p-3">
                      <p className="text-gray-300">{answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">PDF Submission</h3>
                <p className="text-gray-400 mb-6">
                  This student submitted their answers as a PDF file.
                </p>
                <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300">
                  <Download size={18} className="mr-2" />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // AI Grading Confirmation Modal
  const AIGradingModal = ({ isOpen, onClose, onConfirm, count }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">AI Grading</h2>
            <p className="text-gray-400">
              Send {count} submission{count !== 1 ? 's' : ''} for AI-powered grading?
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">What will happen:</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• AI will analyze each submission</li>
              <li>• Scores will be generated based on rubrics</li>
              <li>• Detailed feedback will be provided</li>
              <li>• Results will be available in 2-5 minutes</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Start AI Grading
            </button>
          </div>
        </div>
      </div>
    );
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
                <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
                <p className="text-gray-400 mt-2">Assignment Submissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {selectedForGrading.length > 0 && (
                <button
                  onClick={handleSendForAIGrading}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  <Brain size={18} className="mr-2" />
                  Grade with AI ({selectedForGrading.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name or email..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Submissions</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="pending">Pending Grade</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{submissions.length}</p>
                <p className="text-gray-400">Total Submissions</p>
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
                  {submissions.filter(s => s.gradingStatus === 'graded').length}
                </p>
                <p className="text-gray-400">Graded</p>
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
                  {submissions.filter(s => s.gradingStatus === 'pending').length}
                </p>
                <p className="text-gray-400">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {Math.round((submissions.filter(s => s.score).reduce((sum, s) => sum + s.score, 0) / submissions.filter(s => s.score).length) || 0)}
                </p>
                <p className="text-gray-400">Avg Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Submissions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForGrading(filteredSubmissions.filter(s => s.gradingStatus === 'pending').map(s => s.id));
                        } else {
                          setSelectedForGrading([]);
                        }
                      }}
                      className="text-teal-500 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedForGrading.includes(submission.id)}
                        onChange={() => handleSelectForGrading(submission.id)}
                        disabled={submission.gradingStatus === 'graded'}
                        className="text-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{submission.studentName}</p>
                        <p className="text-gray-400 text-sm">{submission.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText size={16} className="text-gray-400 mr-2" />
                        <span className="text-gray-300 text-sm capitalize">{submission.submissionType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.gradingStatus)}`}>
                        {submission.gradingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {submission.score ? `${submission.score}/100` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewSubmission(submission)}
                        className="inline-flex items-center px-3 py-1 bg-gray-700 text-white text-sm font-medium rounded hover:bg-gray-600 transition-colors"
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Submissions Found</h3>
              <p className="text-gray-400">No submissions match your current filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <SubmissionDetailModal 
        submission={selectedSubmission} 
        onClose={() => setSelectedSubmission(null)} 
      />
      
      <AIGradingModal
        isOpen={gradingModalOpen}
        onClose={() => setGradingModalOpen(false)}
        onConfirm={confirmAIGrading}
        count={selectedForGrading.length}
      />
    </div>
  );
};

export default AssignmentSubmissions;
