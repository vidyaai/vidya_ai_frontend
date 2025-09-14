// src/components/Assignments/AssignmentManager.jsx
import { useState } from 'react';
import { 
  ClipboardList, 
  UserCheck, 
  ArrowRight,
  Plus,
  Sparkles
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import MyAssignments from './MyAssignments';
import AssignedToMe from './AssignedToMe';

const AssignmentManager = ({ onNavigateToHome }) => {
  const [currentView, setCurrentView] = useState('main');

  const handleNavigateToMyAssignments = () => {
    setCurrentView('my-assignments');
  };

  const handleNavigateToAssignedToMe = () => {
    setCurrentView('assigned-to-me');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  if (currentView === 'my-assignments') {
    return <MyAssignments onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

  if (currentView === 'assigned-to-me') {
    return <AssignedToMe onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation */}
      <TopBar onNavigateToHome={onNavigateToHome} />
      
      {/* Page Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">AI Assignment Manager</h1>
            <p className="text-gray-400 mt-2">Create, manage, and share assignments with AI-powered generation</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={40} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Assignment View
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Manage your created assignments or view assignments shared with you. 
            Create new assignments with our AI-powered tools or build them manually.
          </p>
        </div>

        {/* Assignment Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* My Assignments */}
          <div
            onClick={handleNavigateToMyAssignments}
            className="group bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 cursor-pointer"
          >
            <div className="flex-1">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Plus size={32} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                My Assignments
              </h3>
              
              <p className="text-gray-400 leading-relaxed mb-6">
                Create and manage your assignments. Use the Assignment Builder for manual creation 
                or AI Assignment Generator for automated content creation from videos, PDFs, or prompts.
              </p>
              
              <div className="flex items-center text-teal-400 font-medium">
                <span>Manage Assignments</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Assigned to Me */}
          <div
            onClick={handleNavigateToAssignedToMe}
            className="group bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
          >
            <div className="flex-1">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCheck size={32} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                Assigned to Me
              </h3>
              
              <p className="text-gray-400 leading-relaxed mb-6">
                View and complete assignments shared with you. See due dates, draft status, 
                and completed assignments. Answer questions in-app or upload PDF responses.
              </p>
              
              <div className="flex items-center text-blue-400 font-medium">
                <span>View Assignments</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNavigateToMyAssignments}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              Create New Assignment
            </button>
            <button
              onClick={handleNavigateToAssignedToMe}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <UserCheck size={20} className="mr-2" />
              View My Assignments
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentManager;

