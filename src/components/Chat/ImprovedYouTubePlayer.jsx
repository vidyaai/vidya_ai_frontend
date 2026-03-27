// ImprovedYoutubePlayer.jsx - Main component with Quiz integration (STABLE FIX)
import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, X, MessageSquare, FolderOpen, Home, ArrowLeft } from 'lucide-react';
import PlayerComponent from './PlayerComponent';
import TranscriptComponent from './TranscriptComponent';
import InteractivePanel from './InteractivePanel';
import { API_URL, saveToLocalStorage, loadFromLocalStorage, api } from '../generic/utils.jsx';
import VideoUploader from './VideoUploader.jsx';

const ImprovedYoutubePlayer = ({ selectedVideo, onNavigateToHome, onNavigateToGallery, onClearVideo }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState({ title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' });
  const [transcript, setTranscript] = useState('');
  const [transcriptError, setTranscriptError] = useState('');
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  // Per-video chat sessions
  const [chatSessionsByVideo, setChatSessionsByVideo] = useState(() => {
    return loadFromLocalStorage('chatSessionsByVideo', {});
  });
  const [activeSessionId, setActiveSessionId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploadCompleting, setIsUploadCompleting] = useState(false);
  const [showVideoUploader, setShowVideoUploader] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const lastSelectedRef = useRef(null);
  const isLoadingRef = useRef(false); // Prevent multiple concurrent loads
  const menuRef = useRef(null);

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
        // Clear state when explicitly navigating without a video
        // This happens when user navigates to /chat without URL parameters
        console.log("No video selected, clearing state");
        lastSelectedRef.current = null;
        clearVideoState();
      }
    }
  }, [selectedVideo, isUploadCompleting]);

  const clearVideoState = () => {
    setCurrentVideo({ title: '', source: '', videoId: '', sourceType: 'youtube', videoUrl: '' });
    setTranscript('');
    setTranscriptError('');
    setIsTranscriptLoading(false);
    setChatMessages([]);
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
    setTranscriptError('');
    setShowVideoUploader(true);

    try {
      if (videoData.sourceType === 'youtube') {
        // Step 1: Load player immediately
        setCurrentVideo({
          title: videoData.title || "Loading...",
          source: videoData.source || `https://www.youtube.com/embed/${videoData.videoId}?enablejsapi=1&origin=https://vidyaai.co&controls=0`,
          videoId: videoData.videoId,
          sourceType: 'youtube',
          videoUrl: '',
          isShared: videoData.isShared || false,
          shareToken: videoData.shareToken || null,
          shareId: videoData.shareId || null,
          loadTimestamp: Date.now()
        });

        setIsLoading(false);
        isLoadingRef.current = false;

        // Update URL immediately
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('v', videoData.videoId);
        newUrl.searchParams.set('type', 'youtube');
        window.history.replaceState({}, '', newUrl);

        // Reset chat state
        setChatMessages([]);

        // Step 2: Fetch transcript in background
        setIsTranscriptLoading(true);
        setTranscript('');

        const response = await api.post(`/api/youtube/info`, {
          url: `https://www.youtube.com/watch?v=${videoData.videoId}`
        }, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        });

        // Update title if available
        if (response.data.title) {
          setCurrentVideo(prev => ({
            ...prev,
            title: response.data.title
          }));
        }

        // Handle transcript
        if (response.data.transcript_available && response.data.transcript) {
          setTranscript(response.data.transcript);
          setTranscriptError('');
        } else {
          setTranscript('');
          setTranscriptError(response.data.transcript_error || "Transcript not available for this video.");
        }

        setIsTranscriptLoading(false);

      } else {
        // For uploaded videos
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
        newUrl.searchParams.set('type', 'uploaded');
        window.history.replaceState({}, '', newUrl);

        // Reset chat state
        setChatMessages([]);
      }

    } catch (error) {
      console.error("Error loading selected video:", error);

      // If we already loaded the player, just show transcript error
      if (currentVideo.videoId && videoData.sourceType === 'youtube') {
        setTranscriptError(error.response?.data?.detail || error.message || "Failed to load transcript");
        setIsTranscriptLoading(false);
      } else {
        setErrorMessage(error.response?.data?.detail || error.message || "Failed to load video");
      }
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
    setTranscriptError('');
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

      // Step 1: Load the video player immediately (don't wait for transcript)
      setCurrentVideo({
        title: "Loading...",
        source: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=https://vidyaai.co&controls=0`,
        videoId: videoId,
        sourceType: 'youtube',
        videoUrl: '',
        isShared: false,
        shareToken: null,
        shareId: null,
        loadTimestamp: Date.now()
      });

      setIsLoading(false);
      isLoadingRef.current = false;

      // Update URL immediately
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('v', videoId);
      newUrl.searchParams.set('type', 'youtube');
      window.history.replaceState({}, '', newUrl);

      // Reset chat state
      setChatMessages([]);

      // Step 2: Fetch video info and transcript in the background
      setIsTranscriptLoading(true);
      setTranscript('');

      const response = await api.post(`/api/youtube/info`, {
        url: youtubeUrl
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      // Update title
      setCurrentVideo(prev => ({
        ...prev,
        title: response.data.title || "YouTube Video"
      }));

      // Handle transcript
      if (response.data.transcript_available && response.data.transcript) {
        setTranscript(response.data.transcript);
        setTranscriptError('');
      } else {
        setTranscript('');
        setTranscriptError(response.data.transcript_error || "Transcript not available for this video.");
      }

      setIsTranscriptLoading(false);

    } catch (error) {
      console.error("Error loading video:", error);

      // If we already loaded the player, just show transcript error
      if (currentVideo.videoId) {
        setTranscriptError(error.response?.data?.detail || error.message || "Failed to load transcript");
        setIsTranscriptLoading(false);
      } else {
        // If player didn't load, show general error
        setErrorMessage(error.message || "Failed to load video");
        setIsLoading(false);
        isLoadingRef.current = false;
      }
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

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchUploadedVideoInfoWithRetry = async (maxAttempts = 8, delayMs = 1000) => {
      let lastResponseData = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const response = await api.get(`/api/user-videos/info`, {
          params: { video_id: videoId },
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        lastResponseData = response.data;
        const candidateUrl = buildAbsoluteVideoUrl(response.data?.video_url);
        if (candidateUrl) {
          return { data: response.data, videoUrl: candidateUrl };
        }

        if (attempt < maxAttempts) {
          await sleep(delayMs);
        }
      }

      return {
        data: lastResponseData,
        videoUrl: buildAbsoluteVideoUrl(lastResponseData?.video_url)
      };
    };
    
    try {
      const { data, videoUrl } = await fetchUploadedVideoInfoWithRetry();

      if (data && videoUrl) {
        console.log("Upload completion: Setting video data for ID:", videoId);
        
        setTranscript(data.transcript || '');
        
        const newVideoObject = {
          title: data.title || 'Uploaded Video',
          videoId: videoId,
          source: '',
          sourceType: 'uploaded',
          videoUrl,
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
        newUrl.searchParams.set('type', 'uploaded');
        window.history.replaceState({}, '', newUrl);

        // Reset state
        setChatMessages([]);

        // Update refs to prevent conflicts
        lastSelectedRef.current = { videoId, sourceType: 'uploaded' };
      } else {
        setErrorMessage('Upload completed but video is not ready yet. Please try selecting it from Gallery in a moment.');
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

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleSeekToTime = (timeInSeconds) => {
    if (window.playerSeekTo) {
      window.playerSeekTo(timeInSeconds);
    }
  };

  const handleRetryTranscript = async () => {
    if (!currentVideo.videoId || currentVideo.sourceType !== 'youtube') return;

    setIsTranscriptLoading(true);
    setTranscriptError('');
    setTranscript('');

    try {
      const response = await api.post(`/api/youtube/info`, {
        url: `https://www.youtube.com/watch?v=${currentVideo.videoId}`
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.data.transcript_available && response.data.transcript) {
        setTranscript(response.data.transcript);
        setTranscriptError('');
      } else {
        setTranscript('');
        setTranscriptError(response.data.transcript_error || "Transcript not available for this video.");
      }
    } catch (error) {
      console.error("Error retrying transcript:", error);
      setTranscriptError(error.response?.data?.detail || error.message || "Failed to load transcript");
    } finally {
      setIsTranscriptLoading(false);
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

  // Close menu when clicking outside
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
  }, []);

  const handleNewVideo = () => {
    clearVideoState();
    if (onClearVideo) {
      onClearVideo();
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="w-full">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={handleNewVideo}
                className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
              >
                <div className="p-2 bg-emerald-600/10 rounded-lg">
                  <MessageSquare size={18} className="text-emerald-500" />
                </div>
                <span className="text-sm font-medium">Interact with a new video</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToGallery) onNavigateToGallery();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
              >
                <div className="p-2 bg-emerald-600/10 rounded-lg">
                  <FolderOpen size={18} className="text-emerald-500" />
                </div>
                <span className="text-sm font-medium">My Gallery</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToHome) onNavigateToHome();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-zinc-800 transition-colors"
              >
                <div className="p-2 bg-emerald-600/10 rounded-lg">
                  <Home size={18} className="text-emerald-500" />
                </div>
                <span className="text-sm font-medium">Home</span>
              </button>
            </div>
          )}
        </div>

        {/* Back Arrow - only show when video is loaded */}
        {currentVideo.videoId && (
          <button
            onClick={() => {
              if (onNavigateToHome) onNavigateToHome();
            }}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleYoutubeSubmit} className="mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL or upload video"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-500 transition-colors"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !youtubeUrl.trim()}
          >
            {isLoading ? 'Loading...' : 'Load'}
          </button>
          {showVideoUploader && (
            <VideoUploader
              onUploadComplete={handleUploadComplete}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </div>
        {errorMessage && (
          <div className="mt-3 text-red-400 text-sm bg-zinc-900 border border-red-900 p-3 rounded-lg">
            {errorMessage}
          </div>
        )}
      </form>

      <div className="flex flex-col xl:flex-row gap-4 w-full">
        <div className="w-full xl:w-3/5 space-y-4">
          {currentVideo.title && (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl px-6 py-4 shadow-lg shadow-black/20">
              <h1 className="text-white text-xl font-semibold leading-relaxed tracking-tight">{currentVideo.title}</h1>
            </div>
          )}

          <PlayerComponent
            currentVideo={currentVideo}
            onTimeUpdate={handleTimeUpdate}
            seekToTime={handleSeekToTime}
          />

          <TranscriptComponent
            currentVideo={currentVideo}
            transcript={transcript}
            transcriptError={transcriptError}
            isTranscriptLoading={isTranscriptLoading}
            onRetryTranscript={handleRetryTranscript}
            onSeekToTime={handleSeekToTime}
          />
        </div>

        <div className="w-full xl:w-2/5">
          <InteractivePanel
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
            transcript={transcript}
            onQuizSystemMessage={(msg) => console.log('Quiz message:', msg)}
          />
        </div>
      </div>
    </div>
  );
};

export default ImprovedYoutubePlayer;