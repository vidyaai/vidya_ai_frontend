import { useState, useEffect } from 'react';
import { Share2, Folder as FolderIcon, MessageSquare, User, Calendar, Eye, AlertCircle, Loader, LogIn, Play } from 'lucide-react';
import { api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';

const SharedResourceViewer = () => {
  // Extract share token from URL path
  const shareToken = window.location.pathname.split('/shared/')[1];
  const { currentUser } = useAuth();
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    fetchSharedResource();
  }, [shareToken, currentUser]);

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Content</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {requiresAuth ? (
              <button
                onClick={() => window.location.href = '/?login=true'}
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
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No shared content found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 rounded-lg">
              {sharedData.share_type === 'folder' ? (
                <FolderIcon size={24} className="text-white" />
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
          <ChatContent video={sharedData.video} chatSession={sharedData.chat_session} />
        )}
      </div>
    </div>
  );
};

const FolderContent = ({ folder, videos, shareToken }) => {
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
            <VideoCard key={video.id} video={video} shareToken={shareToken} />
          ))}
        </div>
      )}
    </div>
  );
};

const VideoCard = ({ video, shareToken }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (video.thumb_key) {
      getThumbnailUrl(video.thumb_key, shareToken).then(setThumbnailUrl);
    }
  }, [video.thumb_key, shareToken]);

  const getThumbnailUrl = async (thumbKey, shareToken) => {
    if (!thumbKey) return null;
    try {
      let endpoint = '/api/storage/presign';
      let params = { key: thumbKey, expires_in: 3600 };
      
      if (shareToken) {
        // Use public endpoint for any shared content (both public and private)
        endpoint = '/api/storage/presign/public';
        params = { key: thumbKey, expires_in: 3600, share_token: shareToken };
      }
      // For non-shared content, use the regular authenticated endpoint
      

      
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

  const handleChatClick = () => {
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/shared/${shareToken}`);
      window.location.href = `/?login=true&returnUrl=${returnUrl}`;
      return;
    }

    // Navigate to main chat page with video context
    // We'll pass the shared video info to the main chat
    const videoData = {
      ...video,
      shareToken: shareToken,
      isShared: true
    };
    
    // Store in sessionStorage for the main chat to pick up
    sessionStorage.setItem('sharedVideoForChat', JSON.stringify(videoData));
    
    // Navigate to main chat page
    window.location.href = '/';
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
            onClick={handleChatClick}
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
            onClick={handleChatClick}
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

const ChatContent = ({ video, chatSession }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseMarkdown = (text) => {
    // Simple markdown parsing for timestamps
    return text.replace(/\[(\d+:\d+)\]/g, '<span class="text-indigo-400 font-mono">[$1]</span>');
  };

  return (
    <div className="space-y-6">
      {/* Video Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-indigo-400" />
          <h2 className="text-xl font-semibold text-white">Chat Session</h2>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-white font-medium mb-2">{video.title || 'Untitled Video'}</h3>
          <div className="text-sm text-gray-400">
            {video.source_type === 'youtube' ? 'YouTube Video' : 'Uploaded Video'}
          </div>
        </div>
        
        <div className="text-sm text-gray-400">
          <strong>Session:</strong> {chatSession.title || 'Chat Session'}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Conversation</h3>
        
        {!chatSession.messages || chatSession.messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No messages in this chat session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatSession.messages.map((message, index) => (
              <div
                key={index}
                className={`${
                  message.sender === 'user'
                    ? 'ml-8 bg-indigo-900 bg-opacity-50'
                    : message.sender === 'system'
                    ? 'bg-gray-700 bg-opacity-70'
                    : 'mr-8 bg-gray-800'
                } rounded-xl p-4 ${message.isError ? 'border border-red-500' : ''}`}
              >
                <div className="flex items-center mb-2">
                  <span className={`font-medium text-sm ${
                    message.sender === 'user' ? 'text-indigo-300' : 
                    message.sender === 'system' ? 'text-yellow-300' : 'text-cyan-300'
                  }`}>
                    {message.sender === 'user' ? 'User' : 
                     message.sender === 'system' ? 'System' : 'AI Assistant'}
                  </span>
                  {message.timestamp !== null && (
                    <span className="text-gray-500 text-xs ml-2">
                      at {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>
                <div 
                  className="text-white"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedResourceViewer;
