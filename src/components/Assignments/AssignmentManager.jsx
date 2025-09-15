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
            Advanced Engineering Assignment Platform
          </h2>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto">
            Create sophisticated assignments for undergraduate and graduate engineering courses. 
            Support for code problems, circuit diagrams, multi-part questions, mathematical derivations, 
            design challenges, and AI-powered content generation from technical documents.
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
                Create advanced engineering assignments with code problems, circuit analysis, multi-part questions, 
                and design challenges. Use the Assignment Builder for precise manual creation or AI Generator 
                for automated content from technical documents, lecture videos, and engineering specifications.
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
                Complete complex engineering assignments with integrated code editors, diagram viewers, 
                mathematical equation support, and multi-part problem solving. Submit solutions in-app 
                or upload technical drawings, code files, and detailed PDF responses.
              </p>
              
              <div className="flex items-center text-blue-400 font-medium">
                <span>View Assignments</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features Showcase */}
        <div className="mt-16 mb-16">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Advanced Engineering Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-400 text-xl font-mono">{'</>'}</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Code Problems</h4>
              <p className="text-gray-400 text-sm">Programming questions with syntax highlighting, multiple languages, and integrated development environments.</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-400 text-xl">⚡</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Diagram Analysis</h4>
              <p className="text-gray-400 text-sm">Interactive circuit diagrams, technical drawings, and visual problem-solving with image analysis.</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-400 text-xl">📋</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Multi-Part Questions</h4>
              <p className="text-gray-400 text-sm">Complex problems with multiple sub-questions, code components, and diagram integration.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
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

