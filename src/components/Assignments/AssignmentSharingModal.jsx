import { useState, useEffect, useRef } from 'react';
import { X, Search, Users, Lock, Copy, Check, Loader2, FileText, Link as LinkIcon, Globe, Upload, AlertTriangle, UserPlus, Share2, Trash2 } from 'lucide-react';
import { assignmentApi } from './assignmentApi';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AssignmentSharingModal = ({ assignment, onClose, onRefresh }) => {
  // Share link state - null means form view, object means link created/success view
  const [shareLinkData, setShareLinkData] = useState(null);
  const [existingLinkId, setExistingLinkId] = useState(null);
  
  // Form states
  const [isPublic, setIsPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [existingUsers, setExistingUsers] = useState([]);
  
  // UI states
  const [isSearching, setIsSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isGeneratingGoogleForm, setIsGeneratingGoogleForm] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formatUrls, setFormatUrls] = useState({
    pdf: null,
    googleForm: null
  });
  
  // CSV upload states
  const [csvErrors, setCsvErrors] = useState([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    loadSharedAssignmentData();
  }, [assignment.id]);

  const loadSharedAssignmentData = async () => {
    try {
      setLoading(true);
      
      const sharedData = await assignmentApi.getSharedAssignmentLink(assignment.id);
      const pdfUrl = assignmentApi.getPDFDownloadURL(assignment.id);
      let googleFormUrl = assignment.google_form_url || assignment.google_form_response_url || null;
      
      if (sharedData && sharedData.id) {
        // Existing share link found - show success view
        setExistingLinkId(sharedData.id);
        setIsPublic(sharedData.is_public || false);
        setShareLinkData(sharedData);
        
        // Load user details for existing shared users
        // Extract user IDs from shared_accesses array
        const sharedUserIds = sharedData.shared_accesses?.map(access => access.user_id) || [];
        console.log('sharedData:', sharedData);
        console.log('sharedUserIds:', sharedUserIds);
        if (sharedUserIds.length > 0) {
          try {
            const userDetails = await assignmentApi.getUsersByIds(sharedUserIds);
            // Handle both array response and {users: [...]} response
            const users = Array.isArray(userDetails) ? userDetails : (userDetails.users || []);
            setExistingUsers(users);
          } catch (err) {
            console.error('Error loading user details:', err);
            setExistingUsers([]);
          }
        } else {
          setExistingUsers([]);
        }
      }
      
      setFormatUrls({ pdf: pdfUrl, googleForm: googleFormUrl });
      
      if (!googleFormUrl) {
        generateGoogleFormInBackground();
      }
    } catch (err) {
      console.error('Error loading shared assignment data:', err);
      setFormatUrls({
        pdf: assignmentApi.getPDFDownloadURL(assignment.id),
        googleForm: null
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateGoogleFormInBackground = async () => {
    try {
      setIsGeneratingGoogleForm(true);
      const result = await assignmentApi.generateGoogleForm(assignment.id);
      if (result && result.google_resource_url) {
        setFormatUrls(prev => ({ ...prev, googleForm: result.google_resource_url }));
      }
    } catch (err) {
      console.error('Error generating Google Form:', err);
    } finally {
      setIsGeneratingGoogleForm(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      const blobUrl = await assignmentApi.generateAssignmentPDF(assignment.id);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${assignment.title || 'assignment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading PDF:', err);
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
      const usersList = results.users || results || [];
      
      const existingIds = new Set([
        ...existingUsers.map(u => u.uid),
        ...selectedUsers.map(u => u.uid)
      ]);
      setSearchResults(usersList.filter(user => !existingIds.has(user.uid)));
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    if (!selectedUsers.find(u => u.uid === user.uid)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.uid !== userId));
  };

  const handleRemoveExistingUser = async (userId) => {
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

  // Create or Update share link - KEY FUNCTION
  const createShareLink = async () => {
    setCreating(true);
    try {
      const userIds = selectedUsers.filter(u => !u.isPending).map(u => u.uid);
      const pendingEmails = selectedUsers.filter(u => u.isPending).map(u => u.email);

      const shareData = {
        assignment_id: assignment.id,
        shared_with_user_ids: userIds,
        pending_emails: pendingEmails,
        permission: 'complete',
        is_public: isPublic
      };

      const response = await assignmentApi.shareAssignment(assignment.id, shareData);
      
      // Set the share link data to show SUCCESS VIEW
      setShareLinkData({
        ...response,
        share_token: response.share_token,
        is_public: isPublic,
        shared_accesses: response.shared_accesses || []
      });
      
      if (response.id) setExistingLinkId(response.id);
      
      // Move selected users to existing users
      setExistingUsers(prev => [...prev, ...selectedUsers.filter(u => !u.isPending)]);
      setSelectedUsers([]);
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error creating/updating share link:', err);
      alert(err.response?.data?.detail || 'Failed to create/update share link');
    } finally {
      setCreating(false);
    }
  };

  const deleteShareLink = async () => {
    if (!existingLinkId) return;
    if (!confirm('Are you sure you want to delete this share link? Students will no longer be able to access this assignment via the link.')) {
      return;
    }

    setDeleting(true);
    try {
      await assignmentApi.deleteSharedAssignment(assignment.id, existingLinkId);
      alert('Share link deleted successfully!');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting share link:', error);
      alert(error.response?.data?.detail || 'Failed to delete share link');
    } finally {
      setDeleting(false);
    }
  };

  const getShareUrl = () => {
    if (!shareLinkData?.share_token) return '';
    return `${window.location.origin}/shared/${shareLinkData.share_token}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // CSV upload handler
  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingCsv(true);
    setCsvErrors([]);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      const validEmails = [];
      const invalidEmails = [];
      const existingEmails = new Set([
        ...selectedUsers.map(u => u.email?.toLowerCase()),
        ...existingUsers.map(u => u.email?.toLowerCase())
      ].filter(Boolean));

      for (const line of lines) {
        const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
        const email = columns.find(col => EMAIL_REGEX.test(col)) || columns[0];
        if (!email || !email.trim()) continue;
        
        const cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
          invalidEmails.push(email);
          continue;
        }
        if (existingEmails.has(cleanEmail)) continue;
        
        existingEmails.add(cleanEmail);
        validEmails.push(cleanEmail);
      }

      if (invalidEmails.length > 0) setCsvErrors(invalidEmails.slice(0, 5));

      if (validEmails.length > 0) {
        const newUsers = validEmails.map(email => ({
          uid: `pending_${email}`,
          email: email,
          displayName: null,
          isPending: true
        }));
        setSelectedUsers(prev => [...prev, ...newUsers]);
      }
    } catch (err) {
      console.error('Error processing CSV:', err);
      setCsvErrors(['Failed to process CSV file']);
    } finally {
      setIsProcessingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const handleAddEmail = (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) return false;
    
    const existingEmails = new Set([
      ...selectedUsers.map(u => u.email?.toLowerCase()),
      ...existingUsers.map(u => u.email?.toLowerCase())
    ].filter(Boolean));
    
    if (existingEmails.has(cleanEmail)) return false;
    
    setSelectedUsers(prev => [...prev, {
      uid: `pending_${cleanEmail}`,
      email: cleanEmail,
      displayName: null,
      isPending: true
    }]);
    setSearchQuery('');
    setSearchResults([]);
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Share2 size={20} className="text-teal-400 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {existingLinkId ? 'Edit Assignment Share Link' : 'Share Assignment'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded flex-shrink-0 ml-2">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={32} className="text-teal-500 animate-spin" />
            <span className="ml-3 text-gray-300">Loading...</span>
          </div>
        ) : !shareLinkData ? (
          /* ==================== FORM VIEW (Create/Edit) ==================== */
          <div className="space-y-6">
            {existingLinkId && (
              <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Share2 size={16} />
                  <span className="font-medium">Editing Existing Share Link</span>
                </div>
                <p className="text-blue-300 text-sm">You're editing an existing share link.</p>
              </div>
            )}

            {/* Assignment Details */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start space-x-3">
                <FileText className="text-teal-400 mt-1" size={20} />
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-white mb-2">{assignment.title}</h4>
                  {assignment.description && <p className="text-gray-400 text-sm mb-3">{assignment.description}</p>}
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{assignment.total_questions} Questions</span>
                    <span>•</span>
                    <span>{assignment.total_points} Points</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <LinkIcon size={16} /><span>Export & Download</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {/* PDF */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500/10 rounded-lg"><FileText className="text-red-400" size={18} /></div>
                    <div><div className="font-medium text-white">PDF Document</div><div className="text-sm text-gray-400">Download formatted PDF</div></div>
                  </div>
                  <button onClick={handleDownloadPDF} disabled={isDownloadingPDF} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm">
                    {isDownloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                    <span>{isDownloadingPDF ? 'Downloading...' : 'Download'}</span>
                  </button>
                </div>
                {/* Google Form */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/10 rounded-lg"><Globe className="text-green-400" size={18} /></div>
                    <div><div className="font-medium text-white">Google Form</div><div className="text-sm text-gray-400">Interactive online form</div></div>
                  </div>
                  {isGeneratingGoogleForm ? (
                    <div className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg flex items-center space-x-2 text-sm"><Loader2 size={16} className="animate-spin" /><span>Generating...</span></div>
                  ) : formatUrls.googleForm ? (
                    <a href={formatUrls.googleForm} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"><LinkIcon size={16} /><span>Open</span></a>
                  ) : (
                    <button onClick={generateGoogleFormInBackground} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"><Globe size={16} /><span>Generate</span></button>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Privacy Settings</label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="privacy" checked={isPublic} onChange={() => setIsPublic(true)} className="mr-3 accent-teal-500" />
                  <div className="flex items-center gap-2"><Globe size={16} className="text-green-400" /><span className="text-white">Public - Anyone with the link can access</span></div>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" name="privacy" checked={!isPublic} onChange={() => setIsPublic(false)} className="mr-3 accent-teal-500" />
                  <div className="flex items-center gap-2"><Lock size={16} className="text-yellow-400" /><span className="text-white">Private - Only invited students can access</span></div>
                </label>
              </div>
            </div>

            {/* User Invitation - Only for private */}
            {!isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Invite Students</label>
                
                {existingUsers.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Currently Invited ({existingUsers.length})</label>
                    <div className="flex flex-wrap gap-2">
                      {existingUsers.map(user => (
                        <div key={user.uid} className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                          <span>{user.displayName || user.email}</span>
                          <button onClick={() => handleRemoveExistingUser(user.uid)} className="text-gray-300 hover:text-white" title="Remove"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedUsers.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-2">New Students to Invite</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <div key={user.uid} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${user.isPending ? 'bg-yellow-600/20 border border-yellow-500/50 text-yellow-300' : 'bg-teal-600 text-white'}`}>
                          <span>{user.displayName || user.email}</span>
                          {user.isPending && <span className="text-xs opacity-75">(new)</span>}
                          <button onClick={() => handleRemoveSelectedUser(user.uid)} className={user.isPending ? 'text-yellow-200 hover:text-white' : 'text-teal-200 hover:text-white'}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery && EMAIL_REGEX.test(searchQuery.trim())) { e.preventDefault(); handleAddEmail(searchQuery); } }} placeholder="Search by email or enter new email..." className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  {isSearching && <div className="absolute right-3 top-1/2 transform -translate-y-1/2"><Loader2 size={18} className="animate-spin text-gray-400" /></div>}
                </div>

                {searchQuery && (
                  <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-400"><Loader2 size={20} className="animate-spin mx-auto" /></div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <button key={user.uid} onClick={() => handleSelectUser(user)} className="w-full px-3 py-2 text-left hover:bg-gray-600 flex items-center gap-2 border-b border-gray-600 last:border-b-0">
                          <UserPlus size={16} className="text-teal-400" />
                          <div><div className="text-white text-sm">{user.displayName || 'Unknown'}</div><div className="text-gray-400 text-xs">{user.email}</div></div>
                        </button>
                      ))
                    ) : EMAIL_REGEX.test(searchQuery.trim()) ? (
                      <button onClick={() => handleAddEmail(searchQuery)} className="w-full px-3 py-2 text-left hover:bg-gray-600 flex items-center gap-2">
                        <UserPlus size={16} className="text-yellow-400" />
                        <div><div className="text-white text-sm">Add "{searchQuery.trim()}"</div><div className="text-gray-400 text-xs">Invite new user by email</div></div>
                      </button>
                    ) : (
                      <div className="p-3 text-center text-gray-400 text-sm">{searchQuery.includes('@') ? 'Enter a valid email address' : 'No users found. Enter full email to invite.'}</div>
                    )}
                  </div>
                )}

                {/* CSV Upload */}
                <div className="flex items-center gap-2 mt-3">
                  <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" id="csv-upload" />
                  <label htmlFor="csv-upload" className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors text-sm">
                    {isProcessingCsv ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>{isProcessingCsv ? 'Processing...' : 'Upload CSV'}</span>
                  </label>
                  <span className="text-xs text-gray-400">Upload CSV with student emails</span>
                </div>

                {csvErrors.length > 0 && (
                  <div className="mt-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1"><p className="text-yellow-400 text-sm font-medium">Invalid emails skipped:</p><p className="text-yellow-300/70 text-xs mt-1">{csvErrors.join(', ')}{csvErrors.length === 5 && '...'}</p></div>
                      <button onClick={() => setCsvErrors([])} className="text-yellow-400 hover:text-yellow-300"><X size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Cancel</button>
              {existingLinkId && (
                <button onClick={deleteShareLink} disabled={deleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2">
                  {deleting ? <><Loader2 size={16} className="animate-spin" /><span>Deleting...</span></> : <><Trash2 size={16} /><span>Delete</span></>}
                </button>
              )}
              <button onClick={createShareLink} disabled={creating || (!isPublic && !existingLinkId && selectedUsers.length === 0)} className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                {creating ? <><Loader2 size={16} className="animate-spin" /><span>{existingLinkId ? 'Updating...' : 'Creating...'}</span></> : <><Share2 size={16} /><span>{existingLinkId ? 'Update Share Link' : 'Create Share Link'}</span></>}
              </button>
            </div>
          </div>
        ) : (
          /* ==================== SUCCESS VIEW (Link Created) ==================== */
          <div className="space-y-6">
            <div className="bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Check size={16} />
                <span className="font-medium">{existingLinkId ? 'Share link updated!' : 'Share link created!'}</span>
              </div>
              <p className="text-green-300 text-sm">
                {shareLinkData.is_public ? 'Anyone with this link can view and complete the assignment.' : `${existingUsers.length} student(s) have been invited.`}
              </p>
            </div>

            {/* Share URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Share URL</label>
              <div className="flex gap-2">
                <input type="text" value={getShareUrl()} readOnly className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
                <button onClick={handleCopyLink} className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2" title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  <span className="hidden sm:inline">{copySuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Share Details */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Share Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Assignment:</span><span className="text-white">{assignment.title}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Privacy:</span>
                  <div className="flex items-center gap-1">
                    {shareLinkData.is_public ? <><Globe size={14} className="text-green-400" /><span className="text-green-400">Public</span></> : <><Lock size={14} className="text-yellow-400" /><span className="text-yellow-400">Private</span></>}
                  </div>
                </div>
                {!shareLinkData.is_public && existingUsers.length > 0 && (
                  <div>
                    <span className="text-gray-400">Invited Students:</span>
                    <div className="mt-1 space-y-1">{existingUsers.map(user => <div key={user.uid} className="text-white text-xs">{user.displayName || user.email}</div>)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3">
              <button onClick={() => setShareLinkData(null)} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Share2 size={16} /><span>Edit Share Link</span>
              </button>
              <button onClick={deleteShareLink} disabled={deleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}<span>Delete</span>
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSharingModal;