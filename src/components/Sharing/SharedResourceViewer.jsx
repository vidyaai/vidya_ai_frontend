import { useState, useEffect, useRef } from 'react';
import { Share2, Folder as FolderIcon, MessageSquare, User, Calendar, Eye, AlertCircle, Loader, LogIn, Play, FileText, Send, ArrowLeft } from 'lucide-react';
import { api, parseMarkdown, formatTime } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import SharedChatPage from './SharedChatPage';
import SharedAssignmentPage from './SharedAssignmentPage';
import PlayerComponent from '../Chat/PlayerComponent';

const SharedResourceViewer = () => {
  // Extract share token from URL path
  const [shareToken, setShareToken] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  
  // Extract share token when component mounts or URL changes
  useEffect(() => {
    const path = window.location.pathname;
    const token = path.split('/shared/')[1];
    // Remove trailing slash from token if it exists
    setShareToken(token ? token.replace(/\/$/, '') : null);
  }, []);
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    if (shareToken && !authLoading) {
      fetchSharedResource();
    }
  }, [shareToken, currentUser, authLoading]);

  const fetchSharedResource = async () => {
    setLoading(true);
    setError(null);
    setRequiresAuth(false);
    
    try {
      // First try public access
      let response;
      try {
        response = await api.get(`/api/sharing/public/${shareToken}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        setSharedData(response.data);
        return;
      } catch (publicError) {
        if (publicError.response?.status === 403) {
          // Link is private, check if user is authenticated
          if (!currentUser) {
            setRequiresAuth(true);
            setError('This is a private link. Please log in to access the content.');
            return;
          }
          
          // User is authenticated, try private access
          try {
            response = await api.get(`/api/sharing/private/${shareToken}`, {
              headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            setSharedData(response.data);
            return;
          } catch (privateError) {
            if (privateError.response?.status === 401) {
              setRequiresAuth(true);
              setError('Please log in to access this private content.');
            } else if (privateError.response?.status === 403) {
              setError('Access denied. You need an invitation to view this content.');
            } else {
              throw privateError;
            }
            return;
          }
        } else {
          throw publicError;
        }
      }
    } catch (error) {
      console.error('Error fetching shared resource:', error);
      if (error.response?.status === 404) {
        setError('Shared link not found. It may have been deleted or the link is incorrect.');
      } else if (error.response?.status === 410) {
        setError('This shared link has expired.');
      } else if (error.response?.status === 429) {
        setError('This link has reached its view limit.');
      } else {
        setError('Failed to load shared content. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!shareToken) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading shared link...</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center max-w-md mx-auto px-4">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Content</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          {requiresAuth ? (
            <button
              onClick={() => {
                const currentPath = window.location.pathname;
                window.location.href = `/?login=true&returnUrl=${encodeURIComponent(currentPath)}`;
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <LogIn size={16} />
              Log In
            </button>
          ) : null}
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="text-center">
        <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No shared content found.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-600 rounded-lg">
            {sharedData.share_type === 'folder' ? (
              <FolderIcon size={24} className="text-white" />
            ) : sharedData.share_type === 'assignment' ? (
              <FileText size={24} className="text-white" />
            ) : (
              <MessageSquare size={24} className="text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              {sharedData.title || `Shared ${sharedData.share_type}`}
            </h1>
            
            {sharedData.description && (
              <p className="text-gray-300 mb-4">{sharedData.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {sharedData.owner_display_name && (
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>Shared by {sharedData.owner_display_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Created {formatDate(sharedData.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Share2 size={14} />
                <span className="capitalize">{sharedData.share_type} Share</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {sharedData.share_type === 'folder' && sharedData.folder && (
        <FolderContent folder={sharedData.folder} videos={sharedData.videos || []} shareToken={shareToken} />
      )}
      
      {sharedData.share_type === 'chat' && sharedData.video && sharedData.chat_session && (
        <SharedChatPage initialData={sharedData} />
      )}

      {sharedData.share_type === 'assignment' && (
        <SharedAssignmentPage sharedData={sharedData} />
      )}
    </div>
  );
};

const FolderContent = ({ folder, videos, shareToken }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  if (selectedVideo) {
    return (
      <InlineFolderVideoChat
        video={selectedVideo}
        shareToken={shareToken}
        onBack={() => setSelectedVideo(null)}
      />
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <FolderIcon size={20} className="text-yellow-400" />
        <h2 className="text-xl font-semibold text-white">{folder.name}</h2>
        <span className="text-gray-400">({videos.length} video{videos.length !== 1 ? 's' : ''})</span>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">This folder is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} shareToken={shareToken} onChatClick={setSelectedVideo} />
          ))}
        </div>
      )}
    </div>
  );
};

const VideoCard = ({ video, shareToken, onChatClick }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    if (video.thumb_key) {
      getThumbnailUrl(video.thumb_key, shareToken).then(setThumbnailUrl);
    }
  }, [video.thumb_key, shareToken]);

  const getThumbnailUrl = async (thumbKey, shareToken) => {
    if (!thumbKey) return null;
    try {
      const endpoint = shareToken ? '/api/storage/presign/public' : '/api/storage/presign';
      const params = shareToken
        ? { key: thumbKey, expires_in: 3600, share_token: shareToken }
        : { key: thumbKey, expires_in: 3600 };
      const response = await api.get(endpoint, {
        params,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      return response.data.url;
    } catch (error) {
      console.error('Failed to get thumbnail URL:', error);
      return null;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="aspect-video bg-gray-900 flex items-center justify-center relative group">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title || 'Video thumbnail'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center text-gray-500 text-sm ${thumbnailUrl ? 'hidden' : 'flex'}`}>
          {video.source_type === 'uploaded' ? 'Uploaded Video' : 'YouTube Video'}
        </div>

        {/* Overlay with chat button */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={() => onChatClick(video)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <MessageSquare size={16} />
            Chat
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-white text-sm font-medium line-clamp-2 mb-2">
          {video.title || 'Untitled Video'}
        </h3>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {video.source_type === 'youtube' ? 'YouTube' : 'Uploaded'}
          </div>
          <button
            onClick={() => onChatClick(video)}
            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
          >
            <MessageSquare size={12} />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
};

const InlineFolderVideoChat = ({ video, shareToken, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const messagesEndRef = useRef(null);

  const mappedVideo = {
    ...video,
    videoId: video.youtube_id || video.videoId,
    sourceType: video.source_type || video.sourceType,
    videoUrl: video.source_type === 'uploaded' ? videoUrl : null,
  };

  useEffect(() => {
    if (video.source_type === 'uploaded' && video.s3_key) {
      api.get('/api/storage/presign/public', {
        params: { key: video.s3_key, expires_in: 3600, share_token: shareToken },
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
        .then(r => setVideoUrl(r.data.url))
        .catch(err => console.error('Failed to fetch video URL:', err));
    }
  }, [video.s3_key, video.source_type, shareToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSeekToTime = (seconds) => {
    if (window.playerSeekTo) window.playerSeekTo(seconds);
  };

  const sendMessage = async () => {
    const query = input.trim();
    if (!query || sending) return;

    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { sender: 'user', content: query, timestamp: currentTime }]);

    try {
      const res = await api.post('/api/sharing/shared-video-chat', {
        share_token: shareToken,
        video_id: video.id,
        query,
        timestamp: currentTime,
        is_image_query: false,
      }, { headers: { 'ngrok-skip-browser-warning': 'true' } });

      setMessages(prev => [...prev, { sender: 'assistant', content: res.data.response, timestamp: null }]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to get a response. Please try again.';
      setMessages(prev => [...prev, { sender: 'assistant', content: detail, timestamp: null, isError: true }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Back to folder
      </button>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Video player */}
        <div className="w-full xl:w-3/5">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-white font-medium mb-1">{video.title || 'Untitled Video'}</h3>
            <div className="text-xs text-gray-400">{formatTime(currentTime)}</div>
          </div>
          <div className="aspect-video bg-gray-950 rounded-lg">
            {(mappedVideo.videoId && mappedVideo.sourceType === 'youtube') ||
             (mappedVideo.videoUrl && mappedVideo.sourceType === 'uploaded') ? (
              <PlayerComponent
                key={`${mappedVideo.sourceType}-${mappedVideo.videoId || mappedVideo.videoUrl}`}
                currentVideo={mappedVideo}
                onTimeUpdate={setCurrentTime}
                seekToTime={handleSeekToTime}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader size={24} className="animate-spin mr-2" />
                Loading video...
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-full xl:w-2/5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Chat with Video</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 mb-4 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Ask anything about this video
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 shadow-md ${
                    msg.sender === 'user'
                      ? 'ml-8 bg-indigo-900 bg-opacity-50'
                      : `mr-8 bg-gray-700 ${msg.isError ? 'border border-red-500' : ''}`
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className={`font-medium text-sm ${msg.sender === 'user' ? 'text-indigo-300' : 'text-cyan-300'}`}>
                      {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    {msg.timestamp != null && (
                      <span className="text-gray-500 text-xs ml-2">at {formatTime(msg.timestamp)}</span>
                    )}
                  </div>
                  <div className="text-white">
                    {parseMarkdown(msg.content, handleSeekToTime)}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="mr-8 bg-gray-700 rounded-xl p-4">
                <Loader size={16} className="animate-spin text-cyan-300" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about this video…"
              disabled={sending}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};




export default SharedResourceViewer;
