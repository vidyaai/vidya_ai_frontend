// src/components/Courses/VideoPlayerContent.jsx
// Dedicated video player page component with course sidebar navigation
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  FileText,
  BookOpen,
  Info,
  Video,
  GraduationCap,
  Users,
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import { courseApi } from './courseApi';

const PROFESSOR_SECTIONS = [
  { key: 'overview', label: 'Course Overview', icon: Info },
  { key: 'students', label: 'Enrolled Students', icon: Users },
  { key: 'lecture-notes', label: 'Lecture Notes', icon: FileText },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'assignments', label: 'Assignments', icon: BookOpen },
  { key: 'tas', label: 'Teaching Assistants', icon: GraduationCap },
];

const STUDENT_SECTIONS = [
  { key: 'overview', label: 'Course Overview', icon: Info },
  { key: 'lecture-notes', label: 'Lecture Notes', icon: FileText },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'assignments', label: 'Assignments', icon: BookOpen },
  { key: 'tas', label: 'Teaching Assistants', icon: GraduationCap },
];

const VideoPlayerContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const materialId = searchParams.get('materialId');
  const role = searchParams.get('role') || 'student';
  const videoTitle = searchParams.get('title') || '';

  const [course, setCourse] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SECTIONS = role === 'professor' ? PROFESSOR_SECTIONS : STUDENT_SECTIONS;

  useEffect(() => {
    if (courseId && materialId) {
      loadData();
    }
  }, [courseId, materialId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseData, downloadData] = await Promise.all([
        courseApi.getCourse(courseId),
        courseApi.downloadMaterial(courseId, materialId),
      ]);
      setCourse(courseData);
      setVideoUrl(downloadData.download_url);
    } catch (err) {
      setError('Failed to load video.');
    } finally {
      setLoading(false);
    }
  };

  const getBackUrl = () => {
    const view = role === 'professor' ? 'my-assignments' : 'assigned-to-me';
    return `/assignments?view=${view}&courseId=${courseId}&section=videos`;
  };

  const handleBack = () => {
    router.push(getBackUrl());
  };

  const handleSidebarClick = (sectionKey) => {
    const view = role === 'professor' ? 'my-assignments' : 'assigned-to-me';
    router.push(`/assignments?view=${view}&courseId=${courseId}&section=${sectionKey}`);
  };

  const handleNavigateToHome = () => {
    router.push('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || 'Video not found.'}</p>
        <button onClick={handleBack} className="text-teal-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <TopBar onNavigateToHome={handleNavigateToHome} />

      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center space-x-4">
            <button onClick={handleBack} className="p-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {decodeURIComponent(videoTitle) || 'Video Player'}
              </h1>
              {course && (
                <p className="text-gray-500 text-sm mt-0.5">
                  {course.course_code ? `${course.course_code} — ` : ''}{course.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BODY: sidebar + video */}
      <div className="flex-1 flex max-w-screen-2xl mx-auto w-full">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-950">
          <nav className="py-4">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = s.key === 'videos';
              return (
                <button
                  key={s.key}
                  onClick={() => handleSidebarClick(s.key)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-800/70 text-teal-400 border-l-2 border-teal-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border-l-2 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT CONTENT AREA - Video Player */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl">
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                controlsList="nodownload"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoPlayerContent;
