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
import { courseApi } from '../Courses/courseApi';
import { fileToBase64 } from './ImportFromDocumentModal';
import DisplayTextWithEquations from './DisplayTextWithEquations';

const AIAssignmentGeneratorWizard = ({ onBack, onNavigateToHome, onContinueToBuilder, inCourseContext = false, courseId = null, courseSubjectData = null }) => {
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
  
  // Video selection from gallery / course
  const [availableVideos, setAvailableVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Course lecture notes selection
  const [availableLectureNotes, setAvailableLectureNotes] = useState([]);
  const [selectedLectureNotes, setSelectedLectureNotes] = useState([]);
  const [isLoadingLectureNotes, setIsLoadingLectureNotes] = useState(false);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);

  // Fetch available videos on mount
  useEffect(() => {
    const fetchAvailableVideos = async () => {
      setIsLoadingVideos(true);
      try {
        if (inCourseContext && courseId) {
          // Use course materials directly — transcript_text & transcript_status are resolved by backend
          const materials = await courseApi.listVideos(courseId);
          setAvailableVideos(
            (materials || [])
              .filter(m => m.transcript_status === 'completed' && m.transcript_text)
              .map(m => ({
                id: m.id,
                title: m.title,
                source_type: m.video_id ? 'gallery' : 'uploaded',
                transcript_text: m.transcript_text,
                created_at: m.created_at,
              }))
          );
        } else {
          const response = await assignmentApi.getAvailableVideos();
          setAvailableVideos(response.videos || []);
        }
      } catch (error) {
        console.error('Error fetching available videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };
    fetchAvailableVideos();
  }, [inCourseContext, courseId]);

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

  // Fetch course lecture notes when in course context
  useEffect(() => {
    if (!inCourseContext || !courseId) return;
    const fetchLectureNotes = async () => {
      setIsLoadingLectureNotes(true);
      try {
        const notes = await courseApi.listLectureNotes(courseId);
        setAvailableLectureNotes(notes || []);
      } catch (error) {
        console.error('Error fetching course lecture notes:', error);
      } finally {
        setIsLoadingLectureNotes(false);
      }
    };
    fetchLectureNotes();
  }, [inCourseContext, courseId]);

  // Toggle course lecture note selection
  const toggleLectureSelection = (note) => {
    setSelectedLectureNotes(prev => {
      const isSelected = prev.some(n => n.id === note.id);
      return isSelected ? prev.filter(n => n.id !== note.id) : [...prev, note];
    });
  };

  // Remove a selected lecture note
  const removeSelectedLecture = (noteId) => {
    setSelectedLectureNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Step 2: Assignment Settings
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalPoints, setTotalPoints] = useState(50);
  const [difficultyLevel, setDifficultyLevel] = useState('mixed');
  const [perQuestionDifficulty, setPerQuestionDifficulty] = useState(false);
  const [customPoints, setCustomPoints] = useState(false);
  const [pointsVariation, setPointsVariation] = useState('constant');
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy:   { count: 0, pointsEach: 1, varyingPoints: [{ points: 1, count: 0 }] },
    medium: { count: 0, pointsEach: 3, varyingPoints: [{ points: 3, count: 0 }] },
    hard:   { count: 0, pointsEach: 5, varyingPoints: [{ points: 5, count: 0 }] },
  });
  const [subjectCategory, setSubjectCategory] = useState(
    inCourseContext && courseSubjectData?.subject_category
      ? courseSubjectData.subject_category
      : 'engineering'
  );
  const [engineeringLevel, setEngineeringLevel] = useState(
    inCourseContext && courseSubjectData?.engineering_level
      ? courseSubjectData.engineering_level
      : ''
  );
  const [engineeringDiscipline, setEngineeringDiscipline] = useState(
    inCourseContext && courseSubjectData?.engineering_discipline
      ? courseSubjectData.engineering_discipline
      : ''
  );

  // Step 3: Question Types
  const [questionTypes, setQuestionTypes] = useState({
    'multiple-choice': true,
    'short-answer': true,
    'true-false': false,
    'numerical': false,
    'code-writing': false,
    'diagram-analysis': false,
    'diagram-required-in-answer': false,
    'multi-part': false,
    'clinical-case': false,
    'osce': false,
  });

  // Reset medical-specific types when subject category changes away from medical
  useEffect(() => {
    if (subjectCategory !== 'medical') {
      setQuestionTypes(prev => ({ ...prev, 'clinical-case': false, 'osce': false }));
    }
  }, [subjectCategory]);

  // Diagram generation model
  const [diagramModel, setDiagramModel] = useState('nonai');

  // Difficulty distribution helpers
  const updateDifficultyCount = (difficulty, count) => {
    const newCount = Math.max(0, parseInt(count) || 0);
    setDifficultyDistribution(prev => ({ ...prev, [difficulty]: { ...prev[difficulty], count: newCount } }));
  };
  const updateDifficultyPoints = (difficulty, points) => {
    const newPoints = Math.max(1, parseInt(points) || 1);
    setDifficultyDistribution(prev => ({ ...prev, [difficulty]: { ...prev[difficulty], pointsEach: newPoints } }));
  };
  const addVaryingPointsEntry = (difficulty) => {
    setDifficultyDistribution(prev => ({
      ...prev,
      [difficulty]: { ...prev[difficulty], varyingPoints: [...prev[difficulty].varyingPoints, { points: 1, count: 0 }] }
    }));
  };
  const removeVaryingPointsEntry = (difficulty, index) => {
    setDifficultyDistribution(prev => {
      const vp = prev[difficulty].varyingPoints.filter((_, i) => i !== index);
      return { ...prev, [difficulty]: { ...prev[difficulty], varyingPoints: vp.length > 0 ? vp : [{ points: 1, count: 0 }] } };
    });
  };
  const updateVaryingPointsEntry = (difficulty, index, field, value) => {
    const newValue = Math.max(field === 'points' ? 1 : 0, parseInt(value) || 0);
    setDifficultyDistribution(prev => {
      const vp = [...prev[difficulty].varyingPoints];
      vp[index] = { ...vp[index], [field]: newValue };
      return { ...prev, [difficulty]: { ...prev[difficulty], varyingPoints: vp } };
    });
  };
  const getTotalAssignedQuestions = () => {
    if (perQuestionDifficulty && customPoints && pointsVariation === 'varying') {
      return Object.values(difficultyDistribution).reduce((sum, d) => sum + d.varyingPoints.reduce((s, v) => s + v.count, 0), 0);
    }
    return Object.values(difficultyDistribution).reduce((sum, d) => sum + d.count, 0);
  };
  const getCalculatedTotalPoints = () => {
    if (perQuestionDifficulty && customPoints && pointsVariation === 'varying') {
      return Object.values(difficultyDistribution).reduce((sum, d) => sum + d.varyingPoints.reduce((s, v) => s + v.count * v.points, 0), 0);
    }
    return Object.values(difficultyDistribution).reduce((sum, d) => sum + d.count * d.pointsEach, 0);
  };
  const isDistributionValid = () => {
    if (!perQuestionDifficulty) return true;
    return getTotalAssignedQuestions() === parseInt(numQuestions);
  };

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

  // Validation - at least one content source required (description, videos, files, or course lectures)
  const canProceedFromStep1 = () => {
    const hasDescription = assignmentDescription.trim().length > 0;
    const hasVideos = selectedVideos.length > 0;
    const hasFiles = uploadedFiles.length > 0;
    const hasLectureNotes = selectedLectureNotes.length > 0;
    return hasDescription || hasVideos || hasFiles || hasLectureNotes;
  };

  const hasSelectedQuestionTypes = () => {
    return Object.values(questionTypes).some(selected => selected);
  };

  const canGenerate = () => {
    return canProceedFromStep1() && hasSelectedQuestionTypes() && numQuestions > 0 && totalPoints > 0
      && (!perQuestionDifficulty || isDistributionValid());
  };

  // Generate assignment
  const handleGenerateAssignment = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);
    
    try {
      // Build generation request - same structure as original
      const effectiveTotalPoints = perQuestionDifficulty ? getCalculatedTotalPoints() : totalPoints;
      // Clean difficultyDistribution: remove pointsEach when using varying points
      const cleanedDistribution = (perQuestionDifficulty && customPoints && pointsVariation === 'varying')
        ? Object.fromEntries(Object.entries(difficultyDistribution).map(([k, v]) => [k, { count: v.count, varyingPoints: v.varyingPoints }]))
        : difficultyDistribution;
      const generationOptions = {
        numQuestions,
        totalPoints: effectiveTotalPoints,
        difficultyLevel,
        perQuestionDifficulty,
        setCustomPoints: customPoints,
        pointsVariation,
        difficultyDistribution: cleanedDistribution,
        subjectCategory,
        engineeringLevel,
        questionTypes,
        engineeringDiscipline,
        includeCode: questionTypes['code-writing'],
        includeDiagrams: questionTypes['diagram-analysis'] || questionTypes['diagram-required-in-answer'],
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

      // Merge manually uploaded files with downloaded course lecture notes
      let allUploadedFiles = uploadedFiles.map(f => ({
        name: f.name,
        type: f.type,
        content: f.content
      }));

      // Download selected course lecture notes and append
      if (inCourseContext && courseId && selectedLectureNotes.length > 0) {
        const downloadedNotes = await Promise.all(
          selectedLectureNotes.map(async (note) => {
            try {
              const { download_url } = await courseApi.downloadMaterial(courseId, note.id);
              const resp = await fetch(download_url);
              const blob = await resp.blob();
              const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              return {
                name: note.file_name || note.title,
                type: note.mime_type || 'application/octet-stream',
                content,
              };
            } catch (e) {
              console.error('Failed to download course lecture note:', note.title, e);
              return null;
            }
          })
        );
        allUploadedFiles = [...allUploadedFiles, ...downloadedNotes.filter(Boolean)];
      }

      const generateData = {
        generation_prompt: assignmentDescription || '',
        title: assignmentTitle || '',
        generation_options: generationOptions,
        uploaded_files: allUploadedFiles,
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
      return <FileText size={20} className="text-[#43ead6]" />;
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return <FileText size={20} className="text-orange-400" />;
    } else {
      return <FileText size={20} className="text-slate-400" />;
    }
  };

  // Step 1: Upload & Describe
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Sparkles size={48} className="text-teal-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Content Sources</h2>
        <p className="text-slate-400">Provide at least one content source: description, {inCourseContext ? 'course video, or course lecture' : 'video from gallery, or lecture notes'}</p>
      </div>

      {/* Requirement indicator */}
      {!canProceedFromStep1() && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle size={20} className="text-orange-400 flex-shrink-0" />
          <p className="text-orange-300 text-sm">
            Please provide at least one of: Assignment Focus Description, {inCourseContext ? 'Course Video, or Course Lecture' : 'Video from Gallery, or Lecture Notes'}
          </p>
        </div>
      )}

      {/* Assignment Description - Now first and more prominent */}
      <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842]">
        <div className="flex items-center space-x-2 mb-4">
          <FileText size={20} className="text-green-400" />
          <label className="block text-white font-medium">
            Assignment Focus Description
          </label>
          <span className="px-2 py-0.5 bg-white/[0.08] text-slate-300 text-xs rounded">Option 1</span>
        </div>
        <textarea
          value={assignmentDescription}
          onChange={(e) => setAssignmentDescription(e.target.value)}
          placeholder="Describe what you want the assignment to focus on...&#10;&#10;Examples:&#10;• Create a quiz on CMOS transistor design principles&#10;• Generate questions about machine learning fundamentals&#10;• Test understanding of thermodynamics laws&#10;• Cover data structures and algorithms basics"
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-slate-500 text-sm mt-2">
          Describe the topic, concepts, or focus areas for your assignment. AI will generate questions based on this description.
        </p>
      </div>

      {/* Video Selection and File Upload in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Selection from Gallery */}
        <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842] flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Video size={20} className="text-[#43ead6]" />
            <label className="block text-white font-medium">
              {inCourseContext ? 'Course Videos' : 'Videos from Gallery'}
            </label>
            <span className="px-2 py-0.5 bg-white/[0.08] text-slate-300 text-xs rounded">Option 2</span>
          </div>
          
          <div className="flex-1">
            {isLoadingVideos ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#1a2943] rounded-lg">
                <Loader2 size={24} className="text-teal-400 animate-spin" />
                <span className="ml-2 text-slate-400">Loading videos...</span>
              </div>
            ) : selectedVideos.length === 0 ? (
              // No videos selected - show button to open modal
              <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#1a2943] rounded-lg">
                <Video size={28} className="text-slate-500 mb-2" />
                {availableVideos.length === 0 ? (
                  <>
                    <p className="text-slate-400 text-sm">No videos available</p>
                    <p className="text-slate-500 text-xs">{inCourseContext ? 'No course videos available' : 'Upload videos in Gallery first'}</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm mb-2">{inCourseContext ? 'Select from course videos' : 'Select videos from your gallery'}</p>
                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="px-4 py-2 bg-[#43ead6] hover:bg-[#43ead6]/90 text-[#051224] text-sm font-medium rounded-lg transition-colors"
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
                      className="flex items-center justify-between p-2 bg-[#43ead6]/15 border border-[#43ead6] rounded-lg"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Video size={16} className="text-[#43ead6] flex-shrink-0" />
                        <p className="text-white text-sm font-medium truncate">{video.title}</p>
                      </div>
                      <button
                        onClick={() => removeSelectedVideo(video.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-full px-3 py-2 bg-white/5 hover:bg-white/[0.08] text-teal-400 text-sm font-medium rounded-lg border border-[#1a2943] transition-colors"
                >
                  + Add More Videos
                </button>
              </div>
            )}
          </div>
          
          <p className="text-slate-500 text-sm mt-3">
            Questions will be generated from video transcripts
          </p>
        </div>

        {/* File Upload / Course Lecture Selector */}
        <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842] flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Upload size={20} className="text-purple-400" />
            <label className="block text-white font-medium">
              {inCourseContext ? 'Course Lectures' : 'Upload Lecture Notes'}
            </label>
            <span className="px-2 py-0.5 bg-white/[0.08] text-slate-300 text-xs rounded">Option 3</span>
          </div>
          
          <div className="flex-1">
            {inCourseContext ? (
              /* Course lecture note selector */
              isLoadingLectureNotes ? (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#1a2943] rounded-lg">
                  <Loader2 size={24} className="text-teal-400 animate-spin" />
                  <span className="ml-2 text-slate-400">Loading lectures...</span>
                </div>
              ) : selectedLectureNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#1a2943] rounded-lg">
                  <FileText size={28} className="text-slate-500 mb-2" />
                  {availableLectureNotes.length === 0 ? (
                    <>
                      <p className="text-slate-400 text-sm">No course lectures available</p>
                      <p className="text-slate-500 text-xs">Upload lecture notes to this course first</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-400 text-sm mb-2">Select from course lectures</p>
                      <button
                        onClick={() => setIsLectureModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Browse Lectures ({availableLectureNotes.length})
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="min-h-[8rem]">
                  <div className="space-y-2 mb-3">
                    {selectedLectureNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-2 bg-purple-500/20 border border-purple-500 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <FileText size={16} className="text-purple-400 flex-shrink-0" />
                          <p className="text-white text-sm font-medium truncate">{note.title}</p>
                        </div>
                        <button
                          onClick={() => removeSelectedLecture(note.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsLectureModalOpen(true)}
                    className="w-full px-3 py-2 bg-white/5 hover:bg-white/[0.08] text-teal-400 text-sm font-medium rounded-lg border border-[#1a2943] transition-colors"
                  >
                    + Add More Lectures
                  </button>
                </div>
              )
            ) : (
              /* Regular file upload */
              uploadedFiles.length === 0 ? (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#1a2943] rounded-lg hover:border-white/20 transition-colors">
                    <Upload size={28} className="text-slate-500 mb-2" />
                    <p className="text-slate-400 text-sm">
                      <span className="text-teal-400 font-medium">Choose files</span> or drag and drop
                    </p>
                    <p className="text-slate-500 text-xs mt-1">PDF, Word, PPT, Excel, Markdown</p>
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
                <div className="min-h-[8rem]">
                  <div className="space-y-2 mb-3">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {getFileIcon(file.type)}
                          <p className="text-white text-sm font-medium truncate">{file.name}</p>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer block">
                    <div className="w-full px-3 py-2 bg-white/5 hover:bg-white/[0.08] text-teal-400 text-sm font-medium rounded-lg border border-[#1a2943] transition-colors text-center">
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
              )
            )}
          </div>
          
          <p className="text-slate-500 text-sm mt-3">
            {inCourseContext ? 'Questions will be generated from selected course materials' : 'Questions will be generated from uploaded content'}
          </p>
        </div>
      </div>

      {/* Assignment Title */}
      <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842]">
        <label className="block text-white font-medium mb-3">
          Assignment Title (Optional)
        </label>
        <input
          type="text"
          value={assignmentTitle}
          onChange={(e) => setAssignmentTitle(e.target.value)}
          placeholder="e.g., CMOS Circuit Design Quiz (will auto-generate if empty)"
          className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-slate-500 text-sm mt-2">
          Leave empty to auto-generate a title based on your content.
        </p>
      </div>
    </div>
  );

  // Step 2: Assignment Settings
  const CATEGORY_LABELS = { engineering: 'Engineering', pcm: 'PCM', medical: 'Medical' };
  const LEVEL_LABELS = {
    undergraduate: 'Undergraduate', graduate: 'Graduate',
    pre_med: 'Pre-Med', mbbs_preclinical: 'MBBS Pre-Clinical',
    mbbs_clinical: 'MBBS Clinical', md: 'MD / Postgraduate',
  };
  const DISCIPLINE_LABELS = {
    electrical: 'Electrical Engineering', mechanical: 'Mechanical Engineering',
    civil: 'Civil Engineering', computer_eng: 'Computer Engineering', cs: 'Computer Science',
    math: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry',
    anatomy: 'Anatomy', physiology: 'Physiology', biochemistry: 'Biochemistry',
    pharmacology: 'Pharmacology', pathology: 'Pathology', microbiology: 'Microbiology',
    surgery: 'Surgery (Clinical)', medicine: 'Medicine (Clinical)', obgyn: 'OB/GYN (Clinical)',
  };
  const inheritedFromCoursePlaceholder = [
    CATEGORY_LABELS[subjectCategory] ?? subjectCategory,
    courseSubjectData?.engineering_level ? (LEVEL_LABELS[engineeringLevel] ?? engineeringLevel) : null,
    courseSubjectData?.engineering_discipline ? (DISCIPLINE_LABELS[engineeringDiscipline] ?? engineeringDiscipline) : null,
  ].filter(Boolean).join(' · ');

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Settings size={48} className="text-[#43ead6] mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Assignment Settings</h2>
        <p className="text-slate-400">Configure the basic parameters for your assignment</p>
      </div>

      <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842]">
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
              className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
              style={{ appearance: 'textfield' }}
            />
            <p className="text-slate-500 text-xs mt-1">Between 1 and 50 questions</p>
          </div>

          {/* Total Points */}
          <div>
            <label className="block text-white font-medium mb-3">
              Total Points {perQuestionDifficulty && <span className="text-[#43ead6] text-sm font-normal">(Calculated: {getCalculatedTotalPoints()})</span>}
            </label>
            <input
              type="text"
              value={perQuestionDifficulty ? getCalculatedTotalPoints() : totalPoints}
              onChange={(e) => {
                if (perQuestionDifficulty) return;
                const value = e.target.value.replace(/[^0-9]/g, '');
                const num = parseInt(value) || 0;
                if (num >= 1 && num <= 1000) {
                  setTotalPoints(num);
                } else if (value === '') {
                  setTotalPoints('');
                }
              }}
              onBlur={() => {
                if (!perQuestionDifficulty && (totalPoints === '' || totalPoints < 1)) {
                  setTotalPoints(1);
                }
              }}
              disabled={perQuestionDifficulty}
              placeholder="50"
              className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ appearance: 'textfield' }}
            />
            <p className="text-slate-500 text-xs mt-1">
              {perQuestionDifficulty ? 'Auto-calculated from difficulty distribution' : 'Between 1 and 1000 points'}
            </p>
          </div>

          {/* Subject Category — hidden when in course context (inherited from course) */}
          {!inCourseContext && (
            <>
              <div>
                <label className="block text-white font-medium mb-3">Subject Category</label>
                <div className="flex gap-2">
                  {[
                    { value: 'engineering', label: '⚙️ Engineering' },
                    { value: 'pcm', label: '🔬 PCM' },
                    { value: 'medical', label: '🩺 Medical' },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setSubjectCategory(cat.value);
                        setEngineeringLevel('');
                        setEngineeringDiscipline('');
                      }}
                      className={`flex-1 px-3 py-3 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${
                        subjectCategory === cat.value
                          ? 'border-[#43ead6] bg-[#43ead6]/15 text-[#43ead6]'
                          : 'border-[#1a2943] bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                {/* Academic Level */}
                <div>
                <label className="block text-white font-medium mb-3">Academic Level</label>
                <select
                  value={engineeringLevel}
                  onChange={(e) => setEngineeringLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
                >
                  <option value="">None</option>
                  {subjectCategory === 'medical' ? (
                    <>
                      <option value="pre_med">Pre-Med</option>
                      <option value="mbbs_preclinical">MBBS Pre-Clinical (Year 1–2)</option>
                      <option value="mbbs_clinical">MBBS Clinical (Year 3–5)</option>
                      <option value="md">MD / Postgraduate</option>
                    </>
                  ) : (
                    <>
                      <option value="undergraduate">Undergraduate Level</option>
                      <option value="graduate">Graduate Level</option>
                    </>
                  )}
                </select>
                </div>

                {/* Subject Area (discipline) */}
                <div>
                <label className="block text-white font-medium mb-3">Subject Area</label>
                <select
                  value={engineeringDiscipline}
                  onChange={(e) => setEngineeringDiscipline(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
                >
                  <option value="">None</option>
                  {subjectCategory === 'engineering' && (
                    <>
                      <option value="electrical">Electrical Engineering</option>
                      <option value="mechanical">Mechanical Engineering</option>
                      <option value="civil">Civil Engineering</option>
                      <option value="computer_eng">Computer Engineering</option>
                      <option value="cs">Computer Science</option>
                    </>
                  )}
                  {subjectCategory === 'pcm' && (
                    <>
                      <option value="math">Mathematics</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                    </>
                  )}
                  {subjectCategory === 'medical' && (
                    <>
                      <option value="anatomy">Anatomy</option>
                      <option value="physiology">Physiology</option>
                      <option value="biochemistry">Biochemistry</option>
                      <option value="pharmacology">Pharmacology</option>
                      <option value="pathology">Pathology</option>
                      <option value="microbiology">Microbiology</option>
                      <option value="surgery">Surgery (Clinical)</option>
                      <option value="medicine">Medicine (Clinical)</option>
                      <option value="obgyn">OB/GYN (Clinical)</option>
                    </>
                  )}
                </select>
                </div>
              </div>
            </>
          )}

          {inCourseContext && (
            <>
              {/* Col 1: Inherited from course box — aligns with Number of Questions */}
              <div>
                <label className="block text-white font-medium mb-3">Inherited from course</label>
                <input
                  type="text"
                  placeholder={inheritedFromCoursePlaceholder}
                  className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
                  style={{ appearance: 'textfield' }}
                  readOnly
                />
              </div>

              {/* Col 2: Dropdowns for fields not set on course — aligns with Total Points */}
              <div className="space-y-4">
                {!courseSubjectData?.engineering_level && (
                  <div>
                    <label className="block text-white font-medium mb-3">Academic Level</label>
                    <select
                      value={engineeringLevel}
                      onChange={(e) => setEngineeringLevel(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
                    >
                      <option value="">None</option>
                      {subjectCategory === 'medical' ? (
                        <>
                          <option value="pre_med">Pre-Med</option>
                          <option value="mbbs_preclinical">MBBS Pre-Clinical (Year 1–2)</option>
                          <option value="mbbs_clinical">MBBS Clinical (Year 3–5)</option>
                          <option value="md">MD / Postgraduate</option>
                        </>
                      ) : (
                        <>
                          <option value="undergraduate">Undergraduate Level</option>
                          <option value="graduate">Graduate Level</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
                {!courseSubjectData?.engineering_discipline && (
                  <div>
                    <label className="block text-white font-medium mb-3">Subject Area</label>
                    <select
                      value={engineeringDiscipline}
                      onChange={(e) => setEngineeringDiscipline(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
                    >
                      <option value="">None</option>
                      {subjectCategory === 'engineering' && (
                        <>
                          <option value="electrical">Electrical Engineering</option>
                          <option value="mechanical">Mechanical Engineering</option>
                          <option value="civil">Civil Engineering</option>
                          <option value="computer_eng">Computer Engineering</option>
                          <option value="cs">Computer Science</option>
                        </>
                      )}
                      {subjectCategory === 'pcm' && (
                        <>
                          <option value="math">Mathematics</option>
                          <option value="physics">Physics</option>
                          <option value="chemistry">Chemistry</option>
                        </>
                      )}
                      {subjectCategory === 'medical' && (
                        <>
                          <option value="anatomy">Anatomy</option>
                          <option value="physiology">Physiology</option>
                          <option value="biochemistry">Biochemistry</option>
                          <option value="pharmacology">Pharmacology</option>
                          <option value="pathology">Pathology</option>
                          <option value="microbiology">Microbiology</option>
                          <option value="surgery">Surgery (Clinical)</option>
                          <option value="medicine">Medicine (Clinical)</option>
                          <option value="obgyn">OB/GYN (Clinical)</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Difficulty Controls */}
        <div className="mt-6 space-y-4">
          {/* Simple difficulty dropdown — hidden when using custom distribution */}
          {!perQuestionDifficulty && (
            <div>
              <label className="block text-white font-medium mb-2">Difficulty Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          )}

          {/* Custom difficulty distribution toggle */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={perQuestionDifficulty}
                onChange={(e) => { setPerQuestionDifficulty(e.target.checked); if (!e.target.checked) setCustomPoints(false); }}
                className="w-4 h-4 text-[#43ead6] bg-white/5 border-[#1a2943] rounded focus:ring-[#43ead6]/50 focus:ring-2"
              />
              <span className="text-white font-medium">Custom difficulty distribution</span>
            </label>
            <p className="text-slate-500 text-xs mt-1 ml-7">Specify exactly how many questions of each difficulty level</p>
          </div>

          {perQuestionDifficulty && (
            <div className="ml-7">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customPoints}
                  onChange={(e) => setCustomPoints(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/5 border-[#1a2943] rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-white font-medium">Set custom points per difficulty</span>
              </label>
              <p className="text-slate-500 text-xs mt-1 ml-7">Customize point values (defaults: easy=1, medium=3, hard=5)</p>
            </div>
          )}

          {/* Difficulty distribution table */}
          {perQuestionDifficulty && (
            <div className="p-4 bg-white/5 rounded-lg border border-[#1a2943]">
              <h4 className="text-white font-medium mb-3">Difficulty Distribution</h4>

              {/* Points variation method */}
              {customPoints && (
                <div className="mb-4 p-3 bg-white/[0.08] rounded-lg space-y-2">
                  <h5 className="text-white text-sm font-medium">Point Assignment Method</h5>
                  {[
                    { value: 'constant', label: 'Constant within difficulty', desc: 'All questions of the same difficulty have the same points' },
                    { value: 'varying',  label: 'Varying within difficulty',  desc: 'Questions of the same difficulty can have different points' },
                  ].map(opt => (
                    <div key={opt.value}>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="wizardPointsVariation"
                          value={opt.value}
                          checked={pointsVariation === opt.value}
                          onChange={() => setPointsVariation(opt.value)}
                          className="w-4 h-4 text-purple-600 bg-white/5 border-white/20 focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-300 font-medium">{opt.label}</span>
                      </label>
                      <p className="text-slate-500 text-xs ml-7">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {[
                  { key: 'easy',   label: 'Easy',   labelCls: 'text-green-300',  inputCls: 'focus:ring-green-500',  subtotalCls: 'text-green-300'  },
                  { key: 'medium', label: 'Medium', labelCls: 'text-yellow-300', inputCls: 'focus:ring-yellow-500', subtotalCls: 'text-yellow-300' },
                  { key: 'hard',   label: 'Hard',   labelCls: 'text-red-300',    inputCls: 'focus:ring-red-500',    subtotalCls: 'text-red-300'    },
                ].map(({ key, label, labelCls, inputCls, subtotalCls }) => {
                  const dist = difficultyDistribution[key];
                  return (
                    <div
                      key={key}
                      className={`grid gap-3 p-3 bg-white/[0.08] rounded-lg ${
                        customPoints
                          ? pointsVariation === 'varying' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'
                          : 'grid-cols-1 md:grid-cols-2'
                      }`}
                    >
                      {/* Count */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${labelCls}`}>{label} Questions</label>
                        <input
                          type="number" min="0" max={numQuestions}
                          value={dist.count}
                          onChange={(e) => updateDifficultyCount(key, e.target.value)}
                          className={`w-full px-3 py-2 bg-white/10 border border-white/25 rounded-lg text-white focus:outline-none focus:ring-2 ${inputCls}`}
                          placeholder="0"
                        />
                      </div>

                      {/* Constant points */}
                      {customPoints && pointsVariation === 'constant' && (
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Points Each</label>
                          <input
                            type="number" min="1"
                            value={dist.pointsEach}
                            onChange={(e) => updateDifficultyPoints(key, e.target.value)}
                            className={`w-full px-3 py-2 bg-white/10 border border-white/25 rounded-lg text-white focus:outline-none focus:ring-2 ${inputCls}`}
                          />
                        </div>
                      )}

                      {/* Varying points */}
                      {customPoints && pointsVariation === 'varying' && (
                        <div className="col-span-2">
                          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Point Distribution</label>
                          <div className="space-y-2">
                            {dist.varyingPoints.map((vp, idx) => {
                              const isLast = idx === dist.varyingPoints.length - 1;
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="number" min="1" value={vp.points}
                                    onChange={(e) => updateVaryingPointsEntry(key, idx, 'points', e.target.value)}
                                    className={`w-20 px-2 py-1 bg-white/10 border border-white/25 rounded text-white focus:outline-none focus:ring-1 ${inputCls}`}
                                    placeholder="Pts"
                                  />
                                  <span className={`${labelCls} text-sm`}>pts ×</span>
                                  <input
                                    type="number" min="0" value={vp.count}
                                    onChange={(e) => updateVaryingPointsEntry(key, idx, 'count', e.target.value)}
                                    className={`w-20 px-2 py-1 bg-white/10 border border-white/25 rounded text-white focus:outline-none focus:ring-1 ${inputCls}`}
                                    placeholder="Qty"
                                  />
                                  <span className={`${labelCls} text-sm`}>Qs</span>
                                  {dist.varyingPoints.length > 1 && (
                                    <button onClick={() => removeVaryingPointsEntry(key, idx)} className="p-1 text-red-400 hover:text-red-300">
                                      <X size={14} />
                                    </button>
                                  )}
                                  {isLast && (
                                    <button
                                      onClick={() => addVaryingPointsEntry(key)}
                                      className="ml-1 flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/[0.08] text-[#43ead6] text-xs font-medium rounded-lg border border-[#1a2943] transition-colors"
                                    >
                                      <Plus size={12} /><span>Add point value</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Subtotal */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Subtotal</label>
                        <div className={`px-3 py-2 bg-white/10 border border-white/25 rounded-lg ${subtotalCls} font-medium`}>
                          {customPoints && pointsVariation === 'varying'
                            ? `${dist.varyingPoints.reduce((s, v) => s + v.count * v.points, 0)} pts`
                            : `${dist.count * dist.pointsEach} pts`
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary & validation */}
              <div className="mt-3 p-3 bg-white/10 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Questions: {getTotalAssignedQuestions()} / {numQuestions}</span>
                  <span className="text-slate-300">Total Points: {getCalculatedTotalPoints()}</span>
                </div>
                <div className="mt-2">
                  {getTotalAssignedQuestions() < numQuestions && (
                    <p className="text-orange-400 text-sm">⚠️ {numQuestions - getTotalAssignedQuestions()} more question(s) needed</p>
                  )}
                  {getTotalAssignedQuestions() > numQuestions && (
                    <p className="text-red-400 text-sm">❌ Too many questions assigned. Reduce the count above.</p>
                  )}
                  {getTotalAssignedQuestions() === parseInt(numQuestions) && numQuestions > 0 && (
                    <p className="text-green-400 text-sm">✅ All {numQuestions} questions configured.</p>
                  )}
                </div>
              </div>

              {/* Quick preset buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: 'Balanced (40/40/20)', cls: 'bg-[#43ead6] hover:bg-[#43ead6]/90', ratios: [0.4, 0.4] },
                  { label: 'Easy Focus (60/30/10)', cls: 'bg-green-600 hover:bg-green-700', ratios: [0.6, 0.3] },
                  { label: 'Hard Focus (20/30/50)', cls: 'bg-red-600 hover:bg-red-700', ratios: [0.2, 0.3] },
                ].map(({ label, cls, ratios }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const total = parseInt(numQuestions);
                      const easy   = Math.floor(total * ratios[0]);
                      const medium = Math.floor(total * ratios[1]);
                      const hard   = total - easy - medium;
                      setDifficultyDistribution({
                        easy:   { count: easy,   pointsEach: 1, varyingPoints: [{ points: 1, count: easy   }] },
                        medium: { count: medium, pointsEach: 3, varyingPoints: [{ points: 3, count: medium }] },
                        hard:   { count: hard,   pointsEach: 5, varyingPoints: [{ points: 5, count: hard   }] },
                      });
                    }}
                    className={`px-3 py-1 ${cls} text-white text-xs rounded transition-colors`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Preview */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-medium mb-3">Assignment Preview</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#43ead6]">{numQuestions}</p>
              <p className="text-slate-400 text-sm">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#43ead6]">{perQuestionDifficulty ? getCalculatedTotalPoints() : totalPoints}</p>
              <p className="text-slate-400 text-sm">Total Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#43ead6]">
                {Math.round((perQuestionDifficulty ? getCalculatedTotalPoints() : totalPoints) / numQuestions * 10) / 10}
              </p>
              <p className="text-slate-400 text-sm">Avg Points/Q</p>
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
        <p className="text-slate-400">Select the types of questions to include in your assignment</p>
      </div>

      <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(
            subjectCategory === 'medical'
              ? {
                  'multiple-choice': { name: 'Multiple Choice', description: 'Questions with predefined answer options', recommended: true },
                  'short-answer': { name: 'Short Answer', description: 'Brief written responses (1–2 sentences)', recommended: true },
                  'true-false': { name: 'True/False', description: 'Binary choice questions', recommended: false },
                  'clinical-case': { name: 'Clinical Case Study', description: 'Patient scenario with diagnosis, investigations & management', recommended: true, badge: 'Medical' },
                  'osce': { name: 'OSCE / Clinical Skills', description: 'Structured clinical examination station with marking scheme', recommended: false, badge: 'Medical' },
                  'diagram-analysis': { name: 'Diagram Analysis', description: 'Visual analysis and interpretation', recommended: false },
                  'diagram-required-in-answer': { name: 'Diagram Required in Answer', description: 'Student must draw/sketch a diagram as part of their answer', recommended: false },
                  'multi-part': { name: 'Multi-Part Questions', description: 'Complex questions with multiple sub-parts', recommended: false },
                }
              : {
                  'multiple-choice': { name: 'Multiple Choice', description: 'Questions with predefined answer options', recommended: true },
                  'short-answer': { name: 'Short Answer', description: 'Brief written responses (1-2 sentences)', recommended: true },
                  'true-false': { name: 'True/False', description: 'Binary choice questions', recommended: false },
                  'numerical': { name: 'Numerical Problems', description: 'Mathematical calculations and solutions', recommended: false },
                  'code-writing': { name: 'Code Writing', description: 'Programming problems and solutions', recommended: false },
                  'diagram-analysis': { name: 'Diagram Analysis', description: 'Visual analysis and interpretation', recommended: false },
                  'diagram-required-in-answer': { name: 'Diagram Required in Answer', description: 'Student must draw/sketch a diagram as part of their answer', recommended: false },
                  'multi-part': { name: 'Multi-Part Questions', description: 'Complex questions with multiple sub-parts', recommended: false },
                }
          ).map(([type, info]) => (
            <div
              key={type}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                questionTypes[type]
                  ? 'bg-purple-500/10 border-purple-500'
                  : 'bg-white/5 border-[#1a2943] hover:border-white/20'
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
                    {info.badge && (
                      <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        {info.badge}
                      </span>
                    )}
                  </h4>
                  <p className="text-slate-400 text-sm mt-1">{info.description}</p>
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
          <div className="flex-1 p-4 bg-white/5 rounded-lg">
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
              <p className="text-slate-400 text-sm">No question types selected yet</p>
            )}
          </div>

          {/* Diagram Generation Model */}
          <div className="md:w-72 p-4 bg-white/5 rounded-lg border border-[#1a2943]">
            <div className="flex items-center gap-2 mb-3">
              <Image size={18} className="text-teal-400" />
              <h4 className="text-white font-medium">Image Generation</h4>
            </div>
            <p className="text-slate-400 text-xs mb-3">Model used for diagram-analysis questions</p>
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
                        ? 'bg-white/10/30 border border-white/25 ring-1 ring-gray-500/50'
                        : option.color === 'blue'
                          ? 'bg-[#43ead6]/30/15 border border-[#43ead6]/60 ring-1 ring-blue-500/30'
                          : 'bg-purple-500/15 border border-purple-500/60 ring-1 ring-purple-500/30'
                      : 'bg-[#0d1f38]/50 border border-[#1a2943] hover:border-white/20'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    diagramModel === option.value
                      ? option.color === 'gray'
                        ? 'border-gray-400'
                        : option.color === 'blue'
                          ? 'border-[#43ead6]'
                          : 'border-purple-400'
                      : 'border-white/25'
                  }`}>
                    {diagramModel === option.value && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        option.color === 'gray' ? 'bg-slate-500' :
                        option.color === 'blue' ? 'bg-[#43ead6]/60' : 'bg-[#43ead6]/40'
                      }`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${
                      diagramModel === option.value ? 'text-white' : 'text-slate-300'
                    }`}>{option.label}</p>
                    <p className="text-slate-500 text-xs truncate">{option.desc}</p>
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
            <p className="text-slate-400">Review your settings and generate the assignment</p>
          </div>

          {/* Summary */}
          <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842]">
            <h3 className="text-xl font-bold text-white mb-6">Assignment Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{numQuestions}</p>
                <p className="text-slate-400 text-sm">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{totalPoints}</p>
                <p className="text-slate-400 text-sm">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{Object.values(questionTypes).filter(Boolean).length}</p>
                <p className="text-slate-400 text-sm">Question Types</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Content Sources</h4>
                <div className="space-y-2">
                  {assignmentDescription && (
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <FileText size={16} className="text-green-400" />
                      <span>Custom focus description provided</span>
                    </div>
                  )}
                  {selectedVideos.map((video, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-slate-300">
                      <Video size={16} className="text-[#43ead6]" />
                      <span>{video.title}</span>
                    </div>
                  ))}
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-slate-300">
                      {getFileIcon(file.type)}
                      <span>{file.name}</span>
                    </div>
                  ))}
                  {uploadedFiles.length === 0 && selectedVideos.length === 0 && !assignmentDescription && (
                    <p className="text-slate-400 text-sm">No content sources added</p>
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

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={goBack}
              className="inline-flex items-center px-6 py-3 bg-white/5 hover:bg-white/[0.08] text-white rounded-lg font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleGenerateAssignment}
              disabled={!canGenerate()}
              className={`inline-flex items-center px-8 py-4 font-bold rounded-xl transition-all duration-300 ${
                canGenerate()
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700 hover:scale-105 shadow-lg'
                  : 'bg-white/[0.08] text-slate-400 cursor-not-allowed'
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
            <p className="text-slate-400 max-w-lg mx-auto">{generationError}</p>
          </div>
          <div className="text-center">
            <button
              onClick={() => { setGenerationError(null); setProgressLogs([]); setCurrentStep(3); }}
              className="px-6 py-3 bg-white/5 hover:bg-white/[0.08] text-white rounded-lg transition-colors"
            >Go Back & Retry</button>
          </div>
        </div>
      );
    }

    // Generated Assignment Results
    return (
      <div className="space-y-6">
        <div className="bg-[#0d1f38] rounded-xl p-6 border border-[#182842]">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle size={24} className="text-green-400" />
            <h2 className="text-xl font-bold text-white">Assignment Generated Successfully!</h2>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">{generatedAssignment.title}</h3>
            <p className="text-slate-400 mb-4">{generatedAssignment.description}</p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-400">{generatedAssignment.questions.length}</p>
                <p className="text-slate-400 text-sm">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-400">
                  {generatedAssignment.questions.reduce((sum, q) => sum + q.points, 0)}
                </p>
                <p className="text-slate-400 text-sm">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-400">Mixed</p>
                <p className="text-slate-400 text-sm">Question Types</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-medium">Generated Questions Preview:</h4>
            {generatedAssignment.questions.map((question, index) => (
              <div key={question.id} className="bg-white/5 rounded-lg p-3 border border-[#1a2943]">
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
                <p className="text-slate-300 text-sm">
                  <DisplayTextWithEquations
                    text={question.question}
                    equations={question.equations || []}
                  />
                </p>
                <span className="text-slate-500 text-xs">
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
              className="inline-flex items-center px-6 py-3 bg-white/[0.08] text-slate-400 font-medium rounded-lg cursor-not-allowed"
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
    <div className="min-h-screen bg-[#071224]">
      <TopBar onNavigateToHome={onNavigateToHome} />
      
      {/* Header */}
      <div className="bg-[#0d1f38] border-b border-[#182842]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Assignment Generator</h1>
                <p className="text-slate-400">Step {currentStep} of 4</p>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mt-6">
            <div className="flex items-center">
              {[
                { n: 1, label: 'Upload' },
                { n: 2, label: 'Settings' },
                { n: 3, label: 'Types' },
                { n: 4, label: 'Generate' },
              ].map(({ n, label }, idx) => (
                <div key={n} className={`flex items-center ${idx < 3 ? 'flex-1' : ''}`}>
                  {/* Circle */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => n < currentStep && goToStep(n)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                        n < currentStep
                          ? 'bg-[#43ead6] border-[#43ead6] text-[#051224] cursor-pointer'
                          : n === currentStep
                          ? 'bg-[#071224] border-[#43ead6] text-[#43ead6]'
                          : 'bg-[#071224] border-[#1a2943] text-slate-500'
                      }`}
                    >
                      {n}
                    </button>
                    <span className={`text-xs whitespace-nowrap ${
                      n <= currentStep ? 'text-[#43ead6]' : 'text-slate-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {/* Connector line */}
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-colors ${
                      n < currentStep ? 'bg-[#43ead6]' : 'bg-[#1a2943]'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-6 py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation */}
        {currentStep < 4 && !generatedAssignment && (
          <div className="mt-8 flex items-center justify-between">
            {currentStep !== 1 && (
              <button
                onClick={goBack}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                  ? 'bg-white/[0.08] text-slate-400 cursor-not-allowed'
                  : 'bg-white/5 text-white hover:bg-white/[0.08]'
              }`}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </button>) || <div />}

            <div className="flex space-x-3">
              {currentStep === 2 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
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
                    ? 'bg-white/[0.08] text-slate-400 cursor-not-allowed'
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
          <div className="bg-[#0d1f38] rounded-xl border border-[#1a2943] w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1a2943]">
              <div>
                <h3 className="text-xl font-bold text-white">{inCourseContext ? 'Select Course Videos' : 'Select Videos from Gallery'}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Choose videos to generate questions from their transcripts
                </p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Video List */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Video size={48} className="text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No videos with transcripts available</p>
                  <p className="text-slate-500 text-sm">{inCourseContext ? 'Add videos to this course to use them here' : 'Upload videos in the Gallery to use them here'}</p>
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
                            ? 'bg-[#43ead6]/15 border-2 border-[#43ead6]'
                            : 'bg-white/5 border-2 border-[#1a2943] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-[#43ead6]/30 border-[#43ead6]' : 'border-gray-400'
                          }`}>
                            {isSelected && <CheckCircle size={16} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{video.title}</p>
                            <p className="text-slate-400 text-sm">
                              {video.source_type === 'youtube' ? 'YouTube Video' : 'Uploaded Video'} • {video.created_at ? new Date(video.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        {video.source_type === 'youtube' && (
                          <Link size={16} className="text-slate-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-[#1a2943] bg-white/5/50">
              <p className="text-slate-400 text-sm">
                {selectedVideos.length} video(s) selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.08] hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 bg-[#43ead6] hover:bg-[#43ead6]/90 text-[#051224] font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Lecture Selection Modal */}
      {isLectureModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1f38] rounded-xl border border-[#1a2943] w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1a2943]">
              <div>
                <h3 className="text-xl font-bold text-white">Select Course Lectures</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Choose lecture notes to generate questions from their content
                </p>
              </div>
              <button
                onClick={() => setIsLectureModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Lecture List */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableLectureNotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No lecture notes available</p>
                  <p className="text-slate-500 text-sm">Upload lecture notes to this course to use them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableLectureNotes.map((note) => {
                    const isSelected = selectedLectureNotes.some(n => n.id === note.id);
                    return (
                      <div
                        key={note.id}
                        onClick={() => toggleLectureSelection(note)}
                        className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : 'bg-white/5 border-2 border-[#1a2943] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-400'
                          }`}>
                            {isSelected && <CheckCircle size={16} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{note.title}</p>
                            <p className="text-slate-400 text-sm">
                              {note.file_name || 'Lecture document'} • {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <FileText size={16} className="text-slate-400 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-[#1a2943] bg-white/5/50">
              <p className="text-slate-400 text-sm">
                {selectedLectureNotes.length} lecture(s) selected
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsLectureModalOpen(false)}
                  className="px-4 py-2 bg-white/[0.08] hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsLectureModalOpen(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
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
  if (m.includes('domainrouter classified') || m.includes('classified:')) return { icon: ICON_MAP.classify, color: 'text-[#43ead6]', phase: 'Classifying' };
  if (m.includes('agent decided')) return { icon: '🤖', color: 'text-purple-400', phase: 'Routing' };
  if (m.includes('executing') && m.includes('tool')) return { icon: ICON_MAP.generate, color: 'text-teal-400', phase: 'Generating Diagram' };
  if (m.includes('generating matplotlib') || m.includes('generating svg')) return { icon: '📊', color: 'text-cyan-400', phase: 'Rendering' };
  if (m.includes('claude code generation successful') || m.includes('claude generated')) return { icon: '🧠', color: 'text-[#43ead6]', phase: 'AI Code Gen' };
  if (m.includes('rendered successfully') || m.includes('svg→png conversion')) return { icon: '🖼️', color: 'text-green-400', phase: 'Rendered' };
  if (m.includes('uploading diagram') || m.includes('uploaded successfully')) return { icon: ICON_MAP.upload, color: 'text-sky-400', phase: 'Uploading' };
  if (m.includes('diagram review:') && m.includes('failed')) return { icon: ICON_MAP.fail, color: 'text-red-400', phase: 'Review Failed' };
  if (m.includes('diagram review:') && m.includes('pass')) return { icon: ICON_MAP.success, color: 'text-green-400', phase: 'Review Passed' };
  if (m.includes('regenerat')) return { icon: ICON_MAP.regen, color: 'text-amber-400', phase: 'Regenerating' };
  if (m.includes('rephrased') || m.includes('rephrase')) return { icon: ICON_MAP.rephrase, color: 'text-violet-400', phase: 'Rephrasing' };
  if (m.includes('diagram added for question')) return { icon: ICON_MAP.success, color: 'text-green-400', phase: 'Diagram Complete' };
  if (m.includes('successfully added diagram') || m.includes('successfully generated')) return { icon: ICON_MAP.success, color: 'text-green-400', phase: 'Complete' };
  if (m.includes('analyzing question')) return { icon: ICON_MAP.question, color: 'text-yellow-400', phase: 'Analyzing' };
  if (m.includes('generated') && m.includes('questions')) return { icon: '✨', color: 'text-yellow-400', phase: 'Questions Ready' };
  if (m.includes('starting multi-agent')) return { icon: '🚀', color: 'text-orange-400', phase: 'Diagram Pipeline' };
  if (m.includes('starting assignment generation') || m.includes('content sources extracted')) return { icon: '📦', color: 'text-slate-400', phase: 'Preparing' };
  if (m.includes('engine:') && m.includes('subject:')) return { icon: '⚙️', color: 'text-slate-300', phase: 'Configuration' };
  if (m.includes('diagram analysis complete') || m.includes('cleanup complete')) return { icon: '🏁', color: 'text-green-400', phase: 'Finalizing' };
  if (m.includes('question review')) return { icon: '📋', color: 'text-[#43ead6]', phase: 'Reviewing' };
  if (m.includes('warning') || m.includes('skipping')) return { icon: ICON_MAP.warn, color: 'text-yellow-500', phase: 'Warning' };
  return { icon: ICON_MAP.info, color: 'text-slate-400', phase: 'Processing' };
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
    if (l.message.toLowerCase().includes('diagram added for question') || l.message.toLowerCase().includes('successfully added diagram') || l.message.toLowerCase().includes('successfully generated')) {
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
        <p className="text-slate-400 text-sm">
          {latestClassified
            ? <span className={latestClassified.color}>{latestClassified.icon} {latestClassified.phase}</span>
            : 'Initializing…'}
          <span className="text-slate-500 mx-2">•</span>
          <span className="text-slate-500 font-mono text-xs">{formatTime(elapsedSec)}</span>
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d1f38] rounded-lg p-3 border border-[#182842] text-center">
          <p className="text-lg font-bold text-yellow-400">{numQuestions}</p>
          <p className="text-slate-500 text-xs">Questions</p>
        </div>
        <div className="bg-[#0d1f38] rounded-lg p-3 border border-[#182842] text-center">
          <p className="text-lg font-bold text-teal-400">{latestQuestionNum !== null ? latestQuestionNum : 0}<span className="text-slate-500 text-sm">/{numQuestions}</span></p>
          <p className="text-slate-500 text-xs">Processing</p>
        </div>
        <div className="bg-[#0d1f38] rounded-lg p-3 border border-[#182842] text-center">
          <p className="text-lg font-bold text-green-400">{completedQuestions.size}</p>
          <p className="text-slate-500 text-xs">Diagrams Done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(5, ((latestQuestionNum !== null ? latestQuestionNum : 0) / Math.max(numQuestions, 1)) * 100)}%` }}
        />
      </div>

      {/* Live log feed */}
      <div className="bg-[#0d1f38] rounded-xl border border-[#182842] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#182842] bg-[#0d1f38]/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Live Progress</span>
          </div>
          <span className="text-slate-500 text-xs font-mono">{progressLogs.length} events</span>
        </div>

        <div
          ref={logContainerRef}
          className="max-h-80 overflow-y-auto px-2 py-2 space-y-0.5 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
        >
          {progressLogs.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-slate-500 animate-spin mr-2" />
              <span className="text-slate-500 text-sm">Waiting for backend…</span>
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
                  isLatest ? 'bg-white/5/80' : 'hover:bg-white/5/40'
                } ${log.level === 'warning' ? 'border-l-2 border-amber-500/50' : ''}`}
                style={{ animation: isLatest ? 'fadeSlideIn 0.3s ease-out' : 'none' }}
              >
                <span className="text-sm flex-shrink-0 mt-0.5 w-5 text-center">{classified.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${isLatest ? 'text-slate-200' : 'text-slate-400'}`}>
                    {qNum !== null && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300 text-[10px] font-mono mr-1.5">
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