// src/components/Courses/VideoPlayerContent.jsx
// Full-page viewer for a course-video CourseMaterial. PlayerComponent
// (uploaded MP4) sits on the left, MaterialChatBox on the right; chat
// timestamps are clickable and seek the player via window.playerSeekTo.
// No course sidebar — the side-by-side layout owns the page below the
// global TopBar.
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TopBar from '../generic/TopBar';
import { courseApi } from './courseApi';
import PlayerComponent from '../Chat/PlayerComponent';
import MaterialChatBox from './MaterialChatBox';

const VideoPlayerContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const materialId = searchParams.get('materialId');
  const role = searchParams.get('role') || 'student';
  const videoTitle = searchParams.get('title') || '';

  const [course, setCourse] = useState(null);
  const [material, setMaterial] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId && materialId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, materialId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseData, downloadData, videoList] = await Promise.all([
        courseApi.getCourse(courseId),
        courseApi.downloadMaterial(courseId, materialId),
        courseApi.listVideos(courseId),
      ]);
      setCourse(courseData);
      setVideoUrl(downloadData.download_url);
      const found = (videoList || []).find((m) => m.id === materialId);
      setMaterial(found || { id: materialId, title: decodeURIComponent(videoTitle), material_type: 'video' });
    } catch (err) {
      setError('Failed to load video.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const view = role === 'professor' ? 'my-assignments' : 'assigned-to-me';
    router.push(`/assignments?view=${view}&courseId=${courseId}&section=videos`);
  };

  const handleNavigateToHome = () => {
    router.push('/home');
  };

  const handleSeekToTime = (seconds) => {
    if (typeof window !== 'undefined' && typeof window.playerSeekTo === 'function') {
      window.playerSeekTo(seconds);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <svg className="animate-spin" width="80" height="80" viewBox="0 0 80 80">
          <defs>
            <mask id="crescent-mask-video-player">
              <circle cx="40" cy="40" r="36" fill="white" />
              <circle cx="43" cy="40" r="37" fill="black" />
            </mask>
          </defs>
          <circle cx="40" cy="40" r="36" fill="white" mask="url(#crescent-mask-video-player)" />
        </svg>
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

  const currentVideo = {
    videoId: material?.id || materialId,
    sourceType: 'uploaded',
    videoUrl,
    title: decodeURIComponent(videoTitle) || material?.title || 'Video',
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <TopBar onNavigateToHome={handleNavigateToHome} />

      {/* HEADER — back + title */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-white truncate">
                {decodeURIComponent(videoTitle) || material?.title || 'Video'}
              </h1>
              {course && (
                <p className="text-gray-500 text-xs md:text-sm mt-0.5 truncate">
                  {course.course_code ? `${course.course_code} — ` : ''}{course.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BODY: player + chat side by side */}
      <div className="flex-1 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 md:gap-6 h-[calc(100vh-200px)] min-h-[640px]">
          {/* Video player */}
          <div className="bg-black border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <PlayerComponent
              currentVideo={currentVideo}
              onTimeUpdate={(s) => setCurrentTime(s)}
            />
          </div>

          {/* Chat */}
          <div className="min-h-0">
            <MaterialChatBox
              material={material}
              onSeekToTime={handleSeekToTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerContent;
