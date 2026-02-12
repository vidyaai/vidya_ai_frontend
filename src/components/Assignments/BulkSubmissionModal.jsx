// src/components/Assignments/BulkSubmissionModal.jsx
import { useState, useCallback } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Trash2 
} from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const BulkSubmissionModal = ({ assignment, isOpen, onClose, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback((files) => {
    const pdfFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024 // 10MB limit
    );
    
    const newFiles = pdfFiles.map(file => ({
      file,
      id: `${file.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      studentName: file.name.replace(/\.pdf$/i, ''), // Extract student name from filename
      status: 'ready'
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadResults(null);

    try {
      const results = await assignmentApi.bulkUploadPDFs(assignment.id, selectedFiles.map(f => f.file));
      setUploadResults(results);
      
      if (results.successful_count > 0) {
        // Clear files and close modal immediately after successful uploads
        setSelectedFiles([]);
        setUploadResults(null);
        onUploadComplete();  // Close modal immediately
        onClose();
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      setUploadResults({
        successful_count: 0,
        failed_count: selectedFiles.length,
        errors: ['Failed to upload files. Please try again.']
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Bulk Upload PDF Submissions</h2>
            <p className="text-gray-400 mt-1">Upload multiple PDF files as student submissions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
              dragActive 
                ? 'border-teal-500 bg-teal-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
              id="bulk-pdf-upload"
            />
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Drop PDF files here or click to browse
            </h3>
            <p className="text-orange-400 mb-4 text-sm">
              {selectedFiles.length===0 && (`Each PDF filename will be used as the student identifier.`)}
            </p>
            <label
              htmlFor="bulk-pdf-upload"
              className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
            >
              <Upload size={20} className="mr-2" />
              Select PDF Files
            </label>
            <p className="text-gray-500 text-sm mt-3">
              Maximum file size: 10MB per PDF
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-700 rounded-lg">
                {selectedFiles.map((fileInfo) => (
                  <div
                    key={fileInfo.id}
                    className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <FileText size={20} className="text-teal-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{fileInfo.name}</p>
                        <p className="text-gray-400 text-sm">
                          Student: {fileInfo.studentName} • {formatFileSize(fileInfo.size)}
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        onClick={() => removeFile(fileInfo.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults && (
            <div className="mb-6">
              <div className={`rounded-lg p-4 border ${
                uploadResults.successful_count > 0 
                  ? 'bg-green-900/30 border-green-700' 
                  : 'bg-red-900/30 border-red-700'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {uploadResults.successful_count > 0 ? (
                    <CheckCircle size={20} className="text-green-400" />
                  ) : (
                    <AlertCircle size={20} className="text-red-400" />
                  )}
                  <span className={`font-medium ${
                    uploadResults.successful_count > 0 ? 'text-green-300' : 'text-red-300'
                  }`}>
                    Upload Complete
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  {uploadResults.successful_count} files uploaded successfully
                  {uploadResults.failed_count > 0 && `, ${uploadResults.failed_count} failed`}
                </p>
                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <ul className="text-red-300 text-sm space-y-1">
                    {uploadResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
          <div className="text-gray-400 text-sm">
            {selectedFiles.length > 0 && (
              <span>{selectedFiles.length} files ready to upload</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {uploading ? (
                <div className="flex items-center">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Uploading...
                </div>
              ) : (
                `Upload ${selectedFiles.length} PDFs`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSubmissionModal;