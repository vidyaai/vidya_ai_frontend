import { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { api } from '../generic/utils.jsx';

//const API_URL = import.meta.env.VITE_API_URL;
// const API_URL='https://d2e2ezlz7asnwt.cloudfront.net';

const YoutubeDownloader = ({ videoId, videoTitle }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async () => {
    if (!videoId) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError('');
    
    try {
      // Get video download URL from your backend
      const response = await api.get(`/api/youtube/download-info`, {
        params: { videoId }
      });
      
      const { downloadUrl, title } = response.data;
      
      if (!downloadUrl) {
        throw new Error("No download URL available");
      }
      
      // Create a hidden anchor to trigger browser download
      // This uses the browser's native download capability
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${title || videoTitle || videoId}.mp4`;
      document.body.appendChild(downloadLink);
      
      // Trigger the download
      downloadLink.click();
      
      // Clean up
      document.body.removeChild(downloadLink);
      
      setDownloadProgress(100);
      
    } catch (error) {
      console.error("Download error:", error);
      setDownloadError(error.message || "Failed to download video");
    } finally {
      setIsDownloading(false);
    }
  };

  // Alternative implementation using fetch with progress tracking
  const handleDownloadWithProgress = async () => {
    if (!videoId) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError('');
    
    try {
      // Get video download URL from your backend
      const response = await api.get(`/api/youtube/download-info`, {
        params: { videoId }
      });
      
      const { downloadUrl, title } = response.data;
      
      if (!downloadUrl) {
        throw new Error("No download URL available");
      }
      
      // Download the video with progress tracking
      const videoResponse = await fetch(downloadUrl);
      
      if (!videoResponse.ok) {
        throw new Error(`Failed to download: ${videoResponse.statusText}`);
      }
      
      // Get content length for progress calculation
      const contentLength = videoResponse.headers.get('content-length');
      const total = parseInt(contentLength, 10) || 0;
      
      // Create a ReadableStream to track download progress
      const reader = videoResponse.body.getReader();
      let receivedLength = 0;
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Update progress
        if (total > 0) {
          setDownloadProgress(Math.round((receivedLength / total) * 100));
        }
      }
      
      // Combine chunks into a single Blob
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${title || videoTitle || videoId}.mp4`;
      document.body.appendChild(downloadLink);
      
      // Trigger the download
      downloadLink.click();
      
      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      
      setDownloadProgress(100);
      
    } catch (error) {
      console.error("Download error:", error);
      setDownloadError(error.message || "Failed to download video");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownloadWithProgress}
        disabled={isDownloading || !videoId}
        className={`flex items-center px-5 py-3 rounded-2xl transition-all duration-200 font-medium shadow-lg ${
          isDownloading
            ? 'bg-gray-700/60 text-gray-400 cursor-not-allowed border border-gray-600/50'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white hover:scale-105 active:scale-95 hover:shadow-blue-500/30'
        }`}
      >
        <Download size={18} className="mr-2" />
        {isDownloading ? `Downloading ${downloadProgress}%` : 'Download Video'}
      </button>

      {isDownloading && (
        <div className="mt-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/50">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className="font-medium">Download Progress</span>
            <span className="font-bold text-blue-400">{downloadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden border border-gray-700/50">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {downloadError && (
        <div className="mt-3 flex items-center text-red-400 bg-red-900/20 border border-red-500/30 p-3 rounded-xl">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm">{downloadError}</span>
        </div>
      )}
    </div>
  );
};

export default YoutubeDownloader;