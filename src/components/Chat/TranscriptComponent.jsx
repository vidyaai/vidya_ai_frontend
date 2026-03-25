// TranscriptComponent.jsx - Transcript display with timestamps
import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { SimpleSpinner, api, API_URL } from '../generic/utils.jsx';

const TranscriptComponent = ({
  currentVideo,
  transcript,
  transcriptError,
  isTranscriptLoading,
  onRetryTranscript,
  onSeekToTime
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingTimestampedTranscript, setIsLoadingTimestampedTranscript] = useState(false);
  const [timestampedTranscript, setTimestampedTranscript] = useState('');
  const [showTimestampedVersion, setShowTimestampedVersion] = useState(false);
  const [formattingProgress, setFormattingProgress] = useState({ progress: 0, current: 0, total: 0 });

  const parseTimestampedTranscript = (text) => {
    if (!text) return null;
    
    console.log("🔍 PARSING TRANSCRIPT - First 500 chars:", text.substring(0, 500));
    
    const lines = text.split('\n');
    const elements = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      console.log(`🔍 Line ${index}: "${trimmedLine}"`);
      
      if (trimmedLine.match(/^\d+:\d{2}\s*-\s*\d+:\d{2}$/)) {
        console.log("🎯 TIMESTAMP DETECTED:", trimmedLine);
        
        const parts = trimmedLine.split('-');
        const startTime = parts[0].trim();
        const endTime = parts[1].trim();
        
        const [minutes, seconds] = startTime.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        
        console.log(`⏰ Start time: ${startTime} = ${totalSeconds} seconds`);
        
        elements.push(
          <div key={`timestamp-${index}`} className="mb-2">
            <button
              onClick={() => {
                if (onSeekToTime) {
                  onSeekToTime(totalSeconds);
                }
              }}
              className="text-emerald-400 hover:text-emerald-300 font-mono text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title={`Jump to ${startTime}`}
            >
              {trimmedLine}
            </button>
          </div>
        );
      } else if (trimmedLine.startsWith('Title:')) {
        elements.push(
          <div key={`title-${index}`} className="mb-2 text-gray-400 font-medium">
            {trimmedLine}
          </div>
        );
      } else if (trimmedLine.startsWith('Duration:')) {
        elements.push(
          <div key={`duration-${index}`} className="mb-2 text-gray-400 font-medium">
            {trimmedLine}
          </div>
        );
      } else if (trimmedLine.includes('====')) {
        elements.push(
          <div key={`separator-${index}`} className="mb-3 text-gray-600 text-xs">
            {trimmedLine}
          </div>
        );
      } else if (trimmedLine) {
        elements.push(
          <div key={`content-${index}`} className="mb-2 text-gray-300 ml-4">
            {trimmedLine}
          </div>
        );
      }
    });
    
    console.log("✅ Total elements created:", elements.length);
    return <div className="space-y-1">{elements}</div>;
  };
  
  const loadTimestampedTranscript = async () => {
    console.log("🔍 loadTimestampedTranscript called");
    console.log("🔍 currentVideo.videoId:", currentVideo.videoId);
    console.log("🔍 isLoadingTimestampedTranscript:", isLoadingTimestampedTranscript);
    
    if (!currentVideo.videoId || isLoadingTimestampedTranscript) {
      console.log("❌ Early return - no video ID or already loading");
      return;
    }
    
    setIsLoadingTimestampedTranscript(true);
    setFormattingProgress({ progress: 0, current: 0, total: 0 });
    
    // Show immediate feedback that the process has started
    setFormattingProgress({ progress: 1, current: 0, total: 0 });
    
    try {
      console.log("📡 Making API call to:", `${API_URL}/api/youtube/formatting-status/${currentVideo.videoId}`);
      const statusResponse = await api.get(`/api/youtube/formatting-status/${currentVideo.videoId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      console.log("📋 API Response:", statusResponse.data);
      
      if (statusResponse.data.status === 'completed') {
        console.log("✅ Status is completed, setting transcript");
        setTimestampedTranscript(statusResponse.data.formatted_transcript);
        setShowTimestampedVersion(true);
        setFormattingProgress({ progress: 100, current: 0, total: 0 });
        setIsLoadingTimestampedTranscript(false);
        console.log("✅ Transcript set and loading finished");
        return;
      }
      
      if (statusResponse.data.status === 'formatting' || statusResponse.data.status === 'not_found') {
        console.log("⏳ Status is formatting or not found, starting polling with progress");
        
        if (statusResponse.data.progress !== undefined) {
          setFormattingProgress({
            progress: statusResponse.data.progress || 0,
            current: statusResponse.data.current_chunk || 0,
            total: statusResponse.data.total_chunks || 0
          });
        }
        
        const pollForCompletionWithProgress = async () => {
          let attempts = 0;
          const maxAttempts = 120;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const pollResponse = await api.get(`/api/youtube/formatting-status/${currentVideo.videoId}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
              });
              console.log(`📊 Poll attempt ${attempts + 1}:`, pollResponse.data);
              
              if (pollResponse.data.progress !== undefined) {
                setFormattingProgress({
                  progress: pollResponse.data.progress || 0,
                  current: pollResponse.data.current_chunk || 0,
                  total: pollResponse.data.total_chunks || 0
                });
                console.log(`📈 Progress updated: ${pollResponse.data.progress}% (${pollResponse.data.current_chunk}/${pollResponse.data.total_chunks})`);
              }
              
              if (pollResponse.data.status === 'completed') {
                setTimestampedTranscript(pollResponse.data.formatted_transcript);
                setShowTimestampedVersion(true);
                setFormattingProgress({ progress: 100, current: 0, total: 0 });
                setIsLoadingTimestampedTranscript(false);
                console.log("✅ Formatting completed!");
                return;
              }
              
              if (pollResponse.data.status === 'failed') {
                throw new Error(pollResponse.data.error || 'AI formatting failed');
              }
              
              attempts++;
            } catch (error) {
              console.error('Error polling formatting status:', error);
              break;
            }
          }
          
          throw new Error('AI formatting took too long - please try again');
        };
        
        await pollForCompletionWithProgress();
      } else {
        console.log("🔍 Status not completed or formatting, trying direct fetch");
        const transcriptResponse = await api.get(`/api/youtube/formatted-transcript/${currentVideo.videoId}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (transcriptResponse.data.status === 'completed') {
          setTimestampedTranscript(transcriptResponse.data.formatted_transcript);
          setShowTimestampedVersion(true);
          setFormattingProgress({ progress: 100, current: 0, total: 0 });
        } else {
          throw new Error('Timestamped transcript not available yet - AI processing may still be in progress');
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading timestamped transcript:', error);
      // Handle error appropriately - you might want to pass this to parent component
    } finally {
      setIsLoadingTimestampedTranscript(false);
    }
  };

  const copyTranscript = async () => {
    const textToCopy = showTimestampedVersion && timestampedTranscript ? timestampedTranscript : transcript;
    if (!textToCopy) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          } else {
            console.error('Fallback: Could not copy text');
          }
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Reset timestamped transcript when video changes
  useEffect(() => {
    setTimestampedTranscript('');
    setShowTimestampedVersion(false);
    setFormattingProgress({ progress: 0, current: 0, total: 0 });
  }, [currentVideo.videoId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimestampedVersion(false)}
            className={`text-xs px-3 py-2 rounded-lg transition-colors font-medium ${
              !showTimestampedVersion
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
            }`}
            disabled={!transcript}
          >
            Transcript
          </button>

          <button
            onClick={async () => {
              if (timestampedTranscript) {
                setShowTimestampedVersion(true);
                return;
              }
              await loadTimestampedTranscript();
            }}
            className={`text-xs px-3 py-2 rounded-lg transition-colors flex items-center font-medium ${
              showTimestampedVersion
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
            } ${!currentVideo.videoId ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!currentVideo.videoId || isLoadingTimestampedTranscript}
          >
            {isLoadingTimestampedTranscript ? (
              <SimpleSpinner size={12} className="mr-1" />
            ) : (
              <span>Timestamps</span>
            )}
          </button>
        </div>
        {(transcript || timestampedTranscript) && (
          <button
            onClick={copyTranscript}
            className="text-xs flex items-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <Copy size={12} className="mr-1" />
            {isCopied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {isLoadingTimestampedTranscript && formattingProgress.progress > 0 && (
        <div className="mb-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>Processing</span>
            <span>{formattingProgress.progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${formattingProgress.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-64 overflow-y-auto text-zinc-300 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
      >
        {showTimestampedVersion ? (
          timestampedTranscript ? (
            parseTimestampedTranscript(timestampedTranscript)
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-500 italic">Timestamped transcript is being processed...</p>
              {isLoadingTimestampedTranscript && (
                <div className="mt-4">
                  <SimpleSpinner size={24} />
                  {formattingProgress.progress > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {formattingProgress.progress}% complete
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        ) : isTranscriptLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <SimpleSpinner size={24} className="mb-2 mx-auto" />
              <p className="text-zinc-500 text-sm">Loading...</p>
            </div>
          </div>
        ) : transcriptError ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-zinc-400 text-sm mb-4">No transcript available</p>
            {onRetryTranscript && (
              <button
                onClick={onRetryTranscript}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : transcript ? (
          transcript.split('\n').map((line, index) => (
            <p key={index} className="mb-2 text-zinc-300 leading-relaxed">
              {line}
            </p>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm">Load a video to view transcript</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptComponent;