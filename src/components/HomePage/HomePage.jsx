// src/components/HomePage/HomePage.jsx
import { useState, useEffect } from 'react';
import { MessageSquare, Video, Award, BookOpen, Lightbulb, ArrowRight, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../generic/TopBar';

const HomePage = ({ onNavigateToChat, onNavigateToGallery, onNavigateToAssignments, onNavigateToPricing }) => {
  const { currentUser, userType } = useAuth();
  const [navigatingTo, setNavigatingTo] = useState(null);

  useEffect(() => {
    if (!navigatingTo) return;
    if (navigatingTo === 'chat') onNavigateToChat(null);
    else if (navigatingTo === 'assignments') onNavigateToAssignments();
    else if (navigatingTo === 'assignments:ai-generator') onNavigateToAssignments('ai-generator');
    else if (navigatingTo === 'pricing') onNavigateToPricing();
    else if (navigatingTo === 'gallery') onNavigateToGallery();
  }, [navigatingTo]);

  const assignmentFeature = userType === 'student'
    ? {
        icon: ClipboardList,
        title: 'Submit & View Assignments',
        description: 'Access assignments shared with you, submit your work, track due dates, and view grades and feedback from your professor.',
        action: 'View Assignments',
        onClick: () => setNavigatingTo('assignments'),
      }
    : {
        icon: ClipboardList,
        title: 'Create & Manage Assignments',
        description: 'Create assignments manually or with AI-powered generation. Share with students, review submissions, and provide grades and feedback.',
        action: 'Manage Assignments',
        onClick: () => setNavigatingTo('assignments'),
      };

  const features = [
    {
      icon: MessageSquare,
      title: 'Chat with Videos',
      description: 'Upload YouTube videos and have intelligent conversations about the content. Ask questions, get summaries, and understand complex topics better.',
      action: 'Start Video Chat',
      onClick: () => setNavigatingTo('chat'),
    },
    assignmentFeature,
  ];

  return (
    <div className="min-h-screen bg-[#071224]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(67,234,214,0.10),transparent_45%)]" />
      <div className="pointer-events-none fixed right-[-10rem] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-[#43ead6]/5 blur-3xl" />

      {/* Page transition overlay */}
      {navigatingTo && (
        <div className="fixed inset-0 z-50 bg-[#071224] flex items-center justify-center">
          <svg className="animate-spin" width="80" height="80" viewBox="0 0 80 80">
            <defs>
              <mask id="crescent-mask-home">
                <circle cx="40" cy="40" r="36" fill="white" />
                <circle cx="43" cy="40" r="37" fill="black" />
              </mask>
            </defs>
            <circle cx="40" cy="40" r="36" fill="#43ead6" mask="url(#crescent-mask-home)" />
          </svg>
        </div>
      )}

      <TopBar />

      <main className="relative mx-auto max-w-6xl px-5 sm:px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6] mb-4">
            Your AI Learning Hub
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
            Welcome back{currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''}
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Unlock the power of AI-driven education. Chat with videos, solve doubts instantly,
            and manage assignments with ease.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group rounded-[28px] border border-[#182842] bg-white/[0.04] p-8 shadow-[0_16px_40px_rgba(0,0,0,0.18)] flex flex-col h-full hover:border-[#43ead6]/30 transition-colors duration-300"
              >
                <div className="flex-1">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#43ead6]/12 text-[#43ead6] group-hover:bg-[#43ead6]/20 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-300">{feature.description}</p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={feature.onClick}
                    className="inline-flex items-center gap-2 rounded-full bg-[#43ead6] px-5 py-2.5 text-sm font-medium text-[#051224] hover:bg-[#43ead6]/90 transition"
                  >
                    {feature.action}
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="rounded-[28px] border border-[#182842] bg-white/[0.04] p-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Video, value: '1,000+', label: 'Videos Analyzed' },
              { icon: Lightbulb, value: '5,000+', label: 'Doubts Solved' },
              { icon: BookOpen, value: '10,000+', label: 'Quiz Questions' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#43ead6]/12 flex items-center justify-center mx-auto mb-4 text-[#43ead6]">
                  <Icon size={26} />
                </div>
                <h3 className="text-3xl font-semibold text-white mb-1">{value}</h3>
                <p className="text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-white mb-8">Ready to start?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <button
              onClick={() => setNavigatingTo('chat')}
              className="inline-flex items-center gap-2 rounded-full bg-[#43ead6] px-6 py-3 text-sm font-medium text-[#051224] hover:bg-[#43ead6]/90 transition"
            >
              <MessageSquare size={17} />
              Chat with a Video
            </button>
            <button
              onClick={() => setNavigatingTo(userType === 'student' ? 'assignments' : 'assignments:ai-generator')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              <ClipboardList size={17} />
              {userType === 'student' ? 'View Assignments' : 'Generate Assignment'}
            </button>
            <button
              onClick={() => setNavigatingTo('pricing')}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              <Award size={17} />
              View Pricing
            </button>
          </div>
        </div>
      </main>

      <footer className="relative border-t border-[#12213a] mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-8 text-center text-slate-400 text-sm">
          <p>© 2024 VidyaAI. Empowering education through artificial intelligence.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
