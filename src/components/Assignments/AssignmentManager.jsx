// src/components/Assignments/AssignmentManager.jsx
import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  UserCheck, 
  ArrowRight,
  Plus,
  Sparkles,
  GraduationCap,
  BookOpen,
  PenTool,
  Send
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import MyAssignments from './MyAssignments';
import AssignedToMe from './AssignedToMe';

const AssignmentManager = ({ onNavigateToHome }) => {
  const [currentView, setCurrentView] = useState('main');
  const [initialCourseId, setInitialCourseId] = useState(null);
  const [initialSection, setInitialSection] = useState(null);

  // Handle URL query parameter for direct navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      const courseId = urlParams.get('courseId');
      const section = urlParams.get('section');
      if (view === 'assigned-to-me') {
        setCurrentView('assigned-to-me');
        if (courseId) setInitialCourseId(courseId);
        if (section) setInitialSection(section);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (view === 'my-assignments') {
        setCurrentView('my-assignments');
        if (courseId) setInitialCourseId(courseId);
        if (section) setInitialSection(section);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleNavigateToMyAssignments = () => {
    setInitialSection(null);
    setInitialCourseId(null);
    setCurrentView('my-assignments');
  };

  const handleNavigateToAssignedToMe = () => {
    setInitialSection(null);
    setInitialCourseId(null);
    setCurrentView('assigned-to-me');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  if (currentView === 'my-assignments') {
    return <MyAssignments onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} initialCourseId={initialCourseId} initialSection={initialSection} />;
  }

  if (currentView === 'assigned-to-me') {
    return <AssignedToMe onBack={handleBackToMain} onNavigateToHome={onNavigateToHome} initialCourseId={initialCourseId} initialSection={initialSection} />;
  }

  return (
    <div className="min-h-screen bg-[#071224]">
      {/* Top Navigation */}
      <TopBar onNavigateToHome={onNavigateToHome} />
      
      {/* Page Header */}
      <div className="bg-[#0d1f38] border-b border-[#182842]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white">AI Assignment Manager</h1>
            <p className="text-slate-400 mt-3 text-lg">Choose how you'd like to use assignments</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-16">
        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Instructor Card */}
          <div
            onClick={handleNavigateToMyAssignments}
            className="group relative bg-[#0d1f38] rounded-2xl border border-[#182842] hover:border-teal-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 cursor-pointer overflow-hidden"
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="p-8 pt-9">
              {/* Role badge */}
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
                <GraduationCap size={14} className="text-teal-400 mr-1.5" />
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wide">For Instructors</span>
              </div>
              
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-teal-500/20">
                <PenTool size={26} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                Create & Manage Assignments
              </h3>
              
              <p className="text-slate-400 leading-relaxed mb-6 text-[15px]">
                Build assignments manually or generate them with AI from videos, PDFs, or custom prompts. 
                Share with students, review submissions, and grade — all in one place.
              </p>
              
              <div className="flex items-center text-teal-400 font-medium group-hover:translate-x-1 transition-transform duration-300">
                <span>Get Started</span>
                <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </div>

          {/* Student Card */}
          <div
            onClick={handleNavigateToAssignedToMe}
            className="group relative bg-[#0d1f38] rounded-2xl border border-[#182842] hover:border-[#43ead6]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer overflow-hidden"
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#43ead6]/40 to-[#43ead6]/20 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="p-8 pt-9">
              {/* Role badge */}
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#43ead6]/10 border border-[#43ead6]/20 mb-6">
                <BookOpen size={14} className="text-[#43ead6] mr-1.5" />
                <span className="text-xs font-semibold text-[#43ead6] uppercase tracking-wide">For Students</span>
              </div>
              
              <div className="w-14 h-14 bg-gradient-to-br from-[#43ead6]/40 to-[#43ead6]/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#43ead6]/10">
                <Send size={26} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                Submit & View Assignments
              </h3>
              
              <p className="text-slate-400 leading-relaxed mb-6 text-[15px]">
                Access assignments shared with you, complete them in-app or upload your work. 
                Track due dates, check your submission status, and view grades and feedback.
              </p>
              
              <div className="flex items-center text-[#43ead6] font-medium group-hover:translate-x-1 transition-transform duration-300">
                <span>View Assignments</span>
                <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentManager;

