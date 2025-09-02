// VideoUploader.jsx - Upload functionality extracted from UserVideoLibrary
import { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { SimpleSpinner, api, API_URL } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';

const VideoUploader = ({ onUploadComplete, onUploadSuccess }) => {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [clientUploadProgress, setClientUploadProgress] = useState(0);
  const [serverStatus, setServerStatus] = useState(null); // { status, message, progress, current_step, total_steps, error }
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [error, setError] = useState('');
  const [hasCalledOnUploadComplete, setHasCalledOnUploadComplete] = useState(false);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const isMountedRef = useRef(true);
  


  const canUse = !!currentUser?.uid;
  


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const resetUploadState = () => {
    setIsUploading(false);
    setClientUploadProgress(0);
    setCurrentUploadId(null);
    setError('');
    setHasCalledOnUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // Clear server status after a delay so user can see completion
    setTimeout(() => {
      if (isMountedRef.current) {
        setServerStatus(null);
      }
    }, 3000);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canUse) return;
    setIsUploading(true);
    setClientUploadProgress(0);
    setServerStatus(null);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const resp = await api.post(`/api/user-videos/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' },
        onUploadProgress: (pe) => {
          if (!pe.total) return;
          const pct = Math.round((pe.loaded / pe.total) * 100);
          setClientUploadProgress(pct);
        }
      });

      const vid = resp.data?.video_id;
      setCurrentUploadId(vid || null);

      if (vid) {
        // Begin polling server-side upload status
        const poll = async () => {
          try {
            const s = await api.get(`/api/user-videos/upload-status/${vid}`, {
              headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            
            setServerStatus(s.data);

            if (s.data?.status === 'completed') {
              clearInterval(pollRef.current);
              pollRef.current = null;
              setIsUploading(false);
              setClientUploadProgress(100);
              // Call the callback to notify parent component only once
              if (!hasCalledOnUploadComplete) {
                setHasCalledOnUploadComplete(true);
                onUploadComplete?.(vid);
                onUploadSuccess?.();
              }
              // Reset after a short delay
              setTimeout(() => {
                if (isMountedRef.current) {
                  resetUploadState();
                }
              }, 2000);
            } else if (s.data?.status === 'failed') {
              clearInterval(pollRef.current);
              pollRef.current = null;
              resetUploadState();
              setError(s.data?.message || s.data?.error || 'Upload failed');
            } else if (s.data?.status === 'not_found') {
              // Upload record was deleted/rolled back - treat as failure
              clearInterval(pollRef.current);
              pollRef.current = null;
              resetUploadState();
              setError('Upload failed. Try with a shorter video.');
            }
          } catch (err) {
            // keep polling for transient errors, but if 4xx/5xx persist, consider stopping
          }
        };
        // immediate poll, then interval
        await poll();
        pollRef.current = setInterval(poll, 1500);
      } else {
        // No video id returned; treat as error
        resetUploadState();
        setError('Upload failed: missing video_id');
      }
    } catch (e) {
      resetUploadState();
      setError(e.response?.data?.detail || e.message || 'Upload failed');
    }
  };

  return (
    <>
      <button
        onClick={handleUploadClick}
        className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg flex items-center justify-center"
        disabled={!canUse || isUploading}
        title={canUse ? 'Upload video' : 'Login required'}
      >
        {isUploading ? (
          <>
            <SimpleSpinner size={20} className="mr-2" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload size={20} className="mr-2" />
            <span>Upload</span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Upload Progress UI */}
      {(isUploading || serverStatus || (currentUploadId && !hasCalledOnUploadComplete)) && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-3 z-50 min-w-[300px] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white text-sm font-semibold">Upload Progress</div>
            {(isUploading || (currentUploadId && !hasCalledOnUploadComplete)) && <SimpleSpinner size={16} />}
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-gray-300 text-xs mb-1">Client upload to server</div>
              <div className="w-full h-2 bg-gray-700 rounded">
                <div
                  className="h-2 bg-indigo-500 rounded"
                  style={{ width: `${clientUploadProgress}%` }}
                />
              </div>
              <div className="text-gray-400 text-xs mt-1">{clientUploadProgress}%</div>
            </div>
            {(serverStatus || (currentUploadId && !hasCalledOnUploadComplete)) && (
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-300 text-xs mb-1">Server processing</div>
                  <div className="text-gray-400 text-xs">
                    {serverStatus?.progress !== undefined ? `${serverStatus.progress}%` : 'Waiting...'}
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded">
                  <div
                    className="h-2 bg-green-500 rounded transition-all duration-300"
                    style={{ width: `${serverStatus?.progress ?? 0}%` }}
                  />
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {serverStatus?.current_step ? `Step ${serverStatus.current_step}/${serverStatus.total_steps || 6} ` : ''}
                  {serverStatus?.message || serverStatus?.status || 'Processing...'}
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-400 text-sm mt-2">{error}</div>
          )}
        </div>
      )}
    </>
  );
};

export default VideoUploader;
