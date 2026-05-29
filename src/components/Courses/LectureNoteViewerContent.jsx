// src/components/Courses/LectureNoteViewerContent.jsx
// Full-page viewer for a lecture-note CourseMaterial. The PDF renders in
// an <iframe> on the left (relying on the browser's built-in PDF viewer
// with #page=N fragments for jumps); MaterialChatBox sits on the right.
// Citation chips trigger handleJumpToPage, which rewrites the iframe src
// to navigate to the requested page.
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import TopBar from '../generic/TopBar';
import { courseApi } from './courseApi';
import MaterialChatBox from './MaterialChatBox';

const LectureNoteViewerContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const materialId = searchParams.get('materialId');
  const role = searchParams.get('role') || 'student';
  const materialTitle = searchParams.get('title') || '';

  const [course, setCourse] = useState(null);
  const [material, setMaterial] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const iframeRef = useRef(null);

  useEffect(() => {
    if (courseId && materialId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, materialId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseData, downloadData, notesList] = await Promise.all([
        courseApi.getCourse(courseId),
        courseApi.downloadMaterial(courseId, materialId),
        courseApi.listLectureNotes(courseId),
      ]);
      setCourse(courseData);
      setDownloadUrl(downloadData.download_url);
      const found = (notesList || []).find((m) => m.id === materialId);
      setMaterial(found || {
        id: materialId,
        title: decodeURIComponent(materialTitle) || 'Notes',
        material_type: 'lecture_notes',
      });
    } catch (err) {
      setError('Failed to load lecture notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const view = role === 'professor' ? 'my-assignments' : 'assigned-to-me';
    router.push(`/assignments?view=${view}&courseId=${courseId}&section=lecture-notes`);
  };

  const handleNavigateToHome = () => {
    router.push('/home');
  };

  const handleJumpToPage = (pageNumber) => {
    if (!iframeRef.current || !downloadUrl || !pageNumber) return;
    // Strip any existing fragment then add #page=N. Browsers' built-in
    // PDF viewers (Chrome/Edge/Firefox/Safari) respond to this without
    // a full reload most of the time.
    const base = downloadUrl.split('#')[0];
    iframeRef.current.src = `${base}#page=${pageNumber}&toolbar=1&view=FitH`;
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <svg className="animate-spin" width="80" height="80" viewBox="0 0 80 80">
          <defs>
            <mask id="crescent-mask-pdf-viewer">
              <circle cx="40" cy="40" r="36" fill="white" />
              <circle cx="43" cy="40" r="37" fill="black" />
            </mask>
          </defs>
          <circle cx="40" cy="40" r="36" fill="white" mask="url(#crescent-mask-pdf-viewer)" />
        </svg>
      </div>
    );
  }

  if (error || !downloadUrl) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || 'Notes not found.'}</p>
        <button onClick={handleBack} className="text-teal-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <TopBar onNavigateToHome={handleNavigateToHome} />

      {/* HEADER */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800 flex-shrink-0"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-white truncate">
                  {material?.title || decodeURIComponent(materialTitle) || 'Lecture Notes'}
                </h1>
                {course && (
                  <p className="text-gray-500 text-xs md:text-sm mt-0.5 truncate">
                    {course.course_code ? `${course.course_code} — ` : ''}{course.title}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                         border border-gray-700 text-gray-300 hover:border-teal-500/50
                         hover:text-teal-300 text-xs transition-colors flex-shrink-0"
              title="Download PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* BODY: PDF + chat side by side */}
      <div className="flex-1 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 md:gap-6 h-[calc(100vh-200px)] min-h-[640px]">
          {/* PDF viewer */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <iframe
              ref={iframeRef}
              src={`${downloadUrl}#page=1&toolbar=1&view=FitH`}
              className="w-full h-full"
              title={material?.title || 'Lecture Notes'}
            />
          </div>

          {/* Chat */}
          <div className="min-h-0">
            <MaterialChatBox
              material={material}
              onJumpToPage={handleJumpToPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureNoteViewerContent;
