// src/components/Assignments/QuestionCard.jsx
import { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Plus,
  X,
  Edit3,
  Code,
  Image as ImageIcon,
  Calculator,
  Layers,
  FileText,
  Zap,
  Upload,
  Loader2,
  Eye
} from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const QuestionCard = ({ 
  question, 
  index, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  assignmentId = null  // Add assignmentId prop for upload context
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadingDiagram, setUploadingDiagram] = useState(false);
  const [deletingDiagram, setDeletingDiagram] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewModal, setPreviewModal] = useState({ open: false, diagramData: null, field: '', subIndex: null });
  const [imageUrls, setImageUrls] = useState({}); // Cache for presigned URLs

  // Enhanced file validation
  const validateFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'application/pdf'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Check file type
    const extension = file.name.toLowerCase().split('.').pop();
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.includes('.' + extension);
    
    if (!hasValidType && !hasValidExtension) {
      return { valid: false, error: 'Invalid file type. Please upload PNG, JPG, GIF, SVG, or PDF files only.' };
    }
    
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB.` };
    }
    
    // Check for suspicious files
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return { valid: false, error: 'Invalid file name. Please choose a different file.' };
    }
    
    return { valid: true };
  };

  const handleQuestionChange = (value) => {
    onUpdate({ question: value });
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...question.options, ''];
    onUpdate({ options: newOptions });
  };

  const removeOption = (optionIndex) => {
    const newOptions = question.options.filter((_, index) => index !== optionIndex);
    onUpdate({ options: newOptions });
  };

  const handleCorrectAnswerChange = (value) => {
    onUpdate({ correctAnswer: value });
  };

  const handleMultipleCorrectToggle = () => {
    const newAllowMultiple = !question.allowMultipleCorrect;
    onUpdate({ 
      allowMultipleCorrect: newAllowMultiple,
      multipleCorrectAnswers: newAllowMultiple ? [] : undefined,
      correctAnswer: newAllowMultiple ? '' : question.correctAnswer
    });
  };

  const handleMultipleCorrectChange = (optionIndex, isChecked) => {
    const currentAnswers = question.multipleCorrectAnswers || [];
    const optionValue = optionIndex.toString();
    
    let newAnswers;
    if (isChecked) {
      newAnswers = [...currentAnswers, optionValue];
    } else {
      newAnswers = currentAnswers.filter(ans => ans !== optionValue);
    }
    
    onUpdate({ multipleCorrectAnswers: newAnswers });
  };

  const handlePointsChange = (value) => {
    onUpdate({ points: parseInt(value) || 1 });
  };

  const handleRubricChange = (value) => {
    onUpdate({ rubric: value });
  };

  const handleSubquestionChange = (subIndex, field, value) => {
    const newSubquestions = [...(question.subquestions || [])];
    newSubquestions[subIndex] = { ...newSubquestions[subIndex], [field]: value };
    onUpdate({ subquestions: newSubquestions });
  };

  const handleSubquestionMultipleCorrectToggle = (subIndex) => {
    const subq = question.subquestions[subIndex];
    const newAllowMultiple = !subq.allowMultipleCorrect;
    handleSubquestionChange(subIndex, 'allowMultipleCorrect', newAllowMultiple);
    handleSubquestionChange(subIndex, 'multipleCorrectAnswers', newAllowMultiple ? [] : undefined);
    if (newAllowMultiple) {
      handleSubquestionChange(subIndex, 'correctAnswer', '');
    }
  };

  const handleSubquestionMultipleCorrectChange = (subIndex, optionIndex, isChecked) => {
    const subq = question.subquestions[subIndex];
    const currentAnswers = subq.multipleCorrectAnswers || [];
    const optionValue = optionIndex.toString();
    
    let newAnswers;
    if (isChecked) {
      newAnswers = [...currentAnswers, optionValue];
    } else {
      newAnswers = currentAnswers.filter(ans => ans !== optionValue);
    }
    
    handleSubquestionChange(subIndex, 'multipleCorrectAnswers', newAnswers);
  };

  const handleNestedSubquestionMultipleCorrectToggle = (subIndex, subSubIndex) => {
    const subq = question.subquestions[subIndex];
    const subSubq = subq.subquestions[subSubIndex];
    const newAllowMultiple = !subSubq.allowMultipleCorrect;
    
    const newSubSubquestions = [...(subq.subquestions || [])];
    newSubSubquestions[subSubIndex] = { 
      ...newSubSubquestions[subSubIndex], 
      allowMultipleCorrect: newAllowMultiple,
      multipleCorrectAnswers: newAllowMultiple ? [] : undefined,
      correctAnswer: newAllowMultiple ? '' : newSubSubquestions[subSubIndex].correctAnswer
    };
    handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
  };

  const handleNestedSubquestionMultipleCorrectChange = (subIndex, subSubIndex, optionIndex, isChecked) => {
    const subq = question.subquestions[subIndex];
    const subSubq = subq.subquestions[subSubIndex];
    const currentAnswers = subSubq.multipleCorrectAnswers || [];
    const optionValue = optionIndex.toString();
    
    let newAnswers;
    if (isChecked) {
      newAnswers = [...currentAnswers, optionValue];
    } else {
      newAnswers = currentAnswers.filter(ans => ans !== optionValue);
    }
    
    const newSubSubquestions = [...(subq.subquestions || [])];
    newSubSubquestions[subSubIndex] = { 
      ...newSubSubquestions[subSubIndex], 
      multipleCorrectAnswers: newAnswers 
    };
    handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
  };

  const addSubquestion = () => {
    const newSubquestions = [...(question.subquestions || []), {
      id: Date.now(),
      question: '',
      points: 1,
      type: 'short-answer',
      hasSubCode: false,
      hasDiagram: false,
      subCode: '',
      subDiagram: null,
      options: ['', '', '', ''], // for multiple choice
      allowMultipleCorrect: false,
      multipleCorrectAnswers: [],
      subquestions: [] // for nested multi-part
    }];
    onUpdate({ subquestions: newSubquestions });
  };

  const removeSubquestion = (subIndex) => {
    const newSubquestions = (question.subquestions || []).filter((_, index) => index !== subIndex);
    onUpdate({ subquestions: newSubquestions });
  };

  const handleCodeLanguageChange = (language) => {
    onUpdate({ codeLanguage: language });
  };

  // Handle real diagram upload to backend
  const handleDiagramUpload = async (file, field = 'diagram') => {
    if (!file) return;

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    setUploadingDiagram(true);
    setUploadError(null);

    try {
      console.log('Uploading diagram:', file.name);
      const uploadResult = await assignmentApi.uploadDiagram(file, assignmentId);
      
      console.log('Upload successful:', uploadResult);
      
      // Create diagram object with server data (store s3_key, not url)
      const diagramData = {
        file_id: uploadResult.file_id,
        filename: uploadResult.filename,
        s3_key: uploadResult.s3_key, // Store S3 key instead of URL
        size: uploadResult.size,
        content_type: uploadResult.content_type,
        uploaded_at: uploadResult.uploaded_at
      };

      // Cache the presigned URL for immediate use
      setImageUrls(prev => ({
        ...prev,
        [uploadResult.file_id]: uploadResult.url
      }));

      // Update the question with the diagram data
      onUpdate({ [field]: diagramData });
      
    } catch (error) {
      console.error('Error uploading diagram:', error);
      setUploadError(error.response?.data?.detail || 'Failed to upload diagram');
    } finally {
      setUploadingDiagram(false);
    }
  };

  // Handle diagram deletion
  const handleDiagramDelete = async (field = 'diagram') => {
    const diagramData = question[field];
    if (!diagramData?.file_id) return;

    setDeletingDiagram(true);
    setUploadError(null);

    try {
      await assignmentApi.deleteDiagram(diagramData.file_id, assignmentId);
      
      // Clear the diagram from the question
      onUpdate({ [field]: null });
      
      // Clear from cache
      setImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[diagramData.file_id];
        return newUrls;
      });
      
      console.log('Diagram deleted successfully');
    } catch (error) {
      console.error('Error deleting diagram:', error);
      setUploadError('Failed to delete diagram');
      // Note: We still remove it from UI even if backend deletion fails
      onUpdate({ [field]: null });
    } finally {
      setDeletingDiagram(false);
    }
  };

  // Handle diagram replacement (delete old + upload new)
  const handleDiagramReplace = async (file, field = 'diagram') => {
    if (!file) return;

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    const oldDiagramData = question[field];
    
    setUploadingDiagram(true);
    setUploadError(null);

    try {
      // First, upload the new diagram
      console.log('Replacing diagram:', file.name);
      const uploadResult = await assignmentApi.uploadDiagram(file, assignmentId);
      
      // Create new diagram object with server data (store s3_key, not url)
      const newDiagramData = {
        file_id: uploadResult.file_id,
        filename: uploadResult.filename,
        s3_key: uploadResult.s3_key, // Store S3 key instead of URL
        size: uploadResult.size,
        content_type: uploadResult.content_type,
        uploaded_at: uploadResult.uploaded_at
      };

      // Cache the presigned URL for immediate use
      setImageUrls(prev => ({
        ...prev,
        [uploadResult.file_id]: uploadResult.url
      }));

      // Update the question with the new diagram data
      onUpdate({ [field]: newDiagramData });

      // Delete the old diagram (best effort - don't fail if this doesn't work)
      if (oldDiagramData?.file_id) {
        try {
          await assignmentApi.deleteDiagram(oldDiagramData.file_id, assignmentId);
          console.log('Successfully deleted old diagram:', oldDiagramData.file_id);
        } catch (deleteError) {
          console.warn('Failed to delete old diagram (non-critical):', deleteError);
        }
      }
      
    } catch (error) {
      console.error('Error replacing diagram:', error);
      setUploadError(error.response?.data?.detail || 'Failed to replace diagram');
    } finally {
      setUploadingDiagram(false);
    }
  };

  // Handle subquestion diagram upload
  const handleSubquestionDiagramUpload = async (file, subIndex) => {
    if (!file) return;

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    setUploadingDiagram(true);
    setUploadError(null);

    try {
      console.log('Uploading subquestion diagram:', file.name);
      const uploadResult = await assignmentApi.uploadDiagram(file, assignmentId);
      
      // Create diagram object with server data (store s3_key, not url)
      const diagramData = {
        file_id: uploadResult.file_id,
        filename: uploadResult.filename,
        s3_key: uploadResult.s3_key, // Store S3 key instead of URL
        size: uploadResult.size,
        content_type: uploadResult.content_type,
        uploaded_at: uploadResult.uploaded_at
      };

      // Cache the presigned URL for immediate use
      setImageUrls(prev => ({
        ...prev,
        [uploadResult.file_id]: uploadResult.url
      }));

      // Update the subquestion with the diagram data
      handleSubquestionChange(subIndex, 'subDiagram', diagramData);
      
    } catch (error) {
      console.error('Error uploading subquestion diagram:', error);
      setUploadError(error.response?.data?.detail || 'Failed to upload diagram');
    } finally {
      setUploadingDiagram(false);
    }
  };

  // Handle subquestion diagram deletion
  const handleSubquestionDiagramDelete = async (subIndex) => {
    const subq = question.subquestions?.[subIndex];
    if (!subq?.subDiagram?.file_id) return;

    setDeletingDiagram(true);
    setUploadError(null);

    try {
      await assignmentApi.deleteDiagram(subq.subDiagram.file_id, assignmentId);
      
      // Update the subquestion to remove the diagram
      handleSubquestionChange(subIndex, 'subDiagram', null);
      
      // Clear from cache
      setImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[subq.subDiagram.file_id];
        return newUrls;
      });
      
      console.log('Subquestion diagram deleted successfully');
    } catch (error) {
      console.error('Error deleting subquestion diagram:', error);
      setUploadError('Failed to delete diagram');
      // Still remove from UI
      handleSubquestionChange(subIndex, 'subDiagram', null);
    } finally {
      setDeletingDiagram(false);
    }
  };

  // Handle subquestion diagram replacement
  const handleSubquestionDiagramReplace = async (file, subIndex) => {
    if (!file) return;

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    const subq = question.subquestions?.[subIndex];
    const oldDiagramData = subq?.subDiagram;
    
    setUploadingDiagram(true);
    setUploadError(null);

    try {
      // First, upload the new diagram
      console.log('Replacing subquestion diagram:', file.name);
      const uploadResult = await assignmentApi.uploadDiagram(file, assignmentId);
      
      // Create new diagram object with server data (store s3_key, not url)
      const newDiagramData = {
        file_id: uploadResult.file_id,
        filename: uploadResult.filename,
        s3_key: uploadResult.s3_key, // Store S3 key instead of URL
        size: uploadResult.size,
        content_type: uploadResult.content_type,
        uploaded_at: uploadResult.uploaded_at
      };

      // Cache the presigned URL for immediate use
      setImageUrls(prev => ({
        ...prev,
        [uploadResult.file_id]: uploadResult.url
      }));

      // Update the subquestion with the new diagram data
      handleSubquestionChange(subIndex, 'subDiagram', newDiagramData);

      // Delete the old diagram (best effort - don't fail if this doesn't work)
      if (oldDiagramData?.file_id) {
        try {
          await assignmentApi.deleteDiagram(oldDiagramData.file_id, assignmentId);
          console.log('Old subquestion diagram deleted successfully');
        } catch (deleteError) {
          console.warn('Failed to delete old subquestion diagram:', deleteError);
        }
      }
      
    } catch (error) {
      console.error('Error replacing subquestion diagram:', error);
      setUploadError(error.response?.data?.detail || 'Failed to replace diagram');
    } finally {
      setUploadingDiagram(false);
    }
  };

  // Component for handling diagram images with URL fetching
  const DiagramImage = ({ diagramData, displayName, onError }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(!!diagramData.s3_key);
    const [error, setError] = useState(false);

    useEffect(() => {
      const loadImageUrl = async () => {
        // If we already have a URL (cached), use it
        if (imageUrl) return;
        
        // Check if we have a cached URL for this diagram
        if (diagramData.file_id && imageUrls[diagramData.file_id]) {
          setImageUrl(imageUrls[diagramData.file_id]);
          setLoading(false);
          return;
        }
        
        // If no s3_key, we can't fetch from server
        if (!diagramData.s3_key) {
          setError(true);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError(false);
          const url = await assignmentApi.getDiagramUrl(diagramData.s3_key);
          setImageUrl(url);
          
          // Cache the URL if we have a file_id
          if (diagramData.file_id) {
            setImageUrls(prev => ({
              ...prev,
              [diagramData.file_id]: url
            }));
          }
        } catch (error) {
          console.error('Failed to load diagram URL:', error);
          setError(true);
          onError && onError();
        } finally {
          setLoading(false);
        }
      };

      loadImageUrl();
    }, [diagramData.s3_key, diagramData.file_id, imageUrl, imageUrls]);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-32 bg-gray-800 rounded">
          <Loader2 className="animate-spin text-orange-400 mr-2" size={20} />
          <span className="text-gray-300">Loading image...</span>
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <div className="p-4 text-center">
          <ImageIcon size={32} className="text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Failed to load image</p>
          <p className="text-gray-500 text-xs">{displayName}</p>
        </div>
      );
    }

    return (
      <img 
        src={imageUrl} 
        alt={displayName}
        className="w-full max-h-64 object-contain bg-gray-900"
        onError={(e) => {
          console.error('Failed to load diagram:', imageUrl);
          onError && onError();
        }}
      />
    );
  };

  // Render diagram display component
  const renderDiagramDisplay = (diagramData, isUploading = false, onDelete = null, onReplace = null, field = 'diagram', subIndex = null) => {
    if (isUploading) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg border border-gray-700">
          <Loader2 className="animate-spin text-orange-400 mr-2" size={20} />
          <span className="text-gray-300">Uploading diagram...</span>
        </div>
      );
    }

    if (deletingDiagram) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg border border-gray-700">
          <Loader2 className="animate-spin text-red-400 mr-2" size={20} />
          <span className="text-gray-300">Deleting diagram...</span>
        </div>
      );
    }

    if (!diagramData) return null;

    // Check if this is the new format with file_id (from server) or old format with local file
    const isServerDiagram = diagramData.file_id;
    const displayName = diagramData.filename || diagramData.file || 'diagram';

    return (
      <div className="mt-3">
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {diagramData ? (
            // Show actual image for uploaded diagrams
            <div className="relative">
              <DiagramImage 
                diagramData={diagramData}
                displayName={displayName}
                onError={() => {
                  // Handle image load error - could show error state
                }}
              />
              {/* File management buttons */}
              <div className="absolute top-2 right-2 flex space-x-1">
                {/* Preview Button */}
                <button
                  onClick={() => setPreviewModal({ open: true, diagramData, field, subIndex })}
                  className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
                  title="Preview diagram"
                >
                  <Eye size={16} />
                </button>
                {onReplace && (
                  <>
                    <input
                      type="file"
                      accept="image/*,.pdf,.svg"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          onReplace(file);
                        }
                      }}
                      className="hidden"
                      disabled={uploadingDiagram}
                      id={`replace-${field}-${question.id}`}
                    />
                    <label
                      htmlFor={`replace-${field}-${question.id}`}
                      className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors cursor-pointer"
                      title="Replace diagram"
                    >
                      <Upload size={16} />
                    </label>
                  </>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete()}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    title="Delete diagram"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Fallback for old blob URLs or missing images
            <div className="p-4 text-center">
              <ImageIcon size={32} className="text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">{displayName}</p>
              {diagramData.url && (
                <p className="text-gray-500 text-xs mt-1">Preview not available</p>
              )}
            </div>
          )}
          <div className="px-3 py-2 bg-gray-700 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-xs">📎 {displayName}</span>
              {diagramData.size && (
                <span className="text-gray-500 text-xs">
                  {(diagramData.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // File Preview Modal Component
  const renderPreviewModal = () => {
    if (!previewModal.open || !previewModal.diagramData) return null;

    const { diagramData, field, subIndex } = previewModal;
    const displayName = diagramData.filename || diagramData.file || 'diagram';
    const isServerDiagram = diagramData.file_id;
    const isSubquestion = subIndex !== null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPreviewModal({ open: false, diagramData: null, field: '', subIndex: null })}>
        <div className="bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-white">{displayName}</h3>
              <p className="text-sm text-gray-400">
                {diagramData.content_type} • {diagramData.size ? `${(diagramData.size / 1024).toFixed(1)} KB` : 'Unknown size'}
              </p>
            </div>
            <div className="flex space-x-2">
              {/* Replace Button */}
              <input
                type="file"
                accept="image/*,.pdf,.svg"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (isSubquestion) {
                      handleSubquestionDiagramReplace(file, subIndex);
                    } else {
                      handleDiagramReplace(file, field);
                    }
                    setPreviewModal({ open: false, diagramData: null, field: '', subIndex: null });
                  }
                }}
                className="hidden"
                id={`modal-replace-${field}-${question.id}`}
              />
              <label
                htmlFor={`modal-replace-${field}-${question.id}`}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm cursor-pointer"
              >
                Replace
              </label>
              {/* Delete Button */}
              <button
                onClick={() => {
                  if (isSubquestion) {
                    handleSubquestionDiagramDelete(subIndex);
                  } else {
                    handleDiagramDelete(field);
                  }
                  setPreviewModal({ open: false, diagramData: null, field: '', subIndex: null });
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete
              </button>
              {/* Close Button */}
              <button
                onClick={() => setPreviewModal({ open: false, diagramData: null, field: '', subIndex: null })}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-4 max-h-[calc(90vh-120px)] overflow-auto">
            <div className="bg-gray-800 rounded">
              <DiagramImage 
                diagramData={diagramData}
                displayName={displayName}
                onError={() => {
                  console.error('Failed to load diagram in modal');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionTypeIcon = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <span className="text-lg">○</span>;
      case 'fill-blank':
        return <span className="text-lg">___</span>;
      case 'short-answer':
        return <span className="text-lg">A</span>;
      case 'numerical':
        return <span className="text-lg">123</span>;
      case 'long-answer':
        return <span className="text-lg">¶</span>;
      case 'true-false':
        return <span className="text-lg">T/F</span>;
      case 'code-writing':
        return <Code size={18} className="text-purple-400" />;
      case 'diagram-analysis':
        return <ImageIcon size={18} className="text-orange-400" />;
      case 'multi-part':
        return <Layers size={18} className="text-blue-400" />;
      default:
        return <span className="text-lg">?</span>;
    }
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your question..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Enhanced options for multiple choice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDiagramUpload(file, 'diagram');
                          }
                        }}
                        className="hidden"
                        disabled={uploadingDiagram}
                        id={`diagram-upload-${question.id}`}
                      />
                      {/* Show upload section only if no diagram exists */}
                      {!question.diagram && !uploadingDiagram && (
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      )}
                      {/* Show upload progress or diagram */}
                      {uploadingDiagram && renderDiagramDisplay(null, true)}
                      {question.diagram && !uploadingDiagram && renderDiagramDisplay(
                        question.diagram, 
                        false, 
                        () => handleDiagramDelete('diagram'),
                        (file) => handleDiagramReplace(file, 'diagram'),
                        'diagram'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Options
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={question.allowMultipleCorrect || false}
                    onChange={handleMultipleCorrectToggle}
                    className="text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-300">Allow multiple correct answers</span>
                </label>
              </div>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    {question.allowMultipleCorrect ? (
                      <input
                        type="checkbox"
                        checked={(question.multipleCorrectAnswers || []).includes(optionIndex.toString())}
                        onChange={(e) => handleMultipleCorrectChange(optionIndex, e.target.checked)}
                        className="text-teal-500 focus:ring-teal-500"
                      />
                    ) : (
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === optionIndex.toString()}
                        onChange={() => handleCorrectAnswerChange(optionIndex.toString())}
                        className="text-teal-500 focus:ring-teal-500"
                      />
                    )}
                    <textarea
                      value={option}
                      onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      rows={1}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                    />
                    {question.options.length > 2 && (
                      <button
                        onClick={() => removeOption(optionIndex)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="inline-flex items-center px-3 py-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Add Option
                </button>
              </div>
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your true/false question..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Enhanced options for true/false */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDiagramUpload(file, 'diagram');
                          }
                        }}
                        className="hidden"
                        disabled={uploadingDiagram}
                        id={`diagram-upload-${question.id}`}
                      />
                      {/* Show upload section only if no diagram exists */}
                      {!question.diagram && !uploadingDiagram && (
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      )}
                      {/* Show upload progress or diagram */}
                      {uploadingDiagram && renderDiagramDisplay(null, true)}
                      {question.diagram && !uploadingDiagram && renderDiagramDisplay(
                        question.diagram, 
                        false, 
                        () => handleDiagramDelete('diagram'),
                        (file) => handleDiagramReplace(file, 'diagram'),
                        'diagram'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correct Answer
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`tf-${question.id}`}
                    checked={question.correctAnswer === 'true'}
                    onChange={() => handleCorrectAnswerChange('true')}
                    className="text-teal-500 focus:ring-teal-500 mr-2"
                  />
                  <span className="text-white">True</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`tf-${question.id}`}
                    checked={question.correctAnswer === 'false'}
                    onChange={() => handleCorrectAnswerChange('false')}
                    className="text-teal-500 focus:ring-teal-500 mr-2"
                  />
                  <span className="text-white">False</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'fill-blank':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question with Blanks
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your question with blanks (use ___ for blanks)..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Enhanced options for fill-blank */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDiagramUpload(file, 'diagram');
                          }
                        }}
                        className="hidden"
                        disabled={uploadingDiagram}
                        id={`diagram-upload-${question.id}`}
                      />
                      {/* Show upload section only if no diagram exists */}
                      {!question.diagram && !uploadingDiagram && (
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      )}
                      {/* Show upload progress or diagram */}
                      {uploadingDiagram && renderDiagramDisplay(null, true)}
                      {question.diagram && !uploadingDiagram && renderDiagramDisplay(
                        question.diagram, 
                        false, 
                        () => handleDiagramDelete('diagram'),
                        (file) => handleDiagramReplace(file, 'diagram'),
                        'diagram'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correct Answers (one per line)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter correct answers, one per line..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>
          </div>
        );

      case 'numerical':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your numerical question..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Enhanced options for numerical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDiagramUpload(file, 'diagram');
                          }
                        }}
                        className="hidden"
                        disabled={uploadingDiagram}
                        id={`diagram-upload-${question.id}`}
                      />
                      {/* Show upload section only if no diagram exists */}
                      {!question.diagram && !uploadingDiagram && (
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      )}
                      {/* Show upload progress or diagram */}
                      {uploadingDiagram && renderDiagramDisplay(null, true)}
                      {question.diagram && !uploadingDiagram && renderDiagramDisplay(
                        question.diagram, 
                        false, 
                        () => handleDiagramDelete('diagram'),
                        (file) => handleDiagramReplace(file, 'diagram'),
                        'diagram'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correct Answer
              </label>
              <input
                type="text"
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter the correct numerical answer..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'short-answer':
      case 'long-answer':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder={`Enter your ${question.type === 'long-answer' ? 'long answer' : 'short answer'} question...`}
                rows={question.type === 'long-answer' ? 3 : 2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Enhanced options for basic questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDiagramUpload(file, 'diagram');
                          }
                        }}
                        className="hidden"
                        disabled={uploadingDiagram}
                        id={`diagram-upload-${question.id}`}
                      />
                      {/* Show upload section only if no diagram exists */}
                      {!question.diagram && !uploadingDiagram && (
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      )}
                      {/* Show upload progress or diagram */}
                      {uploadingDiagram && renderDiagramDisplay(null, true)}
                      {question.diagram && !uploadingDiagram && renderDiagramDisplay(
                        question.diagram, 
                        false, 
                        () => handleDiagramDelete('diagram'),
                        (file) => handleDiagramReplace(file, 'diagram'),
                        'diagram'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Answer (Required)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter a sample answer or key points..."
                rows={question.type === 'long-answer' ? 4 : 2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>
          </div>
        );

      case 'code-writing':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Programming Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your programming problem description..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Programming Language
                </label>
                <select
                  value={question.codeLanguage || 'python'}
                  onChange={(e) => handleCodeLanguageChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="javascript">JavaScript</option>
                  <option value="matlab">MATLAB</option>
                  <option value="verilog">Verilog</option>
                  <option value="vhdl">VHDL</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Output Type
                </label>
                <select
                  value={question.outputType || 'code'}
                  onChange={(e) => onUpdate({ outputType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="code">Complete Code</option>
                  <option value="function">Function Only</option>
                  <option value="algorithm">Algorithm/Pseudocode</option>
                  <option value="output">Program Output</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Starter Code (Optional)
              </label>
              <textarea
                value={question.starterCode || ''}
                onChange={(e) => onUpdate({ starterCode: e.target.value })}
                placeholder="// Provide starter code or template here..."
                rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Solution (Required)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter sample solution code..."
                rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'diagram-analysis':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your diagram analysis question..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Diagram/Image Upload
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,.svg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleDiagramUpload(file, 'diagram');
                    }
                  }}
                  className="hidden"
                  id={`diagram-upload-${question.id}`}
                />
                {/* Show upload section only if no diagram exists */}
                {!question.diagram && !uploadingDiagram && (
                <label
                  htmlFor={`diagram-upload-${question.id}`}
                  className="cursor-pointer flex flex-col items-center"
                >
                    <ImageIcon size={32} className="text-gray-400 mb-2" />
                    <p className="text-white font-medium mb-1">Upload Diagram</p>
                    <p className="text-gray-400 text-sm">PNG, JPG, SVG, PDF supported</p>
                </label>
                )}
                {uploadingDiagram && renderDiagramDisplay(null, true)}
                {question.diagram && !uploadingDiagram && renderDiagramDisplay(
                  question.diagram, 
                  false, 
                  () => handleDiagramDelete('diagram'),
                  (file) => handleDiagramReplace(file, 'diagram'),
                  'diagram'
                )}
              </div>
            </div>
            
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Answer (Required)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter sample analysis or key points..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
              />
            </div>
          </div>
        );

      case 'multi-part':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Main Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter the main question or problem statement..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Rubric Configuration for Multi-part Questions */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Rubric Configuration
              </label>
              <div className="space-y-3">
                <div className="text-blue-300 text-sm bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
                  <p className="font-medium mb-1">Per Sub-question Rubrics</p>
                  <p className="text-xs text-blue-200">Individual rubrics should be added to each sub-question below.</p>
                </div>
              </div>
            </div>

            {/* Main Question Enhancements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasMainCode || question.hasCode || false}
                    onChange={(e) => onUpdate({ hasMainCode: e.target.checked, hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code in Main Question
                  </span>
                </label>
                {(question.hasMainCode || question.hasCode) && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.mainCodeLanguage || question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ mainCodeLanguage: e.target.value, codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                    </select>
                    <textarea
                      value={question.mainCode || question.code || ''}
                      onChange={(e) => onUpdate({ mainCode: e.target.value, code: e.target.value })}
                      placeholder="// Main question code here..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasMainDiagram || false}
                    onChange={(e) => onUpdate({ hasMainDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram in Main Question
                  </span>
                </label>
                {question.hasMainDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleDiagramUpload(file, 'mainDiagram');
                          }
                        }}
                        className="hidden"
                        disabled={uploadingDiagram}
                        id={`main-diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`main-diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Main Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {uploadingDiagram && renderDiagramDisplay(null, true)}
                      {question.mainDiagram && !uploadingDiagram && renderDiagramDisplay(
                        question.mainDiagram, 
                        false, 
                        () => handleDiagramDelete('mainDiagram'),
                        (file) => handleDiagramReplace(file, 'mainDiagram'),
                        'mainDiagram'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Sub-questions
                </label>
                <button
                  onClick={addSubquestion}
                  className="inline-flex items-center px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Add Part
                </button>
              </div>
              
              <div className="space-y-3">
                {(question.subquestions || []).map((subq, subIndex) => (
                  <div key={subq.id || subIndex} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-300 font-medium text-sm">Part {subIndex + 1}</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={subq.type === 'multi-part' 
                            ? (subq.subquestions || []).reduce((sum, nestedSubq) => sum + (nestedSubq.points || 1), 0)
                            : subq.points || 1
                          }
                          onChange={(e) => handleSubquestionChange(subIndex, 'points', parseInt(e.target.value) || 1)}
                          min="1"
                          disabled={subq.type === 'multi-part'}
                          className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-gray-400 text-sm">pts</span>
                        {subq.type === 'multi-part' && (
                          <span className="text-xs text-gray-500">(auto-calc)</span>
                        )}
                        <button
                          onClick={() => removeSubquestion(subIndex)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={subq.question || ''}
                      onChange={(e) => handleSubquestionChange(subIndex, 'question', e.target.value)}
                      placeholder={`Enter part ${subIndex + 1} question...`}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-sm"
                    />
                    
                    {/* Sub-question type selection */}
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={subq.type || 'short-answer'}
                          onChange={(e) => handleSubquestionChange(subIndex, 'type', e.target.value)}
                          className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="short-answer">Short Answer</option>
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="fill-blank">Fill in Blank</option>
                          <option value="numerical">Numerical</option>
                          <option value="code-writing">Code Writing</option>
                          <option value="diagram-analysis">Diagram Analysis</option>
                          <option value="multi-part">Multi-Part</option>
                        </select>
                        
                        {subq.type === 'code-writing' && (
                          <select
                            value={subq.codeLanguage || 'python'}
                            onChange={(e) => handleSubquestionChange(subIndex, 'codeLanguage', e.target.value)}
                            className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="matlab">MATLAB</option>
                            <option value="c">C</option>
                            <option value="javascript">JavaScript</option>
                          </select>
                        )}
                      </div>

                      {/* Sub-question content options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={subq.hasSubCode || subq.hasCode || false}
                            onChange={(e) => {
                              handleSubquestionChange(subIndex, 'hasSubCode', e.target.checked);
                              handleSubquestionChange(subIndex, 'hasCode', e.target.checked);
                            }}
                            className="text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300">Include Code</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={subq.hasDiagram || false}
                            onChange={(e) => handleSubquestionChange(subIndex, 'hasDiagram', e.target.checked)}
                            className="text-orange-600 bg-gray-600 border-gray-500 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300">Include Diagram</span>
                        </label>
                      </div>

                      {/* Sub-question code editor */}
                      {(subq.hasSubCode || subq.hasCode) && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-purple-300 mb-2">
                            Sub-question Code
                          </label>
                          <textarea
                            value={subq.subCode || subq.code || ''}
                            onChange={(e) => {
                              handleSubquestionChange(subIndex, 'subCode', e.target.value);
                              handleSubquestionChange(subIndex, 'code', e.target.value);
                            }}
                            placeholder="// Enter starter code for this sub-question..."
                            rows={4}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                          />
                        </div>
                      )}

                      {/* Sub-question diagram upload */}
                      {subq.hasDiagram && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-orange-300 mb-2">
                            Sub-question Diagram
                          </label>
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*,.pdf,.svg"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleSubquestionDiagramUpload(file, subIndex);
                                }
                              }}
                              className="hidden"
                              disabled={uploadingDiagram}
                              id={`subq-diagram-upload-${question.id}-${subIndex}`}
                            />
                            {/* Show upload section only if no sub-diagram exists */}
                            {!subq.subDiagram && !uploadingDiagram && (
                            <label
                              htmlFor={`subq-diagram-upload-${question.id}-${subIndex}`}
                              className="cursor-pointer flex flex-col items-center"
                            >
                              <ImageIcon size={20} className="text-gray-500 mb-1" />
                              <p className="text-white font-medium text-xs mb-1">Upload Diagram</p>
                              <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                            </label>
                            )}
                            {subq.subDiagram && !uploadingDiagram && (
                              <div className="mt-2">
                                {renderDiagramDisplay(
                                  subq.subDiagram, 
                                  false, 
                                  () => handleSubquestionDiagramDelete(subIndex),
                                  (file) => handleSubquestionDiagramReplace(file, subIndex),
                                  'subDiagram',
                                  subIndex
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multiple choice options for sub-questions */}
                      {subq.type === 'multiple-choice' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-teal-300">
                              Multiple Choice Options
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={subq.allowMultipleCorrect || false}
                                onChange={() => handleSubquestionMultipleCorrectToggle(subIndex)}
                                className="text-teal-500 focus:ring-teal-500"
                              />
                              <span className="text-xs text-gray-300">Multiple correct</span>
                            </label>
                          </div>
                          <div className="space-y-2">
                            {(subq.options || ['', '', '', '']).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                {subq.allowMultipleCorrect ? (
                                  <input
                                    type="checkbox"
                                    checked={(subq.multipleCorrectAnswers || []).includes(optionIndex.toString())}
                                    onChange={(e) => handleSubquestionMultipleCorrectChange(subIndex, optionIndex, e.target.checked)}
                                    className="text-teal-500 focus:ring-teal-500"
                                  />
                                ) : (
                                  <input
                                    type="radio"
                                    name={`correct-sub-${question.id}-${subIndex}`}
                                    checked={subq.correctAnswer === optionIndex.toString()}
                                    onChange={() => handleSubquestionChange(subIndex, 'correctAnswer', optionIndex.toString())}
                                    className="text-teal-500 focus:ring-teal-500"
                                  />
                                )}
                                <textarea
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(subq.options || ['', '', '', ''])];
                                    newOptions[optionIndex] = e.target.value;
                                    handleSubquestionChange(subIndex, 'options', newOptions);
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  rows={1}
                                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-vertical"
                                />
                                {(subq.options || ['', '', '', '']).length > 2 && (
                                  <button
                                    onClick={() => {
                                      const newOptions = (subq.options || ['', '', '', '']).filter((_, i) => i !== optionIndex);
                                      handleSubquestionChange(subIndex, 'options', newOptions);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newOptions = [...(subq.options || ['', '', '', '']), ''];
                                handleSubquestionChange(subIndex, 'options', newOptions);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                            >
                              <Plus size={12} className="mr-1" />
                              Add Option
                            </button>
                          </div>
                        </div>
                      )}

                      {/* True/False correct answer for sub-questions */}
                      {subq.type === 'true-false' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-teal-300 mb-2">
                            Correct Answer
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`tf-sub-${question.id}-${subIndex}`}
                                checked={subq.correctAnswer === 'true'}
                                onChange={() => handleSubquestionChange(subIndex, 'correctAnswer', 'true')}
                                className="text-teal-500 focus:ring-teal-500 mr-2"
                              />
                              <span className="text-white text-sm">True</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`tf-sub-${question.id}-${subIndex}`}
                                checked={subq.correctAnswer === 'false'}
                                onChange={() => handleSubquestionChange(subIndex, 'correctAnswer', 'false')}
                                className="text-teal-500 focus:ring-teal-500 mr-2"
                              />
                              <span className="text-white text-sm">False</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Correct answer for other sub-question types */}
                      {!['multiple-choice', 'true-false', 'multi-part'].includes(subq.type) && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-teal-300 mb-2">
                            {subq.type === 'numerical' ? 'Correct Answer' : 'Sample Answer (Required)'}
                          </label>
                          <textarea
                            value={subq.correctAnswer || ''}
                            onChange={(e) => handleSubquestionChange(subIndex, 'correctAnswer', e.target.value)}
                            placeholder={subq.type === 'numerical' ? 'Enter the correct numerical answer...' : 'Enter sample answer or key points...'}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical text-sm"
                          />
                        </div>
                      )}

                      {/* Per sub-question rubric */}
                      {question.rubricType === 'per-subquestion' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-blue-300 mb-2">
                            Rubric for Part {subIndex + 1}
                          </label>
                          <textarea
                            value={subq.rubric || ''}
                            onChange={(e) => handleSubquestionChange(subIndex, 'rubric', e.target.value)}
                            placeholder={`Enter grading criteria for part ${subIndex + 1}...`}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-sm"
                          />
                        </div>
                      )}

                      {/* Nested multi-part sub-questions */}
                      {subq.type === 'multi-part' && (
                        <div className="mt-3 border-l-2 border-blue-400/30 pl-4 ml-2">
                          {/* Rubric Configuration for Nested Multi-part Sub-questions */}
                          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 mb-3">
                            <label className="block text-xs font-medium text-blue-300 mb-2">
                              Rubric Configuration for Part {subIndex + 1}
                            </label>
                            <div className="space-y-2">
                              <div className="text-blue-300 text-xs bg-blue-900/20 p-2 rounded border border-blue-700/30">
                                <p className="font-medium mb-1">Per Sub-part Rubrics</p>
                                <p className="text-xs text-blue-200">Individual rubrics can be added to each sub-part below.</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-blue-300">
                              Sub-sub-questions
                            </label>
                            <button
                              onClick={() => {
                                const newSubSubquestions = [...(subq.subquestions || []), {
                                  id: Date.now(),
                                  question: '',
                                  points: 1,
                                  type: 'short-answer'
                                }];
                                handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Plus size={12} className="mr-1" />
                              Add Sub-part
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {(subq.subquestions || []).map((subSubq, subSubIndex) => (
                              <div key={subSubq.id || subSubIndex} className="bg-gray-600 rounded-lg p-3 border border-gray-500">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-blue-200 text-xs font-medium">Part {subIndex + 1}.{subSubIndex + 1}</span>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={subSubq.points || 1}
                                      onChange={(e) => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], points: parseInt(e.target.value) || 1 };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      min="1"
                                      className="w-12 px-1 py-1 bg-gray-500 border border-gray-400 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-300 text-xs">pts</span>
                                    <button
                                      onClick={() => {
                                        const newSubSubquestions = (subq.subquestions || []).filter((_, i) => i !== subSubIndex);
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                                <textarea
                                  value={subSubq.question || ''}
                                  onChange={(e) => {
                                    const newSubSubquestions = [...(subq.subquestions || [])];
                                    newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], question: e.target.value };
                                    handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                  }}
                                  placeholder={`Enter part ${subIndex + 1}.${subSubIndex + 1} question...`}
                                  rows={1}
                                  className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs mb-2 resize-vertical"
                                />
                                <select
                                  value={subSubq.type || 'short-answer'}
                                  onChange={(e) => {
                                    const newSubSubquestions = [...(subq.subquestions || [])];
                                    newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], type: e.target.value };
                                    handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                  }}
                                  className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="short-answer">Short Answer</option>
                                  <option value="multiple-choice">Multiple Choice</option>
                                  <option value="true-false">True/False</option>
                                  <option value="fill-blank">Fill in Blank</option>
                                  <option value="numerical">Numerical</option>
                                  <option value="code-writing">Code Writing</option>
                                  <option value="diagram-analysis">Diagram Analysis</option>
                                </select>
                                
                                {/* Add options for MC questions in sub-sub-questions */}
                                {subSubq.type === 'multiple-choice' && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-400">Options</span>
                                      <label className="flex items-center space-x-1">
                                        <input
                                          type="checkbox"
                                          checked={subSubq.allowMultipleCorrect || false}
                                          onChange={() => handleNestedSubquestionMultipleCorrectToggle(subIndex, subSubIndex)}
                                          className="text-teal-500 focus:ring-teal-500"
                                        />
                                        <span className="text-xs text-gray-400">Multiple</span>
                                      </label>
                                    </div>
                                    <div className="space-y-1">
                                    {(subSubq.options || ['', '', '']).map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        {subSubq.allowMultipleCorrect ? (
                                          <input
                                            type="checkbox"
                                            checked={(subSubq.multipleCorrectAnswers || []).includes(optionIndex.toString())}
                                            onChange={(e) => handleNestedSubquestionMultipleCorrectChange(subIndex, subSubIndex, optionIndex, e.target.checked)}
                                            className="text-teal-500 focus:ring-teal-500"
                                          />
                                        ) : (
                                          <input
                                            type="radio"
                                            name={`correct-subsub-${question.id}-${subIndex}-${subSubIndex}`}
                                            checked={subSubq.correctAnswer === optionIndex.toString()}
                                            onChange={() => {
                                              const newSubSubquestions = [...(subq.subquestions || [])];
                                              newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: optionIndex.toString() };
                                              handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                            }}
                                            className="text-teal-500 focus:ring-teal-500"
                                          />
                                        )}
                                        <textarea
                                          value={option}
                                          onChange={(e) => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            const newOptions = [...(newSubSubquestions[subSubIndex].options || ['', '', ''])];
                                            newOptions[optionIndex] = e.target.value;
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], options: newOptions };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          placeholder={`Option ${optionIndex + 1}`}
                                          rows={1}
                                          className="flex-1 px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs resize-vertical"
                                        />
                                        {(subSubq.options || ['', '', '']).length > 2 && (
                                          <button
                                            onClick={() => {
                                              const newSubSubquestions = [...(subq.subquestions || [])];
                                              const newOptions = (newSubSubquestions[subSubIndex].options || ['', '', '']).filter((_, i) => i !== optionIndex);
                                              newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], options: newOptions };
                                              handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                            }}
                                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                          >
                                            <X size={10} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        const newOptions = [...(newSubSubquestions[subSubIndex].options || ['', '', '']), ''];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], options: newOptions };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      className="inline-flex items-center px-1 py-0.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                      <Plus size={10} className="mr-1" />
                                      Add Option
                                    </button>
                                    </div>
                                  </div>
                                )}

                                {/* True/False correct answer for sub-sub-questions */}
                                {subSubq.type === 'true-false' && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-teal-300 mb-1">
                                      Correct Answer
                                    </label>
                                    <div className="flex space-x-3">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`tf-subsub-${question.id}-${subIndex}-${subSubIndex}`}
                                          checked={subSubq.correctAnswer === 'true'}
                                          onChange={() => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: 'true' };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          className="text-teal-500 focus:ring-teal-500 mr-1"
                                        />
                                        <span className="text-white text-xs">True</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`tf-subsub-${question.id}-${subIndex}-${subSubIndex}`}
                                          checked={subSubq.correctAnswer === 'false'}
                                          onChange={() => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: 'false' };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          className="text-teal-500 focus:ring-teal-500 mr-1"
                                        />
                                        <span className="text-white text-xs">False</span>
                                      </label>
                                    </div>
                                  </div>
                                )}

                                {/* Correct answer for other sub-sub-question types */}
                                {!['multiple-choice', 'true-false'].includes(subSubq.type) && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-teal-300 mb-1">
                                      {subSubq.type === 'numerical' ? 'Correct Answer' : 'Sample Answer (Required)'}
                                    </label>
                                    <textarea
                                      value={subSubq.correctAnswer || ''}
                                      onChange={(e) => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: e.target.value };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      placeholder={subSubq.type === 'numerical' ? 'Correct answer...' : 'Sample answer...'}
                                      rows={1}
                                      className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs resize-vertical"
                                    />
                                  </div>
                                )}

                                {/* Per sub-sub-question rubric for nested multi-part */}
                                {subq.rubricType === 'per-subquestion' && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-blue-300 mb-1">
                                      Rubric for Part {subIndex + 1}.{subSubIndex + 1}
                                    </label>
                                    <textarea
                                      value={subSubq.rubric || ''}
                                      onChange={(e) => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], rubric: e.target.value };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      placeholder={`Enter grading criteria for part ${subIndex + 1}.${subSubIndex + 1}...`}
                                      rows={1}
                                      className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs resize-vertical"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!question.subquestions || question.subquestions.length === 0) && (
                  <div className="text-center py-6 text-gray-400">
                    <Layers size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sub-questions yet. Click "Add Part" to create parts.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );


      default:
        return (
          <div>
            <p className="text-gray-400">Unknown question type</p>
          </div>
        );
    }
  };

  return (
    <>
    <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Question Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            <GripVertical size={16} className="text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            {renderQuestionTypeIcon()}
            <span className="text-white font-medium">
              Question {index + 1}
            </span>
            <span className="text-gray-400 text-sm">
              ({question.type.replace('-', ' ')})
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={question.type === 'multi-part' 
                ? (question.subquestions || []).reduce((sum, subq) => {
                    if (subq.type === 'multi-part') {
                      // Handle nested multi-part questions - sum their sub-questions
                      const nestedPoints = (subq.subquestions || []).reduce((nestedSum, nestedSubq) => {
                        return nestedSum + (nestedSubq.points || 1);
                      }, 0);
                      return sum + nestedPoints;
                    }
                    return sum + (subq.points || 1);
                  }, 0)
                : question.points
              }
              onChange={(e) => handlePointsChange(e.target.value)}
              min="1"
              max="100"
              disabled={question.type === 'multi-part'}
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-400 text-sm">pts</span>
          </div>
          {question.type === 'multi-part' && (
            <span className="text-xs text-gray-500">(auto-calculated)</span>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Edit3 size={16} />
          </button>
          
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronUp size={16} />
            </button>
          )}
          
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          )}
          
          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Question Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {renderQuestionInput()}
          
          {/* Rubric Section - Only show for non-multi-part questions */}
          {question.type !== 'multi-part' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rubric (Required)
              </label>
              <textarea
                value={question.rubric}
                onChange={(e) => handleRubricChange(e.target.value)}
                placeholder="Enter grading criteria or rubric..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
              />
            </div>
          )}
        </div>
      )}
    </div>
    
    {/* Render Preview Modal */}
    {renderPreviewModal()}
  </> 
  );
};

export default QuestionCard;

