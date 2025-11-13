// src/components/Assignments/AIAssignmentGeneratorWizard.jsx
import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import { api } from '../generic/utils.jsx';
import { useAuth } from '../../context/AuthContext';
import { assignmentApi } from './assignmentApi';
import { fileToBase64 } from './ImportFromDocumentModal';

const AIAssignmentGeneratorWizard = ({ onBack, onNavigateToHome, onContinueToBuilder }) => {
  const { currentUser } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);
  
  // Step 1: Upload & Describe
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');

  // Step 2: Assignment Settings
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalPoints, setTotalPoints] = useState(50);
  const [engineeringLevel, setEngineeringLevel] = useState('undergraduate');
  const [engineeringDiscipline, setEngineeringDiscipline] = useState('general');

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

  // Validation
  const canProceedFromStep1 = () => {
    return uploadedFiles.length > 0;
  };

  const hasSelectedQuestionTypes = () => {
    return Object.values(questionTypes).some(selected => selected);
  };

  const canGenerate = () => {
    return uploadedFiles.length > 0 && hasSelectedQuestionTypes() && numQuestions > 0 && totalPoints > 0;
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
        includeCalculations: questionTypes['numerical']
      };

      const generateData = {
        prompt: assignmentDescription || '',
        title: assignmentTitle || 'Generated Assignment',
        generation_options: generationOptions,
        uploaded_files: uploadedFiles.map(f => ({
          name: f.name,
          type: f.type,
          content: f.content
        })),
        linked_videos: [] // No videos in simplified flow
      };

      const result = await assignmentApi.generateAssignment(generateData);
      setGeneratedAssignment(result);
      setCurrentStep(4); // Move to final screen
    } catch (error) {
      console.error('Error generating assignment:', error);
      // You might want to show an error message here
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
        <Upload size={48} className="text-teal-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Upload Lecture Notes</h2>
        <p className="text-gray-400">Upload your lecture materials (required) and optionally describe the assignment focus</p>
      </div>

      {/* File Upload */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="mb-4">
          <label className="block text-white font-medium mb-3">
            Lecture Notes <span className="text-red-400">*</span>
          </label>
          
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
            <Upload size={32} className="text-gray-400 mx-auto mb-4" />
            <div>
              <label className="cursor-pointer">
                <span className="text-teal-400 hover:text-teal-300 font-medium">
                  Choose files
                </span>
                <span className="text-gray-400"> or drag and drop</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.json,.xml,.csv"
                />
              </label>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              PDF, Word, PowerPoint, Excel, Text, Markdown supported
            </p>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="text-white text-sm font-medium">{file.name}</p>
                    <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}


      </div>

      {/* Assignment Description */}
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
        
        <label className="block text-white font-medium mb-3 mt-6">
          Assignment Focus Description (Optional)
        </label>
        <textarea
          value={assignmentDescription}
          onChange={(e) => setAssignmentDescription(e.target.value)}
          placeholder="Describe the focus area or specific topics to emphasize...&#10;&#10;Examples:&#10;• Focus on CMOS transistor design and analysis&#10;• Include both theory and numerical problems&#10;• Emphasize circuit analysis techniques&#10;• Cover chapters 3-5 from uploaded notes"
          rows={6}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-gray-500 text-sm mt-2">
          <strong>Optional:</strong> Provide additional context about what to focus on. The assignment will be generated from your uploaded files even without this description.
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
              <option value="general">General Engineering</option>
              <option value="electrical">Electrical Engineering</option>
              <option value="mechanical">Mechanical Engineering</option>
              <option value="civil">Civil Engineering</option>
              <option value="computer">Computer Engineering</option>
              <option value="chemical">Chemical Engineering</option>
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

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
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
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                      {getFileIcon(file.type)}
                      <span>{file.name}</span>
                    </div>
                  ))}
                  {assignmentDescription && (
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <FileText size={16} className="text-green-400" />
                      <span>Custom focus description provided</span>
                    </div>
                  )}
                  {uploadedFiles.length === 0 && !assignmentDescription && (
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

    if (isGenerating) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-6">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Generating Assignment</h2>
            <p className="text-gray-400">AI is creating questions based on your content and preferences...</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
            <div className="flex items-center justify-center">
              <div className="animate-pulse text-center">
                <p className="text-white text-lg">Creating {numQuestions} questions...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
              </div>
            </div>
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
                <p className="text-gray-300 text-sm">{question.question}</p>
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
            <button
              disabled
              className="inline-flex items-center px-6 py-3 bg-gray-700 text-gray-400 font-medium rounded-lg cursor-not-allowed"
            >
              <FileText size={18} className="mr-2" />
              Google Forms (Coming Soon)
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

    </div>
  );
};

export default AIAssignmentGeneratorWizard;