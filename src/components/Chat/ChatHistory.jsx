// ChatHistory.jsx - Minimal session list for per-video chat
import { useMemo } from 'react';

const ChatHistory = ({
  isOpen,
  sessions,
  activeSessionId,
  onSelectSession,
  onClose
}) => {
  const sortedSessions = useMemo(() => {
    return [...(sessions || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [sessions]);

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
            <button
              key={s.id}
              onClick={() => onSelectSession?.(s.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors ${
                s.id === activeSessionId ? 'bg-gray-800' : ''
              }`}
            >
              <div className="text-white text-sm truncate">{s.title || 'Session'}</div>
              <div className="text-gray-500 text-xs mt-1">
                {new Date(s.updatedAt || Date.now()).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;


