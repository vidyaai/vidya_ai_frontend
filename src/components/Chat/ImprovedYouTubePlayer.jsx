// ImprovedYoutubePlayer.jsx - Main component with Quiz integration (STABLE FIX)
import { useState, useRef, useEffect, useCallback } from 'react';
import { Youtube, Upload } from 'lucide-react';
import YoutubeDownloader from './YoutubeDownloader';
import PlayerComponent from './PlayerComponent';
import TranscriptComponent from './TranscriptComponent';
import ChatBoxComponent from './ChatBoxComponent';
import QuizPanel from './QuizPanel';
import { API_URL, saveToLocalStorage, loadFromLocalStorage, SimpleSpinner, api } from '../generic/utils.jsx';
import VideoUploader from './VideoUploader.jsx';

const ImprovedYoutubePlayer = ({ selectedVideo }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(() => {
    // Only load from localStorage if there's a video ID in the URL (page refresh scenario)
    // Otherwise start with empty state to prevent stale videos from appearing
    const urlParams = new URLSearchParams(window.location.search);
    const hasVideoIdInUrl = urlParams.get('v');
    
    if (hasVideoIdInUrl) {
      return loadFromLocalStorage('currentVideo', { title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' });
    }
    return { title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' };
  });
  const [transcript, setTranscript] = useState(() => {
    // Only load transcript if there's a video ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasVideoIdInUrl = urlParams.get('v');
    return hasVideoIdInUrl ? loadFromLocalStorage('transcript', '') : '';
  });
  const [chatMessages, setChatMessages] = useState(() => {
    // Only load chat messages if there's a video ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasVideoIdInUrl = urlParams.get('v');
    return hasVideoIdInUrl ? loadFromLocalStorage('chatMessages', []) : [];
  });
  // Per-video chat sessions
  const [chatSessionsByVideo, setChatSessionsByVideo] = useState(() => {
    return loadFromLocalStorage('chatSessionsByVideo', {});
  });
  const [activeSessionId, setActiveSessionId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Quiz state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
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
    if (!isUploadCompleting) {
      if (selectedVideo && selectedVideo.videoId) {
        if (selectedVideo !== lastSelectedRef.current && !isLoadingRef.current) {
          console.log("Selected video changed, loading:", selectedVideo.videoId);
          lastSelectedRef.current = selectedVideo;
          loadSelectedVideo(selectedVideo);
        }
      } else if (selectedVideo === null) {
        // Clear state when explicitly navigating without a video (from PageHeader/HomePage)
        // Only clear if we're not just finishing an upload
        if (lastSelectedRef.current?.sourceType !== 'uploaded') {
          lastSelectedRef.current = null;
          clearVideoState();
        }
      }
    }
  }, [selectedVideo, isUploadCompleting]);

  const clearVideoState = () => {
    setCurrentVideo({ title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' });
    setTranscript('');
    setChatMessages([]);
    setIsQuizOpen(false);
    setErrorMessage('');
    setIsLoading(false);
    // Clear localStorage as well so it doesn't persist
    saveToLocalStorage('currentVideo', { title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' });
    saveToLocalStorage('transcript', '');
    saveToLocalStorage('chatMessages', []);
  };

  const loadSelectedVideo = async (videoData) => {
    console.log("loadSelectedVideo called with:", videoData);
    if (!videoData || !videoData.videoId) {
      setErrorMessage("Invalid video data provided");
      return;
    }

    // Prevent loading if we're in the middle of an upload completion
    if (isUploadCompleting || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage('');
    setShowVideoUploader(true);

    try {
      // Determine if we need to detect the source type
      const needsDetection = !videoData.sourceType || videoData.sourceType === undefined;
      
      // Try YouTube first if sourceType is 'youtube' or needs detection
      if (videoData.sourceType === 'youtube' || needsDetection) {
        try {
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
            source: videoData.source || `https://www.youtube.com/embed/${videoData.videoId}?enablejsapi=1&origin=${window.location.origin}&controls=0`,
            videoId: videoData.videoId,
            sourceType: 'youtube',
            videoUrl: '',
            isShared: videoData.isShared || false,
            shareToken: videoData.shareToken || null,
            shareId: videoData.shareId || null,
            loadTimestamp: Date.now()
          });

          // Update URL
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('v', videoData.videoId);
          window.history.replaceState({}, '', newUrl);

          // Reset chat/quiz state
          setChatMessages([]);
          setIsQuizOpen(false);
          
          return; // Successfully loaded as YouTube video
        } catch (youtubeError) {
          console.log("YouTube API failed:", youtubeError);
          
          // If sourceType was explicitly 'youtube', don't try uploaded
          if (videoData.sourceType === 'youtube') {
            throw youtubeError;
          }
          
          // Otherwise, fall through to try uploaded video API
          console.log("Trying uploaded video API as fallback...");
        }
      }
      
      // Try uploaded video API (if sourceType is 'uploaded' or YouTube failed)
      const response = await api.get(`/api/user-videos/info`, {
        params: { 
          video_id: videoData.videoId,
          ...(videoData.shareToken && { share_token: videoData.shareToken })
        },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      if (response.data) {
        setTranscript(response.data.transcript || '');
        setCurrentVideo({
          title: response.data.title || videoData.title || 'Uploaded Video',
          videoId: videoData.videoId,
          source: '',
          sourceType: 'uploaded',
          videoUrl: buildAbsoluteVideoUrl(response.data.video_url || videoData.videoUrl),
          isShared: videoData.isShared || false,
          shareToken: videoData.shareToken || null,
          shareId: videoData.shareId || null,
          loadTimestamp: Date.now()
        });
      } else {
        setCurrentVideo({
          title: videoData.title || 'Uploaded Video',
          videoId: videoData.videoId,
          source: '',
          sourceType: 'uploaded',
          videoUrl: videoData.videoUrl,
          isShared: videoData.isShared || false,
          shareToken: videoData.shareToken || null,
          shareId: videoData.shareId || null,
          loadTimestamp: Date.now()
        });
      }

      // Update URL
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('v', videoData.videoId);
      window.history.replaceState({}, '', newUrl);

      // Reset chat/quiz state
      setChatMessages([]);
      setIsQuizOpen(false);

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
        isShared: false, // YouTube videos are not shared
        shareToken: null,
        shareId: null,
        loadTimestamp: Date.now()
      });

      const newUrl = new URL(window.location);
      newUrl.searchParams.set('v', videoId);
      window.history.replaceState({}, '', newUrl);
      
      setChatMessages([]);
      setIsQuizOpen(false);
      
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
    if (!videoId) {
      return;
    }
    
    if (isLoadingRef.current) {
      console.log("Already loading, skipping upload complete");
      return;
    }

    isLoadingRef.current = true;
    setIsUploadCompleting(true);
    setYoutubeUrl('');
    setErrorMessage('');
    
    // Immediately mark this as an uploaded video to prevent clearing
    lastSelectedRef.current = { videoId, sourceType: 'uploaded' };
    
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
          isShared: false, // Uploaded videos are not shared
          shareToken: null,
          shareId: null,
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

        // Update refs to prevent conflicts
        lastSelectedRef.current = { videoId, sourceType: 'uploaded' };
      } else {
        setErrorMessage('Upload completed but no video data received');
      }
    } catch (e) {
      setErrorMessage('Upload completed but failed to load video details');
      // Reset the ref on error
      lastSelectedRef.current = null;
    } finally {
      setIsUploadCompleting(false);
      isLoadingRef.current = false;
    }
  }, [buildAbsoluteVideoUrl]);

  const handleUploadSuccess = useCallback(() => {
    setShowVideoUploader(false);
  }, []);

  const handlePlayerReady = (playerInstance) => {
    // Player instance is managed by PlayerComponent, no need to store it here
    console.log('Player ready:', playerInstance);
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleSeekToTime = (timeInSeconds) => {
    if (window.playerSeekTo) {
      window.playerSeekTo(timeInSeconds);
    }
  };

  // Initialize a default session for the current video
  useEffect(() => {
    const vid = currentVideo.videoId;
    if (!vid) return;
    setChatSessionsByVideo(prev => {
      const existing = prev[vid] || [];
      if (existing.length === 0) {
        const newSession = {
          id: `${vid}-${Date.now()}`,
          title: currentVideo.title || 'Session',
          messages: [],
          updatedAt: Date.now()
        };
        const next = { ...prev, [vid]: [newSession] };
        saveToLocalStorage('chatSessionsByVideo', next);
        setActiveSessionId(newSession.id);
        setChatMessages([]);
        return next;
      }
      if (!activeSessionId || !existing.find(s => s.id === activeSessionId)) {
        setActiveSessionId(existing[0].id);
        setChatMessages(existing[0].messages || []);
      }
      return prev;
    });
  }, [currentVideo.videoId]);

  // Persist chat sessions locally
  useEffect(() => {
    saveToLocalStorage('chatSessionsByVideo', chatSessionsByVideo);
  }, [chatSessionsByVideo]);

  // Update active session when chat messages change
  useEffect(() => {
    const vid = currentVideo.videoId;
    if (!vid || !activeSessionId) return;
    setChatSessionsByVideo(prev => {
      const sessions = prev[vid] || [];
      const idx = sessions.findIndex(s => s.id === activeSessionId);
      if (idx === -1) return prev;
      const updated = { ...sessions[idx], messages: chatMessages, updatedAt: Date.now() };
      const nextSessions = [...sessions];
      nextSessions[idx] = updated;
      const next = { ...prev, [vid]: nextSessions };
      saveToLocalStorage('chatSessionsByVideo', next);
      return next;
    });
  }, [chatMessages]);

  const handleAddSession = () => {
    if (!currentVideo.videoId) return;
    const newSession = {
      id: `${currentVideo.videoId}-${Date.now()}`,
      title: `Session ${new Date().toLocaleTimeString()}`,
      messages: [],
      updatedAt: Date.now()
    };
    setChatSessionsByVideo(prev => {
      const list = [...(prev[currentVideo.videoId] || [])];
      list.unshift(newSession);
      const next = { ...prev, [currentVideo.videoId]: list };
      saveToLocalStorage('chatSessionsByVideo', next);
      return next;
    });
    setActiveSessionId(newSession.id);
    setChatMessages([]);
    setShowHistory(false);
  };

  const handleSelectSession = (sessionId) => {
    const vid = currentVideo.videoId;
    if (!vid) return;
    const sessions = chatSessionsByVideo[vid] || [];
    const sel = sessions.find(s => s.id === sessionId);
    if (!sel) return;
    setActiveSessionId(sessionId);
    setChatMessages(sel.messages || []);
    setShowHistory(false);
  };

  // Backend sync: load sessions for uploaded videos on video change
  useEffect(() => {
    const vid = currentVideo.videoId;
    if (!vid) return;
    
    console.log('Loading chat sessions for video:', vid);
    console.log('Current video data:', currentVideo);
    
    const load = async () => {
      try {
        // Prepare request parameters
        const params = { video_id: vid };
        
        // If this is a shared video, include the share_id
        if (currentVideo.isShared && currentVideo.shareId) {
          params.share_id = currentVideo.shareId;
          console.log('Adding share_id to params:', currentVideo.shareId);
        }
        
        console.log('Request params:', params);
        
        const resp = await api.get(`/api/user-videos/chat-sessions`, {
          params: params,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const serverSessions = resp.data?.chat_sessions || [];
        if (serverSessions.length > 0) {
          setChatSessionsByVideo(prev => {
            const next = { ...prev, [vid]: serverSessions };
            saveToLocalStorage('chatSessionsByVideo', next);
            return next;
          });
          setActiveSessionId(serverSessions[0]?.id || '');
          setChatMessages(serverSessions[0]?.messages || []);
        }
      } catch (e) {
        // ignore if endpoint not available or unauthorized
        console.error('Error loading chat sessions:', e);
      }
    };
    load();
  }, [currentVideo.videoId, currentVideo.isShared, currentVideo.shareId]);

  // Push sessions to backend on change (debounced-ish via effect)
  useEffect(() => {
    const vid = currentVideo.videoId;
    if (!vid) return;
    const sessions = chatSessionsByVideo[vid] || [];
    const controller = new AbortController();
    const post = async () => {
      try {
        await api.post(`/api/user-videos/chat-sessions`, { chat_sessions: sessions }, {
          params: { video_id: vid },
          headers: { 'ngrok-skip-browser-warning': 'true' },
          signal: controller.signal
        });
      } catch (_e) {}
    };
    post();
    return () => controller.abort();
  }, [chatSessionsByVideo, currentVideo.videoId]);

  // Handle rename events from child (simple event bus to keep props minimal)
  useEffect(() => {
    const handler = (e) => {
      const { id, title } = e.detail || {};
      const vid = currentVideo.videoId;
      if (!vid || !id || !title) return;
      setChatSessionsByVideo(prev => {
        const sessions = prev[vid] || [];
        const idx = sessions.findIndex(s => s.id === id);
        if (idx === -1) return prev;
        const updated = { ...sessions[idx], title, updatedAt: Date.now() };
        const nextSessions = [...sessions];
        nextSessions[idx] = updated;
        const next = { ...prev, [vid]: nextSessions };
        saveToLocalStorage('chatSessionsByVideo', next);
        return next;
      });
    };
    window.addEventListener('rename-session', handler);
    return () => window.removeEventListener('rename-session', handler);
  }, [currentVideo.videoId]);

  const handleQuizSystemMessage = (message) => {
    // System messages functionality removed - quiz messages are handled internally
    console.log('Quiz system message:', message);
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

  // Handle URL parameters - only on initial load when no other video loading mechanism is active
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoIdFromUrl = urlParams.get('v');
    
    // Only set YouTube URL if:
    // 1. There's a video ID in the URL
    // 2. No current video is loaded
    // 3. No YouTube URL is already set
    // 4. No selectedVideo prop is present (handled by parent)
    // 5. Not currently loading
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
        
        <div className="w-full xl:w-2/5 relative">
          <ChatBoxComponent
            currentVideo={currentVideo}
            currentTime={currentTime}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            onSeekToTime={handleSeekToTime}
            onAddSession={handleAddSession}
            onToggleHistory={() => setShowHistory(v => !v)}
            historyList={chatSessionsByVideo[currentVideo.videoId] || []}
            activeSessionId={activeSessionId}
            onSelectHistory={handleSelectSession}
            showHistory={showHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default ImprovedYoutubePlayer;