// src/components/Assignments/ImportFromDocumentModal.jsx
import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  File
} from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const ImportFromDocumentModal = ({ onClose, onParsed }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Supported file types by OpenAI
  const supportedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/html',
    'text/csv',
    'application/json'
  ];

  const supportedExtensions = ['.pdf', '.txt', '.doc', '.docx', '.md', '.html', '.csv', '.json'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    setError('');
    
    // Check file type
    if (!supportedTypes.includes(file.type) && !supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError('Unsupported file type. Please select a PDF, Word document, text file, or other supported format.');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };


  const handleParse = async () => {
    if (!selectedFile) return;

    setParsing(true);
    setError('');

    try {
      // Convert file to base64
      const fileContent = await fileToBase64(selectedFile);
      
      // Call the backend API to extract questions from the document
      const parsedData = await assignmentApi.importFromDocument(
        fileContent,
        selectedFile.name,
        selectedFile.type,
        null  // No generation options needed for extraction
      );

      // Transform the API response to match the expected format
      const assignmentData = {
        title: parsedData.title,
        description: parsedData.description,
        questions: parsedData.questions || []
      };

      setParsing(false);
      onParsed(assignmentData);
    } catch (err) {
      setParsing(false);
      console.error('Error parsing document:', err);
      
      // Provide more specific error messages
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Invalid document format or content.');
      } else if (err.response?.status === 500) {
        setError('Server error while processing document. Please try again.');
      } else {
        setError('Failed to extract assignment questions from document. Please ensure the document contains assignment questions, exercises, or problems.');
      }
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:mime/type;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Import from Document</h2>
            <p className="text-gray-400 mt-1">Upload an assignment document to extract and import existing questions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Upload Document
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-teal-500 bg-teal-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={supportedExtensions.join(',')}
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mx-auto">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mx-auto">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-2">
                      Drop your document here, or <span className="text-teal-400">browse</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Supports: PDF, Word, Text, Markdown, HTML, CSV, JSON (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* File Info */}
          {selectedFile && !error && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <File size={20} className="text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-white font-medium">Ready to Import</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Your document will be analyzed using AI to extract existing assignment questions and import them into the Assignment Builder.
                    This process may take a few moments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Supported Formats Info */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <FileText size={20} className="text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-blue-400 font-medium">Supported Formats</h4>
                <p className="text-blue-300 text-sm mt-1">
                  PDF documents, Word files (.doc, .docx), plain text (.txt), Markdown (.md), 
                  HTML files, CSV data, and JSON files are supported.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={parsing}
          >
            Cancel
          </button>
          
          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
            >
              <Upload size={18} className="mr-2" />
              Choose File
            </button>
          ) : parsing ? (
            <button
              disabled
              className="inline-flex items-center px-6 py-2 bg-gray-600 text-white font-medium rounded-lg cursor-not-allowed"
            >
              <Loader2 size={18} className="mr-2 animate-spin" />
              Importing Document...
            </button>
          ) : (
            <button
              onClick={handleParse}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            >
              <FileText size={18} className="mr-2" />
              Import Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportFromDocumentModal;
