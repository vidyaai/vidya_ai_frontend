// ImprovedYoutubePlayer.jsx - Main component with Quiz integration (STABLE FIX)
import { useState, useRef, useEffect, useCallback } from 'react';
import { Youtube, Menu, Home, MessageSquare, Globe, Upload } from 'lucide-react';
import YoutubeDownloader from './YoutubeDownloader';
import PlayerComponent from './PlayerComponent';
import TranscriptComponent from './TranscriptComponent';
import ChatBoxComponent from './ChatBoxComponent';
import QuizPanel from './QuizPanel';
import { API_URL, saveToLocalStorage, loadFromLocalStorage, SimpleSpinner, api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import VideoUploader from './VideoUploader.jsx';

const ImprovedYoutubePlayer = ({ onNavigateToTranslate, onNavigateToHome, selectedVideo }) => {
  const { currentUser } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(() => {
    return loadFromLocalStorage('currentVideo', { title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' });
  });
  const [transcript, setTranscript] = useState(() => {
    return loadFromLocalStorage('transcript', '');
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => {
    return loadFromLocalStorage('chatMessages', []);
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState(null);
  
  // Quiz state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);
  const [isUploadCompleting, setIsUploadCompleting] = useState(false);
  const [showVideoUploader, setShowVideoUploader] = useState(true);
  
  const menuRef = useRef(null);
  const lastSelectedRef = useRef(null);
  const isLoadingRef = useRef(false); // Prevent multiple concurrent loads

  // Ensure we always use an absolute URL for uploaded videos
  const buildAbsoluteVideoUrl = useCallback((maybeUrl) => {
    if (!maybeUrl) return '';
    try {
      // Absolute URL already
      const u = new URL(maybeUrl);
      return u.href;
    } catch (_e) {
      // Not a full URL; prefix with API base
      return `${API_URL}${maybeUrl.startsWith('/') ? '' : '/'}${maybeUrl}`;
    }
  }, []);

  // Simplified selected video handling
  useEffect(() => {
    if (selectedVideo?.videoId && selectedVideo !== lastSelectedRef.current && !isUploadCompleting && !isLoadingRef.current) {
      console.log("Selected video changed, loading:", selectedVideo.videoId);
      lastSelectedRef.current = selectedVideo;
      loadSelectedVideo(selectedVideo);
    }
  }, [selectedVideo, isUploadCompleting]);

  const loadSelectedVideo = async (videoData) => {
    console.log("loadSelectedVideo called with:", videoData);
    if (!videoData?.videoId || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage('');
    setShowVideoUploader(true);

    try {
      if (videoData.sourceType === 'youtube') {
        const response = await api.post(`/api/youtube/info`, {
          url: `https://www.youtube.com/watch?v=${videoData.videoId}`
        }, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        });

        setTranscript(response.data.transcript || "No transcript available for this video.");
        setCurrentVideo({
          title: response.data.title || videoData.title || "YouTube Video",
          source: videoData.source,
          videoId: videoData.videoId,
          sourceType: 'youtube',
          videoUrl: '',
          loadTimestamp: Date.now()
        });
      } else {
        // For uploaded videos
        const response = await api.get(`/api/user-videos/info`, {
          params: { video_id: videoData.videoId },
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        if (response.data) {
          setTranscript(response.data.transcript || '');
          setCurrentVideo({
            title: response.data.title || videoData.title || 'Uploaded Video',
            videoId: videoData.videoId,
            source: '',
            sourceType: 'uploaded',
            videoUrl: buildAbsoluteVideoUrl(response.data.video_url),
            loadTimestamp: Date.now()
          });
        } else {
          throw new Error('No video data received from API');
        }
      }

      // Update URL
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('v', videoData.videoId);
      window.history.replaceState({}, '', newUrl);

      // Reset chat/quiz state
      setChatMessages([]);
      setIsQuizOpen(false);
      setSystemMessages([]);

    } catch (error) {
      console.error("Error loading selected video:", error);
      setErrorMessage(error.response?.data?.detail || error.message || "Failed to load video");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl.trim() || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage('');
    setShowVideoUploader(true);
    
    try {
      let videoId = '';
      
      if (youtubeUrl.includes('youtube.com/watch?v=')) {
        const urlParams = new URLSearchParams(new URL(youtubeUrl).search);
        videoId = urlParams.get('v');
      } else if (youtubeUrl.includes('youtu.be/')) {
        videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
      } else {
        throw new Error("Invalid YouTube URL format");
      }
      
      if (!videoId) {
        throw new Error("Could not extract video ID from URL");
      }
      
      if (currentVideo.videoId === videoId && currentVideo.sourceType === 'youtube') {
        console.log("Same YouTube video already loaded");
        return;
      }
      
      const response = await api.post(`/api/youtube/info`, {
        url: youtubeUrl
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      setTranscript(response.data.transcript || "No transcript available for this video.");
      
      setCurrentVideo({
        title: response.data.title || "YouTube Video", 
        source: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=https://vidyaai.co&controls=0`,
        videoId: videoId,
        sourceType: 'youtube',
        videoUrl: '',
        loadTimestamp: Date.now()
      });

      const newUrl = new URL(window.location);
      newUrl.searchParams.set('v', videoId);
      window.history.replaceState({}, '', newUrl);
      
      setChatMessages([]);
      setIsQuizOpen(false);
      setSystemMessages([]);
      
    } catch (error) {
      console.error("Error loading video:", error);
      setErrorMessage(error.message || "Failed to load video");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleUploadComplete = useCallback(async (videoId) => {
    console.log("Upload completion started for video ID:", videoId);
    if (isLoadingRef.current) {
      console.log("Already loading, skipping upload complete");
      return;
    }

    isLoadingRef.current = true;
    setIsUploadCompleting(true);
    setYoutubeUrl('');
    setErrorMessage('');
    
    try {
      const response = await api.get(`/api/user-videos/info`, {
        params: { video_id: videoId },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      if (response.data) {
        console.log("Upload completion: Setting video data for ID:", videoId);
        
        setTranscript(response.data.transcript || '');
        
        const newVideoObject = {
          title: response.data.title || 'Uploaded Video',
          videoId: videoId,
          source: '',
          sourceType: 'uploaded',
          videoUrl: buildAbsoluteVideoUrl(response.data.video_url),
          loadTimestamp: Date.now()
        };
        
        console.log("Setting new uploaded video object:", newVideoObject);
        setCurrentVideo(newVideoObject);
        
        // Update URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('v', videoId);
        window.history.replaceState({}, '', newUrl);

        // Reset state
        setChatMessages([]);
        setIsQuizOpen(false);
        setSystemMessages([]);

        // Update refs to prevent conflicts
        lastSelectedRef.current = { videoId, sourceType: 'uploaded' };
      }
    } catch (e) {
      console.warn('Failed to fetch uploaded video info', e);
      setErrorMessage('Upload completed but failed to load video details');
    } finally {
      console.log("Upload completion finished for video ID:", videoId);
      setIsUploadCompleting(false);
      isLoadingRef.current = false;
    }
  }, [buildAbsoluteVideoUrl]);

  const handleUploadSuccess = useCallback(() => {
    console.log("Upload successful, hiding VideoUploader");
    setShowVideoUploader(false);
  }, []);

  const handlePlayerReady = (playerInstance) => {
    setPlayer(playerInstance);
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleSeekToTime = (timeInSeconds) => {
    if (window.playerSeekTo) {
      window.playerSeekTo(timeInSeconds);
    }
  };

  const handleQuizSystemMessage = (message) => {
    setSystemMessages(prev => [...prev, message]);
  };

  const handleStartQuiz = () => {
    if (!currentVideo.videoId) {
      handleQuizSystemMessage({
        id: Date.now(),
        sender: 'system',
        text: 'Please load a video first to start the quiz.',
        isError: true
      });
      return;
    }
    setIsQuizOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Save to localStorage when state changes (but not loadTimestamp)
  useEffect(() => {
    if (currentVideo.videoId) {
      const videoToSave = { ...currentVideo };
      delete videoToSave.loadTimestamp; // Don't persist timestamp
      saveToLocalStorage('currentVideo', videoToSave);
    }
  }, [currentVideo]);

  useEffect(() => {
    if (transcript) {
      saveToLocalStorage('transcript', transcript);
    }
  }, [transcript]);

  useEffect(() => {
    saveToLocalStorage('chatMessages', chatMessages);
  }, [chatMessages]);

  // Handle URL parameters - only on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoIdFromUrl = urlParams.get('v');
    
    if (videoIdFromUrl && !currentVideo.videoId && !youtubeUrl && !selectedVideo && !isLoadingRef.current) {
      setYoutubeUrl(`https://www.youtube.com/watch?v=${videoIdFromUrl}`);
    }
  }, []);
  
  return (
    <div className="w-full">
      {selectedVideo && (
        <div className="mb-4">
          <p className="text-sm text-indigo-400">
            Video loaded from gallery: {selectedVideo.title}
          </p>
        </div>
      )}
      
      <form onSubmit={handleYoutubeSubmit} className="mb-8">
        <div className="relative flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Youtube size={18} className="text-red-500" />
            </div>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 shadow-lg"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <SimpleSpinner size={20} className="mr-2" />
                <span>Loading...</span>
              </>
            ) : (
              'Load Video'
            )}
          </button>
          {showVideoUploader ? (
            <div className="relative">
              <VideoUploader 
                onUploadComplete={handleUploadComplete} 
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowVideoUploader(true)}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg flex items-center justify-center"
              title="Upload another video"
              disabled={isLoading}
            >
              <Upload size={20} className="mr-2" />
              <span>Upload Another Video</span>
            </button>
          )}
        </div>
        {errorMessage && (
          <div className="mt-3 text-red-400 text-sm bg-red-900 bg-opacity-30 p-3 rounded-lg">
            ⚠️ {errorMessage}
          </div>
        )}
      </form>
      
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
        {currentVideo.title || "Enter a YouTube URL to get started"}
      </h2>
      
      {currentVideo.videoId && currentVideo.sourceType === 'youtube' && (
        <YoutubeDownloader
          videoId={currentVideo.videoId}
          videoTitle={currentVideo.title}
        />
      )}
      
      <div className="flex flex-col xl:flex-row gap-8 mt-6 w-full">
        <div className="w-full xl:w-3/5">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10 rounded-2xl">
              <div className="flex flex-col items-center">
                <SimpleSpinner size={48} className="mb-4" />
                <p className="text-white text-lg">Loading video...</p>
              </div>
            </div>
          )}
          
          <PlayerComponent
            currentVideo={currentVideo}
            onPlayerReady={handlePlayerReady}
            onTimeUpdate={handleTimeUpdate}
            seekToTime={handleSeekToTime}
          />
          
          {/* Transcript and Quiz Container */}
          <div className="mt-6 space-y-4">
            {/* Quiz Start Button */}
            {currentVideo.videoId && !isQuizOpen && (
              <div className="flex justify-center">
                <button
                  onClick={handleStartQuiz}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg font-semibold"
                >
                  Start Quiz
                </button>
              </div>
            )}
            
            {/* Quiz Panel */}
            <QuizPanel
              isOpen={isQuizOpen}
              videoId={currentVideo.videoId}
              onClose={() => setIsQuizOpen(false)}
              onSystemMessage={handleQuizSystemMessage}
            />
            
            {/* Transcript Component */}
            <TranscriptComponent
              currentVideo={currentVideo}
              transcript={transcript}
              onSeekToTime={handleSeekToTime}
            />
          </div>
        </div>
        
        <div className="w-full xl:w-2/5">
          <ChatBoxComponent
            currentVideo={currentVideo}
            currentTime={currentTime}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            onSeekToTime={handleSeekToTime}
          />
        </div>
      </div>
    </div>
  );
};

export default ImprovedYoutubePlayer;