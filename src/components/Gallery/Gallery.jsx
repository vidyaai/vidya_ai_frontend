import { useEffect, useMemo, useState } from 'react';
import { FolderPlus, Folder as FolderIcon, ArrowLeft, RefreshCw, MessageSquare, Trash2, Share2 } from 'lucide-react';
import { api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import SharingModal from '../Sharing/SharingModal.jsx';

const SectionTabs = ({ section, setSection }) => {
  return (
    <div className="flex gap-2 mb-4">
      {['uploaded', 'youtube', 'shared'].map((s) => (
        <button
          key={s}
          onClick={() => setSection(s)}
          className={`px-3 py-2 rounded-lg text-sm ${section === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {s === 'uploaded' ? 'Uploaded' : s === 'youtube' ? 'YouTube' : 'Shared to Me'}
        </button>
      ))}
    </div>
  );
};

const Gallery = ({ onNavigateToChat }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || '';
  const [section, setSection] = useState('uploaded');
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [chatLoading, setChatLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'video'|'folder', id: string, data: object }
  const [deleting, setDeleting] = useState(null);
  const [sharingModal, setSharingModal] = useState({ isOpen: false, shareType: null, resourceId: null, resourceData: null });
  const [sharedContent, setSharedContent] = useState({ folders: [], videos: [] });

  const folderMap = useMemo(() => {
    const map = new Map();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  const breadcrumb = useMemo(() => {
    const trail = [];
    let cur = currentFolderId ? folderMap.get(currentFolderId) : null;
    while (cur) {
      trail.unshift(cur);
      cur = cur.parent_id ? folderMap.get(cur.parent_id) : null;
    }
    return trail;
  }, [currentFolderId, folderMap]);

  const fetchFolders = async () => {
    if (!userId) return;
    try {
      const resp = await api.get(`/api/folders`, {
        params: { source_type: section },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setFolders(resp.data || []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || 'Failed to load folders');
    }
  };

  const getThumbnailUrl = async (thumbKey) => {
    if (!thumbKey) return null;
    try {
      const response = await api.get(`/api/storage/presign`, {
        params: { key: thumbKey, expires_in: 3600 },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      return response.data.url;
    } catch (error) {
      console.error('Failed to get thumbnail URL:', error);
      return null;
    }
  };

  const fetchVideos = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError('');
    try {
      const resp = await api.get(`/api/gallery`, {
        params: { source_type: section, folder_id: currentFolderId || undefined },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      // Get thumbnail URLs for videos that have thumb_key
      const videosWithThumbnails = await Promise.all(
        (resp.data || []).map(async (video) => {
          if (video.thumb_key) {
            const thumbnailUrl = await getThumbnailUrl(video.thumb_key);
            return { ...video, thumbnailUrl };
          }
          return video;
        })
      );
      
      setVideos(videosWithThumbnails);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentFolderId(null);
    if (section === 'shared') {
      fetchSharedContent();
    } else {
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, userId]);

  // Fetch shared content on mount if user is in shared section
  useEffect(() => {
    if (section === 'shared' && userId) {
      fetchSharedContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (section !== 'shared') {
      fetchVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, currentFolderId, userId]);



  const subfolders = useMemo(() => {
    return folders.filter((f) => (f.parent_id || null) === (currentFolderId || null));
  }, [folders, currentFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post(`/api/folders`, {
        name: newFolderName.trim(),
        parent_id: currentFolderId,
        source_type: section
      }, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      setNewFolderName('');
      await fetchFolders();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const onDragStartVideo = (e, video) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ video_id: video.id, source_type: video.source_type }));
  };

  const onDropFolder = async (e, folderId) => {
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!data || data.source_type !== section) return; // only within same section
      await api.post(`/api/gallery/move`, {
        video_id: data.video_id,
        target_folder_id: folderId || null
      }, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      await fetchVideos();
    } catch (err) {
      console.error(err);
    }
  };

  const allowDrop = (e) => e.preventDefault();

  const handleVideoChat = (video) => {
    setChatLoading(video.id);
    
    // Prepare video data for chat interface
    const videoData = {
      title: video.title || 'Untitled',
      videoId: video.id,
      sourceType: video.source_type,
      videoUrl: video.video_url || '',
      source: video.source_type === 'youtube' ? `https://www.youtube.com/embed/${video.id}?enablejsapi=1&origin=https://vidyaai.co&controls=0` : ''
    };
    
    // Navigate to chat with video data
    if (onNavigateToChat) {
      onNavigateToChat(videoData);
    }
    
    // Reset loading state after a short delay
    setTimeout(() => setChatLoading(null), 1000);
  };

  const handleSharedFolderClick = (sharedFolder) => {
    // For now, we'll just show the videos in the shared folder
    // In the future, this could navigate to a shared folder view
    console.log('Shared folder clicked:', sharedFolder);
    // You could implement navigation to shared folder content here
  };

  const handleDeleteVideo = async (video) => {
    setDeleting(video.id);
    setError('');
    try {
      await api.delete('/api/gallery/video', {
        data: { video_id: video.id },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      await fetchVideos(); // Refresh the videos list
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete video');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteFolder = async (folder, confirmDeleteVideos = false) => {
    setDeleting(folder.id);
    setError('');
    try {
      const response = await api.delete(`/api/folders/${folder.id}`, {
        data: { 
          folder_id: folder.id,
          confirm_delete_videos: confirmDeleteVideos 
        },
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      if (response.data.success === false && response.data.error === 'folder_has_videos') {
        // Show confirmation dialog for folder with videos
        setDeleteConfirm({
          type: 'folder',
          id: folder.id,
          data: {
            folder,
            videoCount: response.data.video_count,
            message: response.data.message
          }
        });
        setDeleting(null);
        return;
      }
      
      await fetchFolders(); // Refresh folders list
      await fetchVideos(); // Refresh videos list
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete folder');
    } finally {
      setDeleting(null);
    }
  };

  const confirmVideoDelete = (video) => {
    setDeleteConfirm({
      type: 'video',
      id: video.id,
      data: { video }
    });
  };

  const confirmFolderDelete = (folder) => {
    setDeleteConfirm({
      type: 'folder',
      id: folder.id,
      data: { folder }
    });
  };

  const openFolderSharing = (folder) => {
    setSharingModal({
      isOpen: true,
      shareType: 'folder',
      resourceId: folder.id,
      resourceData: folder
    });
  };

  const closeSharingModal = () => {
    setSharingModal({ isOpen: false, shareType: null, resourceId: null, resourceData: null });
  };

  const fetchSharedContent = async () => {
    try {
      const response = await api.get('/api/sharing/my-shared-content', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setSharedContent(response.data);
    } catch (error) {
      console.error('Error fetching shared content:', error);
    }
  };



  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(folderMap.get(currentFolderId)?.parent_id || null)}
              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Up
            </button>
          )}
          <SectionTabs section={section} setSection={setSection} />
          <button
            onClick={() => { 
              if (section === 'shared') {
                fetchSharedContent();
              } else {
                fetchFolders(); 
                fetchVideos();
              }
            }}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        {section !== 'shared' && (
          <div className="flex items-center gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
            />
            <button
              onClick={handleCreateFolder}
              disabled={creating || !newFolderName.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <FolderPlus size={16} />
              Create
            </button>
          </div>
        )}
      </div>

      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-3">
        <span className="text-gray-500">{section === 'uploaded' ? 'Uploaded' : section === 'youtube' ? 'YouTube' : 'Shared to Me'}</span>
        {section !== 'shared' && breadcrumb.map((f) => (
          <span key={f.id}>
            {' / '}
            <button className="text-indigo-400 hover:text-indigo-300" onClick={() => setCurrentFolderId(f.id)}>
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* Shared Content Section */}
      {section === 'shared' && (
        <div className="mb-6">
          {/* Shared Folders */}
          {sharedContent.folders.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Shared Folders</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sharedContent.folders.map((item) => (
                  <div
                    key={item.folder.id}
                    onClick={() => handleSharedFolderClick(item)}
                    className="group rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 bg-gray-700 text-left p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FolderIcon size={18} className="text-yellow-400" />
                      <div className="text-white text-sm font-medium">{item.folder.name}</div>
                    </div>
                    <div className="text-gray-400 text-xs mb-2">
                      Shared by: {item.shared_link.owner?.displayName || 'Unknown'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {item.videos.length} video{item.videos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Shared Videos */}
          {sharedContent.videos.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-300 mb-3">Shared Videos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sharedContent.videos.map((item) => (
                  <div
                    key={item.video.id}
                    className="group rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 bg-gray-700 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-600 text-sm relative">
                      {item.video.source_type === 'uploaded' ? 'Uploaded' : 'YouTube'}
                      {/* Chat button overlay */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoChat(item.video);
                          }}
                          disabled={chatLoading === item.video.id}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                          title="Chat with this video"
                        >
                          {chatLoading === item.video.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <MessageSquare size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="px-2 py-2">
                      <div className="text-white text-sm line-clamp-2">{item.video.title || 'Untitled'}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        Shared by: {item.shared_link.owner?.displayName || 'Unknown'}
                      </div>
                      {/* Chat button below title */}
                      <button
                        onClick={() => handleVideoChat(item.video)}
                        disabled={chatLoading === item.video.id}
                        className="mt-2 w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {chatLoading === item.video.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <MessageSquare size={12} />
                        )}
                        {chatLoading === item.video.id ? 'Loading...' : 'Chat'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {sharedContent.folders.length === 0 && sharedContent.videos.length === 0 && (
            <div className="text-center py-6">
              <Share2 size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No content has been shared with you yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Subfolders */}
      {section !== 'shared' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {/* Root drop area */}
          <div
            onDragOver={allowDrop}
            onDrop={(e) => onDropFolder(e, null)}
            className="rounded-xl border border-dashed border-gray-700 bg-gray-800 p-3 text-center text-gray-400"
            title="Drop here to move to root"
          >
            Move to Root
          </div>
          {subfolders.map((f) => (
            <div
              key={f.id}
              onDragOver={allowDrop}
              onDrop={(e) => onDropFolder(e, f.id)}
              className="group rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 bg-gray-800 text-left p-3 flex items-center gap-2 relative"
              title={f.name}
            >
              <button
                onClick={() => setCurrentFolderId(f.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <FolderIcon size={18} className="text-yellow-400" />
                <div className="text-white text-sm line-clamp-2">{f.name}</div>
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFolderSharing(f);
                  }}
                  className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  title="Share folder"
                >
                  <Share2 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmFolderDelete(f);
                  }}
                  disabled={deleting === f.id}
                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                  title="Delete folder"
                >
                  {deleting === f.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {section !== 'shared' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {videos.map((v) => (
            <div
              key={v.id}
              draggable
              onDragStart={(e) => onDragStartVideo(e, v)}
              className="group rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 bg-gray-800 text-left"
              title={v.title}
            >
              <div className="aspect-video bg-gray-900 overflow-hidden flex items-center justify-center text-gray-600 text-sm relative">
                {v.thumbnailUrl ? (
                  <img 
                    src={v.thumbnailUrl} 
                    alt={v.title || 'Video thumbnail'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${v.thumbnailUrl ? 'hidden' : 'flex'}`}>
                  {section === 'uploaded' ? 'Uploaded' : 'YouTube'}
                </div>
                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoChat(v);
                    }}
                    disabled={chatLoading === v.id}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                    title="Chat with this video"
                  >
                    {chatLoading === v.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <MessageSquare size={16} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmVideoDelete(v);
                    }}
                    disabled={deleting === v.id}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                    title="Delete this video"
                  >
                    {deleting === v.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
              <div className="px-2 py-2">
                <div className="text-white text-sm line-clamp-2">{v.title || 'Untitled'}</div>
                {/* Chat button below title */}
                <button
                  onClick={() => handleVideoChat(v)}
                  disabled={chatLoading === v.id}
                  className="mt-2 w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  {chatLoading === v.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <MessageSquare size={12} />
                  )}
                  {chatLoading === v.id ? 'Loading...' : 'Chat'}
                </button>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full text-gray-500 text-sm py-6 text-center">
              {isLoading ? 'Loading...' : 'No videos in this folder'}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            {deleteConfirm.type === 'video' ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Delete Video</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete "{deleteConfirm.data.video.title || 'Untitled'}"? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(deleteConfirm.data.video)}
                    disabled={deleting === deleteConfirm.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {deleting === deleteConfirm.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Delete Folder</h3>
                {deleteConfirm.data.videoCount ? (
                  <>
                    <p className="text-gray-300 mb-4">
                      The folder "{deleteConfirm.data.folder.name}" contains {deleteConfirm.data.videoCount} video(s).
                    </p>
                    <p className="text-yellow-400 mb-6">
                      ⚠️ Deleting this folder will also permanently delete all videos inside it. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(deleteConfirm.data.folder, true)}
                        disabled={deleting === deleteConfirm.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                      >
                        {deleting === deleteConfirm.id ? 'Deleting...' : 'Delete Folder & Videos'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-300 mb-6">
                      Are you sure you want to delete the folder "{deleteConfirm.data.folder.name}"? 
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(deleteConfirm.data.folder, false)}
                        disabled={deleting === deleteConfirm.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                      >
                        {deleting === deleteConfirm.id ? 'Deleting...' : 'Delete Folder'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sharing Modal */}
      <SharingModal
        isOpen={sharingModal.isOpen}
        onClose={closeSharingModal}
        shareType={sharingModal.shareType}
        resourceId={sharingModal.resourceId}
        resourceData={sharingModal.resourceData}
      />
    </div>
  );
};

export default Gallery;


