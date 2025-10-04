// src/components/Assignments/AIAssignmentGenerator.jsx
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Video, 
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Link,
  Plus,
  Trash2
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import { api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import { assignmentApi } from './assignmentApi';

const AIAssignmentGenerator = ({ onBack, onNavigateToHome }) => {
  const { currentUser } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [linkedVideos, setLinkedVideos] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [generationOptions, setGenerationOptions] = useState({
    numQuestions: 5,
    totalPoints: 15,
    difficultyLevel: 'mixed',
    perQuestionDifficulty: false,
    setCustomPoints: false,
    pointsVariation: 'constant', // 'constant' or 'varying'
    engineeringLevel: 'undergraduate', // 'undergraduate' or 'graduate'
    questionTypes: {
      'multiple-choice': true,
      'short-answer': true,
      'true-false': true,
      'numerical': true,
      'code-writing': false,
      'diagram-analysis': false,
      'multi-part': false
    },
    engineeringDiscipline: 'general', // 'general', 'electrical', 'mechanical', 'civil', 'computer', 'chemical'
    includeCode: false,
    includeDiagrams: false,
    includeCalculations: false,
    difficultyDistribution: {
      easy: { 
        count: 0, 
        pointsEach: 1, 
        varyingPoints: [{ points: 1, count: 0 }] // Array of {points, count} objects
      },
      medium: { 
        count: 0, 
        pointsEach: 3, 
        varyingPoints: [{ points: 3, count: 0 }]
      },
      hard: { 
        count: 0, 
        pointsEach: 5, 
        varyingPoints: [{ points: 5, count: 0 }]
      }
    }
  });

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/markdown',
      'application/json',
      'text/xml',
      'application/xml'
    ];
    
    const validFiles = files.filter(file => 
      supportedTypes.includes(file.type) || 
      file.name.endsWith('.txt') || 
      file.name.endsWith('.md') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.xml')
    );
    
    // Read file content for each file
    const newFiles = await Promise.all(validFiles.map(async (file) => {
      try {
        const content = await readFileAsText(file);
        return {
          id: Date.now() + Math.random(),
          file,
          type: file.type,
          name: file.name,
          size: file.size,
          content: content
        };
      } catch (error) {
        console.error('Error reading file:', error);
        return {
          id: Date.now() + Math.random(),
          file,
          type: file.type,
          name: file.name,
          size: file.size,
          content: null
        };
      }
    }));
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  // Fetch available videos from gallery
  const fetchAvailableVideos = async () => {
    if (!currentUser?.uid) return;
    
    setIsLoadingVideos(true);
    try {
      const response = await assignmentApi.getAvailableVideos();
      setAvailableVideos(response.videos || []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Fallback to empty array
      setAvailableVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Link video from gallery
  const linkVideo = (video) => {
    const videoData = {
      id: video.id,
      title: video.title || 'Untitled',
      source_type: video.source_type,
      youtube_id: video.youtube_id,
      youtube_url: video.youtube_url,
      transcript_text: video.transcript_text
    };
    
    if (!linkedVideos.find(v => v.id === video.id)) {
      setLinkedVideos([...linkedVideos, videoData]);
    }
    setShowVideoSelector(false);
  };

  // Remove linked video
  const removeLinkedVideo = (videoId) => {
    setLinkedVideos(linkedVideos.filter(v => v.id !== videoId));
  };

  // Remove uploaded file
  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) {
      return <Video size={20} className="text-blue-400" />;
    } else if (type === 'application/pdf') {
      return <FileText size={20} className="text-red-400" />;
    } else if (type.includes('word') || type.includes('document')) {
      return <FileText size={20} className="text-blue-500" />;
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return <FileText size={20} className="text-orange-400" />;
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return <FileText size={20} className="text-green-400" />;
    } else if (type === 'text/markdown' || type === 'text/plain') {
      return <FileText size={20} className="text-yellow-400" />;
    } else {
      return <FileText size={20} className="text-gray-400" />;
    }
  };

  // Helper functions for difficulty distribution management
  const updateDifficultyCount = (difficulty, count) => {
    const newCount = Math.max(0, parseInt(count) || 0);
    setGenerationOptions({
      ...generationOptions,
      difficultyDistribution: {
        ...generationOptions.difficultyDistribution,
        [difficulty]: {
          ...generationOptions.difficultyDistribution[difficulty],
          count: newCount
        }
      }
    });
  };

  const updateDifficultyPoints = (difficulty, points) => {
    const newPoints = Math.max(1, parseInt(points) || 1);
    setGenerationOptions({
      ...generationOptions,
      difficultyDistribution: {
        ...generationOptions.difficultyDistribution,
        [difficulty]: {
          ...generationOptions.difficultyDistribution[difficulty],
          pointsEach: newPoints
        }
      }
    });
  };

  // Helper functions for varying points management
  const addVaryingPointsEntry = (difficulty) => {
    const newEntry = { points: 1, count: 0 };
    setGenerationOptions({
      ...generationOptions,
      difficultyDistribution: {
        ...generationOptions.difficultyDistribution,
        [difficulty]: {
          ...generationOptions.difficultyDistribution[difficulty],
          varyingPoints: [...generationOptions.difficultyDistribution[difficulty].varyingPoints, newEntry]
        }
      }
    });
  };

  const removeVaryingPointsEntry = (difficulty, index) => {
    const varyingPoints = generationOptions.difficultyDistribution[difficulty].varyingPoints.filter((_, i) => i !== index);
    setGenerationOptions({
      ...generationOptions,
      difficultyDistribution: {
        ...generationOptions.difficultyDistribution,
        [difficulty]: {
          ...generationOptions.difficultyDistribution[difficulty],
          varyingPoints: varyingPoints.length > 0 ? varyingPoints : [{ points: 1, count: 0 }]
        }
      }
    });
  };

  const updateVaryingPointsEntry = (difficulty, index, field, value) => {
    const newValue = Math.max(field === 'points' ? 1 : 0, parseInt(value) || 0);
    const varyingPoints = [...generationOptions.difficultyDistribution[difficulty].varyingPoints];
    varyingPoints[index] = { ...varyingPoints[index], [field]: newValue };
    
    setGenerationOptions({
      ...generationOptions,
      difficultyDistribution: {
        ...generationOptions.difficultyDistribution,
        [difficulty]: {
          ...generationOptions.difficultyDistribution[difficulty],
          varyingPoints
        }
      }
    });
  };

  const getTotalAssignedQuestions = () => {
    if (generationOptions.perQuestionDifficulty && generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying') {
      // For varying points, count the sum of all varying point entries
      return Object.values(generationOptions.difficultyDistribution)
        .reduce((sum, diff) => {
          const varyingSum = diff.varyingPoints.reduce((vSum, vPoint) => vSum + vPoint.count, 0);
          return sum + varyingSum;
        }, 0);
    } else {
      // For constant points or no custom points, use the main count
      return Object.values(generationOptions.difficultyDistribution)
        .reduce((sum, diff) => sum + diff.count, 0);
    }
  };

  const getCalculatedTotalPoints = () => {
    if (generationOptions.perQuestionDifficulty && generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying') {
      // For varying points, calculate based on varying point entries
      return Object.values(generationOptions.difficultyDistribution)
        .reduce((sum, diff) => {
          const varyingSum = diff.varyingPoints.reduce((vSum, vPoint) => vSum + (vPoint.count * vPoint.points), 0);
          return sum + varyingSum;
        }, 0);
    } else {
      // For constant points, use the main count and pointsEach
      return Object.values(generationOptions.difficultyDistribution)
        .reduce((sum, diff) => sum + (diff.count * diff.pointsEach), 0);
    }
  };

  const isDistributionValid = () => {
    if (!generationOptions.perQuestionDifficulty) return true;
    return getTotalAssignedQuestions() === parseInt(generationOptions.numQuestions);
  };

  const hasSelectedQuestionTypes = () => {
    return Object.values(generationOptions.questionTypes).some(enabled => enabled);
  };

  const canGenerate = (uploadedFiles.length > 0 || linkedVideos.length > 0 || prompt.trim().length > 0) && 
    (!generationOptions.perQuestionDifficulty || isDistributionValid()) &&
    hasSelectedQuestionTypes();


  // Helper function to prepare generation options for API
  const prepareGenerationOptions = (options) => {
    const preparedOptions = { ...options };
    
    // If varying points is selected, remove pointsEach from difficultyDistribution
    if (options.perQuestionDifficulty && options.setCustomPoints && options.pointsVariation === 'varying') {
      const cleanedDistribution = {};
      Object.keys(options.difficultyDistribution).forEach(difficulty => {
        const config = options.difficultyDistribution[difficulty];
        cleanedDistribution[difficulty] = {
          count: config.count,
          varyingPoints: config.varyingPoints
          // pointsEach is excluded when using varying points
        };
      });
      preparedOptions.difficultyDistribution = cleanedDistribution;
    }
    
    return preparedOptions;
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    
    try {
      // Prepare generation options (clean up difficultyDistribution if needed)
      const preparedGenerationOptions = prepareGenerationOptions(generationOptions);
      
      // Prepare generation request
      const generateData = {
        linked_videos: linkedVideos,
        uploaded_files: uploadedFiles.map(f => ({ 
          name: f.name, 
          type: f.type, 
          size: f.size,
          content: f.content || null // Include file content if available
        })),
        generation_prompt: prompt.trim() || null,
        generation_options: preparedGenerationOptions,
        title: `${generationOptions.engineeringLevel === 'graduate' ? 'Graduate' : 'Undergraduate'} ${generationOptions.engineeringDiscipline === 'general' ? 'Engineering' : generationOptions.engineeringDiscipline.charAt(0).toUpperCase() + generationOptions.engineeringDiscipline.slice(1) + ' Engineering'} Assignment`,
        description: `Advanced ${generationOptions.engineeringLevel}-level assignment generated using AI. 
        ${linkedVideos.length > 0 ? `Includes ${linkedVideos.length} linked video(s). ` : ''}
        ${uploadedFiles.length > 0 ? `Based on ${uploadedFiles.length} uploaded document(s). ` : ''}
        Features ${Object.entries(generationOptions.questionTypes).filter(([_, enabled]) => enabled).map(([type, _]) => type.replace('-', ' ')).join(', ')} question types.`
      };

      // Call API to generate assignment
      console.log('Calling API with data:', generateData);
      console.log('Generation options difficultyDistribution:', preparedGenerationOptions.difficultyDistribution);
      const generatedAssignment = await assignmentApi.generateAssignment(generateData);
      console.log('API response:', generatedAssignment);
      
      setGeneratedAssignment(generatedAssignment);
      setIsGenerating(false);
    } catch (error) {
      console.error('Failed to generate assignment:', error);
      console.error('Error details:', error.response?.data || error.message);
      setIsGenerating(false);
      
      // Show error to user instead of falling back to mock questions
      alert('Failed to generate assignment. Please try again or check your input.');
    }
  };

  const handleContinueToBuilder = () => {
    // TODO: Navigate to AssignmentBuilder with generated content
    console.log('Continuing to builder with:', generatedAssignment);
    onBack(); // For now, just go back
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation */}
      <TopBar onNavigateToHome={onNavigateToHome} />
      
      {/* Page Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Assignment Generator</h1>
                <p className="text-gray-400 mt-2">Generate assignments from your content using AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedAssignment ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Upload Content</h2>
              <p className="text-gray-400 mb-6">
                Link videos from your gallery, upload documents, or provide a text prompt to generate your assignment. 
                You must provide at least one of these options.
              </p>

              {/* Video Linking */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Link Videos from Gallery
                  </label>
                  <button
                    onClick={() => {
                      setShowVideoSelector(true);
                      fetchAvailableVideos();
                    }}
                    className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Link size={16} className="mr-1" />
                    Link Videos
                  </button>
                </div>
                
                {linkedVideos.length > 0 && (
                  <div className="space-y-2">
                    {linkedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <Video size={20} className="text-blue-400" />
                          <div>
                            <p className="text-white text-sm font-medium">{video.title}</p>
                            <p className="text-gray-400 text-xs">{video.source_type}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeLinkedVideo(video.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Documents
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.json,.xml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={48} className="text-gray-400 mb-4" />
                    <p className="text-white font-medium mb-2">Click to upload documents</p>
                    <p className="text-gray-400 text-sm">PDF, Word, PowerPoint, Excel, Text, Markdown, JSON, XML supported</p>
                  </label>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-3">Uploaded Files</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-white text-sm font-medium">{file.name}</p>
                            <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or provide a text prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want your assignment to cover, or paste text content here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Generation Options */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Generation Options</h2>
              
              {/* Engineering Level and Discipline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Engineering Level
                  </label>
                  <select 
                    value={generationOptions.engineeringLevel}
                    onChange={(e) => setGenerationOptions({...generationOptions, engineeringLevel: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="undergraduate">Undergraduate Level</option>
                    <option value="graduate">Graduate Level</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Engineering Discipline
                  </label>
                  <select 
                    value={generationOptions.engineeringDiscipline}
                    onChange={(e) => setGenerationOptions({...generationOptions, engineeringDiscipline: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="general">General Engineering</option>
                    <option value="electrical">Electrical Engineering</option>
                    <option value="mechanical">Mechanical Engineering</option>
                    <option value="civil">Civil Engineering</option>
                    <option value="computer">Computer Engineering</option>
                    <option value="chemical">Chemical Engineering</option>
                  </select>
                </div>
              </div>
              
              {/* Question Types Selection */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-white mb-4">Question Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(generationOptions.questionTypes).map(([type, enabled]) => {
                    const isEngineering = ['code-writing', 'diagram-analysis', 'multi-part'].includes(type);
                    return (
                      <label key={type} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        enabled 
                          ? isEngineering 
                            ? 'bg-purple-500/20 border-purple-500/50' 
                            : 'bg-teal-500/20 border-teal-500/50'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setGenerationOptions({
                            ...generationOptions,
                            questionTypes: {
                              ...generationOptions.questionTypes,
                              [type]: e.target.checked
                            }
                          })}
                          className={`${isEngineering ? 'text-purple-600 focus:ring-purple-500' : 'text-teal-600 focus:ring-teal-500'} bg-gray-800 border-gray-700 rounded`}
                        />
                        <span className={`text-sm font-medium ${enabled ? 'text-white' : 'text-gray-400'}`}>
                          {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {isEngineering && <span className="text-xs text-purple-400 ml-1">(Engineering)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              {/* Basic Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generationOptions.numQuestions}
                    onChange={(e) => setGenerationOptions({...generationOptions, numQuestions: Math.max(1, parseInt(e.target.value) || 1)})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter number of questions"
                  />
                  <p className="text-gray-400 text-xs mt-1">1-100 questions</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Points {generationOptions.perQuestionDifficulty && `(Calculated: ${getCalculatedTotalPoints()})`}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={generationOptions.perQuestionDifficulty ? getCalculatedTotalPoints() : generationOptions.totalPoints}
                    onChange={(e) => setGenerationOptions({...generationOptions, totalPoints: Math.max(1, parseInt(e.target.value) || 1)})}
                    disabled={generationOptions.perQuestionDifficulty}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter total points"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    {generationOptions.perQuestionDifficulty ? 'Auto-calculated from difficulty distribution' : 'Total points for the assignment'}
                  </p>
                </div>
              </div>

              {/* Difficulty Level (only when not using custom distribution) */}
              {!generationOptions.perQuestionDifficulty && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select 
                    value={generationOptions.difficultyLevel}
                    onChange={(e) => setGenerationOptions({...generationOptions, difficultyLevel: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              )}
              
              {/* Per-Question Difficulty Toggle */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={generationOptions.perQuestionDifficulty}
                      onChange={(e) => setGenerationOptions({...generationOptions, perQuestionDifficulty: e.target.checked, setCustomPoints: false})}
                      className="w-4 h-4 text-teal-600 bg-gray-800 border-gray-700 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      Custom difficulty distribution
                    </span>
                  </label>
                  <p className="text-gray-400 text-xs mt-1 ml-7">
                    Specify exactly how many questions of each difficulty level
                  </p>
                </div>

                {generationOptions.perQuestionDifficulty && (
                  <div className="ml-7">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={generationOptions.setCustomPoints}
                        onChange={(e) => setGenerationOptions({...generationOptions, setCustomPoints: e.target.checked})}
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-300">
                        Set custom points
                      </span>
                    </label>
                    <p className="text-gray-400 text-xs mt-1 ml-7">
                      Customize point values for each difficulty level (default: easy=1, medium=3, hard=5)
                    </p>
                  </div>
                )}
              </div>


              {/* Custom Difficulty Distribution */}
              {generationOptions.perQuestionDifficulty && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-4">Difficulty Distribution</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Configure how many questions of each difficulty level you want.
                  </p>

                  {/* Points Variation Radio Buttons */}
                  {generationOptions.setCustomPoints && (
                    <div className="mb-6 p-3 bg-gray-700 rounded-lg">
                      <h4 className="text-md font-medium text-white mb-3">Point Assignment Method</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="pointsVariation"
                            value="constant"
                            checked={generationOptions.pointsVariation === 'constant'}
                            onChange={(e) => setGenerationOptions({...generationOptions, pointsVariation: e.target.value})}
                            className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-300">
                            Constant within difficulty level
                          </span>
                        </label>
                        <p className="text-gray-400 text-xs ml-7">
                          All questions of the same difficulty level have the same points
                        </p>
                        
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="pointsVariation"
                            value="varying"
                            checked={generationOptions.pointsVariation === 'varying'}
                            onChange={(e) => setGenerationOptions({...generationOptions, pointsVariation: e.target.value})}
                            className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-gray-300">
                            Varying within difficulty level
                          </span>
                        </label>
                        <p className="text-gray-400 text-xs ml-7">
                          Questions of the same difficulty level can have different points within a range
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Easy Questions */}
                    <div className={`grid gap-4 p-3 bg-gray-700 rounded-lg ${generationOptions.setCustomPoints ? (generationOptions.pointsVariation === 'varying' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3') : 'grid-cols-1 md:grid-cols-2'}`}>
                      <div>
                        <label className="block text-sm font-medium text-green-300 mb-2">
                          Easy Questions
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={generationOptions.numQuestions}
                          value={generationOptions.difficultyDistribution.easy.count}
                          onChange={(e) => updateDifficultyCount('easy', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'constant' && (
                        <div>
                          <label className="block text-sm font-medium text-green-300 mb-2">
                            Points Each
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={generationOptions.difficultyDistribution.easy.pointsEach}
                            onChange={(e) => updateDifficultyPoints('easy', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-green-300 mb-2">
                            Point Distribution
                          </label>
                          <div className="space-y-2">
                            {generationOptions.difficultyDistribution.easy.varyingPoints.map((vPoint, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={vPoint.points}
                                  onChange={(e) => updateVaryingPointsEntry('easy', index, 'points', e.target.value)}
                                  className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                  placeholder="Points"
                                />
                                <span className="text-green-300 text-sm">pts ×</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={vPoint.count}
                                  onChange={(e) => updateVaryingPointsEntry('easy', index, 'count', e.target.value)}
                                  className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                  placeholder="Count"
                                />
                                <span className="text-green-300 text-sm">questions</span>
                                {generationOptions.difficultyDistribution.easy.varyingPoints.length > 1 && (
                                  <button
                                    onClick={() => removeVaryingPointsEntry('easy', index)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addVaryingPointsEntry('easy')}
                              className="flex items-center space-x-1 text-green-300 hover:text-green-200 text-sm"
                            >
                              <Plus size={14} />
                              <span>Add point value</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-green-300 mb-2">
                          Subtotal
                        </label>
                        <div className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-green-300 font-medium">
                          {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying' 
                            ? `${generationOptions.difficultyDistribution.easy.varyingPoints.reduce((sum, vPoint) => sum + (vPoint.count * vPoint.points), 0)} pts`
                            : `${generationOptions.difficultyDistribution.easy.count * generationOptions.difficultyDistribution.easy.pointsEach} pts`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Medium Questions */}
                    <div className={`grid gap-4 p-3 bg-gray-700 rounded-lg ${generationOptions.setCustomPoints ? (generationOptions.pointsVariation === 'varying' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3') : 'grid-cols-1 md:grid-cols-2'}`}>
                      <div>
                        <label className="block text-sm font-medium text-yellow-300 mb-2">
                          Medium Questions
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={generationOptions.numQuestions}
                          value={generationOptions.difficultyDistribution.medium.count}
                          onChange={(e) => updateDifficultyCount('medium', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'constant' && (
                        <div>
                          <label className="block text-sm font-medium text-yellow-300 mb-2">
                            Points Each
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={generationOptions.difficultyDistribution.medium.pointsEach}
                            onChange={(e) => updateDifficultyPoints('medium', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-yellow-300 mb-2">
                            Point Distribution
                          </label>
                          <div className="space-y-2">
                            {generationOptions.difficultyDistribution.medium.varyingPoints.map((vPoint, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={vPoint.points}
                                  onChange={(e) => updateVaryingPointsEntry('medium', index, 'points', e.target.value)}
                                  className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                  placeholder="Points"
                                />
                                <span className="text-yellow-300 text-sm">pts ×</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={vPoint.count}
                                  onChange={(e) => updateVaryingPointsEntry('medium', index, 'count', e.target.value)}
                                  className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                  placeholder="Count"
                                />
                                <span className="text-yellow-300 text-sm">questions</span>
                                {generationOptions.difficultyDistribution.medium.varyingPoints.length > 1 && (
                                  <button
                                    onClick={() => removeVaryingPointsEntry('medium', index)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addVaryingPointsEntry('medium')}
                              className="flex items-center space-x-1 text-yellow-300 hover:text-yellow-200 text-sm"
                            >
                              <Plus size={14} />
                              <span>Add point value</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-yellow-300 mb-2">
                          Subtotal
                        </label>
                        <div className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-yellow-300 font-medium">
                          {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying' 
                            ? `${generationOptions.difficultyDistribution.medium.varyingPoints.reduce((sum, vPoint) => sum + (vPoint.count * vPoint.points), 0)} pts`
                            : `${generationOptions.difficultyDistribution.medium.count * generationOptions.difficultyDistribution.medium.pointsEach} pts`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Hard Questions */}
                    <div className={`grid gap-4 p-3 bg-gray-700 rounded-lg ${generationOptions.setCustomPoints ? (generationOptions.pointsVariation === 'varying' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3') : 'grid-cols-1 md:grid-cols-2'}`}>
                      <div>
                        <label className="block text-sm font-medium text-red-300 mb-2">
                          Hard Questions
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={generationOptions.numQuestions}
                          value={generationOptions.difficultyDistribution.hard.count}
                          onChange={(e) => updateDifficultyCount('hard', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'constant' && (
                        <div>
                          <label className="block text-sm font-medium text-red-300 mb-2">
                            Points Each
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={generationOptions.difficultyDistribution.hard.pointsEach}
                            onChange={(e) => updateDifficultyPoints('hard', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-red-300 mb-2">
                            Point Distribution
                          </label>
                          <div className="space-y-2">
                            {generationOptions.difficultyDistribution.hard.varyingPoints.map((vPoint, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={vPoint.points}
                                  onChange={(e) => updateVaryingPointsEntry('hard', index, 'points', e.target.value)}
                                  className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                                  placeholder="Points"
                                />
                                <span className="text-red-300 text-sm">pts ×</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={vPoint.count}
                                  onChange={(e) => updateVaryingPointsEntry('hard', index, 'count', e.target.value)}
                                  className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                                  placeholder="Count"
                                />
                                <span className="text-red-300 text-sm">questions</span>
                                {generationOptions.difficultyDistribution.hard.varyingPoints.length > 1 && (
                                  <button
                                    onClick={() => removeVaryingPointsEntry('hard', index)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addVaryingPointsEntry('hard')}
                              className="flex items-center space-x-1 text-red-300 hover:text-red-200 text-sm"
                            >
                              <Plus size={14} />
                              <span>Add point value</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-red-300 mb-2">
                          Subtotal
                        </label>
                        <div className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-red-300 font-medium">
                          {generationOptions.setCustomPoints && generationOptions.pointsVariation === 'varying' 
                            ? `${generationOptions.difficultyDistribution.hard.varyingPoints.reduce((sum, vPoint) => sum + (vPoint.count * vPoint.points), 0)} pts`
                            : `${generationOptions.difficultyDistribution.hard.count * generationOptions.difficultyDistribution.hard.pointsEach} pts`
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Summary */}
                  <div className="mt-4 p-3 bg-gray-600 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">
                        Questions: {getTotalAssignedQuestions()} / {generationOptions.numQuestions}
                      </span>
                      <span className="text-gray-300">
                        Total Points: {getCalculatedTotalPoints()}
                      </span>
                    </div>
                    
                    {/* Validation Messages */}
                    <div className="mt-2">
                      {getTotalAssignedQuestions() < generationOptions.numQuestions && (
                        <p className="text-orange-400 text-sm">
                          ⚠️ {generationOptions.numQuestions - getTotalAssignedQuestions()} more question(s) needed
                        </p>
                      )}
                      {getTotalAssignedQuestions() > generationOptions.numQuestions && (
                        <p className="text-red-400 text-sm">
                          ❌ Too many questions assigned. Reduce the count above.
                        </p>
                      )}
                      {getTotalAssignedQuestions() === generationOptions.numQuestions && (
                        <p className="text-green-400 text-sm">
                          ✅ Perfect! All {generationOptions.numQuestions} questions are configured.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const total = parseInt(generationOptions.numQuestions);
                        const easy = Math.floor(total * 0.4);
                        const medium = Math.floor(total * 0.4);
                        const hard = total - easy - medium;
                        setGenerationOptions({
                          ...generationOptions,
                          difficultyDistribution: {
                            easy: { 
                              count: easy, 
                              pointsEach: 1, 
                              varyingPoints: [{ points: 1, count: easy }]
                            },
                            medium: { 
                              count: medium, 
                              pointsEach: 3, 
                              varyingPoints: [{ points: 3, count: medium }]
                            },
                            hard: { 
                              count: hard, 
                              pointsEach: 5, 
                              varyingPoints: [{ points: 5, count: hard }]
                            }
                          }
                        });
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
                    >
                      Balanced (40/40/20)
                    </button>
                    <button
                      onClick={() => {
                        const total = parseInt(generationOptions.numQuestions);
                        const easy = Math.floor(total * 0.6);
                        const medium = Math.floor(total * 0.3);
                        const hard = total - easy - medium;
                        setGenerationOptions({
                          ...generationOptions,
                          difficultyDistribution: {
                            easy: { 
                              count: easy, 
                              pointsEach: 1, 
                              varyingPoints: [{ points: 1, count: easy }]
                            },
                            medium: { 
                              count: medium, 
                              pointsEach: 3, 
                              varyingPoints: [{ points: 3, count: medium }]
                            },
                            hard: { 
                              count: hard, 
                              pointsEach: 5, 
                              varyingPoints: [{ points: 5, count: hard }]
                            }
                          }
                        });
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      Easy Focus (60/30/10)
                    </button>
                    <button
                      onClick={() => {
                        const total = parseInt(generationOptions.numQuestions);
                        const easy = Math.floor(total * 0.2);
                        const medium = Math.floor(total * 0.3);
                        const hard = total - easy - medium;
                        setGenerationOptions({
                          ...generationOptions,
                          difficultyDistribution: {
                            easy: { 
                              count: easy, 
                              pointsEach: 1, 
                              varyingPoints: [{ points: 1, count: easy }]
                            },
                            medium: { 
                              count: medium, 
                              pointsEach: 3, 
                              varyingPoints: [{ points: 3, count: medium }]
                            },
                            hard: { 
                              count: hard, 
                              pointsEach: 5, 
                              varyingPoints: [{ points: 5, count: hard }]
                            }
                          }
                        });
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                    >
                      Hard Focus (20/30/50)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={`inline-flex items-center px-8 py-4 font-bold rounded-xl transition-all duration-300 ${
                  canGenerate && !isGenerating
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 shadow-lg'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating Assignment...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="mr-2" />
                    Generate Assignment
                  </>
                )}
              </button>
              
              {!canGenerate && (
                <p className="text-orange-400 text-sm mt-3 flex items-center justify-center">
                  <AlertCircle size={16} className="mr-1" />
                  {!uploadedFiles.length && !linkedVideos.length && !prompt.trim().length 
                    ? "Please upload at least one file, link a video, or provide a text prompt"
                    : !hasSelectedQuestionTypes()
                    ? "Please select at least one question type"
                    : "Please ensure all questions are properly configured in the difficulty distribution"
                  }
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Generated Assignment Preview */
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle size={24} className="text-green-400" />
                <h2 className="text-xl font-bold text-white">Assignment Generated Successfully!</h2>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{generatedAssignment.title}</h3>
                <p className="text-gray-400 mb-4">{generatedAssignment.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-400">{generatedAssignment.questions.length}</p>
                    <p className="text-gray-400 text-sm">Questions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-400">
                      {generatedAssignment.questions.reduce((sum, q) => sum + q.points, 0)}
                    </p>
                    <p className="text-gray-400 text-sm">Total Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-400">Mixed</p>
                    <p className="text-gray-400 text-sm">Question Types</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium">Generated Questions Preview:</h4>
                {generatedAssignment.questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Question {index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          question.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                          question.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-teal-400 text-sm">{question.points} pts</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{question.question}</p>
                    <span className="text-gray-500 text-xs">
                      {question.type.replace('-', ' ')} question
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Show linked content */}
              {(generatedAssignment.linkedVideos?.length > 0 || generatedAssignment.uploadedFiles?.length > 0) && (
                <div className="mt-6">
                  <h4 className="text-white font-medium mb-3">Content Sources:</h4>
                  <div className="space-y-2">
                    {generatedAssignment.linkedVideos?.map((video, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                        <Video size={16} className="text-blue-400" />
                        <span>Linked: {video.title}</span>
                      </div>
                    ))}
                    {generatedAssignment.uploadedFiles?.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                        {getFileIcon(file.type)}
                        <span>Uploaded: {file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={handleContinueToBuilder}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Sparkles size={20} className="mr-2" />
                Continue to Assignment Builder
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Selector Modal */}
      {showVideoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Select Videos from Gallery</h3>
              <button
                onClick={() => setShowVideoSelector(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {isLoadingVideos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <span className="ml-3 text-gray-300">Loading videos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {availableVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => linkVideo(video)}
                    className="group rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 bg-gray-800 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-600 text-sm relative">
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title || 'Video thumbnail'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>Video</span>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <Plus size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="px-2 py-2">
                      <div className="text-white text-sm line-clamp-2">{video.title || 'Untitled'}</div>
                      <div className="text-gray-400 text-xs mt-1">{video.source_type}</div>
                    </div>
                  </div>
                ))}
                {availableVideos.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    No videos available in your gallery
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVideoSelector(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssignmentGenerator;

