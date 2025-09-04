// SharedChatHistory.jsx - Display shared chat history for shared videos
import { useState, useEffect } from 'react';
import { MessageSquare, User, Calendar, Share2 } from 'lucide-react';
import { api } from '../generic/utils.jsx';

const SharedChatHistory = ({
  isOpen,
  videoId,
  onClose,
  onSelectSession
}) => {
  const [sharedSessions, setSharedSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchSharedChatHistory();
    }
  }, [isOpen, videoId]);

  const fetchSharedChatHistory = async () => {
    if (!videoId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/sharing/shared-chat-history/${videoId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setSharedSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching shared chat history:', error);
      setError('Failed to load shared chat history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  const formatMessageCount = (messages) => {
    if (!messages || !Array.isArray(messages)) return '0 messages';
    return `${messages.length} message${messages.length !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 mt-2 mr-2 z-40 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="text-white font-semibold text-sm flex items-center gap-2">
          <Share2 size={16} className="text-indigo-400" />
          Chats Shared with Me
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm">✕</button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-gray-400 text-sm p-4 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400 mx-auto mb-2"></div>
            Loading shared chats...
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm p-4 text-center">{error}</div>
        ) : sharedSessions.length === 0 ? (
          <div className="text-gray-400 text-sm p-4 text-center">
            No shared chats found for this video.
          </div>
        ) : (
          sharedSessions.map((session) => (
            <div
              key={session.session_id}
              className="border-b border-gray-700 last:border-b-0"
            >
              <button
                onClick={() => onSelectSession?.(session)}
                className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-white text-sm font-medium truncate flex-1">
                    {session.title || 'Shared Chat'}
                  </div>
                  <Share2 size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="text-gray-400 text-xs mb-2 flex items-center gap-2">
                  <User size={12} />
                  <span className="truncate">
                    Shared by: {session.shared_by || 'Unknown'}
                  </span>
                </div>
                
                {session.share_title && (
                  <div className="text-indigo-400 text-xs mb-2">
                    "{session.share_title}"
                  </div>
                )}
                
                <div className="text-gray-500 text-xs mb-2">
                  {formatMessageCount(session.messages)}
                </div>
                
                <div className="text-gray-500 text-xs flex items-center gap-2">
                  <Calendar size={12} />
                  <span>
                    {formatDate(session.updated_at || session.created_at)}
                  </span>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SharedChatHistory;
