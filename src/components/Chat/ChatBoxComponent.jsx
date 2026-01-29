// ChatBoxComponent.jsx - AI chat interface with clickable timestamps
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Clock, PlusCircle, Pencil, Check, X, Share2 } from 'lucide-react';
import { formatTime, parseMarkdown, parseMarkdownWithMath, SimpleSpinner, api, convertLatexToMathHTML } from '../generic/utils.jsx';
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
  const [downloadProgress, setDownloadProgress] = useState(null); // { status, progress, message }
  
  const chatContainerRef = useRef(null);
  const progressPollingRef = useRef(null);

  // Helper function to maintain only the last 10 messages
  const addMessageWithHistory = (newMessage, prevMessages) => {
    const updatedMessages = [...prevMessages, newMessage];
    // Keep only the last 10 messages (rolling window)
    return updatedMessages.slice(-10);
  };

  // Helper function to get conversation context for API
  const getConversationContext = (messages) => {
    // Get last 10 messages, excluding system/error messages
    const conversationMessages = messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
      .slice(-10)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: msg.timestamp
      }));
    
    return conversationMessages;
  };

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

  // Function to poll download progress
  const pollDownloadProgress = async (videoId) => {
    try {
      const response = await api.get(`/api/youtube/download-status/${videoId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const status = response.data;
      
      if (status.status === 'completed') {
        setDownloadProgress(null);
        // Stop polling
        if (progressPollingRef.current) {
          clearInterval(progressPollingRef.current);
          progressPollingRef.current = null;
        }
      } else if (status.status === 'preparing') {
        setDownloadProgress({
          status: 'preparing',
          progress: 0,
          message: status.message || '🔄 Preparing video from YouTube...',
          downloaded_bytes: 0,
          total_bytes: 0,
          chunks_received: 0
        });
      } else if (status.status === 'buffering') {
        setDownloadProgress({
          status: 'buffering',
          progress: status.percentage || 0,  // Use percentage from API (might be progress from RapidAPI)
          message: status.message || '⏳ Video is being prepared by YouTube server...',
          downloaded_bytes: 0,
          total_bytes: 0,
          chunks_received: 0,
          api_status: status.api_status  // Pass through any API status info
        });
      } else if (status.status === 'downloading') {
        setDownloadProgress({
          status: 'downloading',
          progress: status.progress || 0,
          message: status.message || 'Downloading video...',
          downloaded_bytes: status.downloaded_bytes,
          total_bytes: status.total_bytes,
          chunks_received: status.chunks_received || 0
        });
      } else if (status.status === 'failed') {
        setDownloadProgress({ status: 'failed', message: status.message });
        if (progressPollingRef.current) {
          clearInterval(progressPollingRef.current);
          progressPollingRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error polling download progress:', error);
    }
  };

  // Start polling when a download is detected
  const startDownloadProgressPolling = (videoId) => {
    // Clear any existing polling interval
    if (progressPollingRef.current) {
      clearInterval(progressPollingRef.current);
    }
    
    // Poll immediately, then every 1 second for more responsive updates
    pollDownloadProgress(videoId);
    progressPollingRef.current = setInterval(() => {
      pollDownloadProgress(videoId);
    }, 1000); // Changed from 2000ms to 1000ms for faster updates
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (progressPollingRef.current) {
        clearInterval(progressPollingRef.current);
      }
    };
  }, []);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!userQuestion.trim() || !currentVideo.videoId || isProcessingQuery) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: userQuestion,
      timestamp: currentTime
    };
    
    setChatMessages(prevMessages => addMessageWithHistory(userMessage, prevMessages));
    const currentQuery = userQuestion;
    setUserQuestion('');
    setIsProcessingQuery(true);
    
    try {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      
      // Get conversation context before making API call
      const conversationContext = getConversationContext(chatMessages);
      
      // Use different endpoints based on whether the video is shared or not
      let response;
      if (currentVideo.isShared && currentVideo.shareToken) {
        // Use shared video chat endpoint
        response = await api.post(`/api/sharing/shared-video-chat`, {
          share_token: currentVideo.shareToken,
          video_id: currentVideo.videoId,
          query: currentQuery,
          timestamp: currentTime,
          is_image_query: queryType === 'frame',
          conversation_history: conversationContext,
          session_id: activeSessionId
        }, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
      } else {
        // Use regular video query endpoint
        response = await api.post(`/api/query/video`, {
          video_id: currentVideo.videoId,
          query: currentQuery,
          timestamp: currentTime,
          is_image_query: queryType === 'frame',
          conversation_history: conversationContext,
          session_id: activeSessionId
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
        
        setChatMessages(prevMessages => addMessageWithHistory(aiMessage, prevMessages));
        
        // Start polling for download progress
        startDownloadProgressPolling(currentVideo.videoId);
      } else {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.data.response,
          timestamp: currentTime
        };
        
        setChatMessages(prevMessages => addMessageWithHistory(aiMessage, prevMessages));
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
      
      setChatMessages(prevMessages => addMessageWithHistory(errorMessage, prevMessages));
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
        
        setChatMessages(prev => addMessageWithHistory(successMessage, prev));
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
              <div className="text-white break-words overflow-wrap-anywhere">
                {message.sender === 'ai' ? (
                  parseMarkdownWithMath(message.text, onSeekToTime)
                ) : (
                  parseMarkdown(message.text, onSeekToTime)
                )}
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
      
      {/* Download Progress Bar */}
      {downloadProgress && (downloadProgress.status === 'preparing' || downloadProgress.status === 'buffering' || downloadProgress.status === 'downloading') && (
        <div className="px-4 py-4 border-t border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 bg-opacity-90">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {(downloadProgress.status === 'preparing' || downloadProgress.status === 'buffering') ? (
                  // Pulsing animation for buffering/preparing
                  <div className="relative">
                    <div className="animate-pulse">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 animate-ping opacity-75">
                      <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                      </svg>
                    </div>
                  </div>
                ) : (
                  // Download animation
                  <>
                    <div className="animate-spin">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 animate-pulse">
                      <svg className="w-5 h-5 text-indigo-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-white font-medium">
                  {downloadProgress.message || 'Processing...'}
                </span>
                {downloadProgress.status === 'downloading' && downloadProgress.chunks_received > 0 && (
                  <span className="text-xs text-gray-400 mt-0.5">
                    Chunks received: {downloadProgress.chunks_received}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              {downloadProgress.status === 'downloading' ? (
                <>
                  <span className="text-lg text-indigo-400 font-bold">
                    {downloadProgress.progress || 0}%
                  </span>
                  {downloadProgress.downloaded_bytes && downloadProgress.total_bytes && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      {(downloadProgress.downloaded_bytes / (1024 * 1024)).toFixed(1)} / {(downloadProgress.total_bytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-yellow-400 font-medium">
                  {downloadProgress.status === 'preparing' ? (
                    <span className="animate-pulse">Preparing...</span>
                  ) : downloadProgress.progress > 0 ? (
                    // Show buffering percentage if available from RapidAPI
                    <span>{downloadProgress.progress}%</span>
                  ) : (
                    <span className="animate-pulse">Buffering...</span>
                  )}
                </span>
              )}
            </div>
          </div>
          
          {/* Progress bar with percentage markers */}
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              {downloadProgress.status === 'preparing' ? (
                // Indeterminate progress bar for preparing
                <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                    style={{
                      animation: 'slide 1.5s ease-in-out infinite',
                      width: '50%'
                    }}
                  ></div>
                </div>
              ) : downloadProgress.status === 'buffering' && downloadProgress.progress > 0 ? (
                // Semi-determinate progress bar for buffering (if RapidAPI provides progress)
                <div 
                  className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-3 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${downloadProgress.progress || 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-full w-32 bg-white opacity-20 blur-sm" 
                         style={{ 
                           animation: 'slide 1.5s ease-in-out infinite',
                           width: '50%'
                         }}></div>
                  </div>
                </div>
              ) : downloadProgress.status === 'buffering' ? (
                // Indeterminate progress bar for buffering (no progress from API)
                <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                    style={{
                      animation: 'slide 1.5s ease-in-out infinite',
                      width: '50%'
                    }}
                  ></div>
                </div>
              ) : (
                // Determinate progress bar for downloading
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${downloadProgress.progress || 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-full w-32 bg-white opacity-20 blur-sm animate-[shimmer_2s_infinite]" 
                         style={{ 
                           animation: 'shimmer 2s ease-in-out infinite',
                           transform: 'translateX(-100%)'
                         }}></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Percentage markers */}
            {(downloadProgress.status === 'downloading' || (downloadProgress.status === 'buffering' && downloadProgress.progress > 0)) && (
              <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span className={downloadProgress.progress >= 25 ? (downloadProgress.status === 'buffering' ? 'text-yellow-400' : 'text-indigo-400') : ''}>25%</span>
                <span className={downloadProgress.progress >= 50 ? (downloadProgress.status === 'buffering' ? 'text-yellow-400' : 'text-indigo-400') : ''}>50%</span>
                <span className={downloadProgress.progress >= 75 ? (downloadProgress.status === 'buffering' ? 'text-yellow-400' : 'text-indigo-400') : ''}>75%</span>
                <span className={downloadProgress.progress >= 100 ? 'text-green-400' : ''}>100%</span>
              </div>
            )}
          </div>
          
          {/* Additional details */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
              {downloadProgress.total_bytes > 0 && (
                <span>
                  {((downloadProgress.downloaded_bytes / downloadProgress.total_bytes) * 100).toFixed(1)}% complete
                </span>
              )}
            </div>
            <span className="text-gray-500">
              Refreshing every second...
            </span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
      
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