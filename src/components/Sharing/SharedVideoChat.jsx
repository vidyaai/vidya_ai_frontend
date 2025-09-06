import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Clock, Loader, AlertCircle, Play, Pause } from 'lucide-react';
import { api } from '../generic/utils.jsx';

const SharedVideoChat = ({ video, shareToken, onClose }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const chatContainerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Get video URL when component mounts (only for uploaded videos)
    if (video.source_type === 'uploaded') {
      getVideoUrl();
    } else if (video.source_type === 'youtube') {
      // For YouTube videos, we don't need to fetch a URL
      setVideoUrl(null);
    }
  }, [video.id, video.source_type, shareToken]);

  const getVideoUrl = async () => {
    try {
      const response = await api.get(`/api/sharing/shared-video-url/${shareToken}/${video.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setVideoUrl(response.data.video_url);
    } catch (error) {
      console.error('Failed to get video URL:', error);
      setVideoError('Failed to load video');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (timestamp) => {
    if (videoRef.current && timestamp !== null && timestamp !== undefined) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!userQuestion.trim() || !video.id || isProcessingQuery) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userQuestion,
      timestamp: currentTime
    };
    
    setChatMessages(prevMessages => [...prevMessages, userMessage]);
    const currentQuery = userQuestion;
    setUserQuestion('');
    setIsProcessingQuery(true);
    
    try {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      
      const response = await api.post(`/api/sharing/shared-video-chat`, {
        share_token: shareToken,
        video_id: video.id,
        query: currentQuery,
        timestamp: currentTime,
        is_image_query: false
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.data.response,
        timestamp: currentTime
      };
      
      setChatMessages(prevMessages => [...prevMessages, aiMessage]);
      
    } catch (error) {
      console.error("Error processing query:", error);
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        text: `Error: ${error.response?.data?.detail || error.message || "Something went wrong"}`,
        timestamp: null,
        isError: true
      };
      
      setChatMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessingQuery(false);
      
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseMarkdown = (text) => {
    // Simple markdown parsing for timestamps
    return text.replace(/\[(\d+:\d+)\]/g, '<span class="text-indigo-400 font-mono">[$1]</span>');
  };

  const handleTimeClick = (timestamp) => {
    handleSeek(timestamp);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-400" />
          <h2 className="text-xl font-semibold text-white">Chat with Video</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Video Player */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-white font-medium mb-2">{video.title || 'Untitled Video'}</h3>
        <div className="text-sm text-gray-400 mb-3">
          {video.source_type === 'youtube' ? 'YouTube Video' : 'Uploaded Video'}
        </div>
        
        {videoError ? (
          <div className="text-red-400 text-center py-8">
            <AlertCircle size={48} className="mx-auto mb-2" />
            {videoError}
          </div>
        ) : (video.source_type === 'youtube' && video.youtube_id) || (video.source_type === 'uploaded' && videoUrl) ? (
          <div className="relative">
            {video.source_type === 'youtube' ? (
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_id}?enablejsapi=1`}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={video.title || 'YouTube video'}
                />
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg"
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls
                />
              </div>
            )}
            
            <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
              <span>Current Time: {formatTime(currentTime)}</span>
              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                disabled={video.source_type === 'youtube'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader size={48} className="text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading video...</p>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="bg-gray-800 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Start a conversation about this video!</p>
            <p className="text-gray-500 text-sm mt-2">Ask questions about the content, request summaries, or explore specific topics.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
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
                    {message.sender === 'user' ? 'You' : 
                     message.sender === 'system' ? 'System' : 'AI Assistant'}
                  </span>
                  {message.timestamp !== null && message.timestamp !== undefined && (
                    <button
                      onClick={() => handleTimeClick(message.timestamp)}
                      className="text-gray-500 text-xs ml-2 hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                      <Clock size={12} />
                      {formatTime(message.timestamp)}
                    </button>
                  )}
                </div>
                <div 
                  className="text-white"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}
                />
              </div>
            ))}
            
            {isProcessingQuery && (
              <div className="mr-8 bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Loader size={16} className="text-indigo-400 animate-spin" />
                  <span className="text-gray-400">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleQuerySubmit} className="flex gap-2">
        <input
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="Ask a question about this video..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          disabled={isProcessingQuery}
        />
        <button
          type="submit"
          disabled={!userQuestion.trim() || isProcessingQuery}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Send size={16} />
          Send
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Tip: Ask questions about the video content, request summaries, or explore specific topics discussed in the video.</p>
        <p className="mt-1">Click on timestamps in chat messages to jump to specific parts of the video.</p>
      </div>
    </div>
  );
};

export default SharedVideoChat;
