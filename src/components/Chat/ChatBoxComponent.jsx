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
  showHistory,
  isEmbedded = false
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

  // Reset to 'video' queryType for YouTube videos (frame extraction not supported)
  useEffect(() => {
    if (currentVideo?.sourceType === 'youtube' && queryType === 'frame') {
      setQueryType('video');
    }
  }, [currentVideo?.sourceType, currentVideo?.videoId]);

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
    <div className={`w-full bg-zinc-900 overflow-hidden flex flex-col ${
      isEmbedded ? 'h-[650px]' : 'h-[750px] rounded-lg border border-zinc-800'
    }`}>
      <div className={`px-4 py-3 flex items-center justify-between ${
        !isEmbedded ? 'border-b border-zinc-800' : ''
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddSession}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="New chat"
            disabled={!currentVideo.videoId}
          >
            <PlusCircle size={18} />
          </button>
          <button
            onClick={() => {
              onToggleHistory();
              setShowSharedHistory(false);
            }}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              showHistory ? 'bg-emerald-600 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="History"
            disabled={!currentVideo.videoId}
          >
            <Clock size={18} />
          </button>
          {currentVideo.isShared && currentVideo.shareToken && (
            <button
              onClick={handleSharedHistoryClick}
              className={`p-2 rounded-lg transition-colors ${
                showSharedHistory ? 'bg-emerald-600 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Shared chats"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
        <span className="text-xs text-zinc-600">{formatTime(currentTime || 0)}</span>
      </div>
      
      <div className="flex-grow overflow-hidden">
        {showHistory ? (
          <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {(!historyList || historyList.length === 0) ? (
              <div className="text-zinc-500 text-sm p-8 text-center">No history</div>
            ) : (
              historyList.map((s) => (
                <div
                  key={s.id}
                  className={`w-full px-3 py-2.5 rounded-lg mb-2 text-sm transition-colors ${s.id === activeSessionId ? 'bg-emerald-950 border border-emerald-900 text-white' : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700'}`}
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
                      className="flex items-center gap-2"
                    >
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-gray-900/60 text-white px-3 py-2 rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        placeholder="Conversation name"
                      />
                      <button type="submit" className="text-green-400 hover:text-green-300 transition-colors p-1 hover:bg-green-400/10 rounded-lg" title="Save">
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingSessionId(null); setEditingTitle(''); }}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-lg"
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openChatSharing(s.id)}
                          className="text-gray-400 hover:text-white transition-all p-1.5 hover:bg-gray-700/50 rounded-lg"
                          title="Share chat"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={() => { setEditingSessionId(s.id); setEditingTitle(s.title || ''); }}
                          className="text-gray-400 hover:text-white transition-all p-1.5 hover:bg-gray-700/50 rounded-lg"
                          title="Rename"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1.5">{new Date(s.updatedAt || Date.now()).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        ) : showSharedHistory ? (
          <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700/50 scrollbar-track-transparent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base flex items-center gap-2">
                <Share2 size={18} className="text-indigo-400" />
                Chats Shared with Me
              </h3>
              <button
                onClick={() => setShowSharedHistory(false)}
                className="w-7 h-7 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-sm flex items-center justify-center transition-all duration-200"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-4 text-center py-2 px-3 bg-gray-800/30 rounded-lg border border-gray-800/50">
              💡 Click on any chat card to load it into the chatbox
            </div>
            {sharedHistoryLoading ? (
              <div className="text-center text-gray-500 my-12 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                  <SimpleSpinner size={28} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-400">Loading shared chats...</p>
              </div>
            ) : sharedHistoryError ? (
              <div className="text-center my-12 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center mb-4">
                  <X size={28} className="text-red-500" />
                </div>
                <p className="text-sm text-red-400">{sharedHistoryError}</p>
              </div>
            ) : sharedSessions.length === 0 ? (
              <div className="text-gray-500 text-sm p-8 text-center">No shared chats found for this video.</div>
            ) : (
              sharedSessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => !isLoadingSharedChat && handleSharedChatClick(session)}
                  className={`w-full px-4 py-4 rounded-xl mb-2.5 text-sm bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/50 hover:border-indigo-500/50 text-gray-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99] ${
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
          className="h-full overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        >
        {chatMessages.length === 0 ? (
          <div className="text-center text-zinc-500 my-20">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          chatMessages.map(message => (
            <div
              key={message.id}
              className={`${
                message.sender === 'user'
                  ? 'ml-12 bg-emerald-950 border border-emerald-900'
                  : message.sender === 'system'
                    ? message.isSuccess ? 'bg-green-950 border border-green-900' : 'bg-zinc-800 border border-zinc-700'
                    : 'mr-12 bg-zinc-800 border border-zinc-700'
              } rounded-lg p-3 ${message.isError ? 'border-red-900' : ''}`}
            >
              <div className="flex items-center mb-2">
                <span className={`text-xs font-medium ${
                  message.sender === 'user' ? 'text-emerald-400' :
                  message.sender === 'system' ? 'text-yellow-400' : 'text-zinc-400'
                }`}>
                  {message.sender === 'user' ? 'You' :
                   message.sender === 'system' ? 'System' : 'AI'}
                </span>
                {message.timestamp !== null && (
                  <span className="text-zinc-600 text-xs ml-2">
                    {formatTime(message.timestamp)}
                  </span>
                )}
              </div>
              <div className="text-zinc-200 break-words overflow-wrap-anywhere leading-relaxed text-sm">
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
          <div className="mr-12 bg-zinc-800 border border-zinc-700 rounded-lg p-3">
            <div className="flex items-center">
              <SimpleSpinner size={16} className="mr-2" />
              <span className="text-sm text-zinc-400">Thinking...</span>
            </div>
          </div>
        )}
        </div>
        )}
      </div>
      
      {/* Download Progress Bar */}
      {downloadProgress && (downloadProgress.status === 'preparing' || downloadProgress.status === 'buffering' || downloadProgress.status === 'downloading') && (
        <div className="px-5 py-4 border-t border-gray-800/50 bg-gray-900/60 backdrop-blur-sm">
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
            <div className="w-full bg-gray-800/80 rounded-full h-2.5 overflow-hidden shadow-inner border border-gray-700/50">
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
      <div className="px-4 py-3 border-t border-zinc-800">
        {currentVideo?.sourceType !== 'youtube' && (
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="queryType"
                value="video"
                checked={queryType === 'video'}
                onChange={() => setQueryType('video')}
                className="mr-2 accent-emerald-500"
              />
              <span className="text-xs text-zinc-400">Video</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="queryType"
                value="frame"
                checked={queryType === 'frame'}
                onChange={() => setQueryType('frame')}
                className="mr-2 accent-emerald-500"
              />
              <span className="text-xs text-zinc-400">Frame</span>
            </label>
          </div>
        )}
        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-grow px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-500 text-sm transition-colors"
            disabled={!currentVideo.videoId || isProcessingQuery}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={!userQuestion.trim() || !currentVideo.videoId || isProcessingQuery}
          >
            <Send size={16} />
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