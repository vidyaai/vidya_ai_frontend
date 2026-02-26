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
  console.log('AssignmentBuilder: Received preloadedData:', preloadedData);
  console.log('AssignmentBuilder: Received preloadedData:', preloadedData?.ai_penalty_percentage);

  let initialAiPenalty = 50; // Default value
  if (preloadedData) {
    if (preloadedData.ai_penalty_percentage !== undefined && preloadedData.ai_penalty_percentage !== null) {
      initialAiPenalty = preloadedData.ai_penalty_percentage;
    }
  }

  const [questions, setQuestions] = useState(preloadedData?.questions || []);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [assignmentTitle, setAssignmentTitle] = useState(preloadedData?.title || '');
  const [assignmentDescription, setAssignmentDescription] = useState(preloadedData?.description || '');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [aiPenaltyPercentage, setAiPenaltyPercentage] = useState(initialAiPenalty);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(preloadedData?.id || null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [validationStatus, setValidationStatus] = useState({ isValid: false, errors: [] });
  const [isPublished, setIsPublished] = useState(preloadedData?.status === 'published');

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

  // Helper function to normalize question diagrams (for multi-part questions)
  const normalizeSubquestionDiagrams = (question) => {
    // Handle main diagram for multi-part questions
    if (question.type === 'multi-part') {
      // Map main question 'diagram' to 'mainDiagram' if it exists and mainDiagram doesn't
      if (question.diagram && !question.mainDiagram) {
        question.mainDiagram = question.diagram;
        question.hasMainDiagram = true;
        // Clear the diagram field to avoid duplicates
        question.diagram = null;
      }
      // Set hasMainDiagram if diagram exists
      if (question.mainDiagram) {
        question.hasMainDiagram = true;
      }
    }

    // Handle subquestion diagrams
    if (question.type === 'multi-part' && question.subquestions) {
      const normalizedSubquestions = question.subquestions.map(subq => {
        // Map 'diagram' to 'subDiagram' for frontend compatibility
        if (subq.diagram && !subq.subDiagram) {
          subq.subDiagram = subq.diagram;
          // Clear the diagram field to avoid duplicates
          subq.diagram = null;
          // Set hasDiagram flag if not already set
          if (!('hasDiagram' in subq)) {
            subq.hasDiagram = true;
          }
        }
        // Set hasDiagram flag based on diagram presence
        if (subq.subDiagram) {
          subq.hasDiagram = true;
        }
        
        // Recursively handle nested subquestions
        if (subq.type === 'multi-part' && subq.subquestions) {
          const normalizedNested = normalizeSubquestionDiagrams(subq);
          subq.subquestions = normalizedNested.subquestions;
        }
        
        return subq;
      });
      return { ...question, subquestions: normalizedSubquestions };
    }
    return question;
  };

  // Helper function to get next sequential ID
  const getNextQuestionId = () => {
    if (questions.length === 0) return 1;
    const maxId = Math.max(...questions.map(q => q.id || 0));
    return maxId + 1;
  };

  // Update state when preloadedData changes
  useEffect(() => {
    if (preloadedData) {
      console.log('AssignmentBuilder: Loading preloaded data:', preloadedData);
      
      // Process questions to ensure they have proper IDs for the frontend
      const processedQuestions = (preloadedData.questions || []).map((question, index) => {
        // Normalize subquestion diagrams
        const normalizedQ = normalizeSubquestionDiagrams(question);
        return {
          ...normalizedQ,
          // Ensure each question has a unique ID that works with the frontend
          id: question.id || (index + 1),
          // Ensure order is set
          order: question.order || index + 1
        };
      });
      
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
      id: getNextQuestionId(),
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
        code: ''
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
        optionalParts: false,
        requiredPartsCount: 0
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
      } else if (question.type === 'true-false') {
        // For true/false, correctAnswer must be either "True" or "False" or boolean true/false
        const validTrueFalseAnswers = ['True', 'False', 'true', 'false', true, false, '1', '0', 1, 0];
        if (!validTrueFalseAnswers.includes(question.correctAnswer)) {
            errors.push(`Question ${questionNum}: Correct answer for True/False must be either "True" or "False"`);
        }
      } else if (question.type !== 'multi-part') {
        // Check Sample Answer requirement for non-multiple-choice, non-multi-part questions
        if (!question.correctAnswer || question.correctAnswer.trim() === '') {
          errors.push(`Question ${questionNum}: Sample Answer cannot be empty`);
        }
      }
      
      // Check Rubric requirement
      if (question.type === 'multi-part') {
        // Check if multi-part question has sub-questions
        if (!question.subquestions || question.subquestions.length === 0) {
          errors.push(`Question ${questionNum}: Multi-part questions must have at least one sub-question`);
        }
        // Validate optional parts settings
        if (question.optionalParts) {
          const subqCount = (question.subquestions || []).length;
          if (question.requiredPartsCount <= 0 || question.requiredPartsCount > subqCount) {
            errors.push(`Question ${questionNum}: Required parts count must be between 1 and ${subqCount}`);
          }
          if (question.requiredPartsCount === subqCount) {
            errors.push(`Question ${questionNum}: Optional parts requires student to answer fewer than all parts (currently ${question.requiredPartsCount} of ${subqCount})`);
          }
          
          // Validate that all optional parts have equal points
          const subqPoints = (question.subquestions || []).map(sq => {
            if (sq.type === 'multi-part') {
              // Calculate points for nested multi-part
              return (sq.subquestions || []).reduce((sum, ssq) => sum + (ssq.points || 1), 0);
            }
            return sq.points || 1;
          });
          const uniquePoints = [...new Set(subqPoints)];
          if (uniquePoints.length > 1) {
            errors.push(`Question ${questionNum}: All optional parts must have equal points (found: ${uniquePoints.join(', ')})`);
          }
        }
        // Multi-part questions use per-subquestion rubrics only - no overall rubric needed
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
          } else if (subQ.type === 'true-false') {
            // For true/false, correctAnswer must be either "True" or "False" or boolean true/false
            const validTrueFalseAnswers = ['True', 'False', 'true', 'false', true, false, '1', '0', 1, 0];
            if (!validTrueFalseAnswers.includes(subQ.correctAnswer)) {
                errors.push(`Sub-question ${subNum}: Correct answer for True/False must be either "True" or "False"`);
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
            // Validate optional parts for nested multi-part
            if (subQ.optionalParts) {
              const nestedSubqCount = (subQ.subquestions || []).length;
              if (subQ.requiredPartsCount <= 0 || subQ.requiredPartsCount > nestedSubqCount) {
                errors.push(`Sub-question ${subNum}: Required parts count must be between 1 and ${nestedSubqCount}`);
              }
              if (subQ.requiredPartsCount === nestedSubqCount) {
                errors.push(`Sub-question ${subNum}: Optional parts requires student to answer fewer than all parts`);
              }
              
              // Validate that all optional parts have equal points
              const nestedSubqPoints = (subQ.subquestions || []).map(ssq => ssq.points || 1);
              const uniqueNestedPoints = [...new Set(nestedSubqPoints)];
              if (uniqueNestedPoints.length > 1) {
                errors.push(`Sub-question ${subNum}: All optional parts must have equal points (found: ${uniqueNestedPoints.join(', ')})`);
              }
            }
            // Multi-part sub-questions use per-subquestion rubrics only - no overall rubric needed
          } else {
            // For non-multi-part sub-questions, always require rubric
            if (!subQ.rubric || subQ.rubric.trim() === '') {
              errors.push(`Sub-question ${subNum}: Rubric cannot be empty`);
            }
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
              } else if (subSubQ.type === 'true-false') {
                // For true/false, correctAnswer must be either "True" or "False" or boolean true/false
                const validTrueFalseAnswers = ['True', 'False', 'true', 'false', true, false, '1', '0', 1, 0];
                if (!validTrueFalseAnswers.includes(subSubQ.correctAnswer)) {
                  errors.push(`Sub-sub-question ${subSubNum}: Correct answer for True/False must be either "True" or "False"`);
                }
              } else {
                // Check sample answer for non-multiple-choice sub-sub-questions
                if (!subSubQ.correctAnswer || subSubQ.correctAnswer.trim() === '') {
                  errors.push(`Sub-sub-question ${subSubNum}: Sample Answer cannot be empty`);
                }
              }
              
              // Check sub-sub-question rubric (always required for non-multi-part sub-sub-questions)
              if (subSubQ.type !== 'multi-part' && (!subSubQ.rubric || subSubQ.rubric.trim() === '')) {
                errors.push(`Sub-sub-question ${subSubNum}: Rubric cannot be empty`);
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

  // Helper function to convert subDiagram back to diagram for backend
  const denormalizeSubquestionDiagrams = (question) => {
    // Handle main diagram for multi-part questions
    if (question.type === 'multi-part') {
      // Map 'mainDiagram' back to 'diagram' for backend compatibility
      if (question.mainDiagram && !question.diagram) {
        question.diagram = question.mainDiagram;
      }
      // Keep both fields for backwards compatibility
      // if (question.mainDiagram) {
      //   question.diagram = question.mainDiagram;
      // }
    }

    // Handle subquestion diagrams
    if (question.type === 'multi-part' && question.subquestions) {
      const denormalizedSubquestions = question.subquestions.map(subq => {
        // Map 'subDiagram' back to 'diagram' for backend compatibility
        if (subq.subDiagram && !subq.diagram) {
          subq.diagram = subq.subDiagram;
        }
        // Remove hasDiagram flag if exporting to backend (backend derives it from diagram presence)
        
        // Recursively handle nested subquestions
        if (subq.type === 'multi-part' && subq.subquestions) {
          const denormalizedNested = denormalizeSubquestionDiagrams(subq);
          subq.subquestions = denormalizedNested.subquestions;
        }
        
        return subq;
      });
      return { ...question, subquestions: denormalizedSubquestions };
    }
    return question;
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
      // Process questions for backend: convert to diagram format and set rubricType
      const processedQuestions = questions.map(q => {
        // Denormalize subquestion diagrams for backend
        const denormalizedQ = denormalizeSubquestionDiagrams(q);
        
        if (denormalizedQ.type === 'multi-part') {
          return { ...denormalizedQ, rubricType: 'per-subquestion' };
        }
        return denormalizedQ;
      });

      const assignmentData = {
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim() || null,
        due_date: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
        questions: processedQuestions,
        status: status,
        engineering_level: preloadedData?.engineering_level || 'undergraduate',
        engineering_discipline: preloadedData?.engineering_discipline || 'general',
        question_types: [...new Set(questions.map(q => q.type))],
        course_id: preloadedData?.course_id || null,
        linked_videos: preloadedData?.linked_videos || preloadedData?.linkedVideos || null,
        uploaded_files: preloadedData?.uploaded_files || preloadedData?.uploadedFiles || null,
        generation_prompt: preloadedData?.generation_prompt || null,
        generation_options: preloadedData?.generation_options || null,
        ai_penalty_percentage: aiPenaltyPercentage
      };

      let assignmentId;
      if (currentAssignmentId || preloadedData?.id) {
        // Update existing assignment
        assignmentId = currentAssignmentId || preloadedData.id;
        await assignmentApi.updateAssignment(assignmentId, assignmentData);
        if (status !== 'published') {
          alert('Assignment updated successfully!');
        }
      } else {
        // Create new assignment
        const response = await assignmentApi.createAssignment(assignmentData);
        assignmentId = response.id;
        setCurrentAssignmentId(assignmentId); // Save the ID for future updates
        if (status !== 'published') {
          alert('Assignment saved successfully!');
        }
      }

      // Lock the assignment as published once saved with published status
      if (status === 'published') {
        setIsPublished(true);
        onBack(); // Navigate back to assignments list
      }
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
                  disabled={saving || isPublished}
                  title={isPublished ? 'Already published — cannot revert to draft' : 'Save as draft'}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    AI Plagiarism Penalty (%)
                    <span className="ml-2 text-xs text-gray-400">Score reduction for AI-flagged answers</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={aiPenaltyPercentage}
                      onChange={(e) => setAiPenaltyPercentage(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={aiPenaltyPercentage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= 0 && val <= 100) setAiPenaltyPercentage(val);
                      }}
                      className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <span className="text-gray-400 text-sm">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {aiPenaltyPercentage === 0 ? 'No penalty applied' : 
                     aiPenaltyPercentage === 100 ? 'Full score deduction (0 points)' :
                     `${aiPenaltyPercentage}% score reduction for AI-detected answers`}
                  </p>
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
                isPublished={isPublished}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentBuilder;

