import { useState } from 'react';
import { MessageSquare, FileText, ArrowLeft, Download, Loader } from 'lucide-react';
import ChatBoxComponent from './ChatBoxComponent';
import QuizPanel from './QuizPanel';
import { api } from '../generic/utils.jsx';

const InteractivePanel = ({
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
  transcript,
  onQuizSystemMessage
}) => {
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'chat', 'quiz', 'summary'
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Summary state
  const [summaryData, setSummaryData] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [summaryStage, setSummaryStage] = useState('');
  const [summaryError, setSummaryError] = useState(null);

  const handleViewChange = (view) => {
    if (view === 'quiz') {
      setIsQuizOpen(true);
    } else {
      setIsQuizOpen(false);
    }
    setActiveView(view);
  };

  const handleBackToMenu = () => {
    setActiveView('menu');
    setIsQuizOpen(false);
    setSummaryData(null);
    setSummaryError(null);
  };

  const handleSummarize = async () => {
    if (!currentVideo || !currentVideo.videoId) {
      setSummaryError('No video selected');
      return;
    }

    if (!transcript) {
      setSummaryError('Video transcript not available');
      return;
    }

    try {
      setIsSummarizing(true);
      setSummaryError(null);
      setSummaryProgress(0);
      setActiveView('summary');

      // Stage 1: Generate summary
      setSummaryStage('Analyzing video content...');
      setSummaryProgress(33);

      const generateResponse = await api.post(
        '/api/lecture-summary/generate',
        {
          video_id: currentVideo.videoId,
          force_regenerate: false,
        },
        {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        }
      );

      const summaryId = generateResponse.data.summary_id;
      const summaryText = generateResponse.data.summary || 'Summary generated successfully.';

      // Stage 2: Research
      setSummaryStage('Researching external resources...');
      setSummaryProgress(66);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stage 3: Complete
      setSummaryStage('Summary ready!');
      setSummaryProgress(100);

      setSummaryData({
        summaryId,
        text: summaryText,
        title: currentVideo.title || 'Video Summary'
      });

    } catch (err) {
      console.error('Summarization failed:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'Failed to generate summary. Please try again.';
      setSummaryError(errorMessage);
    } finally {
      setIsSummarizing(false);
      setSummaryProgress(0);
      setSummaryStage('');
    }
  };

  const handleDownloadPDF = async () => {
    if (!summaryData || !summaryData.summaryId) return;

    try {
      const downloadResponse = await api.get(
        `/api/lecture-summary/${summaryData.summaryId}/download`,
        {
          headers: { 'ngrok-skip-browser-warning': 'true' },
          responseType: 'blob',
        }
      );

      const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const cleanTitle = (currentVideo.title || 'lecture')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      link.download = `${cleanTitle}_Summary.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setSummaryError('Failed to download PDF. Please try again.');
    }
  };

  // Main menu view
  if (activeView === 'menu') {
    return (
      <div className="w-full h-[750px] bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-b border-zinc-700/50 px-6 py-4">
          <h2 className="text-white text-xl font-semibold tracking-tight">Interactive Panel</h2>
          <p className="text-zinc-400 text-sm mt-1">Choose an option to get started</p>
        </div>

        <div className="flex-1 p-6 space-y-3 overflow-y-auto">
          <button
            onClick={() => handleViewChange('chat')}
            className="group w-full p-5 bg-zinc-800/50 hover:bg-emerald-900/20 border border-zinc-700/50 hover:border-emerald-600/50 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-4"
          >
            <div className="p-3 bg-emerald-600/10 group-hover:bg-emerald-600/20 rounded-lg transition-colors">
              <MessageSquare size={24} className="text-emerald-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-base">AI Video Assistant</div>
              <div className="text-zinc-400 text-sm mt-0.5">Chat about the video content</div>
            </div>
          </button>

          <button
            onClick={() => handleViewChange('quiz')}
            disabled={!currentVideo.videoId}
            className="group w-full p-5 bg-zinc-800/50 hover:bg-emerald-900/20 border border-zinc-700/50 hover:border-emerald-600/50 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800/50 disabled:hover:border-zinc-700/50"
          >
            <div className="p-3 bg-emerald-600/10 group-hover:bg-emerald-600/20 rounded-lg transition-colors">
              <span className="text-2xl">🧠</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-base">Take Quiz</div>
              <div className="text-zinc-400 text-sm mt-0.5">Test your understanding</div>
            </div>
          </button>

          <button
            onClick={handleSummarize}
            disabled={!currentVideo.videoId || !transcript}
            className="group w-full p-5 bg-zinc-800/50 hover:bg-emerald-900/20 border border-zinc-700/50 hover:border-emerald-600/50 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800/50 disabled:hover:border-zinc-700/50"
          >
            <div className="p-3 bg-emerald-600/10 group-hover:bg-emerald-600/20 rounded-lg transition-colors">
              <FileText size={24} className="text-emerald-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-base">Summarize Video</div>
              <div className="text-zinc-400 text-sm mt-0.5">Generate AI summary & notes</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Chat view
  if (activeView === 'chat') {
    return (
      <div className="w-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-b border-zinc-700/50 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="p-2 hover:bg-zinc-700/50 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600/10 rounded-md">
              <MessageSquare size={16} className="text-emerald-500" />
            </div>
            <h2 className="text-white text-base font-semibold">AI Video Assistant</h2>
          </div>
        </div>

        <ChatBoxComponent
          currentVideo={currentVideo}
          currentTime={currentTime}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          onSeekToTime={onSeekToTime}
          onAddSession={onAddSession}
          onToggleHistory={onToggleHistory}
          historyList={historyList}
          activeSessionId={activeSessionId}
          onSelectHistory={onSelectHistory}
          showHistory={showHistory}
          isEmbedded={true}
        />
      </div>
    );
  }

  // Quiz view
  if (activeView === 'quiz') {
    return (
      <div className="w-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-b border-zinc-700/50 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="p-2 hover:bg-zinc-700/50 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600/10 rounded-md">
              <span className="text-xl">🧠</span>
            </div>
            <h2 className="text-white text-base font-semibold">Quiz</h2>
          </div>
        </div>

        <div className="p-4">
          <QuizPanel
            isOpen={isQuizOpen}
            videoId={currentVideo.videoId}
            onClose={handleBackToMenu}
            onSystemMessage={onQuizSystemMessage}
          />
        </div>
      </div>
    );
  }

  // Summary view
  if (activeView === 'summary') {
    return (
      <div className="w-full h-[750px] bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-b border-zinc-700/50 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="p-2 hover:bg-zinc-700/50 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600/10 rounded-md">
              <FileText size={16} className="text-emerald-500" />
            </div>
            <h2 className="text-white text-base font-semibold">Summarize Video</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isSummarizing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="relative">
                <Loader className="animate-spin text-emerald-500" size={48} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-white font-medium">{summaryStage}</p>
                <p className="text-zinc-400 text-sm">{summaryProgress}% complete</p>
              </div>
              <div className="w-full max-w-xs bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summaryProgress}%` }}
                />
              </div>
            </div>
          ) : summaryError ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <p className="text-red-400 text-center">{summaryError}</p>
              <button
                onClick={handleSummarize}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : summaryData ? (
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {summaryData.text}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-500">Loading summary...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default InteractivePanel;
