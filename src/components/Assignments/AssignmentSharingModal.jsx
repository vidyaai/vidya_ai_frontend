import { useState, useEffect } from 'react';
import { X, Search, Users, Lock, Copy, Check, Loader2, Mail, FileText, Link as LinkIcon, Globe } from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const AssignmentSharingModal = ({ assignment, onClose, onRefresh }) => {
  const [shareFormat, setShareFormat] = useState('html_form'); // 'pdf', 'html_form', or 'google_forms'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formatUrls, setFormatUrls] = useState({
    pdf: null,
    googleForm: null
  });

  useEffect(() => {
    loadSharedAssignmentData();
  }, [assignment.id]);

  const loadSharedAssignmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sharedData = await assignmentApi.getSharedAssignmentLink(assignment.id);
      
      if (sharedData) {
        setShareLink(sharedData.share_link || '');
        setShareFormat(sharedData.share_format || 'html_form');
        
        // Set format URLs from shared data
        setFormatUrls({
          pdf: assignmentApi.getPDFDownloadURL(assignment.id),
          googleForm: sharedData.google_resource_url || null
        });
        
        // Load user details for shared users
        if (sharedData.shared_with && sharedData.shared_with.length > 0) {
          try {
            const userDetails = await assignmentApi.getUsersByIds(sharedData.shared_with);
            setSharedUsers(userDetails.users || []);
          } catch (err) {
            console.error('Error loading user details:', err);
            setSharedUsers([]);
          }
        }
      } else {
        // No shared data exists, but we can still provide PDF download
        setFormatUrls({
          pdf: assignmentApi.getPDFDownloadURL(assignment.id),
          googleForm: null
        });
      }
    } catch (err) {
      console.error('Error loading shared assignment data:', err);
      // If 404, it means no shared link exists yet - this is fine for a new share
      if (err.response?.status === 404) {
        // Keep current shareFormat state, just set URLs
        setFormatUrls({
          pdf: assignmentApi.getPDFDownloadURL(assignment.id),
          googleForm: null
        });
      } else {
        setError('Failed to load sharing information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      const blobUrl = await assignmentApi.generateAssignmentPDF(assignment.id);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${assignment.title || 'assignment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await assignmentApi.searchUsers(query);
      
      // Handle different API response structures
      const usersList = results.users || results || [];
      
      // Filter out already shared users
      const sharedUserIds = sharedUsers.map(u => u.uid);
      const filteredResults = usersList.filter(
        user => !sharedUserIds.includes(user.uid)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    const userId = user.uid;
    if (!selectedUsers.find(u => u.uid === userId)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.uid !== userId));
  };

  const handleShareAssignment = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one student to share with');
      return;
    }

    try {
      setIsSharing(true);
      
      console.log('Selected users before mapping:', selectedUsers);
      const userIds = selectedUsers.map(u => {
        console.log('User object:', u);
        return u.uid; // FirebaseUser uses 'uid' property
      });
      console.log('Mapped user IDs:', userIds);

      const shareData = {
        assignment_id: assignment.id,
        shared_with_user_ids: userIds,
        share_format: shareFormat,
        permission: 'complete', // Fixed permission for students
        is_public: false // Always private for individual student sharing
      };

      console.log('Sharing with data:', shareData);

      const response = await assignmentApi.shareAssignment(assignment.id, shareData);
      
      if (response.share_link) {
        setShareLink(response.share_link);
      }

      // Reload shared users
      await loadSharedAssignmentData();
      setSelectedUsers([]);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error sharing assignment:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to share assignment: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveSharedUser = async (userId) => {
    if (!window.confirm('Remove this student from the assignment?')) {
      return;
    }

    try {
      // Get the share ID from the shared data
      const sharedData = await assignmentApi.getSharedAssignmentLink(assignment.id);
      if (sharedData && sharedData.id) {
        await assignmentApi.removeUserFromSharedAssignment(sharedData.id, userId);
        await loadSharedAssignmentData();
        
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err) {
      console.error('Error removing user:', err);
      alert('Failed to remove student. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleUpdateShareFormat = async (newFormat) => {
    console.log('handleUpdateShareFormat called with format:', newFormat);
    
    // First, update local state immediately for better UX
    setShareFormat(newFormat);
    
    try {
      const sharedData = await assignmentApi.getSharedAssignmentLink(assignment.id);
      console.log('Existing shared data:', sharedData);
      
      if (sharedData && sharedData.id) {
        // Get current shared user IDs from the shared_accesses array
        const currentSharedUserIds = (sharedData.shared_accesses || []).map(access => access.user_id);
        console.log('Extracted user IDs from shared_accesses:', currentSharedUserIds);
        // Get permission from first shared access (they should all be the same)
        const currentPermission = sharedData.shared_accesses?.[0]?.permission || 'complete';
        
        // Prepare complete update data matching ShareAssignmentRequest schema
        const updateData = {
          assignment_id: assignment.id,
          shared_with_user_ids: currentSharedUserIds,
          permission: currentPermission,
          share_format: newFormat,
          title: sharedData.title,
          description: sharedData.description,
          is_public: sharedData.is_public || false,
          expires_at: sharedData.expires_at
        };

        console.log('Updating share format with data:', updateData);

        const updatedSharedData = await assignmentApi.updateSharedAssignment(assignment.id, sharedData.id, updateData);
        
        // Update format URLs if Google Form was created
        if (newFormat === 'google_forms' && updatedSharedData.google_resource_url) {
          setFormatUrls(prev => ({
            ...prev,
            googleForm: updatedSharedData.google_resource_url
          }));
        }
        
        console.log('Share format updated successfully on server');
      } else {
        // No shared link exists yet - format will be used when sharing
        console.log('No existing shared link, format will be used when sharing');
      }
    } catch (err) {
      console.error('Error updating share format:', err);
      // If no shared link exists yet (404), that's fine - we already updated local state
      if (err.response?.status === 404) {
        console.log('No shared link yet, format will be used when sharing');
      } else {
        // For other errors, revert the local state and show error
        console.error('Error details:', err.response?.data);
        setShareFormat(shareFormat); // Revert to previous value
        alert(`Failed to update share format: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <Users className="text-teal-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Share Assignment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={32} className="text-teal-500 animate-spin" />
              <span className="ml-3 text-gray-300">Loading...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Assignment Details */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start space-x-3">
                  <FileText className="text-teal-400 mt-1" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Assignment Details</h3>
                    <h4 className="text-lg font-medium text-white mb-2">{assignment.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{assignment.total_questions} Questions</span>
                      <span>•</span>
                      <span>{assignment.total_points} Points</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <LinkIcon size={16} />
                  <span>Export & Download</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* PDF Download */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <FileText className="text-red-400" size={18} />
                        </div>
                        <div>
                          <div className="font-medium text-white">PDF Document</div>
                          <div className="text-sm text-gray-400">Professional formatted assignment</div>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloadingPDF}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                      >
                        {isDownloadingPDF ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <LinkIcon size={16} />
                        )}
                        <span>{isDownloadingPDF ? 'Downloading...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Google Forms Link */}
                  {formatUrls.googleForm && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <Globe className="text-green-400" size={18} />
                          </div>
                          <div>
                            <div className="font-medium text-white">Google Form</div>
                            <div className="text-sm text-gray-400">Interactive online form</div>
                          </div>
                        </div>
                        <a
                          href={formatUrls.googleForm}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        >
                          <LinkIcon size={16} />
                          <span>Open Form</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Settings - Always Private */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Privacy Settings</h3>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      <Lock className="text-gray-400" size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Private</div>
                      <div className="text-sm text-gray-400">Only invited students can access</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Format Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Share As:
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleUpdateShareFormat('html_form')}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                      shareFormat === 'html_form'
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      shareFormat === 'html_form' ? 'border-teal-500' : 'border-gray-600'
                    }`}>
                      {shareFormat === 'html_form' && (
                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        HTML Form {shareFormat === 'html_form' && '(Current Format)'}
                      </div>
                      <div className="text-sm text-gray-400">Interactive online form with instant validation</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUpdateShareFormat('pdf')}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                      shareFormat === 'pdf'
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      shareFormat === 'pdf' ? 'border-teal-500' : 'border-gray-600'
                    }`}>
                      {shareFormat === 'pdf' && (
                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        PDF {shareFormat === 'pdf' && '(Current Format)'}
                      </div>
                      <div className="text-sm text-gray-400">Downloadable PDF document for offline work</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUpdateShareFormat('google_forms')}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                      shareFormat === 'google_forms'
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      shareFormat === 'google_forms' ? 'border-teal-500' : 'border-gray-600'
                    }`}>
                      {shareFormat === 'google_forms' && (
                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        Google Forms {shareFormat === 'google_forms' && '(Current Format)'}
                      </div>
                      <div className="text-sm text-gray-400">Export to Google Forms for easy distribution</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Share with Students */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <Users size={16} />
                  <span>Share with Students</span>
                </h3>

                {/* Search Input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search students by email..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchQuery && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-400">
                          <Loader2 size={20} className="animate-spin mx-auto" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <button
                            key={user.uid}
                            onClick={() => handleSelectUser(user)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center space-x-3"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-white text-sm">{user.displayName || 'Unknown'}</div>
                              <div className="text-gray-400 text-xs">{user.email}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          No students found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Selected students:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.uid}
                          className="flex items-center space-x-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-white">{user.email}</span>
                          <button
                            onClick={() => handleRemoveSelectedUser(user.uid)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShareAssignment}
                  disabled={selectedUsers.length === 0 || isSharing}
                  className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isSharing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      <span>Share with Selected Students</span>
                    </>
                  )}
                </button>
              </div>

              {/* Currently Shared Users */}
              {sharedUsers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">
                    Currently Shared With ({sharedUsers.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sharedUsers.map((user) => (
                      <div
                        key={user.uid}
                        className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-white">{user.displayName || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSharedUser(user.uid)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Remove student"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Link */}
              {shareLink && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                    <LinkIcon size={16} />
                    <span>Share Link</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {copySuccess ? (
                        <>
                          <Check size={18} />
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Students can access the assignment using this link. By default, they can only view and submit their responses.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSharingModal;
