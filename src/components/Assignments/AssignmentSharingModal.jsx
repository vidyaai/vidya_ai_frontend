// src/components/Assignments/AssignmentSharingModal.jsx
import { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Users, 
  Globe, 
  Lock, 
  Copy, 
  Check, 
  Mail, 
  UserPlus, 
  Trash2,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const AssignmentSharingModal = ({ assignment, onClose, onRefresh }) => {
  const [shareLink, setShareLink] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [permission, setPermission] = useState('complete');
  const [emailQuery, setEmailQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [existingUsers, setExistingUsers] = useState([]);
  const [existingLinkId, setExistingLinkId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (assignment) {
      setShareLink(null);
      setIsPublic(false);
      setPermission('complete');
      setEmailQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setExistingUsers([]);
      setExistingLinkId(null);
      setCopySuccess(false);
      
      // Check for existing shared link
      checkExistingShare();
    }
  }, [assignment]);

  // Fetch user details by UIDs
  const fetchUserDetails = async (userIds) => {
    if (!userIds || userIds.length === 0) return [];
    
    try {
      const users = await assignmentApi.getUsersByIds(userIds);
      return users;
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Return fallback data with UIDs as display names
      return userIds.map(uid => ({
        uid: uid,
        email: uid,
        displayName: uid
      }));
    }
  };

  // Check if this assignment is already shared
  const checkExistingShare = async () => {
    if (!assignment?.id) return;
    
    try {
      const existingLink = await assignmentApi.getSharedAssignmentLink(assignment.id);
      
      if (existingLink) {
        // Don't set shareLink here - we want to show the form with existing data
        // setShareLink(existingLink);
        
        // Get user details for shared accesses
        const userIds = existingLink.shared_accesses?.map(access => access.user_id) || [];
        const existingUserList = await fetchUserDetails(userIds);
        setExistingUsers(existingUserList);
        setIsPublic(existingLink.is_public);
        setExistingLinkId(existingLink.id);
      }
    } catch (error) {
      console.error('Error checking existing share:', error);
    }
  };

  // Search users by email
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await assignmentApi.searchUsers(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(emailQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [emailQuery]);

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.uid === user.uid) && 
        !existingUsers.find(u => u.uid === user.uid)) {
      setSelectedUsers(prev => [...prev, user]);
      setEmailQuery('');
      setSearchResults([]);
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user.uid !== userId));
  };

  const removeExistingUser = async (userId) => {
    if (!existingLinkId) return;
    
    try {
      await assignmentApi.removeUserFromSharedAssignment(existingLinkId, userId);
      setExistingUsers(prev => prev.filter(user => user.uid !== userId));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user. Please try again.');
    }
  };

  const createShareLink = async () => {
    if (!assignment?.id) return;

    setCreating(true);
    try {
      const allUsers = [...existingUsers, ...selectedUsers];
      const shareData = {
        assignment_id: assignment.id,
        shared_with_user_ids: allUsers.map(u => u.uid),
        permission: permission,
        title: assignment.title,
        description: assignment.description,
        is_public: isPublic,
        expires_at: null
      };

      let response;
      if (existingLinkId) {
        // Update existing share link
        response = await assignmentApi.updateSharedAssignment(assignment.id, existingLinkId, shareData);
      } else {
        // Create new share link
        response = await assignmentApi.shareAssignment(assignment.id, shareData);
      }

      setShareLink(response);
      setCopySuccess(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating/updating share link:', error);
      alert(error.response?.data?.detail || 'Failed to create/update share link');
    } finally {
      setCreating(false);
    }
  };

  const deleteShareLink = async () => {
    if (!existingLinkId || !assignment?.id) return;

    if (!confirm('Are you sure you want to delete this shared link? This will remove access for all users.')) {
      return;
    }

    try {
      await assignmentApi.deleteSharedAssignment(assignment.id, existingLinkId);
      setShareLink(null);
      setExistingLinkId(null);
      setExistingUsers([]);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting share link:', error);
      alert('Failed to delete share link. Please try again.');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getShareUrl = () => {
    if (!shareLink) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${shareLink.share_token}`;
  };

  if (!assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Share2 size={20} className="text-teal-400 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {existingLinkId && shareLink ? 'Edit' : 'Share'} Assignment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {!shareLink ? (
          // Create share link form
          <div className="space-y-6">
            {/* Show existing link info if editing */}
            {existingLinkId && (
              <div className="bg-teal-900 bg-opacity-50 border border-teal-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-teal-400 mb-2">
                  <Share2 size={16} />
                  <span className="font-medium">Editing Existing Share Link</span>
                </div>
                <p className="text-teal-300 text-sm">
                  You're editing an existing share link. Changes will update the current link.
                </p>
              </div>
            )}

            {/* Assignment Info */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <FileText size={16} />
                <span className="font-medium">Assignment Details</span>
              </div>
              <h4 className="text-white font-medium">{assignment.title}</h4>
              {assignment.description && (
                <p className="text-gray-400 text-sm mt-1">{assignment.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span>{assignment.total_questions} Questions</span>
                <span>{assignment.total_points} Points</span>
                {assignment.due_date && (
                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Privacy Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="text-teal-500 focus:ring-teal-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Lock size={16} className="text-gray-400 mr-2" />
                      <span className="text-white font-medium">Private</span>
                    </div>
                    <p className="text-gray-400 text-sm">Only invited students can access</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="text-teal-500 focus:ring-teal-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Globe size={16} className="text-gray-400 mr-2" />
                      <span className="text-white font-medium">Public</span>
                    </div>
                    <p className="text-gray-400 text-sm">Anyone with the link can access</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Permission Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Student Permission
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="view">View Only - Students can view but not submit</option>
                <option value="complete">Complete - Students can view and submit</option>
                <option value="edit">Edit - Students can view, submit, and modify</option>
              </select>
            </div>



            {/* User Management */}
            {!isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Users size={16} className="inline mr-2" />
                  Share with Students
                </label>
                
                {/* Existing Users */}
                {existingUsers.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Current Students
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {existingUsers.map(user => (
                        <div
                          key={user.uid}
                          className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1 rounded-full text-sm"
                        >
                          <span>{user.displayName || user.email}</span>
                          <button
                            onClick={() => removeExistingUser(user.uid)}
                            className="text-gray-300 hover:text-white"
                            title="Remove student"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      New Students to Invite
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <div
                          key={user.uid}
                          className="flex items-center gap-2 bg-teal-600 text-white px-3 py-1 rounded-full text-sm"
                        >
                          <span>{user.displayName || user.email}</span>
                          <button
                            onClick={() => removeUser(user.uid)}
                            className="text-teal-200 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Search */}
                <div className="relative">
                  <input
                    type="email"
                    value={emailQuery}
                    onChange={(e) => setEmailQuery(e.target.value)}
                    placeholder="Search students by email..."
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.uid}
                        onClick={() => addUser(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-600 flex items-center gap-2 border-b border-gray-600 last:border-b-0"
                      >
                        <UserPlus size={16} className="text-teal-400" />
                        <div>
                          <div className="text-white text-sm">{user.displayName || 'Unknown'}</div>
                          <div className="text-gray-400 text-xs">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              {existingLinkId && (
                <button
                  onClick={deleteShareLink}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
              <button
                onClick={createShareLink}
                disabled={creating || (!isPublic && selectedUsers.length === 0 && existingUsers.length === 0)}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {existingLinkId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    {existingLinkId ? 'Update Share Link' : 'Create Share Link'}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Share link created view
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 size={32} className="text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Assignment Shared Successfully!</h3>
              <p className="text-gray-400">
                Your assignment is now shared and accessible to students.
              </p>
            </div>

            {/* Share Link */}
            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Share Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(getShareUrl())}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Share Info */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Privacy:</span>
                  <div className="flex items-center gap-1 text-white mt-1">
                    {shareLink.is_public ? <Globe size={14} /> : <Lock size={14} />}
                    {shareLink.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Students:</span>
                  <div className="text-white mt-1">
                    {shareLink.is_public ? 'Anyone with link' : `${existingUsers.length + selectedUsers.length} invited`}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShareLink(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Edit Settings
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSharingModal;