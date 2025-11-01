// src/components/Assignments/AssignmentBuilder.jsx
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Eye, 
  GripVertical,
  Trash2,
  Edit,
  ChevronDown
} from 'lucide-react';
import TopBar from '../generic/TopBar';
import QuestionCard from './QuestionCard';
import AssignmentPreview from './AssignmentPreview';
import { assignmentApi } from './assignmentApi';

const AssignmentBuilder = ({ onBack, onNavigateToHome, preloadedData }) => {
  const [questions, setQuestions] = useState(preloadedData?.questions || []);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [assignmentTitle, setAssignmentTitle] = useState(preloadedData?.title || '');
  const [assignmentDescription, setAssignmentDescription] = useState(preloadedData?.description || '');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [validationStatus, setValidationStatus] = useState({ isValid: false, errors: [] });

  const questionTypes = [
    { type: 'multiple-choice', label: 'Multiple Choice', icon: '○', category: 'Basic' },
    { type: 'fill-blank', label: 'Fill in the Blank', icon: '___', category: 'Basic' },
    { type: 'short-answer', label: 'Short Answer', icon: 'A', category: 'Basic' },
    { type: 'numerical', label: 'Numerical', icon: '123', category: 'Basic' },
    { type: 'long-answer', label: 'Long Answer', icon: '¶', category: 'Basic' },
    { type: 'true-false', label: 'True/False', icon: 'T/F', category: 'Basic' },
    { type: 'code-writing', label: 'Code Writing', icon: '</>', category: 'Engineering', color: 'purple' },
    { type: 'diagram-analysis', label: 'Diagram Analysis', icon: '⚡', category: 'Engineering', color: 'orange' },
    { type: 'multi-part', label: 'Multi-Part Question', icon: '📋', category: 'Engineering', color: 'blue' }
  ];

  // Update state when preloadedData changes
  useEffect(() => {
    if (preloadedData) {
      console.log('AssignmentBuilder: Loading preloaded data:', preloadedData);
      
      // Process questions to ensure they have proper IDs for the frontend
      const processedQuestions = (preloadedData.questions || []).map((question, index) => ({
        ...question,
        // Ensure each question has a unique ID that works with the frontend
        id: question.id || Date.now() + index,
        // Ensure order is set
        order: question.order || index + 1
      }));
      
      console.log('AssignmentBuilder: Processed questions:', processedQuestions);
      
      setQuestions(processedQuestions);
      setAssignmentTitle(preloadedData.title || '');
      setAssignmentDescription(preloadedData.description || '');
      // Handle both dueDate (from parsed docs) and due_date (from API)
      const dueDate = preloadedData.due_date || preloadedData.dueDate || '';
      // Convert ISO date to datetime-local format if needed
      if (dueDate) {
        try {
          const date = new Date(dueDate);
          // Format for datetime-local input (YYYY-MM-DDTHH:MM)
          const localDateTime = date.toISOString().slice(0, 16);
          setAssignmentDueDate(localDateTime);
        } catch (e) {
          console.error('Error parsing due date:', e);
          setAssignmentDueDate(dueDate);
        }
      } else {
        setAssignmentDueDate('');
      }
    }
  }, [preloadedData]);

  // Update validation status whenever questions change
  useEffect(() => {
    const validation = validateAssignmentForPublishing();
    setValidationStatus(validation);
  }, [questions, assignmentTitle]);

  const addQuestion = (type) => {
    const baseQuestion = {
      id: Date.now(),
      type,
      question: '',
      options: type === 'multiple-choice' ? ['', '', '', ''] : [],
      correctAnswer: '',
      points: 1,
      rubric: '',
      order: questions.length + 1
    };

    // Add type-specific default values
    const typeSpecificDefaults = {
      'code-writing': {
        codeLanguage: 'python',
        outputType: 'code',
        starterCode: ''
      },
      'diagram-analysis': {
        diagram: null
      },
      'multi-part': {
        subquestions: [],
        hasMainCode: false,
        hasMainDiagram: false,
        mainCodeLanguage: 'python',
        mainDiagram: null,
        rubricType: 'per-subquestion'
      }
    };

    const newQuestion = {
      ...baseQuestion,
      ...typeSpecificDefaults[type]
    };

    setQuestions([...questions, newQuestion]);
    setShowQuestionTypes(false);
  };

  const updateQuestion = (id, updates) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = async (id) => {
    const questionToDelete = questions.find(q => q.id === id);
    const newQuestions = questions.filter(q => q.id !== id);
    
    // Update state immediately for responsive UI
    setQuestions(newQuestions);
    
    // Clean up orphaned diagrams if we have an assignment ID
    if (preloadedData?.id && questionToDelete) {
      try {
        const cleanup = await assignmentApi.cleanupOrphanedDiagrams(
          [questionToDelete], 
          [], 
          preloadedData.id
        );
        if (cleanup.cleaned > 0) {
          console.log(`Cleaned up ${cleanup.cleaned} orphaned diagrams from deleted question`);
        }
        if (cleanup.errors.length > 0) {
          console.warn('Some diagram cleanup failures:', cleanup.errors);
        }
      } catch (error) {
        console.error('Failed to cleanup diagrams for deleted question:', error);
      }
    }
  };

  const moveQuestion = (fromIndex, toIndex) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    setQuestions(newQuestions);
  };

  // Validation function for publishing
  const validateAssignmentForPublishing = () => {
    const errors = [];
    
    // Check if at least one question is present
    if (questions.length === 0) {
      errors.push('At least one question must be present');
    }
    
    // Validate each question and sub-questions
    questions.forEach((question, qIndex) => {
      const questionNum = qIndex + 1;
      
      // Check if question text is not empty
      if (!question.question || question.question.trim() === '') {
        errors.push(`Question ${questionNum}: Question text cannot be empty`);
      }
      
      // Check Include Code requirement
      if ((question.hasMainCode || question.hasCode) && 
          (!question.mainCode || question.mainCode.trim() === '') && 
          (!question.code || question.code.trim() === '')) {
        errors.push(`Question ${questionNum}: Code cannot be empty when Include Code is checked`);
      }
      
      // Check Include Diagram requirement
      if ((question.hasMainDiagram && !question.mainDiagram) || 
          (question.diagram === null && question.type === 'diagram-analysis')) {
        errors.push(`Question ${questionNum}: Diagram must be present when Include Diagram is checked`);
      }
      
      // Check multiple choice options and answers
      if (question.type === 'multiple-choice') {
        const validOptions = question.options?.filter(opt => opt && opt.trim() !== '') || [];
        if (validOptions.length < 2) {
          errors.push(`Question ${questionNum}: At least two options must be present for multiple choice questions`);
        }
        
        // Check correct answers based on single vs multiple correct
        if (question.allowMultipleCorrect) {
          if (!question.multipleCorrectAnswers || question.multipleCorrectAnswers.length === 0) {
            errors.push(`Question ${questionNum}: At least one correct answer must be selected for multiple choice questions`);
          }
        } else {
          if (!question.correctAnswer || question.correctAnswer.trim() === '') {
            errors.push(`Question ${questionNum}: A correct answer must be selected for multiple choice questions`);
          }
        }
      } else if (question.type !== 'multi-part') {
        // Check Sample Answer requirement for non-multiple-choice, non-multi-part questions
        if (!question.correctAnswer || question.correctAnswer.trim() === '') {
          errors.push(`Question ${questionNum}: Sample Answer cannot be empty`);
        }
      }
      
      // Check Rubric requirement (varies for multi-part vs other questions)
      if (question.type === 'multi-part') {
        // Check if multi-part question has sub-questions
        if (!question.subquestions || question.subquestions.length === 0) {
          errors.push(`Question ${questionNum}: Multi-part questions must have at least one sub-question`);
        }
        
        // Multi-part questions now only use per-subquestion rubrics
        // No overall rubric required
      } else {
        // For non-multi-part questions, always require rubric
        if (!question.rubric || question.rubric.trim() === '') {
          errors.push(`Question ${questionNum}: Rubric cannot be empty`);
        }
      }
      
      // Validate sub-questions for multi-part questions
      if (question.type === 'multi-part' && question.subquestions) {
        question.subquestions.forEach((subQ, subIndex) => {
          const subNum = `${questionNum}.${subIndex + 1}`;
          
          // Check sub-question text
          if (!subQ.question || subQ.question.trim() === '') {
            errors.push(`Sub-question ${subNum}: Question text cannot be empty`);
          }
          
          // Check sub-question code
          if ((subQ.hasCode || subQ.hasSubCode)) {
            const hasSubCode = subQ.subCode && subQ.subCode.trim() !== '';
            const hasCode = subQ.code && subQ.code.trim() !== '';
            if (!hasSubCode && !hasCode) {
              errors.push(`Sub-question ${subNum}: Code cannot be empty when Include Code is checked`);
            }
          }
          
          // Check sub-question diagram
          if (subQ.hasDiagram && !subQ.subDiagram) {
            errors.push(`Sub-question ${subNum}: Diagram must be present when Include Diagram is checked`);
          }
          
          // Check sub-question multiple choice options and answers
          if (subQ.type === 'multiple-choice') {
            const validSubOptions = subQ.options?.filter(opt => opt && opt.trim() !== '') || [];
            if (validSubOptions.length < 2) {
              errors.push(`Sub-question ${subNum}: At least two options must be present for multiple choice questions`);
            }
            
            // Check correct answers based on single vs multiple correct
            if (subQ.allowMultipleCorrect) {
              if (!subQ.multipleCorrectAnswers || subQ.multipleCorrectAnswers.length === 0) {
                errors.push(`Sub-question ${subNum}: At least one correct answer must be selected for multiple choice questions`);
              }
            } else {
              if (!subQ.correctAnswer || subQ.correctAnswer.trim() === '') {
                errors.push(`Sub-question ${subNum}: A correct answer must be selected for multiple choice questions`);
              }
            }
          } else if (subQ.type !== 'multi-part') {
            // Check sample answer for non-multiple-choice, non-multi-part sub-questions
            if (!subQ.correctAnswer || subQ.correctAnswer.trim() === '') {
              errors.push(`Sub-question ${subNum}: Sample Answer cannot be empty`);
            }
          }
          
          // Check if multi-part sub-question has sub-sub-questions
          if (subQ.type === 'multi-part') {
            if (!subQ.subquestions || subQ.subquestions.length === 0) {
              errors.push(`Sub-question ${subNum}: Multi-part sub-questions must have at least one sub-part`);
            }
            
            // Multi-part sub-questions now only use per-subquestion rubrics
            // No overall rubric required
          }
          
          // Check sub-question rubric (if using per-subquestion rubrics)
          if (question.rubricType === 'per-subquestion') {
            if (subQ.type !== 'multi-part') {
              // For non-multi-part sub-questions, always require rubric when parent uses per-subquestion
              if (!subQ.rubric || subQ.rubric.trim() === '') {
                errors.push(`Sub-question ${subNum}: Rubric cannot be empty when using per-subquestion rubrics`);
              }
            }
            // Note: Multi-part sub-questions are handled in the block above
          }
          
          // Validate sub-sub-questions
          if (subQ.subquestions) {
            subQ.subquestions.forEach((subSubQ, subSubIndex) => {
              const subSubNum = `${questionNum}.${subIndex + 1}.${subSubIndex + 1}`;
              
              // Check sub-sub-question text
              if (!subSubQ.question || subSubQ.question.trim() === '') {
                errors.push(`Sub-sub-question ${subSubNum}: Question text cannot be empty`);
              }
              
              // Check sub-sub-question multiple choice options and answers
              if (subSubQ.type === 'multiple-choice') {
                const validSubSubOptions = subSubQ.options?.filter(opt => opt && opt.trim() !== '') || [];
                if (validSubSubOptions.length < 2) {
                  errors.push(`Sub-sub-question ${subSubNum}: At least two options must be present for multiple choice questions`);
                }
                
                // Check correct answers based on single vs multiple correct
                if (subSubQ.allowMultipleCorrect) {
                  if (!subSubQ.multipleCorrectAnswers || subSubQ.multipleCorrectAnswers.length === 0) {
                    errors.push(`Sub-sub-question ${subSubNum}: At least one correct answer must be selected for multiple choice questions`);
                  }
                } else {
                  if (!subSubQ.correctAnswer || subSubQ.correctAnswer.trim() === '') {
                    errors.push(`Sub-sub-question ${subSubNum}: A correct answer must be selected for multiple choice questions`);
                  }
                }
              } else {
                // Check sample answer for non-multiple-choice sub-sub-questions
                if (!subSubQ.correctAnswer || subSubQ.correctAnswer.trim() === '') {
                  errors.push(`Sub-sub-question ${subSubNum}: Sample Answer cannot be empty`);
                }
              }
              
              // Check sub-sub-question rubric (only required if parent sub-question uses per-subquestion rubrics)
              if (subQ.rubricType === 'per-subquestion' && (!subSubQ.rubric || subSubQ.rubric.trim() === '')) {
                errors.push(`Sub-sub-question ${subSubNum}: Rubric cannot be empty when using per-subquestion rubrics`);
              }
            });
          }
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const saveAssignment = async (status = 'draft') => {
    if (!assignmentTitle.trim()) {
      alert('Please enter a title for the assignment');
      return;
    }

    // Validate for publishing
    if (status === 'published') {
      const validation = validateAssignmentForPublishing();
      if (!validation.isValid) {
        const errorMessage = `Cannot publish assignment. Please fix the following issues:\n\n${validation.errors.join('\n')}`;
        alert(errorMessage);
        return;
      }
    }

    setSaving(true);
    setSaveError(null);

    try {
      const assignmentData = {
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim() || null,
        due_date: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
        questions: questions,
        status: status,
        engineering_level: preloadedData?.engineering_level || 'undergraduate',
        engineering_discipline: preloadedData?.engineering_discipline || 'general',
        question_types: [...new Set(questions.map(q => q.type))],
        linked_videos: preloadedData?.linked_videos || preloadedData?.linkedVideos || null,
        uploaded_files: preloadedData?.uploaded_files || preloadedData?.uploadedFiles || null,
        generation_prompt: preloadedData?.generation_prompt || null,
        generation_options: preloadedData?.generation_options || null
      };

      if (preloadedData?.id) {
        // Update existing assignment
        await assignmentApi.updateAssignment(preloadedData.id, assignmentData);
        alert('Assignment updated successfully!');
      } else {
        // Create new assignment
        await assignmentApi.createAssignment(assignmentData);
        alert('Assignment saved successfully!');
      }
      
      // Don't automatically go back - let user continue editing or manually go back
    } catch (error) {
      console.error('Failed to save assignment:', error);
      setSaveError('Failed to save assignment. Please try again.');
    } finally {
      setSaving(false);
    }
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
                <h1 className="text-3xl font-bold text-white">Assignment Builder</h1>
                <p className="text-gray-400 mt-2">
                  {preloadedData ? 
                    (preloadedData.id ? 'Editing assignment - modify as needed' : 'Assignment parsed from document - review and modify as needed') : 
                    'Create your assignment manually'
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Eye size={18} className="mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => saveAssignment('draft')}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save size={18} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <div className="relative group">
                  <button
                    onClick={() => saveAssignment('published')}
                    disabled={saving || !validationStatus.isValid}
                    className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      validationStatus.isValid 
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                    title={validationStatus.isValid ? 'Ready to publish' : `Cannot publish: ${validationStatus.errors.length} validation error(s)`}
                  >
                    <Save size={18} className="mr-2" />
                    {saving ? 'Publishing...' : 'Save & Publish'}
                    {!validationStatus.isValid && (
                      <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        {validationStatus.errors.length}
                      </span>
                    )}
                  </button>
                  {!validationStatus.isValid && validationStatus.errors.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-red-900/90 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 z-20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="font-medium text-red-100 mb-2">Cannot publish - Fix these issues:</div>
                      <ul className="space-y-1 text-xs">
                        {validationStatus.errors.slice(0, 5).map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-400 mr-1 flex-shrink-0">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                        {validationStatus.errors.length > 5 && (
                          <li className="text-red-300 italic">...and {validationStatus.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-8 ${showPreview ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Assignment Builder */}
          <div className={`${showPreview ? 'lg:col-span-2' : 'col-span-1'}`}>
            {/* Assignment Details */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Assignment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="Enter assignment title..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={assignmentDescription}
                    onChange={(e) => setAssignmentDescription(e.target.value)}
                    placeholder="Enter assignment description..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Questions</h2>
                <div className="relative">
                  <button
                    onClick={() => setShowQuestionTypes(!showQuestionTypes)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Question
                    <ChevronDown size={18} className="ml-2" />
                  </button>
                  
                  {showQuestionTypes && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        {/* Basic Question Types */}
                        <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700">
                          Basic Question Types
                        </div>
                        {questionTypes.filter(type => type.category === 'Basic').map((type) => (
                          <button
                            key={type.type}
                            onClick={() => addQuestion(type.type)}
                            className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center"
                          >
                            <span className="text-lg mr-3">{type.icon}</span>
                            <span>{type.label}</span>
                          </button>
                        ))}
                        
                        {/* Engineering Question Types */}
                        <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-t border-b border-gray-700 mt-2">
                          Engineering Question Types
                        </div>
                        {questionTypes.filter(type => type.category === 'Engineering').map((type) => (
                          <button
                            key={type.type}
                            onClick={() => addQuestion(type.type)}
                            className={`w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center group`}
                          >
                            <span className={`text-lg mr-3 ${
                              type.color === 'purple' ? 'group-hover:text-purple-400' :
                              type.color === 'orange' ? 'group-hover:text-orange-400' :
                              type.color === 'blue' ? 'group-hover:text-blue-400' :
                              type.color === 'green' ? 'group-hover:text-green-400' :
                              type.color === 'yellow' ? 'group-hover:text-yellow-400' : ''
                            }`}>
                              {type.icon}
                            </span>
                            <div>
                              <div>{type.label}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {type.type === 'code-writing' && 'Programming problems with syntax highlighting'}
                                {type.type === 'diagram-analysis' && 'Circuit diagrams and technical drawings'}
                                {type.type === 'multi-part' && 'Complex problems with multiple sub-questions and code/diagrams'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Questions Yet</h3>
                    <p className="text-gray-400 mb-4">Add your first question to get started</p>
                    <button
                      onClick={() => setShowQuestionTypes(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
                    >
                      <Plus size={18} className="mr-2" />
                      Add Question
                    </button>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      assignmentId={preloadedData?.id || null}
                      onUpdate={(updates) => updateQuestion(question.id, updates)}
                      onDelete={() => deleteQuestion(question.id)}
                      onMoveUp={index > 0 ? () => moveQuestion(index, index - 1) : null}
                      onMoveDown={index < questions.length - 1 ? () => moveQuestion(index, index + 1) : null}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Assignment Preview */}
          {showPreview && (
            <div className="lg:col-span-1">
              <AssignmentPreview
                title={assignmentTitle}
                description={assignmentDescription}
                questions={questions}
                onSave={saveAssignment}
                saving={saving}
                validationStatus={validationStatus}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentBuilder;

