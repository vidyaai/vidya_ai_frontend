import { useState, useEffect } from 'react';
import { X, Share2, Users, Globe, Lock, Copy, Check, Mail, UserPlus, Trash2 } from 'lucide-react';
import { api } from '../generic/utils.jsx';

const SharingModal = ({ isOpen, onClose, shareType, resourceId, resourceData = null }) => {
  const [shareLink, setShareLink] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
    if (isOpen) {
      setShareLink(null);
      setIsPublic(false);
      setTitle('');
      setDescription('');
      setEmailQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setExistingUsers([]);
      setExistingLinkId(null);
      setCopySuccess(false);
      
      // Set default title based on resource
      if (resourceData) {
        if (shareType === 'folder') {
          setTitle(`Shared Folder: ${resourceData.name}`);
        } else if (shareType === 'chat') {
          setTitle(`Shared Chat: ${resourceData.title || 'Video Chat'}`);
        }
      }
    }
  }, [isOpen, shareType, resourceData]);

  // Check if this is an existing shared link
  const checkExistingShare = async () => {
    if (!resourceId) return;
    
    try {
      // Check if there's already a shared link for this resource
      const response = await api.get('/api/sharing/links', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      const existingLink = response.data.find(link => 
        (shareType === 'folder' && link.folder_id === resourceId) ||
        (shareType === 'chat' && link.chat_session_id === resourceId)
      );
      
      if (existingLink) {
        // Set the existing link to show the share link view
        setShareLink(existingLink);
        // Store existing link data for editing
        setExistingUsers(existingLink.shared_accesses?.map(access => access.user).filter(Boolean) || []);
        // Pre-fill form with existing data
        setTitle(existingLink.title || '');
        setDescription(existingLink.description || '');
        setIsPublic(existingLink.is_public);
        // Store the existing link ID for later use
        setExistingLinkId(existingLink.id);
        
        console.log('Found existing share link:', existingLink);
      }
    } catch (error) {
      console.error('Error checking existing share:', error);
    }
  };

  useEffect(() => {
    if (isOpen && resourceId) {
      checkExistingShare();
    }
  }, [isOpen, resourceId]);

  // Debug: Monitor shareLink state changes
  useEffect(() => {
    console.log('shareLink state changed:', shareLink);
  }, [shareLink]);

  // Search users by email
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.post('/api/sharing/search-users', {
        query: query
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      // Filter out already selected users
      const filtered = response.data.filter(user => 
        !selectedUsers.some(selected => selected.uid === user.uid)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(emailQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailQuery, selectedUsers]);

  const addUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setEmailQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user.uid !== userId));
  };

  const removeExistingUser = async (userId) => {
    if (!existingLinkId) return;
    
    try {
      await api.delete(`/api/sharing/links/${existingLinkId}/users`, {
        data: { user_id: userId },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      // Remove from local state
      setExistingUsers(prev => prev.filter(user => user.uid !== userId));
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user. Please try again.');
    }
  };

  const createShareLink = async () => {
    setCreating(true);
    try {
      if (existingLinkId) {
        // Update existing link
        const updatePayload = {
          title: title.trim() || null,
          description: description.trim() || null,
          is_public: isPublic
        };

        const response = await api.put(`/api/sharing/links/${existingLinkId}`, updatePayload, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        // Add new users if any
        if (selectedUsers.length > 0) {
          await api.post(`/api/sharing/links/${existingLinkId}/users`, {
            user_ids: selectedUsers.map(user => user.uid),
            permission: 'view'
          }, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
        }

        // Show success message and close modal
        alert('Share link updated successfully!');
        onClose();
      } else {
        // Create new link
        const payload = {
          share_type: shareType,
          is_public: isPublic,
          title: title.trim() || null,
          description: description.trim() || null,
          invited_users: selectedUsers.map(user => user.uid)
        };

        if (shareType === 'folder') {
          payload.folder_id = resourceId;
        } else if (shareType === 'chat') {
          payload.video_id = resourceData.videoId;
          payload.chat_session_id = resourceId;
        }

        console.log('Creating share link with payload:', payload);

        const response = await api.post('/api/sharing/links', payload, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        console.log('Share link created:', response.data);
        setShareLink(response.data);
        setCopySuccess(false); // Reset copy success state
      }
    } catch (error) {
      console.error('Error creating/updating share link:', error);
      alert(error.response?.data?.detail || 'Failed to create/update share link');
    } finally {
      setCreating(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Share2 size={20} className="text-indigo-400 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {existingLinkId && shareLink ? 'Edit' : 'Share'} {shareType === 'folder' ? 'Folder' : 'Chat'}
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
              <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Share2 size={16} />
                  <span className="font-medium">Editing Existing Share Link</span>
                </div>
                <p className="text-blue-300 text-sm">
                  You're editing an existing share link. Changes will update the current link.
                </p>
              </div>
            )}

            {/* Title and Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this shared link"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this shared link"
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="mr-3 accent-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-green-400" />
                    <span className="text-white">Public - Anyone with the link can access</span>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="mr-3 accent-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-yellow-400" />
                    <span className="text-white">Private - Only invited users can access</span>
                  </div>
                </label>
              </div>
            </div>

            {/* User Invitation */}
            {!isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Invite Users
                </label>
                
                {/* Existing Users (if editing) */}
                {existingUsers.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Currently Invited Users
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
                            title="Remove user"
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
                      New Users to Invite
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <div
                          key={user.uid}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm"
                        >
                          <span>{user.displayName || user.email}</span>
                          <button
                            onClick={() => removeUser(user.uid)}
                            className="text-indigo-200 hover:text-white"
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
                    placeholder="Search users by email..."
                    className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
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
                        <UserPlus size={16} className="text-indigo-400" />
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

            {/* Create Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
                             <button
                 onClick={createShareLink}
                 disabled={creating || (!isPublic && selectedUsers.length === 0 && existingUsers.length === 0)}
                 className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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
          // Share link created
          <div className="space-y-6">
            <div className="bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Check size={16} />
                <span className="font-medium">
                  {existingLinkId ? 'Share link updated successfully!' : 'Share link created successfully!'}
                </span>
              </div>
              <p className="text-green-300 text-sm">
                {shareLink.is_public 
                  ? 'Anyone with this link can access the shared content.'
                  : `${shareLink.shared_accesses.length} user(s) have been invited.`
                }
              </p>
            </div>

            {/* Share URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Share URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm sm:text-base"
                />
                <button
                  onClick={() => copyToClipboard(getShareUrl())}
                  className="px-2 sm:px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                  title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  <span className="hidden sm:inline">
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Share Details */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Share Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{shareLink.share_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Privacy:</span>
                  <div className="flex items-center gap-1">
                    {shareLink.is_public ? (
                      <>
                        <Globe size={14} className="text-green-400" />
                        <span className="text-green-400">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="text-yellow-400" />
                        <span className="text-yellow-400">Private</span>
                      </>
                    )}
                  </div>
                </div>
                {shareLink.title && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Title:</span>
                    <span className="text-white">{shareLink.title}</span>
                  </div>
                )}
                {!shareLink.is_public && shareLink.shared_accesses.length > 0 && (
                  <div>
                    <span className="text-gray-400">Invited Users:</span>
                    <div className="mt-1 space-y-1">
                      {shareLink.shared_accesses.map(access => (
                        <div key={access.id} className="text-white text-xs">
                          {access.user?.displayName || access.user?.email || 'Unknown User'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {existingLinkId && (
                <button
                  onClick={() => setShareLink(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Share2 size={16} />
                  Edit Share Link
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
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

export default SharingModal;
