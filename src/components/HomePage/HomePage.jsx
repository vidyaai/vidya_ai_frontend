// src/components/HomePage/HomePage.jsx
import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Globe,
  Video,
  Award,
  BookOpen,
  Lightbulb,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../generic/TopBar';

const HomePage = ({ onNavigateToChat, onNavigateToTranslate, onNavigateToGallery, onNavigateToAssignments, onNavigateToPricing }) => {
  const { currentUser, userType } = useAuth();
  const [navigatingTo, setNavigatingTo] = useState(null);

  // Fire navigation AFTER React has committed the overlay to the DOM.
  // useEffect always runs after the browser has painted, so the loader
  // is guaranteed to be visible before the page switch happens.
  useEffect(() => {
    if (!navigatingTo) return;
    if (navigatingTo === 'chat') onNavigateToChat(null);
    else if (navigatingTo === 'assignments') onNavigateToAssignments();
    else if (navigatingTo === 'assignments:ai-generator') onNavigateToAssignments('ai-generator');
    else if (navigatingTo === 'pricing') onNavigateToPricing();
    else if (navigatingTo === 'gallery') onNavigateToGallery();
    else if (navigatingTo === 'translate') onNavigateToTranslate();
  }, [navigatingTo]);

  const assignmentFeature = userType === 'student'
    ? {
        icon: ClipboardList,
        title: "Submit & View Assignments",
        description: "Access assignments shared with you, submit your work, track due dates, and view grades and feedback from your professor.",
        action: "View Assignments",
        onClick: () => setNavigatingTo('assignments'),
        gradient: "from-teal-500 to-cyan-500"
      }
    : {
        icon: ClipboardList,
        title: "Create & Manage Assignments",
        description: "Create assignments manually or with AI-powered generation. Share with students, review submissions, and provide grades and feedback.",
        action: "Manage Assignments",
        onClick: () => setNavigatingTo('assignments'),
        gradient: "from-teal-500 to-cyan-500"
      };

  const features = [
    {
      icon: MessageSquare,
      title: "Chat with Videos",
      description: "Upload YouTube videos and have intelligent conversations about the content. Ask questions, get summaries, and understand complex topics better.",
      action: "Start Video Chat",
      onClick: () => setNavigatingTo('chat'),
      gradient: "from-blue-500 to-cyan-500"
    },
    assignmentFeature,
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Page transition loader overlay */}
      {navigatingTo && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm tracking-wide">Loading...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <TopBar />

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Your AI Learning Hub
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Unlock the power of AI-driven education. Chat with videos, solve doubts instantly, 
            take adaptive quizzes, and translate content seamlessly.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full"
              >
                <div className="flex-1">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={feature.onClick}
                    className={`group/btn inline-flex items-center px-6 py-3 bg-gradient-to-r ${feature.gradient} text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105`}
                  >
                    {feature.action}
                    <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video size={32} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">1000+</h3>
              <p className="text-gray-400">Videos Analyzed</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb size={32} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">5000+</h3>
              <p className="text-gray-400">Doubts Solved</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">10000+</h3>
              <p className="text-gray-400">Quiz Questions</p>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mt-16 text-center">
          <h3 className="text-3xl font-bold text-white mb-8">Ready to Start Learning?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setNavigatingTo('chat')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <MessageSquare size={20} className="mr-2" />
              Chat with a Video
            </button>
            {userType === 'student' ? (
              <button
                onClick={() => setNavigatingTo('assignments')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <ClipboardList size={20} className="mr-2" />
                View Assignments
              </button>
            ) : (
              <button
                onClick={() => setNavigatingTo('assignments:ai-generator')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <ClipboardList size={20} className="mr-2" />
                Generate Assignment
              </button>
            )}
            <button
              onClick={() => setNavigatingTo('pricing')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Award size={20} className="mr-2" />
              View Pricing
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 VidyaAI. Empowering education through artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;