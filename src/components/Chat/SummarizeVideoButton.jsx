import { useState } from 'react';
import { FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../generic/utils.jsx';

const SummarizeVideoButton = ({ currentVideo, transcript }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSummarize = async () => {
    if (!currentVideo || !currentVideo.videoId) {
      setError('No video selected');
      return;
    }

    if (!transcript) {
      setError('Video transcript not available');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);
      setProgress(0);

      // Stage 1: Generate summary
      setStage('Analyzing video content...');
      setProgress(33);

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

      // Stage 2: Research (simulated progress)
      setStage('Researching external resources...');
      setProgress(66);

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stage 3: Download PDF
      setStage('Generating PDF summary...');
      setProgress(100);

      const downloadResponse = await api.get(
        `/api/lecture-summary/${summaryId}/download`,
        {
          headers: { 'ngrok-skip-browser-warning': 'true' },
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Clean filename
      const cleanTitle = (currentVideo.title || 'lecture')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      link.download = `${cleanTitle}_Summary.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Success state
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Summarization failed:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'Failed to generate summary. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStage('');
    }
  };

  return (
    <div className="w-full p-4 bg-gray-800 rounded-xl shadow-lg">
      {/* Default state */}
      {!isGenerating && !success && !error && (
        <button
          onClick={handleSummarize}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <FileText size={20} />
          Summarize Video
        </button>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="space-y-3">
          <button
            disabled
            className="w-full px-6 py-4 bg-gray-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 opacity-75 cursor-not-allowed"
          >
            <Loader className="animate-spin" size={20} />
            {stage}
          </button>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-gray-400 text-sm">
            {progress}% complete
          </div>
        </div>
      )}

      {/* Success state */}
      {success && (
        <div className="flex items-center justify-center gap-2 text-green-400 font-semibold py-4">
          <CheckCircle size={20} />
          PDF Downloaded Successfully!
        </div>
      )}

      {/* Error state */}
      {error && !isGenerating && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800/30">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleSummarize}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default SummarizeVideoButton;
