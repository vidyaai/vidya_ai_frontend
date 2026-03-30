import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const USER_TYPE_OPTIONS = [
  {
    type: 'professor',
    icon: GraduationCap,
    label: "I'm a Professor",
    description:
      'Create and manage assignments, share video content with students, and track submissions.',
    gradient: 'from-indigo-500 to-purple-500',
    hoverBorder: 'hover:border-indigo-500',
  },
  {
    type: 'student',
    icon: BookOpen,
    label: "I'm a Student",
    description:
      'Submit assignments, chat with videos to deepen understanding, and track your progress.',
    gradient: 'from-teal-500 to-cyan-500',
    hoverBorder: 'hover:border-teal-500',
  },
];

export default function SetUserTypePage() {
  const router = useRouter();
  const { updateUserType } = useAuth();
  const [selecting, setSelecting] = useState(null);

  const handleSelect = async (type) => {
    if (selecting) return;
    setSelecting(type);
    try {
      await updateUserType(type);
      router.push('/home');
    } catch (error) {
      console.error('Failed to set user type:', error);
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {selecting && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm tracking-wide">Setting up your account...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Welcome to VidyaAI</h1>
          <p className="text-gray-400 text-lg">Tell us how you'll be using the platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {USER_TYPE_OPTIONS.map(({ type, icon: Icon, label, description, gradient, hoverBorder }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              disabled={!!selecting}
              className={`group bg-gray-900 rounded-2xl p-8 border border-gray-800 ${hoverBorder} transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{label}</h2>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
