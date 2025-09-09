// src/components/Assignments/MyAssignments.jsx
import { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Share2, 
  Edit, 
  Trash2,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import AssignmentBuilder from './AssignmentBuilder';
import AIAssignmentGenerator from './AIAssignmentGenerator';
import AssignmentSharingModal from './AssignmentSharingModal';

const MyAssignments = ({ onBack, onNavigateToHome }) => {
  const [currentView, setCurrentView] = useState('main');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);

  // Mock data for assignments
  const [assignments] = useState([
    {
      id: 1,
      title: "Mathematics Problem Set",
      description: "Advanced calculus problems covering derivatives and integrals",
      createdAt: "2024-01-15",
      dueDate: "2024-02-01",
      totalQuestions: 15,
      sharedWith: 25,
      status: "published"
    },
    {
      id: 2,
      title: "Physics Lab Report",
      description: "Analysis of pendulum motion and energy conservation",
      createdAt: "2024-01-10",
      dueDate: "2024-01-25",
      totalQuestions: 8,
      sharedWith: 18,
      status: "draft"
    },
    {
      id: 3,
      title: "Literature Analysis",
      description: "Critical analysis of Shakespeare's Hamlet",
      createdAt: "2024-01-05",
      dueDate: "2024-01-20",
      totalQuestions: 12,
      sharedWith: 32,
      status: "published"
    }
  ]);

  const handleCreateAssignment = () => {
    setCurrentView('assignment-builder');
  };

  const handleGenerateAssignment = () => {
    setCurrentView('ai-generator');
  };

  const handleShareAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSharingModalOpen(true);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  if (currentView === 'assignment-builder') {
    return <AssignmentBuilder onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

  if (currentView === 'ai-generator') {
    return <AIAssignmentGenerator onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
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
                <p className="text-gray-400 mt-2">Create and manage your assignments</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateAssignment}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
              >
                <Plus size={18} className="mr-2" />
                Create Assignment
              </button>
              <button
                onClick={handleGenerateAssignment}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                <Sparkles size={18} className="mr-2" />
                Generate with AI
              </button>
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Plus size={24} className="text-white" />
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
                  {assignments.reduce((sum, assignment) => sum + assignment.sharedWith, 0)}
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

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{assignment.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  assignment.status === 'published' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {assignment.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar size={16} className="mr-2" />
                  <span>Due: {assignment.dueDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Plus size={16} className="mr-2" />
                  <span>{assignment.totalQuestions} questions</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Users size={16} className="mr-2" />
                  <span>{assignment.sharedWith} students</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleShareAssignment(assignment)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  <Share2 size={16} className="mr-1" />
                  Share
                </button>
                <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">
                  <Edit size={16} className="mr-1" />
                  Edit
                </button>
                <button className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {assignments.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus size={40} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Assignments Yet</h3>
            <p className="text-gray-400 mb-8">Create your first assignment to get started</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreateAssignment}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
              >
                <Plus size={18} className="mr-2" />
                Create Assignment
              </button>
              <button
                onClick={handleGenerateAssignment}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                <Sparkles size={18} className="mr-2" />
                Generate with AI
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Assignment Sharing Modal */}
      {sharingModalOpen && (
        <AssignmentSharingModal
          assignment={selectedAssignment}
          onClose={() => setSharingModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MyAssignments;

