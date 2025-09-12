// ChatHistory.jsx - Minimal session list for per-video chat
import { useMemo, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../generic/utils.jsx';

const ChatHistory = ({
  isOpen,
  sessions,
  activeSessionId,
  onSelectSession,
  onClose,
  videoId,
  onSessionDeleted
}) => {
  const [deleting, setDeleting] = useState(null);
  const [sharedContentError, setSharedContentError] = useState(null);

  const sortedSessions = useMemo(() => {
    return [...(sessions || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [sessions]);

  const handleDeleteSession = async (sessionId, sessionTitle) => {
    if (!videoId || !sessionId) return;
    
    setDeleting(sessionId);
    try {
      await api.delete(`/api/user-videos/chat-sessions/${videoId}/${sessionId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      // Call the callback to refresh sessions
      if (onSessionDeleted) {
        onSessionDeleted();
      }
    } catch (e) {
      console.error(e);
      
      // Check if this is a shared content error
      if (e.response?.data?.detail?.error === 'content_is_shared') {
        setSharedContentError({
          type: 'chat',
          message: e.response.data.detail.message,
          sharedLink: e.response.data.detail.shared_link,
          resourceName: sessionTitle || 'Chat Session'
        });
      } else {
        alert(e.response?.data?.detail || e.message || 'Failed to delete chat session');
      }
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 mt-2 mr-2 z-40 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="text-white font-semibold text-sm">Chat History</div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm">✕</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {sortedSessions.length === 0 ? (
          <div className="text-gray-400 text-sm p-4">No history yet.</div>
        ) : (
          sortedSessions.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors ${
                s.id === activeSessionId ? 'bg-gray-800' : ''
              }`}
            >
              <button
                onClick={() => onSelectSession?.(s.id)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-white text-sm truncate">{s.title || 'Session'}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {new Date(s.updatedAt || Date.now()).toLocaleString()}
                </div>
              </button>
              
              {videoId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${s.title || 'Session'}"? This action cannot be undone.`)) {
                      handleDeleteSession(s.id, s.title);
                    }
                  }}
                  disabled={deleting === s.id}
                  className="ml-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Delete session"
                >
                  {deleting === s.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Shared Content Error Modal */}
      {sharedContentError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Cannot Delete Chat Session</h3>
                <p className="text-gray-400 text-sm">This session is part of shared content</p>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-sm mb-3">
                {sharedContentError.message}
              </p>
              
              {sharedContentError.sharedLink && (
                <div className="border-t border-gray-600 pt-3">
                  <h4 className="text-white font-medium text-sm mb-2">Share Link Details:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Title:</span>
                      <span className="text-white">{sharedContentError.sharedLink.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white capitalize">{sharedContentError.sharedLink.share_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visibility:</span>
                      <span className="text-white">{sharedContentError.sharedLink.is_public ? 'Public' : 'Private'}</span>
                    </div>
                    {sharedContentError.sharedLink.created_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white text-xs">
                          {new Date(sharedContentError.sharedLink.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSharedContentError(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSharedContentError(null);
                  alert('Please go to the Sharing section to manage your share links and delete the one blocking this deletion.');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Manage Share Links
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;


