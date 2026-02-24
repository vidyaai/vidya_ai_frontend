// src/components/Assignments/AIAssignmentGeneratorWizard.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  FileText, 
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Settings,
  Target,
  Loader2,
  Video,
  Link,
  Image
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import { api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import { assignmentApi } from './assignmentApi';
import { fileToBase64 } from './ImportFromDocumentModal';
import DisplayTextWithEquations from './DisplayTextWithEquations';

const AIAssignmentGeneratorWizard = ({ onBack, onNavigateToHome, onContinueToBuilder }) => {
  const { currentUser } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [generationError, setGenerationError] = useState(null);
  const logContainerRef = useRef(null);
  
  // Step 1: Upload & Describe
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  
  // Video selection from gallery
  const [availableVideos, setAvailableVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Fetch available videos on mount
  useEffect(() => {
    const fetchAvailableVideos = async () => {
      setIsLoadingVideos(true);
      try {
        const response = await assignmentApi.getAvailableVideos();
        setAvailableVideos(response.videos || []);
      } catch (error) {
        console.error('Error fetching available videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };
    fetchAvailableVideos();
  }, []);

  // Toggle video selection
  const toggleVideoSelection = (video) => {
    setSelectedVideos(prev => {
      const isSelected = prev.some(v => v.id === video.id);
      if (isSelected) {
        return prev.filter(v => v.id !== video.id);
      } else {
        return [...prev, video];
      }
    });
  };

  // Remove a selected video
  const removeSelectedVideo = (videoId) => {
    setSelectedVideos(prev => prev.filter(v => v.id !== videoId));
  };

  // Step 2: Assignment Settings
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalPoints, setTotalPoints] = useState(50);
  const [engineeringLevel, setEngineeringLevel] = useState('');
  const [engineeringDiscipline, setEngineeringDiscipline] = useState('');

  // Step 3: Question Types
  const [questionTypes, setQuestionTypes] = useState({
    'multiple-choice': true,
    'short-answer': true,
    'true-false': false,
    'numerical': false,
    'code-writing': false,
    'diagram-analysis': false,
    'multi-part': false
  });

  // Diagram generation model
  const [diagramModel, setDiagramModel] = useState('nonai');

  // Navigation helpers
  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step) => setCurrentStep(step);

  // File upload handler
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
    
    const newFiles = await Promise.all(validFiles.map(async (file) => {
      try {
        const content = await fileToBase64(file);
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

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  // Question type management
  const toggleQuestionType = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Validation - at least one content source required (description, videos, or files)
  const canProceedFromStep1 = () => {
    const hasDescription = assignmentDescription.trim().length > 0;
    const hasVideos = selectedVideos.length > 0;
    const hasFiles = uploadedFiles.length > 0;
    return hasDescription || hasVideos || hasFiles;
  };

  const hasSelectedQuestionTypes = () => {
    return Object.values(questionTypes).some(selected => selected);
  };

  const canGenerate = () => {
    return canProceedFromStep1() && hasSelectedQuestionTypes() && numQuestions > 0 && totalPoints > 0;
  };

  // Generate assignment
  const handleGenerateAssignment = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);
    
    try {
      // Build generation request - same structure as original
      const generationOptions = {
        numQuestions,
        totalPoints,
        difficultyLevel: 'mixed',
        perQuestionDifficulty: false,
        setCustomPoints: false,
        pointsVariation: 'constant',
        engineeringLevel,
        questionTypes,
        engineeringDiscipline,
        includeCode: questionTypes['code-writing'],
        includeDiagrams: questionTypes['diagram-analysis'],
        includeCalculations: questionTypes['numerical'],
        diagramEngine: diagramModel === 'nonai' ? 'nonai' : 'ai',
        diagramModel: diagramModel === 'nonai' ? 'flash' : diagramModel,
      };

      // Build linked_videos array from selected videos
      const linkedVideos = selectedVideos.map(v => ({
        id: v.id,
        title: v.title,
        source_type: v.source_type,
        youtube_id: v.youtube_id,
        youtube_url: v.youtube_url,
        transcript_text: v.transcript_text
      }));

      const generateData = {
        generation_prompt: assignmentDescription || '',  // Fixed: was 'prompt', should be 'generation_prompt'
        title: assignmentTitle || '',
        generation_options: generationOptions,
        uploaded_files: uploadedFiles.map(f => ({
          name: f.name,
          type: f.type,
          content: f.content
        })),
        linked_videos: linkedVideos
      };

      setProgressLogs([]);
      setGenerationError(null);
      setCurrentStep(4); // Move to generating screen immediately

      const result = await assignmentApi.generateAssignmentStream(generateData, (event) => {
        setProgressLogs(prev => [...prev, { ...event, id: Date.now() + Math.random(), ts: new Date() }]);
      });
      setGeneratedAssignment(result);
    } catch (error) {
      console.error('Error generating assignment:', error);
      setGenerationError(error.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueToBuilder = () => {
    // Pass the generated assignment data back to the parent (MyAssignments)
    // MyAssignments will then navigate to the assignment builder with this data
    if (onContinueToBuilder) {
      onContinueToBuilder(generatedAssignment);
    } else {
      // Fallback: trigger parent to switch to builder mode
      // We'll need to add this as a prop or modify the parent component
      console.log('Continue to builder with:', generatedAssignment);
      onBack(); // For now, just go back to let parent handle navigation
    }
  };

  // Utility functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type === 'application/pdf') {
      return <FileText size={20} className="text-red-400" />;
    } else if (type.includes('word') || type.includes('document')) {
      return <FileText size={20} className="text-blue-500" />;
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return <FileText size={20} className="text-orange-400" />;
    } else {
      return <FileText size={20} className="text-gray-400" />;
    }
  };

  // Step 1: Upload & Describe
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Sparkles size={48} className="text-teal-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Content Sources</h2>
        <p className="text-gray-400">Provide at least one content source: description, video from gallery, or lecture notes</p>
      </div>

      {/* Requirement indicator */}
      {!canProceedFromStep1() && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle size={20} className="text-orange-400 flex-shrink-0" />
          <p className="text-orange-300 text-sm">
            Please provide at least one of: Assignment Focus Description, Video from Gallery, or Lecture Notes
          </p>
        </div>
      )}

      {/* Assignment Description - Now first and more prominent */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <FileText size={20} className="text-green-400" />
          <label className="block text-white font-medium">
            Assignment Focus Description
          </label>
          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">Option 1</span>
        </div>
        <textarea
          value={assignmentDescription}
          onChange={(e) => setAssignmentDescription(e.target.value)}
          placeholder="Describe what you want the assignment to focus on...&#10;&#10;Examples:&#10;• Create a quiz on CMOS transistor design principles&#10;• Generate questions about machine learning fundamentals&#10;• Test understanding of thermodynamics laws&#10;• Cover data structures and algorithms basics"
          rows={5}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-gray-500 text-sm mt-2">
          Describe the topic, concepts, or focus areas for your assignment. AI will generate questions based on this description.
        </p>
      </div>

      {/* Video Selection and File Upload in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Selection from Gallery */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Video size={20} className="text-blue-400" />
            <label className="block text-white font-medium">
              Videos from Gallery
            </label>
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">Option 2</span>
          </div>
          
          <div className="flex-1">
            {isLoadingVideos ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg">
                <Loader2 size={24} className="text-teal-400 animate-spin" />
                <span className="ml-2 text-gray-400">Loading videos...</span>
              </div>
            ) : selectedVideos.length === 0 ? (
              // No videos selected - show button to open modal
              <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg">
                <Video size={28} className="text-gray-500 mb-2" />
                {availableVideos.length === 0 ? (
                  <>
                    <p className="text-gray-400 text-sm">No videos available</p>
                    <p className="text-gray-500 text-xs">Upload videos in Gallery first</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">Select videos from your gallery</p>
                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Browse Videos ({availableVideos.length})
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Videos selected - show selected videos list
              <div className="min-h-[8rem]">
                <div className="space-y-2 mb-3">
                  {selectedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-2 bg-blue-500/20 border border-blue-500 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Video size={16} className="text-blue-400 flex-shrink-0" />
                        <p className="text-white text-sm font-medium truncate">{video.title}</p>
                      </div>
                      <button
                        onClick={() => removeSelectedVideo(video.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-teal-400 text-sm font-medium rounded-lg border border-gray-700 transition-colors"
                >
                  + Add More Videos
                </button>
              </div>
            )}
          </div>
          
          <p className="text-gray-500 text-sm mt-3">
            Questions will be generated from video transcripts
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Upload size={20} className="text-purple-400" />
            <label className="block text-white font-medium">
              Upload Lecture Notes
            </label>
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">Option 3</span>
          </div>
          
          <div className="flex-1">
            {uploadedFiles.length === 0 ? (
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                  <Upload size={28} className="text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">
                    <span className="text-teal-400 font-medium">Choose files</span> or drag and drop
                  </p>
                  <p className="text-gray-500 text-xs mt-1">PDF, Word, PPT, Excel, Markdown</p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.json,.xml,.csv"
                />
              </label>
            ) : (
              // Files uploaded - show file list
              <div className="min-h-[8rem]">
                <div className="space-y-2 mb-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {getFileIcon(file.type)}
                        <p className="text-white text-sm font-medium truncate">{file.name}</p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer block">
                  <div className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-teal-400 text-sm font-medium rounded-lg border border-gray-700 transition-colors text-center">
                    + Add More Files
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.json,.xml,.csv"
                  />
                </label>
              </div>
            )}
          </div>
          
          <p className="text-gray-500 text-sm mt-3">
            Questions will be generated from uploaded content
          </p>
        </div>
      </div>

      {/* Assignment Title */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <label className="block text-white font-medium mb-3">
          Assignment Title (Optional)
        </label>
        <input
          type="text"
          value={assignmentTitle}
          onChange={(e) => setAssignmentTitle(e.target.value)}
          placeholder="e.g., CMOS Circuit Design Quiz (will auto-generate if empty)"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-gray-500 text-sm mt-2">
          Leave empty to auto-generate a title based on your content.
        </p>
      </div>
    </div>
  );

  // Step 2: Assignment Settings
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Settings size={48} className="text-blue-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Assignment Settings</h2>
        <p className="text-gray-400">Configure the basic parameters for your assignment</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-white font-medium mb-3">Number of Questions</label>
            <input
              type="text"
              value={numQuestions}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
                const num = parseInt(value) || 0;
                if (num >= 1 && num <= 50) {
                  setNumQuestions(num);
                } else if (value === '') {
                  setNumQuestions('');
                }
              }}
              onBlur={(e) => {
                if (numQuestions === '' || numQuestions < 1) {
                  setNumQuestions(1);
                }
              }}
              placeholder="10"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ appearance: 'textfield' }}
            />
            <p className="text-gray-500 text-xs mt-1">Between 1 and 50 questions</p>
          </div>

          {/* Total Points */}
          <div>
            <label className="block text-white font-medium mb-3">Total Points</label>
            <input
              type="text"
              value={totalPoints}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
                const num = parseInt(value) || 0;
                if (num >= 1 && num <= 1000) {
                  setTotalPoints(num);
                } else if (value === '') {
                  setTotalPoints('');
                }
              }}
              onBlur={(e) => {
                if (totalPoints === '' || totalPoints < 1) {
                  setTotalPoints(1);
                }
              }}
              placeholder="50"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ appearance: 'textfield' }}
            />
            <p className="text-gray-500 text-xs mt-1">Between 1 and 1000 points</p>
          </div>

          {/* Engineering Level */}
          <div>
            <label className="block text-white font-medium mb-3">Academic Level</label>
            <select
              value={engineeringLevel}
              onChange={(e) => setEngineeringLevel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              <option value="undergraduate">Undergraduate Level</option>
              <option value="graduate">Graduate Level</option>
            </select>
          </div>

          {/* Engineering Discipline */}
          <div>
            <label className="block text-white font-medium mb-3">Subject Area</label>
            <select
              value={engineeringDiscipline}
              onChange={(e) => setEngineeringDiscipline(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              <option value="electrical">Electrical Engineering</option>
              <option value="mechanical">Mechanical Engineering</option>
              <option value="civil">Civil Engineering</option>
              <option value="computer_eng">Computer Engineering</option>
              <option value="cs">Computer Science</option>
              <option value="math">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
            </select>
          </div>
        </div>

        {/* Quick Preview */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h4 className="text-white font-medium mb-3">Assignment Preview</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-400">{numQuestions}</p>
              <p className="text-gray-400 text-sm">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{totalPoints}</p>
              <p className="text-gray-400 text-sm">Total Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{Math.round(totalPoints / numQuestions * 10) / 10}</p>
              <p className="text-gray-400 text-sm">Avg Points/Q</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Question Types
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target size={48} className="text-purple-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Question Types</h2>
        <p className="text-gray-400">Select the types of questions to include in your assignment</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries({
            'multiple-choice': { name: 'Multiple Choice', description: 'Questions with predefined answer options', recommended: true },
            'short-answer': { name: 'Short Answer', description: 'Brief written responses (1-2 sentences)', recommended: true },
            'true-false': { name: 'True/False', description: 'Binary choice questions', recommended: false },
            'numerical': { name: 'Numerical Problems', description: 'Mathematical calculations and solutions', recommended: false },
            'code-writing': { name: 'Code Writing', description: 'Programming problems and solutions', recommended: false },
            'diagram-analysis': { name: 'Diagram Analysis', description: 'Visual analysis and interpretation', recommended: false },
            'multi-part': { name: 'Multi-Part Questions', description: 'Complex questions with multiple sub-parts', recommended: false }
          }).map(([type, info]) => (
            <div
              key={type}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                questionTypes[type]
                  ? 'bg-purple-500/10 border-purple-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => toggleQuestionType(type)}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 ${
                  questionTypes[type]
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-gray-400'
                }`}>
                  {questionTypes[type] && <CheckCircle size={20} className="text-white -m-0.5" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${questionTypes[type] ? 'text-purple-300' : 'text-white'}`}>
                    {info.name}
                    {info.recommended && (
                      <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Recommended
                      </span>
                    )}
                  </h4>
                  <p className="text-gray-400 text-sm mt-1">{info.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!hasSelectedQuestionTypes() && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center space-x-2">
            <AlertCircle size={20} className="text-orange-400" />
            <p className="text-orange-300 text-sm">Please select at least one question type to continue.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          {/* Selected Types Summary */}
          <div className="flex-1 p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-2">Selected Types Summary</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(questionTypes)
                .filter(([type, selected]) => selected)
                .map(([type, _]) => (
                  <span key={type} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {type.replace('-', ' ')}
                  </span>
                ))}
            </div>
            {Object.values(questionTypes).every(selected => !selected) && (
              <p className="text-gray-400 text-sm">No question types selected yet</p>
            )}
          </div>

          {/* Diagram Generation Model */}
          <div className="md:w-72 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Image size={18} className="text-teal-400" />
              <h4 className="text-white font-medium">Image Generation</h4>
            </div>
            <p className="text-gray-400 text-xs mb-3">Model used for diagram-analysis questions</p>
            <div className="space-y-2">
              {[
                { value: 'nonai', label: 'Non AI', desc: 'Code-based (matplotlib, SVG)', color: 'gray' },
                { value: 'flash', label: 'Gemini Flash', desc: 'Fast AI image generation', color: 'blue' },
                { value: 'pro', label: 'Gemini Pro', desc: 'Highest quality AI images', color: 'purple' },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => setDiagramModel(option.value)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                    diagramModel === option.value
                      ? option.color === 'gray'
                        ? 'bg-gray-600/30 border border-gray-500 ring-1 ring-gray-500/50'
                        : option.color === 'blue'
                          ? 'bg-blue-500/15 border border-blue-500/60 ring-1 ring-blue-500/30'
                          : 'bg-purple-500/15 border border-purple-500/60 ring-1 ring-purple-500/30'
                      : 'bg-gray-900/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    diagramModel === option.value
                      ? option.color === 'gray'
                        ? 'border-gray-400'
                        : option.color === 'blue'
                          ? 'border-blue-400'
                          : 'border-purple-400'
                      : 'border-gray-500'
                  }`}>
                    {diagramModel === option.value && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        option.color === 'gray' ? 'bg-gray-400' :
                        option.color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'
                      }`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${
                      diagramModel === option.value ? 'text-white' : 'text-gray-300'
                    }`}>{option.label}</p>
                    <p className="text-gray-500 text-xs truncate">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Generate & Results
  const renderStep4 = () => {
    if (!generatedAssignment && !isGenerating) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <Sparkles size={48} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Generate Assignment</h2>
            <p className="text-gray-400">Review your settings and generate the assignment</p>
          </div>

          {/* Summary */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6">Assignment Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{numQuestions}</p>
                <p className="text-gray-400 text-sm">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{totalPoints}</p>
                <p className="text-gray-400 text-sm">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{Object.values(questionTypes).filter(Boolean).length}</p>
                <p className="text-gray-400 text-sm">Question Types</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Content Sources</h4>
                <div className="space-y-2">
                  {assignmentDescription && (
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <FileText size={16} className="text-green-400" />
                      <span>Custom focus description provided</span>
                    </div>
                  )}
                  {selectedVideos.map((video, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                      <Video size={16} className="text-blue-400" />
                      <span>{video.title}</span>
                    </div>
                  ))}
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                      {getFileIcon(file.type)}
                      <span>{file.name}</span>
                    </div>
                  ))}
                  {uploadedFiles.length === 0 && selectedVideos.length === 0 && !assignmentDescription && (
                    <p className="text-gray-400 text-sm">No content sources added</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">Question Types</h4>
                <div className="space-y-1">
                  {Object.entries(questionTypes)
                    .filter(([type, selected]) => selected)
                    .map(([type, _]) => (
                      <span key={type} className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm mr-2 mb-1">
                        {type.replace('-', ' ')}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleGenerateAssignment}
              disabled={!canGenerate()}
              className={`inline-flex items-center px-8 py-4 font-bold rounded-xl transition-all duration-300 ${
                canGenerate()
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700 hover:scale-105 shadow-lg'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Sparkles size={20} className="mr-2" />
              Generate Assignment
            </button>
          </div>
        </div>
      );
    }

    if (isGenerating || (progressLogs.length > 0 && !generatedAssignment && !generationError)) {
      return <GeneratingProgressView
        numQuestions={numQuestions}
        progressLogs={progressLogs}
        logContainerRef={logContainerRef}
        engineeringDiscipline={engineeringDiscipline}
        diagramModel={diagramModel}
      />;
    }

    if (generationError && !generatedAssignment) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Generation Failed</h2>
            <p className="text-gray-400 max-w-lg mx-auto">{generationError}</p>
          </div>
          <div className="text-center">
            <button
              onClick={() => { setGenerationError(null); setProgressLogs([]); setCurrentStep(3); }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >Go Back & Retry</button>
          </div>
        </div>
      );
    }

    // Generated Assignment Results
    return (
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
                <p className="text-gray-300 text-sm">
                  <DisplayTextWithEquations
                    text={question.question}
                    equations={question.equations || []}
                  />
                </p>
                <span className="text-gray-500 text-xs">
                  {question.type.replace('-', ' ')} question
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Edit Assignment</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleContinueToBuilder}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
            >
              <FileText size={18} className="mr-2" />
              HTML Form Editor
            </button>
            <button
              disabled
              className="inline-flex items-center px-6 py-3 bg-gray-700 text-gray-400 font-medium rounded-lg cursor-not-allowed"
            >
              <FileText size={18} className="mr-2" />
              Google Docs (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <TopBar onNavigateToHome={onNavigateToHome} />
      
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Assignment Generator</h1>
                <p className="text-gray-400">Step {currentStep} of 4</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${
                      step <= currentStep
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                    onClick={() => step < currentStep && goToStep(step)}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`h-1 flex-1 mx-4 rounded transition-colors ${
                        step < currentStep ? 'bg-teal-500' : 'bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Upload</span>
              <span>Settings</span>
              <span>Types</span>
              <span>Generate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation */}
        {currentStep < 4 && !generatedAssignment && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </button>

            <div className="flex space-x-3">
              {currentStep < 3 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={goNext}
                disabled={
                  (currentStep === 1 && !canProceedFromStep1()) ||
                  (currentStep === 3 && !hasSelectedQuestionTypes())
                }
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  (currentStep === 1 && !canProceedFromStep1()) ||
                  (currentStep === 3 && !hasSelectedQuestionTypes())
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                }`}
              >
                {currentStep === 3 ? 'Review & Generate' : 'Next'}
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Video Selection Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-white">Select Videos from Gallery</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Choose videos to generate questions from their transcripts
                </p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Video List */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Video size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No videos with transcripts available</p>
                  <p className="text-gray-500 text-sm">Upload videos in the Gallery to use them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableVideos.map((video) => {
                    const isSelected = selectedVideos.some(v => v.id === video.id);
                    return (
                      <div
                        key={video.id}
                        onClick={() => toggleVideoSelection(video)}
                        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-500/20 border-2 border-blue-500'
                            : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                          }`}>
                            {isSelected && <CheckCircle size={16} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{video.title}</p>
                            <p className="text-gray-400 text-sm">
                              {video.source_type === 'youtube' ? 'YouTube Video' : 'Uploaded Video'} • {video.created_at ? new Date(video.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        {video.source_type === 'youtube' && (
                          <Link size={16} className="text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
              <p className="text-gray-400 text-sm">
                {selectedVideos.length} video(s) selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Animated Generating Progress View ────────────────────────────────
const ICON_MAP = {
  classify: '🔍',
  generate: '🎨',
  review: '🔎',
  regen: '🔄',
  upload: '☁️',
  rephrase: '✏️',
  success: '✅',
  fail: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  question: '📝',
};

function classifyLog(msg) {
  const m = msg.toLowerCase();
  if (m.includes('domainrouter classified') || m.includes('classified:')) return { icon: ICON_MAP.classify, color: 'text-blue-400', phase: 'Classifying' };
  if (m.includes('agent decided')) return { icon: '🤖', color: 'text-purple-400', phase: 'Routing' };
  if (m.includes('executing') && m.includes('tool')) return { icon: ICON_MAP.generate, color: 'text-teal-400', phase: 'Generating Diagram' };
  if (m.includes('generating matplotlib') || m.includes('generating svg')) return { icon: '📊', color: 'text-cyan-400', phase: 'Rendering' };
  if (m.includes('claude code generation successful') || m.includes('claude generated')) return { icon: '🧠', color: 'text-indigo-400', phase: 'AI Code Gen' };
  if (m.includes('rendered successfully') || m.includes('svg→png conversion')) return { icon: '🖼️', color: 'text-green-400', phase: 'Rendered' };
  if (m.includes('uploading diagram') || m.includes('uploaded successfully')) return { icon: ICON_MAP.upload, color: 'text-sky-400', phase: 'Uploading' };
  if (m.includes('diagram review:') && m.includes('failed')) return { icon: ICON_MAP.fail, color: 'text-red-400', phase: 'Review Failed' };
  if (m.includes('diagram review:') && m.includes('pass')) return { icon: ICON_MAP.success, color: 'text-green-400', phase: 'Review Passed' };
  if (m.includes('regenerat')) return { icon: ICON_MAP.regen, color: 'text-amber-400', phase: 'Regenerating' };
  if (m.includes('rephrased') || m.includes('rephrase')) return { icon: ICON_MAP.rephrase, color: 'text-violet-400', phase: 'Rephrasing' };
  if (m.includes('successfully added diagram') || m.includes('successfully generated')) return { icon: ICON_MAP.success, color: 'text-green-400', phase: 'Complete' };
  if (m.includes('analyzing question')) return { icon: ICON_MAP.question, color: 'text-yellow-400', phase: 'Analyzing' };
  if (m.includes('generated') && m.includes('questions')) return { icon: '✨', color: 'text-yellow-400', phase: 'Questions Ready' };
  if (m.includes('starting multi-agent')) return { icon: '🚀', color: 'text-orange-400', phase: 'Diagram Pipeline' };
  if (m.includes('starting assignment generation') || m.includes('content sources extracted')) return { icon: '📦', color: 'text-gray-400', phase: 'Preparing' };
  if (m.includes('engine:') && m.includes('subject:')) return { icon: '⚙️', color: 'text-gray-300', phase: 'Configuration' };
  if (m.includes('diagram analysis complete') || m.includes('cleanup complete')) return { icon: '🏁', color: 'text-green-400', phase: 'Finalizing' };
  if (m.includes('question review')) return { icon: '📋', color: 'text-blue-300', phase: 'Reviewing' };
  if (m.includes('warning') || m.includes('skipping')) return { icon: ICON_MAP.warn, color: 'text-yellow-500', phase: 'Warning' };
  return { icon: ICON_MAP.info, color: 'text-gray-400', phase: 'Processing' };
}

function truncateLogMessage(msg, maxLen = 120) {
  // Remove verbose prefixes
  let cleaned = msg
    .replace(/^(Starting|DEBUG -|INFO -)\s*/i, '')
    .replace(/^(controllers\.config - INFO - )/i, '');
  if (cleaned.length > maxLen) cleaned = cleaned.slice(0, maxLen) + '…';
  return cleaned;
}

function extractQuestionNum(msg) {
  const m = msg.match(/(?:question|Q)\s*(\d+)/i);
  return m ? parseInt(m[1]) : null;
}

const GeneratingProgressView = ({ numQuestions, progressLogs, logContainerRef, engineeringDiscipline, diagramModel }) => {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (logContainerRef?.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progressLogs]);

  // Derive active question being processed
  const latestQuestionNum = (() => {
    for (let i = progressLogs.length - 1; i >= 0; i--) {
      const n = extractQuestionNum(progressLogs[i].message);
      if (n !== null) return n;
    }
    return null;
  })();

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Phase summary: count completed questions
  const completedQuestions = new Set();
  progressLogs.forEach(l => {
    if (l.message.toLowerCase().includes('successfully added diagram') || l.message.toLowerCase().includes('successfully generated')) {
      const n = extractQuestionNum(l.message);
      if (n !== null) completedQuestions.add(n);
    }
  });

  // Current status message
  const latestMeaningfulLog = progressLogs.length > 0
    ? progressLogs[progressLogs.length - 1]
    : null;
  const latestClassified = latestMeaningfulLog ? classifyLog(latestMeaningfulLog.message) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4 relative">
          <Sparkles size={28} className="text-white animate-pulse" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
            <Loader2 size={12} className="text-white animate-spin" />
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Generating Assignment</h2>
        <p className="text-gray-400 text-sm">
          {latestClassified
            ? <span className={latestClassified.color}>{latestClassified.icon} {latestClassified.phase}</span>
            : 'Initializing…'}
          <span className="text-gray-600 mx-2">•</span>
          <span className="text-gray-500 font-mono text-xs">{formatTime(elapsedSec)}</span>
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center">
          <p className="text-lg font-bold text-yellow-400">{numQuestions}</p>
          <p className="text-gray-500 text-xs">Questions</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center">
          <p className="text-lg font-bold text-teal-400">{latestQuestionNum !== null ? latestQuestionNum + 1 : 0}<span className="text-gray-600 text-sm">/{numQuestions}</span></p>
          <p className="text-gray-500 text-xs">Processing</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center">
          <p className="text-lg font-bold text-green-400">{completedQuestions.size}</p>
          <p className="text-gray-500 text-xs">Diagrams Done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(5, ((latestQuestionNum !== null ? latestQuestionNum + 1 : 0) / Math.max(numQuestions, 1)) * 100)}%` }}
        />
      </div>

      {/* Live log feed */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Live Progress</span>
          </div>
          <span className="text-gray-600 text-xs font-mono">{progressLogs.length} events</span>
        </div>

        <div
          ref={logContainerRef}
          className="max-h-80 overflow-y-auto px-2 py-2 space-y-0.5 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
        >
          {progressLogs.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-gray-600 animate-spin mr-2" />
              <span className="text-gray-500 text-sm">Waiting for backend…</span>
            </div>
          )}
          {progressLogs.map((log, idx) => {
            const classified = classifyLog(log.message);
            const isLatest = idx === progressLogs.length - 1;
            const qNum = extractQuestionNum(log.message);

            // Skip noisy HTTP/httpx lines
            if (log.message.includes('HTTP Request:') || log.message.includes('httpx')) return null;
            // Skip overly verbose lines
            if (log.message.startsWith('Starting assignment generation with options:')) return null;
            if (log.message.startsWith('Generation prompt:')) return null;
            if (log.message.startsWith('Linked videos:') || log.message.startsWith('Uploaded files:')) return null;
            if (log.message.includes('Dynamically loaded schemdraw')) return null;

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md transition-all duration-300 ${
                  isLatest ? 'bg-gray-800/80' : 'hover:bg-gray-800/40'
                } ${log.level === 'warning' ? 'border-l-2 border-amber-500/50' : ''}`}
                style={{ animation: isLatest ? 'fadeSlideIn 0.3s ease-out' : 'none' }}
              >
                <span className="text-sm flex-shrink-0 mt-0.5 w-5 text-center">{classified.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${isLatest ? 'text-gray-200' : 'text-gray-400'}`}>
                    {qNum !== null && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 text-[10px] font-mono mr-1.5">
                        Q{qNum}
                      </span>
                    )}
                    {truncateLogMessage(log.message)}
                  </p>
                </div>
                <span className={`text-[10px] font-medium flex-shrink-0 mt-0.5 ${classified.color}`}>
                  {classified.phase}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AIAssignmentGeneratorWizard;