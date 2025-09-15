// src/components/Assignments/AssignedToMe.jsx
import { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Upload,
  Eye
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import DoAssignmentModal from './DoAssignmentModal';

const AssignedToMe = ({ onBack, onNavigateToHome }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [doAssignmentModalOpen, setDoAssignmentModalOpen] = useState(false);

  // Mock data for assignments assigned to the user
  const [assignments] = useState([
    {
      id: 1,
      title: "Control Systems Design",
      description: "Temperature regulation system with MATLAB implementation, block diagrams, and multi-part analysis including PID controller design and stability analysis",
      instructor: "Dr. Sarah Johnson",
      dueDate: "2024-02-01",
      totalQuestions: 4,
      totalParts: 15,
      status: "due", // due, draft, completed
      timeRemaining: "5 days",
      progress: 0,
      questionTypes: ["Multiple Choice", "Code Writing", "Diagram Analysis", "Multi-Part"],
      engineeringLevel: "undergraduate"
    },
    {
      id: 2,
      title: "Digital Signal Processing",
      description: "Audio filter design with Python implementation, frequency analysis, and nested multi-part questions covering filter theory and practical implementation",
      instructor: "Prof. Michael Chen",
      dueDate: "2024-01-25",
      totalQuestions: 5,
      totalParts: 12,
      status: "draft",
      timeRemaining: "2 days",
      progress: 60,
      questionTypes: ["Code Writing", "Multi-Part", "Numerical"],
      engineeringLevel: "graduate"
    },
    {
      id: 3,
      title: "Circuit Analysis & Design",
      description: "Comprehensive electrical engineering assignment with circuit diagrams, impedance calculations, and design challenges",
      instructor: "Dr. Emily Rodriguez",
      dueDate: "2024-01-20",
      totalQuestions: 6,
      totalParts: 8,
      status: "completed",
      timeRemaining: "Completed",
      progress: 100,
      questionTypes: ["Diagram Analysis", "Multiple Choice", "Numerical"],
      engineeringLevel: "undergraduate"
    }
  ]);

  const handleOpenAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setDoAssignmentModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'due':
        return <AlertCircle size={20} className="text-orange-400" />;
      case 'draft':
        return <Clock size={20} className="text-blue-400" />;
      case 'completed':
        return <CheckCircle size={20} className="text-green-400" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'due':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'draft':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'due':
        return 'Due Soon';
      case 'draft':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
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
                <p className="text-gray-400 mt-2">View and complete your assignments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {assignments.filter(a => a.status === 'due').length}
                </p>
                <p className="text-gray-400">Due Soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">
                  {assignments.filter(a => a.status === 'draft').length}
                </p>
                <p className="text-gray-400">In Progress</p>
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
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
                <p className="text-gray-400">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{assignments.length}</p>
                <p className="text-gray-400">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => handleOpenAssignment(assignment)}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                    {assignment.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{assignment.description}</p>
                  <p className="text-gray-500 text-sm">by {assignment.instructor}</p>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(assignment.status)}`}>
                  {getStatusIcon(assignment.status)}
                  <span className="text-sm font-medium">{getStatusText(assignment.status)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar size={16} className="mr-2" />
                  <span>Due: {assignment.dueDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Clock size={16} className="mr-2" />
                  <span>{assignment.timeRemaining}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <FileText size={16} className="mr-2" />
                  <span>{assignment.totalQuestions} questions ({assignment.totalParts} parts)</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    assignment.engineeringLevel === 'graduate' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {assignment.engineeringLevel === 'graduate' ? 'Graduate' : 'Undergraduate'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {assignment.questionTypes.map((type, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              {assignment.status === 'draft' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{assignment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${assignment.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300">
                  <Eye size={16} className="mr-1" />
                  {assignment.status === 'completed' ? 'Review' : 'Continue'}
                </button>
                {assignment.status !== 'completed' && (
                  <button className="inline-flex items-center justify-center px-3 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">
                    <Upload size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {assignments.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Assignments Yet</h3>
            <p className="text-gray-400 mb-8">You don't have any assignments assigned to you yet</p>
            <button
              onClick={onBack}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Assignment Manager
            </button>
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

