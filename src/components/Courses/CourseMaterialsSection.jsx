// src/components/Courses/CourseMaterialsSection.jsx
import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Video, Trash2, Download, Loader2, FolderOpen, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { courseApi } from './courseApi';

const CourseMaterialsSection = ({ courseId, isOwner }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFolder, setUploadFolder] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await courseApi.listMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF and DOCX files are supported.' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File must be under 50 MB.' });
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setShowUploadForm(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    try {
      setUploading(true);
      setMessage(null);
      await courseApi.uploadMaterial(
        courseId,
        uploadFile,
        uploadTitle.trim(),
        uploadDescription.trim() || null,
        'lecture_notes',
        uploadFolder.trim() || null,
        (progressEvent) => {
          const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(pct);
        }
      );
      setMessage({ type: 'success', text: 'Material uploaded successfully!' });
      resetUploadForm();
      loadMaterials();
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setShowUploadForm(false);
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadFolder('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (material) => {
    try {
      const { download_url } = await courseApi.downloadMaterial(courseId, material.id);
      window.open(download_url, '_blank');
    } catch (err) {
      alert('Failed to download material.');
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await courseApi.deleteMaterial(courseId, materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err) {
      alert('Failed to delete material.');
    }
  };

  // Group by folder
  const grouped = materials.reduce((acc, m) => {
    const key = m.folder || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
  const folderNames = Object.keys(grouped).sort();

  const typeIcon = (type) => {
    if (type === 'video') return <Video size={16} className="text-purple-400" />;
    return <FileText size={16} className="text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload button (owner only) */}
      {isOwner && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          {!showUploadForm ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
            >
              <Upload size={16} className="mr-1.5" />
              Upload Material
            </button>
          ) : (
            <form onSubmit={handleUpload} className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
              <div className="text-sm text-gray-300 mb-2">
                File: <span className="text-white font-medium">{uploadFile?.name}</span>
              </div>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Title *"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500"
                required
              />
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500"
              />
              <input
                type="text"
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                placeholder="Folder / Section (e.g. Week 1)"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-teal-500"
              />
              {uploading && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-teal-500 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || !uploadTitle.trim()}
                  className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Upload size={16} className="mr-1.5" />}
                  {uploading ? `${uploadProgress}%` : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={resetUploadForm}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-teal-500 animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
          <p>No materials uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {folderNames.map((folder) => (
            <div key={folder}>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center space-x-2">
                <FolderOpen size={14} />
                <span>{folder}</span>
              </h4>
              <div className="space-y-2">
                {grouped[folder].map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between bg-gray-800/50 border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {typeIcon(material.material_type)}
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{material.title}</p>
                        {material.description && (
                          <p className="text-xs text-gray-500 truncate">{material.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      {material.s3_key && (
                        <button
                          onClick={() => handleDownload(material)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      {material.external_url && (
                        <a
                          href={material.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseMaterialsSection;
