// ChatBoxComponent.jsx - AI chat interface with clickable timestamps
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Clock, PlusCircle, Pencil, Check, X, Share2 } from 'lucide-react';
import { formatTime, parseMarkdown, SimpleSpinner, api } from '../generic/utils.jsx';
import SharingModal from '../Sharing/SharingModal.jsx';

const ChatBoxComponent = ({ 
  currentVideo, 
  currentTime,
  chatMessages,
  setChatMessages,
  onSeekToTime,
  onAddSession,
  onToggleHistory,
  historyList,
  activeSessionId,
  onSelectHistory,
  showHistory
}) => {
  const [userQuestion, setUserQuestion] = useState('');
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [queryType, setQueryType] = useState('video');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sharingModal, setSharingModal] = useState({ isOpen: false, sessionId: null });
  
  const chatContainerRef = useRef(null);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!userQuestion.trim() || !currentVideo.videoId || isProcessingQuery) return;
    
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
      
      const response = await api.post(`/api/query/video`, {
        video_id: currentVideo.videoId,
        query: currentQuery,
        timestamp: currentTime,
        is_image_query: queryType === 'frame'
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      if (response.data.is_downloading) {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.data.response,
          timestamp: currentTime,
          isDownloading: true
        };
        
        setChatMessages(prevMessages => [...prevMessages, aiMessage]);
      } else {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.data.response,
          timestamp: currentTime
        };
        
        setChatMessages(prevMessages => [...prevMessages, aiMessage]);
      }
      
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const openChatSharing = (sessionId) => {
    setSharingModal({ isOpen: true, sessionId });
  };

  const closeSharingModal = () => {
    setSharingModal({ isOpen: false, sessionId: null });
  };

  return (
    <div className="w-full bg-gray-900 rounded-xl shadow-xl overflow-hidden flex flex-col h-[750px]">
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-white">AI Video Assistant</h3>
          <p className="text-xs text-gray-400">Current time: {formatTime(currentTime || 0)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onAddSession}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-lg flex items-center justify-center"
            title="New chat"
            disabled={!currentVideo.videoId}
          >
            <PlusCircle size={18} />
          </button>
          <button
            onClick={onToggleHistory}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-lg flex items-center justify-center"
            title="History"
            disabled={!currentVideo.videoId}
          >
            <Clock size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-grow overflow-hidden">
        {showHistory ? (
          <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {(!historyList || historyList.length === 0) ? (
              <div className="text-gray-500 text-sm p-4 text-center">No history yet</div>
            ) : (
              historyList.map((s) => (
                <div
                  key={s.id}
                  className={`w-full px-3 py-3 rounded-lg mb-2 text-sm border border-gray-700 ${s.id === activeSessionId ? 'bg-gray-800 text-white' : 'bg-gray-900 hover:bg-gray-800 text-gray-200'}`}
                >
                  {editingSessionId === s.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const title = (editingTitle || '').trim();
                        if (!title) return;
                        const evt = new CustomEvent('rename-session', { detail: { id: s.id, title } });
                        window.dispatchEvent(evt);
                        setEditingSessionId(null);
                        setEditingTitle('');
                      }}
                      className="flex items-center"
                    >
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Conversation name"
                      />
                      <button type="submit" className="ml-2 text-green-400 hover:text-green-300" title="Save">
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingSessionId(null); setEditingTitle(''); }}
                        className="ml-2 text-gray-400 hover:text-white"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button onClick={() => onSelectHistory?.(s.id)} className="flex-1 text-left truncate">
                        <span className="font-medium">{s.title || 'Session'}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openChatSharing(s.id)}
                          className="text-gray-300 hover:text-white"
                          title="Share chat"
                        >
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingSessionId(s.id); setEditingTitle(s.title || ''); }}
                          className="text-gray-300 hover:text-white"
                          title="Rename"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">{new Date(s.updatedAt || Date.now()).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        ) : (
        <div 
          ref={chatContainerRef}
          className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 my-12 flex flex-col items-center">
            <MessageSquare size={40} className="mb-4 text-gray-700" />
            <p>No messages yet</p>
            <p className="text-sm mt-2">Ask me anything about this video!</p>
          </div>
        ) : (
          chatMessages.map(message => (
            <div 
              key={message.id} 
              className={`${
                message.sender === 'user' 
                  ? 'ml-8 bg-indigo-900 bg-opacity-50' 
                  : message.sender === 'system'
                    ? 'bg-gray-700 bg-opacity-70'
                    : 'mr-8 bg-gray-800'
              } rounded-xl p-4 ${message.isError ? 'border border-red-500' : ''} shadow-md`}
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
                {parseMarkdown(message.text, onSeekToTime)}
              </div>
            </div>
          ))
        )}
        {isProcessingQuery && (
          <div className="mr-8 bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center mb-2">
              <span className="font-medium text-sm text-cyan-300">AI Assistant</span>
            </div>
            <div className="flex items-center text-white">
              <SimpleSpinner size={16} className="mr-3" />
              Thinking...
            </div>
          </div>
        )}
        </div>
        )}
      </div>
      
      {!showHistory && (
      <div className="p-4 border-t border-gray-700 bg-gray-800 bg-opacity-50">
        <div className="flex space-x-4 mb-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="queryType"
              value="video"
              checked={queryType === 'video'}
              onChange={() => setQueryType('video')}
              className="mr-2 accent-indigo-500"
            />
            <span className="text-sm text-white">Ask about video</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="queryType"
              value="frame"
              checked={queryType === 'frame'}
              onChange={() => setQueryType('frame')}
              className="mr-2 accent-indigo-500"
            />
            <span className="text-sm text-white">Ask about current frame</span>
          </label>
        </div>
        <form onSubmit={handleQuerySubmit} className="flex space-x-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask a question about the video..."
            className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 shadow-inner"
            disabled={!currentVideo.videoId || isProcessingQuery}
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-white disabled:opacity-50 disabled:hover:bg-indigo-600"
            disabled={!userQuestion.trim() || !currentVideo.videoId || isProcessingQuery}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      )}

      {/* Sharing Modal */}
      <SharingModal
        isOpen={sharingModal.isOpen}
        onClose={closeSharingModal}
        shareType="chat"
        resourceId={sharingModal.sessionId}
        resourceData={currentVideo}
      />
    </div>
  );
};

export default ChatBoxComponent;