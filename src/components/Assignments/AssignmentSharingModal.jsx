// src/components/Assignments/AssignmentSharingModal.jsx
import { useState } from 'react';
import { 
  X, 
  Upload, 
  Users, 
  Mail, 
  Share2, 
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AssignmentSharingModal = ({ assignment, onClose }) => {
  const [shareMethod, setShareMethod] = useState('email'); // 'email' or 'csv'
  const [emailList, setEmailList] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const handleEmailListChange = (value) => {
    setEmailList(value);
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const parseEmails = (text) => {
    return text
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    let emails = [];
    
    if (shareMethod === 'email') {
      emails = parseEmails(emailList);
    } else if (shareMethod === 'csv' && csvFile) {
      // TODO: Parse CSV file to extract emails
      // For now, simulate parsing
      emails = ['student1@example.com', 'student2@example.com', 'student3@example.com'];
    }
    
    if (emails.length === 0) {
      alert('Please provide at least one valid email address');
      setIsSharing(false);
      return;
    }

    // Simulate sharing process
    setTimeout(() => {
      const mockShareLink = `https://vidyaai.com/assignments/shared/${assignment.id}/token123`;
      setShareLink(mockShareLink);
      setShareSuccess(true);
      setIsSharing(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    // TODO: Show toast notification
  };

  if (shareSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Assignment Shared Successfully!</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <p className="text-gray-400">
              Your assignment has been shared with the students successfully.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Share Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                <Copy size={16} className="text-white" />
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={copyToClipboard}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share Assignment</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Assignment Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">{assignment.title}</h3>
          <p className="text-gray-400 text-sm mb-3">{assignment.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span>{assignment.totalQuestions} questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Due: {assignment.dueDate}</span>
            </div>
          </div>
        </div>

        {/* Share Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">How would you like to share?</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShareMethod('email')}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                shareMethod === 'email'
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Mail size={20} className={shareMethod === 'email' ? 'text-teal-400' : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`font-medium ${shareMethod === 'email' ? 'text-teal-400' : 'text-white'}`}>
                    Email List
                  </p>
                  <p className="text-gray-400 text-sm">Enter emails manually</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShareMethod('csv')}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                shareMethod === 'csv'
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Upload size={20} className={shareMethod === 'csv' ? 'text-teal-400' : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`font-medium ${shareMethod === 'csv' ? 'text-teal-400' : 'text-white'}`}>
                    CSV Upload
                  </p>
                  <p className="text-gray-400 text-sm">Upload student list</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Email List Input */}
        {shareMethod === 'email' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Student Email Addresses
            </label>
            <textarea
              value={emailList}
              onChange={(e) => handleEmailListChange(e.target.value)}
              placeholder="Enter email addresses separated by commas, semicolons, or new lines:&#10;student1@example.com&#10;student2@example.com&#10;student3@example.com"
              rows={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <p className="text-gray-400 text-sm mt-2">
              {parseEmails(emailList).length} valid email addresses detected
            </p>
          </div>
        )}

        {/* CSV Upload */}
        {shareMethod === 'csv' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload size={32} className="text-gray-400 mb-3" />
                <p className="text-white font-medium mb-1">Click to upload CSV file</p>
                <p className="text-gray-400 text-sm">CSV should contain student email addresses</p>
              </label>
            </div>
            
            {csvFile && (
              <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-green-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{csvFile.name}</p>
                    <p className="text-gray-400 text-xs">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share Options */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Share Options</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="text-teal-500 focus:ring-teal-500 mr-3"
              />
              <span className="text-white">Send email notifications to students</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="text-teal-500 focus:ring-teal-500 mr-3"
              />
              <span className="text-white">Allow students to submit answers</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="text-teal-500 focus:ring-teal-500 mr-3"
              />
              <span className="text-white">Set deadline reminder emails</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || (shareMethod === 'email' && parseEmails(emailList).length === 0) || (shareMethod === 'csv' && !csvFile)}
            className={`flex-1 px-4 py-3 font-medium rounded-lg transition-all duration-300 ${
              isSharing || (shareMethod === 'email' && parseEmails(emailList).length === 0) || (shareMethod === 'csv' && !csvFile)
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
            }`}
          >
            {isSharing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sharing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Share2 size={18} className="mr-2" />
                Share Assignment
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSharingModal;

