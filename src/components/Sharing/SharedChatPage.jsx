import { useState, useEffect } from 'react';
import { MessageSquare, Play, Clock, AlertCircle, Loader, LogIn, Share2, User, Calendar } from 'lucide-react';
import { parseMarkdown, formatTime, api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import PlayerComponent from '../Chat/PlayerComponent';

const SharedChatPage = () => {
  // Extract share token from URL path
  const shareToken = window.location.pathname.split('/shared/')[1];
  const { currentUser } = useAuth();
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState(null);
  const [presignedUrlFetched, setPresignedUrlFetched] = useState(false);
  


  useEffect(() => {
    fetchSharedResource();
    setPresignedUrlFetched(false); // Reset flag when share token changes
  }, [shareToken, currentUser]);

  // Fetch presigned URL when video data is available (only once)
  
  useEffect(() => {
    if (sharedData && 
        sharedData.video && 
        sharedData.video.s3_key && 
        sharedData.video.source_type === 'uploaded' && 
        !sharedData.video.videoUrl && 
        !presignedUrlFetched) {
      

      setPresignedUrlFetched(true); // Mark as fetched to prevent re-fetching
      
      fetchPresignedUrl(sharedData.video.s3_key).then(url => {
        if (url) {
  
          setSharedData(prev => ({
            ...prev,
            video: {
              ...prev.video,
              videoUrl: url
            }
          }));
        }
      });
    }
  }, [sharedData?.video?.s3_key, sharedData?.video?.source_type, shareToken, presignedUrlFetched]);

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

  const handleSeekToTime = (seconds) => {
    // Use the global seek function set up by PlayerComponent
    if (window.playerSeekTo && typeof window.playerSeekTo === 'function') {
      window.playerSeekTo(seconds);
    }
  };

  const handlePlayerReady = (playerInstance) => {

    setPlayer(playerInstance);
  };

  const handleTimeUpdate = (currentTime) => {
    setCurrentTime(currentTime);
  };

  // Fetch presigned URL for uploaded videos
  const fetchPresignedUrl = async (s3Key) => {
    try {

      const response = await api.get(`/api/storage/presign/public`, {
        params: {
          key: s3Key,
          expires_in: 3600,
          share_token: shareToken
        },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      return response.data.url;
    } catch (error) {
      console.error('❌ Error fetching presigned URL:', error);
      return null;
    }
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

  if (!sharedData || sharedData.share_type !== 'chat') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">This shared link is not a chat session.</p>
        </div>
      </div>
    );
  }

  const { video, chat_session } = sharedData;
  

  
  // Map shared video data to PlayerComponent expected format
  const mappedVideo = {
    ...video,
    videoId: video.youtube_id || video.videoId, // Use youtube_id if available
    sourceType: video.source_type || video.sourceType, // Use source_type if available
    videoUrl: video.videoUrl || null // Use the presigned URL if available
  };
  


  return (
    // <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        // {/* Video Player and Chat Layout */}
        <div className="flex flex-col xl:flex-row gap-8 mt-6 w-full">
          {/* Video Player Section */}
          <div className="w-full xl:w-3/5">
            {/* <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6"> */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-white font-medium mb-2">{mappedVideo.title || 'Untitled Video'}</h3>
                <div className="text-sm text-gray-400 mb-2">
                  {mappedVideo.sourceType === 'youtube' ? 'YouTube Video' : 'Uploaded Video'}
                  {mappedVideo.sourceType === 'youtube' && (
                    <span className="ml-2 text-xs">ID: {mappedVideo.videoId}</span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  Current time: {formatTime(currentTime || 0)}
                </div>

              </div>
              
              {/* Video Player */}
               <div className="aspect-video bg-gray-950 rounded-lg">
                 {mappedVideo.videoUrl ? (
                   <PlayerComponent
                     key={`${mappedVideo.sourceType}-${mappedVideo.videoUrl}`}
                     currentVideo={mappedVideo}
                     onPlayerReady={handlePlayerReady}
                     onTimeUpdate={handleTimeUpdate}
                     seekToTime={handleSeekToTime}
                   />
                 ) : (
                   <div className="flex items-center justify-center h-full text-gray-400">
                     <Loader size={24} className="animate-spin mr-2" />
                     Loading video...
                   </div>
                 )}

               </div>
            {/* </div> */}
          </div>

          {/* Chat Messages Section */}
          <div className="w-full xl:w-2/5 relative">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-indigo-400" />
                <h2 className="text-xl font-semibold text-white">Chat Conversation</h2>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-white font-medium mb-2">Session: {chat_session.title || 'Chat Session'}</h3>
                <div className="text-sm text-gray-400">
                  {chat_session.messages && Array.isArray(chat_session.messages) 
                    ? `${chat_session.messages.length} message${chat_session.messages.length !== 1 ? 's' : ''}`
                    : '0 messages'
                  }
                </div>
              </div>
              
              {/* Chat Messages */}
              {!chat_session.messages || chat_session.messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No messages in this chat session.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                  {chat_session.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`${
                        message.sender === 'user' 
                          ? 'ml-8 bg-indigo-900 bg-opacity-50' 
                          : message.sender === 'system'
                            ? message.isSuccess ? 'bg-green-700 bg-opacity-70' : 'bg-gray-700 bg-opacity-70'
                            : 'mr-8 bg-gray-800'
                      } rounded-xl p-4 ${message.isError ? 'border border-red-500' : ''} ${message.isSuccess ? 'border border-green-500' : ''} shadow-md`}
                    >
                      <div className="flex items-center mb-2">
                        <span className={`font-medium text-sm ${
                          message.sender === 'user' ? 'text-indigo-300' : 
                          message.sender === 'system' ? 'text-yellow-300' : 'text-cyan-300'
                        }`}>
                          {message.sender === 'user' ? 'You' : 
                           message.sender === 'system' ? 'System' : 'AI Assistant'}
                        </span>
                        {message.timestamp !== null && (
                          <span className="text-gray-500 text-xs ml-2">
                            at {formatTime(message.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="text-white">
                        {parseMarkdown(message.content || message.text || message.message || '', handleSeekToTime)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    // {/* </div> */}
  );
};

export default SharedChatPage;
