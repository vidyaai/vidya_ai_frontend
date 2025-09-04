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
  const [showSharedHistory, setShowSharedHistory] = useState(false);
  const [sharedSessions, setSharedSessions] = useState([]);
  const [sharedHistoryLoading, setSharedHistoryLoading] = useState(false);
  const [sharedHistoryError, setSharedHistoryError] = useState(null);
  const [isLoadingSharedChat, setIsLoadingSharedChat] = useState(false);
  
  const chatContainerRef = useRef(null);

  const fetchSharedChatHistory = async () => {
    if (!currentVideo.videoId) return;
    
    setSharedHistoryLoading(true);
    setSharedHistoryError(null);
    
    try {
      const response = await api.get(`/api/sharing/shared-chat-history/${currentVideo.videoId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setSharedSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching shared chat history:', error);
      setSharedHistoryError('Failed to load shared chat history');
    } finally {
      setSharedHistoryLoading(false);
    }
  };

  const handleSharedHistoryClick = () => {
    if (showSharedHistory) {
      setShowSharedHistory(false);
    } else {
      setShowSharedHistory(true);
      // Turn off regular history by calling onToggleHistory if it's currently open
      if (showHistory) {
        onToggleHistory();
      }
      fetchSharedChatHistory();
    }
  };

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
      
      // Use different endpoints based on whether the video is shared or not
      let response;
      if (currentVideo.isShared && currentVideo.shareToken) {
        // Use shared video chat endpoint
        response = await api.post(`/api/sharing/shared-video-chat`, {
          share_token: currentVideo.shareToken,
          video_id: currentVideo.videoId,
          query: currentQuery,
          timestamp: currentTime,
          is_image_query: queryType === 'frame'
        }, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
      } else {
        // Use regular video query endpoint
        response = await api.post(`/api/query/video`, {
          video_id: currentVideo.videoId,
          query: currentQuery,
          timestamp: currentTime,
          is_image_query: queryType === 'frame'
        }, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
      }
      
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

  const handleSharedChatClick = (session) => {
    // Load the shared chat session into the current chat
    if (session.messages && Array.isArray(session.messages)) {
      setIsLoadingSharedChat(true);
      
      // Simulate a small delay for better UX
      setTimeout(() => {
        // Convert the shared session messages to the chat format
        const formattedMessages = session.messages.map((msg, index) => ({
          id: Date.now() + index,
          sender: msg.sender === 'user' ? 'user' : 'ai',
          text: msg.content || msg.text || msg.message || '',
          timestamp: msg.timestamp || null,
          isShared: true
        }));
        
        // Set the chat messages to the shared session
        setChatMessages(formattedMessages);
        
        // Close the shared history panel
        setShowSharedHistory(false);
        
        // Scroll to bottom of chat
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
        
        // Show a brief success message
        const successMessage = {
          id: Date.now() + formattedMessages.length + 1,
          sender: 'system',
          text: `✅ Loaded shared chat: "${session.title || 'Shared Chat'}"`,
          timestamp: null,
          isSuccess: true
        };
        
        setChatMessages(prev => [...prev, successMessage]);
        setIsLoadingSharedChat(false);
      }, 300);
    }
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
            onClick={() => {
              onToggleHistory();
              setShowSharedHistory(false); // Turn off shared history
            }}
            className={`w-8 h-8 rounded-lg text-white text-lg flex items-center justify-center ${
              showHistory ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="History"
            disabled={!currentVideo.videoId}
          >
            <Clock size={18} />
          </button>
          <button
            onClick={handleSharedHistoryClick}
            className={`w-8 h-8 rounded-lg text-white text-lg flex items-center justify-center ${
              currentVideo.isShared && currentVideo.shareToken 
                ? (showSharedHistory ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600')
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            title="Chats Shared with Me"
            disabled={!currentVideo.isShared || !currentVideo.shareToken}
          >
            <Share2 size={18} />
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
        ) : showSharedHistory ? (
          <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Share2 size={16} className="text-indigo-400" />
                Chats Shared with Me
              </h3>
              <button 
                onClick={() => setShowSharedHistory(false)} 
                className="text-gray-400 hover:text-gray-200 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-400 mb-3 text-center">
              💡 Click on any chat card to load it into the chatbox
            </div>
            {sharedHistoryLoading ? (
              <div className="text-center text-gray-500 my-8 flex flex-col items-center">
                <SimpleSpinner size={32} className="mb-3 text-gray-700" />
                <p className="text-sm">Loading shared chats...</p>
              </div>
            ) : sharedHistoryError ? (
              <div className="text-center text-red-500 my-8 flex flex-col items-center">
                <X size={32} className="mb-3 text-red-700" />
                <p className="text-sm">{sharedHistoryError}</p>
              </div>
            ) : sharedSessions.length === 0 ? (
              <div className="text-gray-500 text-sm p-4 text-center">No shared chats found for this video.</div>
            ) : (
              sharedSessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => !isLoadingSharedChat && handleSharedChatClick(session)}
                  className={`w-full px-3 py-3 rounded-lg mb-2 text-sm border border-gray-700 bg-gray-900 hover:bg-gray-800 hover:border-indigo-500 text-gray-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                    isLoadingSharedChat ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-white text-sm font-medium truncate flex-1">
                      {session.title || 'Shared Chat'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isLoadingSharedChat 
                          ? 'text-yellow-400 bg-yellow-900 bg-opacity-50' 
                          : 'text-indigo-400 bg-indigo-900 bg-opacity-50'
                      }`}>
                        {isLoadingSharedChat ? 'Loading...' : 'Click to load'}
                      </span>
                      <Share2 size={14} className="text-indigo-400" />
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-xs mb-2 flex items-center gap-2">
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
                    {session.messages && Array.isArray(session.messages) 
                      ? `${session.messages.length} message${session.messages.length !== 1 ? 's' : ''}`
                      : '0 messages'
                    }
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(session.updated_at || session.created_at || Date.now()).toLocaleString()}
                  </div>
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