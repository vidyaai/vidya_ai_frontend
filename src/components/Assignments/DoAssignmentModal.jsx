// src/components/Assignments/DoAssignmentModal.jsx
import { useState, useEffect, memo, useCallback } from 'react';
import { 
  Brain,
  X, 
  Save, 
  Upload, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { assignmentApi } from './assignmentApi';
import { TextWithEquations, EquationList } from './EquationRenderer';
import { useIntegrityTracker } from '../../hooks/useIntegrityTracker';

// Component for handling diagram images with URL fetching
const DiagramImage = memo(({ diagramData, displayName }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(!!diagramData.s3_key && !diagramData.s3_url);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImageUrl = async () => {
      if (imageUrl) return;

      // If s3_url is present, use it directly (bypass presigned URL generation)
      if (diagramData.s3_url) {
        setImageUrl(diagramData.s3_url);
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
      } catch (error) {
        console.error('Failed to load diagram URL:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImageUrl();
  }, [diagramData.s3_key, diagramData.s3_url, imageUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-800 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
          <p className="text-gray-300 text-sm">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-800 rounded">
        <div className="text-center">
          <ImageIcon size={32} className="text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Failed to load image</p>
          <p className="text-gray-500 text-xs">{displayName}</p>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={displayName}
      className="w-full max-h-64 object-contain bg-gray-900"
      onError={() => setError(true)}
    />
  );
});

DiagramImage.displayName = 'DiagramImage';

const DoAssignmentModal = ({ assignment, onClose, onAssignmentUpdate }) => {
  const [answers, setAnswers] = useState({});
  const [submissionMethod, setSubmissionMethod] = useState('in-app'); // 'in-app' or 'pdf'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [selectedParts, setSelectedParts] = useState({}); // Track which optional parts are selected
  const [pdfLoading, setPdfLoading] = useState(false);
  const [assignmentQuestions, setAssignmentQuestions] = useState([]);
  
  // AI Plagiarism Detection telemetry (per-question tracking)
  const { 
    startQuestionTracking, 
    stopQuestionTracking, 
    handlePaste, 
    handleKeyDown, 
    getAllQuestionTelemetry, 
    resetTracking 
  } = useIntegrityTracker();

  const actualAssignment = assignment.assignment || assignment;
  
  const questions = actualAssignment.questions && actualAssignment.questions.length > 0 
    ? actualAssignment.questions 
    : [];

  // Load existing draft/submission on component mount
  useEffect(() => {
    loadExistingSubmission();
    // Note: Per-question tracking starts on focus, not modal open
  }, []);

  // Load assignment questions on component mount
//   useEffect(() => {
//     loadAssignmentQuestions();
//   }, [assignment]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadExistingSubmission = async () => {
    try {
      const submission = await assignmentApi.getMySubmission(actualAssignment.id);
      if (!submission) return;
      setSubmission(submission);
      if (submission && submission.answers) {
        setAnswers(submission.answers);
        setSubmissionMethod(submission.submission_method || 'in-app');
        // Check if assignment is already submitted
        if (submission.status === 'submitted' || submission.status === 'graded') {
          setIsAlreadySubmitted(true);
        }
        if (submission.status === 'graded') {
          setIsGraded(true);
        }
        
        // Load selected parts for optional questions (including nested)
        const newSelectedParts = {};
        questions.forEach(question => {
          if (question.type === 'multi-part' && question.optionalParts) {
            const answer = submission.answers[question.id];
            if (answer && answer.subAnswers) {
              const answered = Object.keys(answer.subAnswers).filter(k => answer.subAnswers[k]);
              newSelectedParts[question.id] = answered.map(String);
            } else {
              newSelectedParts[question.id] = [];
            }
          }
          
          // Handle nested multi-part subquestions
          if (question.type === 'multi-part' && question.subquestions) {
            question.subquestions.forEach(subq => {
              if (subq.type === 'multi-part' && subq.optionalParts) {
                const answer = submission.answers[question.id];
                const subAnswer = answer?.subAnswers?.[subq.id];
                if (subAnswer && subAnswer.subAnswers) {
                  const answered = Object.keys(subAnswer.subAnswers).filter(k => subAnswer.subAnswers[k]);
                  newSelectedParts[`${question.id}.${subq.id}`] = answered.map(String);
                } else {
                  newSelectedParts[`${question.id}.${subq.id}`] = [];
                }
              }
            });
          }
        });
        setSelectedParts(newSelectedParts);
      }
      if (submission.status === 'submitted' || submission.status === 'graded') {
        setAssignmentQuestions(submission.assignment.questions || []);
      }
    } catch (error) {
      // No existing submission - this is fine for new assignments
      console.log('No existing submission found');
    }
  };
  
  // Handler for optional parts selection (handles both main and nested)
  const handlePartSelection = (questionId, subqId, isSelected, parentSubqId = null) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    let targetQuestion, requiredCount, selectionKey;
    
    if (parentSubqId) {
      // Nested multi-part subquestion
      const parentSubq = question.subquestions?.find(sq => String(sq.id) === String(parentSubqId));
      if (!parentSubq || !parentSubq.optionalParts) return;
      targetQuestion = parentSubq;
      requiredCount = parentSubq.requiredPartsCount || 1;
      selectionKey = `${questionId}.${parentSubqId}`;
    } else {
      // Main multi-part question
      if (!question.optionalParts) return;
      targetQuestion = question;
      requiredCount = question.requiredPartsCount || 1;
      selectionKey = String(questionId);
    }
    
    const currentSelected = selectedParts[selectionKey] || [];
    
    let newSelected;
    if (isSelected) {
      // Adding a selection
      if (currentSelected.length < requiredCount) {
        newSelected = [...currentSelected, String(subqId)];
      } else {
        // Already at max, don't add
        return;
      }
    } else {
      // Removing a selection
      newSelected = currentSelected.filter(id => id !== String(subqId));
    }
    
    setSelectedParts(prev => ({
      ...prev,
      [selectionKey]: newSelected
    }));
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle diagram upload for a question
  const handleDiagramUpload = async (questionId, file, isSubQuestion = false, subqId = null) => {
    try {
      const uploadResult = await assignmentApi.uploadDiagram(file, actualAssignment.id);
      
      if (isSubQuestion && subqId) {
        // For subquestions
        const currentAnswer = answers[questionId] || {};
        const currentSubAnswers = currentAnswer.subAnswers || {};
        const currentSubAnswer = currentSubAnswers[subqId];
        
        const newSubAnswer = {
          text: typeof currentSubAnswer === 'string' ? currentSubAnswer : (currentSubAnswer?.text || ''),
          diagram: {
            s3_key: uploadResult.s3_key,
            file_id: uploadResult.file_id,
            filename: uploadResult.filename,
          }
        };
        
        handleAnswerChange(questionId, {
          ...currentAnswer,
          subAnswers: {
            ...currentSubAnswers,
            [subqId]: newSubAnswer
          }
        });
      } else {
        // For main questions
        const currentAnswer = answers[questionId];
        const newAnswer = {
          text: typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || ''),
          diagram: {
            s3_key: uploadResult.s3_key,
            file_id: uploadResult.file_id,
            filename: uploadResult.filename,
          }
        };
        handleAnswerChange(questionId, newAnswer);
      }
    } catch (error) {
      console.error('Failed to upload diagram:', error);
      alert('Failed to upload diagram. Please try again.');
    }
  };

  // Remove diagram from answer
  const handleRemoveDiagram = (questionId, isSubQuestion = false, subqId = null) => {
    if (isSubQuestion && subqId) {
      const currentAnswer = answers[questionId] || {};
      const currentSubAnswers = currentAnswer.subAnswers || {};
      const currentSubAnswer = currentSubAnswers[subqId];
      
      const newSubAnswer = {
        text: typeof currentSubAnswer === 'string' ? currentSubAnswer : (currentSubAnswer?.text || ''),
        diagram: null
      };
      
      handleAnswerChange(questionId, {
        ...currentAnswer,
        subAnswers: {
          ...currentSubAnswers,
          [subqId]: newSubAnswer
        }
      });
    } else {
      const currentAnswer = answers[questionId];
      const newAnswer = {
        text: typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || ''),
        diagram: null
      };
      handleAnswerChange(questionId, newAnswer);
    }
  };

  // Handle text change for diagram-enabled questions
  const handleTextChangeWithDiagram = (questionId, text, isSubQuestion = false, subqId = null) => {
    if (isSubQuestion && subqId) {
      const currentAnswer = answers[questionId] || {};
      const currentSubAnswers = currentAnswer.subAnswers || {};
      const currentSubAnswer = currentSubAnswers[subqId];
      
      const newSubAnswer = typeof currentSubAnswer === 'object' && currentSubAnswer !== null
        ? { ...currentSubAnswer, text }
        : { text, diagram: null };
      
      handleAnswerChange(questionId, {
        ...currentAnswer,
        subAnswers: {
          ...currentSubAnswers,
          [subqId]: newSubAnswer
        }
      });
    } else {
      const currentAnswer = answers[questionId];
      const newAnswer = typeof currentAnswer === 'object' && currentAnswer !== null
        ? { ...currentAnswer, text }
        : { text, diagram: null };
      handleAnswerChange(questionId, newAnswer);
    }
  };


  // Helper function to render diagrams - memoized to prevent unnecessary re-renders
  const renderDiagram = useCallback((diagramData, label = "Diagram") => {
    if (!diagramData) return null;

    const isServerDiagram = diagramData.s3_key;
    const displayName = diagramData.filename || diagramData.file || label;

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          {isServerDiagram ? (
            <DiagramImage diagramData={diagramData} displayName={displayName} />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-800 rounded">
              <div className="text-center">
                <ImageIcon size={32} className="text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-gray-500 text-xs">{displayName}</p>
              </div>
            </div>
          )}
        </div>
    );
  }, []);

  const handleMultipleChoiceChange = (questionId, optionIndex, isChecked, allowMultiple) => {
    if (allowMultiple) {
      // Handle multiple correct answers
      const currentAnswers = answers[questionId] || [];
      const answerArray = Array.isArray(currentAnswers) ? currentAnswers : [];
      const optionValue = optionIndex.toString();
      
      let newAnswers;
      if (isChecked) {
        newAnswers = [...answerArray, optionValue];
      } else {
        newAnswers = answerArray.filter(ans => ans !== optionValue);
      }
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers
      }));
    } else {
      // Handle single correct answer (existing behavior)
      handleAnswerChange(questionId, optionIndex.toString());
    }
  };

  const handleSubquestionMultipleChoiceChange = (questionId, subqId, optionIndex, isChecked, allowMultiple) => {
    const currentAnswer = answers[questionId] || {};
    const currentSubAnswers = currentAnswer.subAnswers || {};
    
    if (allowMultiple) {
      // Handle multiple correct answers for subquestion
      const currentSubAnswers = currentAnswer.subAnswers || {};
      const subAnswerArray = Array.isArray(currentSubAnswers[subqId]) ? currentSubAnswers[subqId] : [];
      const optionValue = optionIndex.toString();
      
      let newSubAnswers;
      if (isChecked) {
        newSubAnswers = [...subAnswerArray, optionValue];
      } else {
        newSubAnswers = subAnswerArray.filter(ans => ans !== optionValue);
      }
      
      const newAnswer = {
        ...currentAnswer,
        subAnswers: {
          ...currentSubAnswers,
          [subqId]: newSubAnswers
        }
      };
      
      handleAnswerChange(questionId, newAnswer);
    } else {
      // Handle single correct answer for subquestion (existing behavior)
      const newAnswer = {
        ...currentAnswer,
        subAnswers: {
          ...currentSubAnswers,
          [subqId]: optionIndex.toString()
        }
      };
      handleAnswerChange(questionId, newAnswer);
    }
  };

  const handleNestedSubquestionMultipleChoiceChange = (questionId, subqId, subSubqId, optionIndex, isChecked, allowMultiple) => {
    const currentAnswer = answers[questionId] || {};
    
    if (allowMultiple) {
      // Handle multiple correct answers for nested subquestion
      const currentNestedSubAnswers = currentAnswer?.subAnswers?.[subqId]?.subAnswers || {};
      const nestedSubAnswerArray = Array.isArray(currentNestedSubAnswers[subSubqId]) ? currentNestedSubAnswers[subSubqId] : [];
      const optionValue = optionIndex.toString();
      
      let newNestedSubAnswers;
      if (isChecked) {
        newNestedSubAnswers = [...nestedSubAnswerArray, optionValue];
      } else {
        newNestedSubAnswers = nestedSubAnswerArray.filter(ans => ans !== optionValue);
      }
      
      const newAnswer = {
        ...currentAnswer,
        subAnswers: {
          ...(currentAnswer?.subAnswers || {}),
          [subqId]: {
            ...(currentAnswer?.subAnswers?.[subqId] || {}),
            subAnswers: {
              ...currentNestedSubAnswers,
              [subSubqId]: newNestedSubAnswers
            }
          }
        }
      };
      
      handleAnswerChange(questionId, newAnswer);
    } else {
      // Handle single correct answer for nested subquestion (existing behavior)
      const newAnswer = {
        ...currentAnswer,
        subAnswers: {
          ...(currentAnswer?.subAnswers || {}),
          [subqId]: {
            ...(currentAnswer?.subAnswers?.[subqId] || {}),
            subAnswers: {
              ...(currentAnswer?.subAnswers?.[subqId]?.subAnswers || {}),
              [subSubqId]: optionIndex.toString()
            }
          }
        }
      };
      handleAnswerChange(questionId, newAnswer);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      
      const draftData = {
        answers,
        submission_method: submissionMethod,
        time_spent: "0" // Could track actual time spent
      };

      await assignmentApi.saveDraft(actualAssignment.id, draftData);
      setLastSaved(new Date());
      
      // Notify parent component to refresh assignment status
      if (onAssignmentUpdate) {
        onAssignmentUpdate();
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfFileChange = (event) => {
    // Prevent file changes if assignment is already submitted
    if (isAlreadySubmitted) {
      return;
    }
    
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };
  // Transform answers from question IDs to backend format
  const transformAnswersToSequentialIds = (answersObj) => {
    const transformed = {};
    let mainQuestionCounter = 0;
    
    const processAnswerValue = (value, question) => {
      // If the answer is an object with subAnswers, transform those too
      if (value && typeof value === 'object' && value.subAnswers) {
        const transformedSubAnswers = {};
        
        // Get the subquestions for this question
        const subQuestions = question.subquestions || question.sub_questions || question.subQuestions || [];
        
        // Map each subquestion by its ID
        subQuestions.forEach((subq, subIndex) => {
          const subqId = String(subq.id);
          if (value.subAnswers[subqId]) {
            // Use sequential index (1, 2, 3...) for subquestion keys
            transformedSubAnswers[String(subIndex + 1)] = value.subAnswers[subqId];
          }
        });
        
        return {
          ...value,
          subAnswers: transformedSubAnswers
        };
      }
      
      return value;
    };
    
    // Process each question in order
    questions.forEach((question, questionIndex) => {
      mainQuestionCounter = questionIndex + 1;
      const questionId = String(question.id);
      
      if (answersObj[questionId]) {
        transformed[String(mainQuestionCounter)] = processAnswerValue(answersObj[questionId], question);
      }
    });
    
    return transformed;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Collect per-question telemetry data
      const telemetryData = getAllQuestionTelemetry();
      
      // Transform answers for in-app submissions to use sequential IDs
      const answersToSubmit = submissionMethod === 'in-app' 
        ? transformAnswersToSequentialIds(answers)
        : answers;
      
      let submissionData = {
        answers: answersToSubmit,
        submission_method: submissionMethod,
        time_spent: "0", // Could track actual time spent
        submitted_files: null,
        telemetry_data: telemetryData  // Include telemetry for AI detection
      };

      // Handle PDF submission
      if (submissionMethod === 'pdf') {
        if (!pdfFile) {
          alert('Please upload a PDF file first');
          setIsSubmitting(false);
          return;
        }
        
        // Build minimal payload; backend will extract answers from PDF
        setPdfUploading(true);
        try {
          submissionData = {
            answers: {},
            submission_method: 'pdf',
            time_spent: "0",
            telemetry_data: telemetryData  // Include telemetry even for PDF submissions
          };
        } finally {
          setPdfUploading(false);
        }
      }

      await assignmentApi.submitAssignment(
        actualAssignment.id,
        submissionData,
        submissionMethod === 'pdf' ? pdfFile : null
      );
      setSubmitted(true);
      
      // Notify parent component to refresh assignment status
      if (onAssignmentUpdate) {
        onAssignmentUpdate();
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      alert('Failed to submit assignment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[index+1] || '';

    switch (question.type) {
      case 'multiple_choice':
      case 'multiple-choice':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <div className="space-y-3">
              {question.allowMultipleCorrect && (
                <div className="text-sm text-gray-400 mb-2">
                  Select all correct answers
                </div>
              )}
              {question.options.map((option, optionIndex) => {
                // Find equations for this option
                const optionEquations = question.equations?.filter(
                  eq => eq.position.context === 'options' && 
                       eq.position.option_index === optionIndex
                ) || [];

                return (
                  <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type={question.allowMultipleCorrect ? "checkbox" : "radio"}
                      name={question.allowMultipleCorrect ? undefined : `question-${question.id}`}
                      value={optionIndex}
                      checked={
                        question.allowMultipleCorrect 
                          ? (Array.isArray(currentAnswer) ? currentAnswer : []).includes(optionIndex.toString())
                          : currentAnswer === optionIndex.toString()
                      }
                      onChange={(e) => !isAlreadySubmitted && handleMultipleChoiceChange(
                        question.id, 
                        optionIndex, 
                        e.target.checked, 
                        question.allowMultipleCorrect
                      )}
                      disabled={isAlreadySubmitted}
                      className={`text-teal-500 focus:ring-teal-500 ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                    />
                    <span className="text-white">
                      {optionEquations.length > 0 ? (
                        <TextWithEquations 
                          text={option} 
                          equations={optionEquations} 
                        />
                      ) : (
                        option
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'fill_blank':
      case 'fill-blank':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={!currentAnswer ? "Enter your answer here..." : ""}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        );

      case 'true_false':
      case 'true-false':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <div className="flex space-x-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="true"
                  checked={currentAnswer === 'true'}
                  onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
                  disabled={isAlreadySubmitted}
                  className={`text-teal-500 focus:ring-teal-500 ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                <span className="text-white text-lg">True</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="false"
                  checked={currentAnswer === 'false'}
                  onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
                  disabled={isAlreadySubmitted}
                  className={`text-teal-500 focus:ring-teal-500 ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                <span className="text-white text-lg">False</span>
              </label>
            </div>
          </div>
        );

      case 'short_answer':
      case 'short-answer':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>

            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || '')}
              onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value)}
              onFocus={() => startQuestionTracking(question.id.toString())}
              onBlur={() => stopQuestionTracking(question.id.toString())}
              onPaste={(e) => handlePaste(e, question.id.toString())}
              onKeyDown={(e) => handleKeyDown(e, question.id.toString())}
              placeholder={(typeof currentAnswer === 'string' ? !currentAnswer : !currentAnswer?.text) ? "Enter your answer here..." : ""}
              rows={4}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
            
            {/* Diagram upload */}
            {!isAlreadySubmitted && (
              <div className="space-y-2">
                {currentAnswer?.diagram ? (
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Attached Diagram:</span>
                      <button
                        onClick={() => handleRemoveDiagram(question.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    {renderDiagram(currentAnswer.diagram, "Your diagram")}
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id={`diagram-upload-${question.id}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleDiagramUpload(question.id, e.target.files[0]);
                        }
                      }}
                    />
                    <label
                      htmlFor={`diagram-upload-${question.id}`}
                      className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <ImageIcon size={16} className="mr-2" />
                      Attach Diagram (Optional)
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'numerical':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={!currentAnswer ? "Enter your numerical answer..." : ""}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        );

      case 'long_answer':
      case 'long-answer':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || '')}
              onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value)}
              onFocus={() => startQuestionTracking(question.id.toString())}
              onBlur={() => stopQuestionTracking(question.id.toString())}
              onPaste={(e) => handlePaste(e, question.id.toString())}
              onKeyDown={(e) => handleKeyDown(e, question.id.toString())}
              placeholder={(typeof currentAnswer === 'string' ? !currentAnswer : !currentAnswer?.text) ? "Enter your detailed answer here..." : ""}
              rows={8}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
            
            {/* Diagram upload */}
            {!isAlreadySubmitted && (
              <div className="space-y-2">
                {currentAnswer?.diagram ? (
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Attached Diagram:</span>
                      <button
                        onClick={() => handleRemoveDiagram(question.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    {renderDiagram(currentAnswer.diagram, "Your diagram")}
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id={`diagram-upload-${question.id}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleDiagramUpload(question.id, e.target.files[0]);
                        }
                      }}
                    />
                    <label
                      htmlFor={`diagram-upload-${question.id}`}
                      className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <ImageIcon size={16} className="mr-2" />
                      Attach Diagram (Optional)
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'code_writing':
      case 'code-writing':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-purple-400 text-sm font-medium">{question.points} points</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <div className="bg-gray-800 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-400 text-sm font-medium">
                  Language: {question.codeLanguage?.toUpperCase() || 'PYTHON'}
                </span>
                <span className="text-gray-400 text-sm">
                  Expected: {question.outputType?.replace('-', ' ') || 'Complete Code'}
                </span>
              </div>
              <textarea
                value={currentAnswer}
                onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
                onFocus={() => startQuestionTracking(question.id.toString())}
                onBlur={() => stopQuestionTracking(question.id.toString())}
                onPaste={(e) => handlePaste(e, question.id.toString())}
                onKeyDown={(e) => handleKeyDown(e, question.id.toString())}
                placeholder={isAlreadySubmitted ? "// Submitted code" : "// Write your code here..."}
                rows={12}
                readOnly={isAlreadySubmitted}
                className={`w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm ${
                  isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
                }`}
              />
            </div>
          </div>
        );

      case 'diagram-analysis':
      case 'diagram_analysis':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-orange-400 text-sm font-medium">{question.points} points</span>
            </div>
            <p className="text-gray-300 text-lg">{question.question}</p>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || '')}
              onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value)}
              onFocus={() => startQuestionTracking(question.id.toString())}
              onBlur={() => stopQuestionTracking(question.id.toString())}
              onPaste={(e) => handlePaste(e, question.id.toString())}
              onKeyDown={(e) => handleKeyDown(e, question.id.toString())}
              placeholder={isAlreadySubmitted ? "Submitted analysis" : "Enter your analysis here..."}
              rows={8}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
            
            {/* Diagram upload */}
            {!isAlreadySubmitted && (
              <div className="space-y-2">
                {currentAnswer?.diagram ? (
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Attached Diagram:</span>
                      <button
                        onClick={() => handleRemoveDiagram(question.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    {renderDiagram(currentAnswer.diagram, "Your diagram")}
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id={`diagram-upload-${question.id}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleDiagramUpload(question.id, e.target.files[0]);
                        }
                      }}
                    />
                    <label
                      htmlFor={`diagram-upload-${question.id}`}
                      className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <ImageIcon size={16} className="mr-2" />
                      Attach Diagram (Optional)
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );


      case 'multi-part':
      case 'multi_part':
        return (
          <div key={question.id} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Question {index + 1} - Multi-Part
                {question.optionalParts && (
                  <span className="ml-2 text-sm font-normal text-blue-300">
                    (Answer {question.requiredPartsCount} of {(question.subquestions || []).length})
                  </span>
                )}
              </h3>
              <span className="text-blue-400 text-sm font-medium">{question.points} points total</span>
            </div>
            
            {/* Render question text with equations */}
            <div className="text-gray-300 text-lg">
              {question.equations && question.equations.length > 0 ? (
                <TextWithEquations 
                  text={question.question} 
                  equations={question.equations.filter(eq => eq.position.context === 'question_text')} 
                />
              ) : (
                <p>{question.question}</p>
              )}
            </div>
            
            {/* Show code if available */}
            {question.code && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto mb-4">
                <pre className="text-sm text-green-400">
                    {question.code}
                </pre>
              </div>
            )}
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            {/* Optional Parts Selection UI */}
            {question.optionalParts && !isAlreadySubmitted && (
              <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="text-blue-300 font-medium mb-3">
                  Select exactly {question.requiredPartsCount} of {(question.subquestions || []).length} parts to answer
                </div>
                <div className="space-y-2">
                  {(question.subquestions || []).map((subq, idx) => {
                    const isSelected = (selectedParts[question.id] || []).includes(String(subq.id));
                    const isMaxSelected = (selectedParts[question.id] || []).length >= question.requiredPartsCount;
                    const isDisabled = !isSelected && isMaxSelected;
                    
                    return (
                      <label key={subq.id} className={`flex items-start space-x-3 p-2 rounded ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-900/10'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handlePartSelection(question.id, subq.id, e.target.checked)}
                          disabled={isDisabled}
                          className="mt-1 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">Part {idx + 1} ({subq.points} pts)</div>
                          <div className="text-gray-300 text-sm mt-1">{subq.question.substring(0, 100)}{subq.question.length > 100 ? '...' : ''}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm">
                  <span className={`font-medium ${(selectedParts[question.id] || []).length === question.requiredPartsCount ? 'text-green-400' : 'text-yellow-400'}`}>
                    {(selectedParts[question.id] || []).length} of {question.requiredPartsCount} parts selected
                  </span>
                </div>
              </div>
            )}
            
            {question.optionalParts && isAlreadySubmitted && (selectedParts[question.id] || []).length > 0 && (
              <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="text-blue-300 font-medium mb-2">
                  Selected Parts: {(selectedParts[question.id] || []).length} of {(question.subquestions || []).length}
                </div>
              </div>
            )}
            
            {/* Main Question Code */}
            {((question.hasMainCode && question.mainCode) || (question.hasCode && question.code)) && (
              <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-purple-400 text-sm font-medium">
                    Main Code ({(question.mainCodeLanguage || question.codeLanguage)?.toUpperCase() || 'CODE'})
                  </span>
                </div>
                <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto font-mono border border-gray-700">
                  <code>{question.mainCode || question.code}</code>
                </pre>
              </div>
            )}
            
            {/* Main Question Diagram */}
            {((question.hasMainDiagram && question.mainDiagram) || question.diagram) && 
              renderDiagram(question.mainDiagram || question.diagram, "Main Diagram")
            }
            
            <div className="space-y-4">
              {(question.subquestions || []).map((subq, subIndex) => {
                // For optional parts, only render selected subquestions
                if (question.optionalParts && !isAlreadySubmitted) {
                  const isSelected = (selectedParts[question.id] || []).includes(String(subq.id));
                  if (!isSelected) {
                    return null; // Don't render unselected parts
                  }
                }
                
                // For already submitted optional parts, only show parts that were answered
                if (question.optionalParts && isAlreadySubmitted) {
                  const isSelected = (selectedParts[question.id] || []).includes(String(subq.id));
                  if (!isSelected) {
                    return null; // Don't render unselected parts
                  }
                }
                
                return (
                <div key={subq.id} className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 text-blue-300 font-medium">
                      {subq.equations && subq.equations.length > 0 ? (
                        <TextWithEquations 
                          text={subq.question} 
                          equations={subq.equations.filter(eq => eq.position.context === 'question_text' || eq.position.context === 'subquestion')} 
                        />
                      ) : (
                        <h4>{subq.question}</h4>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                      <span className={`px-2 py-1 rounded text-xs ${
                        subq.type === 'code-writing' ? 'bg-purple-500/20 text-purple-300' :
                        subq.type === 'diagram-analysis' ? 'bg-orange-500/20 text-orange-300' :
                        subq.type === 'multi-part' ? 'bg-blue-500/20 text-blue-300' :
                        subq.type === 'multiple-choice' ? 'bg-teal-500/20 text-teal-300' :
                        subq.type === 'true-false' ? 'bg-yellow-500/20 text-yellow-300' :
                        subq.type === 'fill-blank' ? 'bg-pink-500/20 text-pink-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {subq.type === 'code-writing' ? 'Code' :
                         subq.type === 'diagram-analysis' ? 'Diagram' :
                         subq.type === 'multi-part' ? 'Multi-Part' :
                         subq.type === 'multiple-choice' ? 'MC' :
                         subq.type === 'true-false' ? 'T/F' :
                         subq.type === 'fill-blank' ? 'Fill' :
                         subq.type?.replace('-', ' ') || 'Text'}
                      </span>
                      <span className="text-blue-400 text-sm">{subq.points} pts</span>
                    </div>
                  </div>
                  
                  {/* Sub-question Code */}
                  {((subq.hasSubCode && subq.subCode) || (subq.hasCode && subq.code)) && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-purple-500/30 mb-3">
                      <div className="text-purple-400 text-xs font-medium mb-2">
                        Code ({(subq.codeLanguage)?.toUpperCase() || 'CODE'})
                      </div>
                      <pre className="bg-gray-800 rounded p-2 text-xs text-gray-300 overflow-x-auto font-mono">
                        <code>{subq.subCode || subq.code}</code>
                      </pre>
                    </div>
                  )}
                  
                  {/* Sub-question Diagram */}
                  {subq.hasDiagram && subq.subDiagram && renderDiagram(subq.subDiagram, "Sub-question Diagram")}
                  
                  {/* Render different sub-question types */}
                  {subq.type === 'multiple-choice' ? (
                    <div className="space-y-2">
                      {subq.allowMultipleCorrect && (
                        <div className="text-sm text-gray-400 mb-2">
                          Select all correct answers
                        </div>
                      )}
                      {(subq.options || []).map((option, optionIndex) => {
                        // Find equations for this option
                        const optionEquations = subq.equations?.filter(
                          eq => eq.position.context === 'options' && 
                               eq.position.option_index === optionIndex
                        ) || [];
                        
                        return (
                          <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type={subq.allowMultipleCorrect ? "checkbox" : "radio"}
                              name={subq.allowMultipleCorrect ? undefined : `subq-${question.id}-${subq.id}`}
                              value={optionIndex}
                              checked={
                                subq.allowMultipleCorrect 
                                  ? (Array.isArray((currentAnswer?.subAnswers || {})[subq.id]) 
                                     ? (currentAnswer?.subAnswers || {})[subq.id] 
                                     : []).includes(optionIndex.toString())
                                  : (currentAnswer?.subAnswers || {})[subq.id] === optionIndex.toString()
                              }
                              onChange={(e) => !isAlreadySubmitted && handleSubquestionMultipleChoiceChange(
                                question.id,
                                subq.id,
                                optionIndex,
                                e.target.checked,
                                subq.allowMultipleCorrect
                              )}
                              disabled={isAlreadySubmitted}
                              className={`text-teal-500 focus:ring-teal-500 ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                            />
                            <span className="text-white text-sm">
                              {optionEquations.length > 0 ? (
                                <TextWithEquations 
                                  text={option} 
                                  equations={optionEquations} 
                                />
                              ) : (
                                option
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : subq.type === 'true-false' ? (
                    <div className="flex space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`subq-${question.id}-${subq.id}`}
                          value="true"
                          checked={(currentAnswer?.subAnswers || {})[subq.id] === 'true'}
                          onChange={(e) => {
                            const newAnswer = {
                              ...currentAnswer,
                              subAnswers: {
                                ...(currentAnswer?.subAnswers || {}),
                                [subq.id]: e.target.value
                              }
                            };
                            handleAnswerChange(question.id, newAnswer);
                          }}
                          className="text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="text-white">True</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`subq-${question.id}-${subq.id}`}
                          value="false"
                          checked={(currentAnswer?.subAnswers || {})[subq.id] === 'false'}
                          onChange={(e) => {
                            const newAnswer = {
                              ...currentAnswer,
                              subAnswers: {
                                ...(currentAnswer?.subAnswers || {}),
                                [subq.id]: e.target.value
                              }
                            };
                            handleAnswerChange(question.id, newAnswer);
                          }}
                          className="text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="text-white">False</span>
                      </label>
                    </div>
                  ) : subq.type === 'fill-blank' ? (
                    <div>
                      <p className="text-gray-300 text-sm mb-2">Fill in the blank(s):</p>
                      <input
                        type="text"
                        value={(currentAnswer?.subAnswers || {})[subq.id] || ''}
                        onChange={(e) => {
                          const newAnswer = {
                            ...currentAnswer,
                            subAnswers: {
                              ...(currentAnswer?.subAnswers || {}),
                              [subq.id]: e.target.value
                            }
                          };
                          handleAnswerChange(question.id, newAnswer);
                        }}
                        placeholder={!(currentAnswer?.subAnswers || {})[subq.id] ? "Enter your answer..." : ""}
                        readOnly={isAlreadySubmitted}
                        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                      />
                    </div>
                  ) : subq.type === 'numerical' ? (
                    <input
                      type="text"
                      value={(currentAnswer?.subAnswers || {})[subq.id] || ''}
                      onChange={(e) => {
                        const newAnswer = {
                          ...currentAnswer,
                          subAnswers: {
                            ...(currentAnswer?.subAnswers || {}),
                            [subq.id]: e.target.value
                          }
                        };
                        handleAnswerChange(question.id, newAnswer);
                      }}
                      placeholder="Enter numerical answer..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  ) : subq.type === 'code-writing' ? (
                    <div>
                      <div className="text-xs text-purple-400 mb-2">
                        Language: {subq.codeLanguage?.toUpperCase() || 'CODE'}
                      </div>
                      <textarea
                        value={(currentAnswer?.subAnswers || {})[subq.id] || ''}
                        onChange={(e) => {
                          const newAnswer = {
                            ...currentAnswer,
                            subAnswers: {
                              ...(currentAnswer?.subAnswers || {}),
                              [subq.id]: e.target.value
                            }
                          };
                          handleAnswerChange(question.id, newAnswer);
                        }}
                        placeholder={`// Write your ${subq.codeLanguage || 'code'} here...`}
                        rows={6}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm font-mono"
                      />
                    </div>
                  ) : subq.type === 'diagram-analysis' || subq.type === 'short-answer' || subq.type === 'long-answer' ? (
                    <div className="space-y-2">
                      <textarea
                        value={typeof (currentAnswer?.subAnswers || {})[subq.id] === 'string' ? (currentAnswer?.subAnswers || {})[subq.id] : ((currentAnswer?.subAnswers || {})[subq.id]?.text || '')}
                        onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value, true, subq.id)}
                        onFocus={() => startQuestionTracking(`${question.id}.${subq.id}`)}
                        onBlur={() => stopQuestionTracking(`${question.id}.${subq.id}`)}
                        onPaste={(e) => handlePaste(e, `${question.id}.${subq.id}`)}
                        onKeyDown={(e) => handleKeyDown(e, `${question.id}.${subq.id}`)}
                        placeholder={(typeof (currentAnswer?.subAnswers || {})[subq.id] === 'string' ? !(currentAnswer?.subAnswers || {})[subq.id] : !((currentAnswer?.subAnswers || {})[subq.id]?.text)) ? (subq.type === 'diagram-analysis' ? "Enter your diagram analysis..." : "Enter your answer...") : ""}
                        rows={subq.type === 'long-answer' ? 6 : 4}
                        readOnly={isAlreadySubmitted}
                        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                      />
                      {/* Diagram upload for subquestions */}
                      {!isAlreadySubmitted && (
                        <div>
                          {(currentAnswer?.subAnswers || {})[subq.id]?.diagram ? (
                            <div className="bg-gray-800 p-2 rounded border border-gray-600">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Attached Diagram:</span>
                                <button
                                  onClick={() => handleRemoveDiagram(question.id, true, subq.id)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                              {renderDiagram((currentAnswer?.subAnswers || {})[subq.id]?.diagram, "Your diagram")}
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                id={`diagram-upload-${question.id}-${subq.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleDiagramUpload(question.id, e.target.files[0], true, subq.id);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`diagram-upload-${question.id}-${subq.id}`}
                                className="inline-flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded cursor-pointer transition-colors text-xs"
                              >
                                <ImageIcon size={12} className="mr-1" />
                                Attach Diagram
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                      {/* show diagram if already submitted */}
                      {isAlreadySubmitted && (currentAnswer?.subAnswers || {})[subq.id]?.diagram && (
                          <div className="bg-gray-800 p-2 rounded border border-gray-600">
                              <div className="text-xs text-gray-400 mb-1">Submitted Diagram:</div>
                              {renderDiagram((currentAnswer?.subAnswers || {})[subq.id]?.diagram, "Submitted diagram")}
                          </div>
                      )}
                    </div>
                  ) : subq.type === 'multi-part' ? (
                    <div className="space-y-3 ml-4 border-l-2 border-blue-400/30 pl-4">
                      {/* Optional Parts Selection for Nested Multi-part */}
                      {subq.optionalParts && !isAlreadySubmitted && (
                        <div className="mb-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                          <div className="text-blue-300 font-medium text-xs mb-2">
                            Select exactly {subq.requiredPartsCount} of {(subq.subquestions || []).length} sub-parts to answer
                          </div>
                          <div className="space-y-1">
                            {(subq.subquestions || []).map((subSubq, ssIdx) => {
                              const selectionKey = `${question.id}.${subq.id}`;
                              const isSelected = (selectedParts[selectionKey] || []).includes(String(subSubq.id));
                              const isMaxSelected = (selectedParts[selectionKey] || []).length >= subq.requiredPartsCount;
                              const isDisabled = !isSelected && isMaxSelected;
                              
                              return (
                                <label key={subSubq.id} className={`flex items-start space-x-2 p-1 rounded text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-900/10'}`}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handlePartSelection(question.id, subSubq.id, e.target.checked, subq.id)}
                                    disabled={isDisabled}
                                    className="mt-0.5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                                  />
                                  <div className="flex-1">
                                    <span className="text-white font-medium">Part {subIndex + 1}.{ssIdx + 1} ({subSubq.points} pts)</span>
                                    <div className="text-gray-300 text-xs mt-0.5">{subSubq.question.substring(0, 80)}{subSubq.question.length > 80 ? '...' : ''}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                          <div className="mt-2 text-xs">
                            <span className={`font-medium ${(selectedParts[selectionKey] || []).length === subq.requiredPartsCount ? 'text-green-400' : 'text-yellow-400'}`}>
                              {(selectedParts[selectionKey] || []).length} of {subq.requiredPartsCount} selected
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {subq.optionalParts && isAlreadySubmitted && (selectedParts[`${question.id}.${subq.id}`] || []).length > 0 && (
                        <div className="mb-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
                          <div className="text-blue-300 font-medium text-xs">
                            Selected Sub-parts: {(selectedParts[`${question.id}.${subq.id}`] || []).length} of {(subq.subquestions || []).length}
                          </div>
                        </div>
                      )}
                      
                      {(subq.subquestions || []).map((subSubq, subSubIndex) => {
                        // For optional parts, only render selected sub-sub-questions
                        if (subq.optionalParts) {
                          const selectionKey = `${question.id}.${subq.id}`;
                          const isSelected = (selectedParts[selectionKey] || []).includes(String(subSubq.id));
                          if (!isSelected) {
                            return null; // Don't render unselected parts
                          }
                        }
                        
                        return (
                        <div key={subSubq.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-200 text-sm font-medium">
                              Part {subIndex + 1}.{subSubIndex + 1}: {subSubq.question}
                            </span>
                            <span className="text-blue-300 text-xs">{subSubq.points} pts</span>
                          </div>
                          
                          {/* Sub-sub-question code if present */}
                          {subSubq.code && (
                            <div className="bg-gray-800 rounded p-2 mb-2 border border-gray-600">
                              <p className="text-gray-400 text-xs mb-1">Code:</p>
                              <pre className="text-green-400 text-xs overflow-x-auto font-mono">
                                {subSubq.code}
                              </pre>
                            </div>
                          )}
                          
                          {/* Sub-sub-question diagram if present */}
                          {subSubq.diagram && (
                            <div className="bg-gray-800 rounded p-2 mb-2 border border-gray-600">
                              <p className="text-gray-400 text-xs mb-1">Diagram:</p>
                              {renderDiagram(subSubq.diagram, "Sub-sub-question diagram")}
                            </div>
                          )}
                          
                          {/* Render sub-sub-questions */}
                          {(subSubq.type === 'multiple-choice' || subSubq.type === 'multiple_choice') ? (
                            <div className="space-y-1">
                              {subSubq.allowMultipleCorrect && (
                                <div className="text-xs text-gray-400 mb-1">
                                  Select all correct answers
                                </div>
                              )}
                              {(subSubq.options || []).map((option, optionIndex) => (
                                <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type={subSubq.allowMultipleCorrect ? "checkbox" : "radio"}
                                    name={subSubq.allowMultipleCorrect ? undefined : `subsubq-${question.id}-${subq.id}-${subSubq.id}`}
                                    value={optionIndex}
                                    checked={
                                      subSubq.allowMultipleCorrect 
                                        ? (Array.isArray((currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]) 
                                           ? (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] 
                                           : []).includes(optionIndex.toString())
                                        : (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] === optionIndex.toString()
                                    }
                                    onChange={(e) => !isAlreadySubmitted && handleNestedSubquestionMultipleChoiceChange(
                                      question.id,
                                      subq.id,
                                      subSubq.id,
                                      optionIndex,
                                      e.target.checked,
                                      subSubq.allowMultipleCorrect
                                    )}
                                    disabled={isAlreadySubmitted}
                                    className={`text-teal-500 focus:ring-teal-500 ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                                  />
                                  <span className="text-white text-sm">{option}</span>
                                </label>
                              ))}
                            </div>
                          ) : (subSubq.type === 'true-false' || subSubq.type === 'true_false') ? (
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`subsubq-${question.id}-${subq.id}-${subSubq.id}`}
                                  value="true"
                                  checked={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] === 'true'}
                                  onChange={(e) => {
                                    const newAnswer = {
                                      ...currentAnswer,
                                      subAnswers: {
                                        ...(currentAnswer?.subAnswers || {}),
                                        [subq.id]: {
                                          ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                          subAnswers: {
                                            ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                            [subSubq.id]: e.target.value
                                          }
                                        }
                                      }
                                    };
                                    handleAnswerChange(question.id, newAnswer);
                                  }}
                                  className="text-yellow-500 focus:ring-yellow-500"
                                />
                                <span className="text-white text-sm">True</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`subsubq-${question.id}-${subq.id}-${subSubq.id}`}
                                  value="false"
                                  checked={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] === 'false'}
                                  onChange={(e) => {
                                    const newAnswer = {
                                      ...currentAnswer,
                                      subAnswers: {
                                        ...(currentAnswer?.subAnswers || {}),
                                        [subq.id]: {
                                          ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                          subAnswers: {
                                            ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                            [subSubq.id]: e.target.value
                                          }
                                        }
                                      }
                                    };
                                    handleAnswerChange(question.id, newAnswer);
                                  }}
                                  className="text-yellow-500 focus:ring-yellow-500"
                                />
                                <span className="text-white text-sm">False</span>
                              </label>
                            </div>
                          ) : (subSubq.type === 'fill-blank' || subSubq.type === 'fill_blank') ? (
                            <input
                              type="text"
                              value={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] || ''}
                              onChange={(e) => {
                                const newAnswer = {
                                  ...currentAnswer,
                                  subAnswers: {
                                    ...(currentAnswer?.subAnswers || {}),
                                    [subq.id]: {
                                      ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                      subAnswers: {
                                        ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                        [subSubq.id]: e.target.value
                                      }
                                    }
                                  }
                                };
                                handleAnswerChange(question.id, newAnswer);
                              }}
                              placeholder="Fill in the blank..."
                              readOnly={isAlreadySubmitted}
                              className={`w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                            />
                          ) : subSubq.type === 'numerical' ? (
                            <input
                              type="text"
                              value={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] || ''}
                              onChange={(e) => {
                                const newAnswer = {
                                  ...currentAnswer,
                                  subAnswers: {
                                    ...(currentAnswer?.subAnswers || {}),
                                    [subq.id]: {
                                      ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                      subAnswers: {
                                        ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                        [subSubq.id]: e.target.value
                                      }
                                    }
                                  }
                                };
                                handleAnswerChange(question.id, newAnswer);
                              }}
                              placeholder="Enter number..."
                              readOnly={isAlreadySubmitted}
                              className={`w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                            />
                          ) : (subSubq.type === 'code-writing' || subSubq.type === 'code_writing') ? (
                            <div>
                              <div className="text-xs text-purple-400 mb-1">
                                Language: {subSubq.codeLanguage?.toUpperCase() || 'CODE'}
                              </div>
                              <textarea
                                value={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] || ''}
                                onChange={(e) => {
                                  const newAnswer = {
                                    ...currentAnswer,
                                    subAnswers: {
                                      ...(currentAnswer?.subAnswers || {}),
                                      [subq.id]: {
                                        ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                        subAnswers: {
                                          ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                          [subSubq.id]: e.target.value
                                        }
                                      }
                                    }
                                  };
                                  handleAnswerChange(question.id, newAnswer);
                                }}
                                placeholder={`// Write your ${subSubq.codeLanguage || 'code'} here...`}
                                rows={6}
                                readOnly={isAlreadySubmitted}
                                className={`w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none text-sm font-mono ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                              />
                            </div>
                          ) : (subSubq.type === 'diagram-analysis' || subSubq.type === 'diagram_analysis' || subSubq.type === 'short-answer' || subSubq.type === 'short_answer' || subSubq.type === 'long-answer' || subSubq.type === 'long_answer') ? (
                            <div className="space-y-2">
                              <textarea
                                value={typeof (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] === 'string' ? (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] : ((currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.text || '')}
                                onChange={(e) => {
                                  const newAnswer = {
                                    ...currentAnswer,
                                    subAnswers: {
                                      ...(currentAnswer?.subAnswers || {}),
                                      [subq.id]: {
                                        ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                        subAnswers: {
                                          ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                          [subSubq.id]: typeof (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] === 'object' 
                                            ? { ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id], text: e.target.value }
                                            : e.target.value
                                        }
                                      }
                                    }
                                  };
                                  handleAnswerChange(question.id, newAnswer);
                                }}
                                onFocus={() => startQuestionTracking(`${question.id}.${subq.id}.${subSubq.id}`)}
                                onBlur={() => stopQuestionTracking(`${question.id}.${subq.id}.${subSubq.id}`)}
                                onPaste={(e) => handlePaste(e, `${question.id}.${subq.id}.${subSubq.id}`)}
                                onKeyDown={(e) => handleKeyDown(e, `${question.id}.${subq.id}.${subSubq.id}`)}
                                placeholder={(subSubq.type === 'diagram-analysis' || subSubq.type === 'diagram_analysis') ? "Enter your diagram analysis..." : "Enter your answer..."}
                                rows={(subSubq.type === 'long-answer' || subSubq.type === 'long_answer') ? 6 : 3}
                                readOnly={isAlreadySubmitted}
                                className={`w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none text-sm ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                              />
                              {/* Diagram upload for nested sub-subquestions */}
                              {!isAlreadySubmitted && (
                                <div>
                                  {(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.diagram ? (
                                    <div className="bg-gray-700 p-2 rounded border border-gray-500">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">Attached Diagram:</span>
                                        <button
                                          onClick={() => {
                                            const newAnswer = {
                                              ...currentAnswer,
                                              subAnswers: {
                                                ...(currentAnswer?.subAnswers || {}),
                                                [subq.id]: {
                                                  ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                                  subAnswers: {
                                                    ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                                    [subSubq.id]: {
                                                      text: (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.text || '',
                                                      diagram: null
                                                    }
                                                  }
                                                }
                                              }
                                            };
                                            handleAnswerChange(question.id, newAnswer);
                                          }}
                                          className="text-red-400 hover:text-red-300 text-xs"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      {renderDiagram((currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.diagram, "Your diagram")}
                                    </div>
                                  ) : (
                                    <div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        id={`diagram-upload-${question.id}-${subq.id}-${subSubq.id}`}
                                        className="hidden"
                                        onChange={async (e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            try {
                                              const response = await assignmentApi.uploadDiagram(file, actualAssignment.id);
                                              const newAnswer = {
                                                ...currentAnswer,
                                                subAnswers: {
                                                  ...(currentAnswer?.subAnswers || {}),
                                                  [subq.id]: {
                                                    ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                                    subAnswers: {
                                                      ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                                      [subSubq.id]: {
                                                        text: (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.text || '',
                                                        diagram: response
                                                      }
                                                    }
                                                  }
                                                }
                                              };
                                              handleAnswerChange(question.id, newAnswer);
                                            } catch (err) {
                                              console.error('Failed to upload diagram:', err);
                                              alert('Failed to upload diagram. Please try again.');
                                            }
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`diagram-upload-${question.id}-${subq.id}-${subSubq.id}`}
                                        className="inline-flex items-center px-2 py-1 bg-gray-500 hover:bg-gray-400 text-white rounded cursor-pointer transition-colors text-xs"
                                      >
                                        <ImageIcon size={12} className="mr-1" />
                                        Attach Diagram
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* show diagram if already submitted */}
                                {isAlreadySubmitted && (currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.diagram && (
                                    <div className="bg-gray-700 p-2 rounded border border-gray-500">
                                        <div className="text-xs text-gray-400 mb-1">Submitted Diagram:</div>
                                        {renderDiagram((currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id]?.diagram, "Submitted diagram")}
                                    </div>
                                )}
                            </div>
                          ) : (
                            <textarea
                              value={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] || ''}
                              onChange={(e) => {
                                const newAnswer = {
                                  ...currentAnswer,
                                  subAnswers: {
                                    ...(currentAnswer?.subAnswers || {}),
                                    [subq.id]: {
                                      ...(currentAnswer?.subAnswers?.[subq.id] || {}),
                                      subAnswers: {
                                        ...(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {}),
                                        [subSubq.id]: e.target.value
                                      }
                                    }
                                  }
                                };
                                handleAnswerChange(question.id, newAnswer);
                              }}
                              placeholder={!(((currentAnswer?.subAnswers || {})[subq.id]?.subAnswers || {})[subSubq.id]) ? "Enter your answer..." : ""}
                              rows={2}
                              readOnly={isAlreadySubmitted}
                              className={`w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-sm ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                            />
                          )}
                        </div>
                      );
                      })}
                    </div>
                  ) : (
                    <textarea
                      value={(currentAnswer?.subAnswers || {})[subq.id] || ''}
                      onChange={(e) => {
                        const newAnswer = {
                          ...currentAnswer,
                          subAnswers: {
                            ...(currentAnswer?.subAnswers || {}),
                            [subq.id]: e.target.value
                          }
                        };
                        handleAnswerChange(question.id, newAnswer);
                      }}
                      placeholder={`Answer for part ${subIndex + 1}...`}
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  )}
                </div>
              );
              })}
            </div>
          </div>
        );


      default:
        return (
          <div key={question.id} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
            <p className="text-gray-400">Unknown question type: {question.type}</p>
          </div>
        );
    }
  };

//   const handleDownloadPDF = async (submission) => {
//     try {
//       setPdfLoading(true);
      
//       // Get the first file from submitted_files (PDF submissions typically have one file)
//       const fileInfo = submission.submitted_files?.[0];
//       if (!fileInfo || !fileInfo.file_id) {
//         alert('No PDF file found in this submission.');
//         return;
//       }

//       // Get presigned URL from backend
//       const response = await assignmentApi.getSubmissionFileUrl(
//         actualAssignment.id,
//         submission.id,
//         fileInfo.file_id
//       );

//       // Open PDF in new tab
//       window.open(response.url, '_blank');

//     } catch (error) {
//       console.error('Failed to open PDF:', error);
//       alert('Failed to open PDF. Please try again.');
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const loadAssignmentQuestions = async () => {
//     try {
//       // If assignment is already passed with questions, use them
//       if (assignment?.questions && assignment.questions.length > 0) {
//         setAssignmentQuestions(assignment.questions);
//       } else {
//         // Otherwise fetch the full assignment data
//         const assignmentData = await assignmentApi.getAssignment(assignment.id);
//         setAssignmentQuestions(assignmentData.questions || []);
//       }
//     } catch (err) {
//       console.log('Failed to load assignment questions:', err);
//     //   setAssignmentQuestions(submission?.assignment?.questions || []);
//     //   console.log('Falling back to submission assignment questions:', submission?.assignment?.questions || []);
//     }
//   };

  const getQuestionById = (questionId) => {
    // First try to find by exact ID match
    let question = assignmentQuestions.find(q => q.id === parseInt(questionId) || q.id === questionId);
    
    // If not found, try to find by order/index (1-based)
    if (!question) {
      const questionIndex = parseInt(questionId) - 1;
      question = assignmentQuestions[questionIndex];
    }
    
    return question;
  };

  // Helper function to format question display
  const getQuestionNumber = (questionId) => {
    const question = getQuestionById(questionId);
    if (question) {
      // Use the question's order if available, otherwise use index + 1
      return question.order || (assignmentQuestions.indexOf(question) + 1);
    }
    return questionId; // fallback to original ID
  };

  // Helper function to get sub-question feedback from submission feedback
  // Feedback keys are structured as "questionNumber.partNumber" (e.g., "2.1", "2.2")
  const getSubQuestionFeedback = (feedbackKey) => {
    if (!submission?.feedback || !feedbackKey) return null;
    return submission.feedback[feedbackKey];
  };

  // Helper function to render sub-question answer based on its type
  const renderSubQuestionAnswer = (subQuestion, subAnswer, feedbackKey = null) => {
    const subQuestionFeedback = getSubQuestionFeedback(feedbackKey);
    if (!subQuestion) {
      return (
        <div className="bg-gray-800 rounded p-3">
          <p className="text-gray-300">{typeof subAnswer === 'string' ? subAnswer : JSON.stringify(subAnswer)}</p>
        </div>
      );
    }

    switch (subQuestion.type) {
      case 'multiple_choice':
      case 'multiple-choice':
        // Handle both single answer (string/integer) and multiple answers (array)
        const selectedIndices = Array.isArray(subAnswer) 
          ? subAnswer.map(idx => parseInt(idx))
          : [parseInt(subAnswer)];
        
        const selectedOptions = selectedIndices
          .map(idx => subQuestion.options?.[idx])
          .filter(opt => opt !== undefined);

        return (
          <div className="space-y-2">
            <div className="bg-gray-800 rounded p-3">
              <p className="text-teal-300 font-medium text-sm">Selected Answer{selectedOptions.length > 1 ? 's' : ''}:</p>
              {selectedOptions.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {selectedOptions.map((opt, idx) => (
                    <li key={idx} className="text-white text-sm">• {opt}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white text-sm mt-1">{subAnswer}</p>
              )}
            </div>
            {subQuestion.options && (
              <div className="bg-gray-900 rounded p-3">
                <p className="text-gray-400 text-xs mb-2">Available options:</p>
                <div className="space-y-1">
                  {subQuestion.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`text-xs p-2 rounded ${
                        selectedIndices.includes(index)
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                          : 'text-gray-400 bg-gray-800'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Sub-question feedback */}
            {subQuestionFeedback && (
              <div className="bg-gray-900 rounded-lg p-3 border border-green-500/20">
                <p className="text-green-400 font-medium text-xs mb-2 flex items-center">
                  <Brain size={12} className="mr-1" />
                  AI Feedback
                </p>
                {subQuestionFeedback.score !== undefined && (
                  <div className="mb-2">
                    <span className="text-green-400 font-bold text-sm">
                      {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0} pts
                    </span>
                  </div>
                )}
                {subQuestionFeedback.breakdown && (
                  <div className="mb-2">
                    <p className="text-gray-400 text-xs mb-1">Breakdown:</p>
                    <p className="text-gray-200 text-xs whitespace-pre-wrap">{subQuestionFeedback.breakdown}</p>
                  </div>
                )}
                {subQuestionFeedback.strengths && (
                  <div className="mb-2">
                    <p className="text-green-400 text-xs mb-1">✓ Strengths:</p>
                    <p className="text-gray-200 text-xs">{subQuestionFeedback.strengths}</p>
                  </div>
                )}
                {subQuestionFeedback.areas_for_improvement && (
                  <div>
                    <p className="text-orange-400 text-xs mb-1">→ Areas for Improvement:</p>
                    <p className="text-gray-200 text-xs">{subQuestionFeedback.areas_for_improvement}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'code_writing':
      case 'code-writing':
        return (
          <div className="space-y-2">
            <div className="bg-gray-800 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs">Code Answer:</p>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">
                  {subQuestion.code_language || 'code'}
                </span>
              </div>
              <pre className="text-gray-200 text-xs overflow-x-auto whitespace-pre-wrap font-mono bg-gray-900 p-2 rounded">
                {subAnswer}
              </pre>
            </div>
            {subQuestion.subCode && (
              <div className="bg-gray-900 rounded p-3">
                <p className="text-gray-400 text-xs mb-2">Reference Code:</p>
                <pre className="text-gray-300 text-xs overflow-x-auto font-mono">
                  {subQuestion.subCode}
                </pre>
              </div>
            )}
            {/* Sub-question feedback */}
            {subQuestionFeedback && (
              <div className="space-y-2">
                {/* AI Flag Warning Banner */}
                {subQuestionFeedback.ai_flag && subQuestionFeedback.ai_flag.flag_level !== 'none' && (
                  <div className={`rounded-lg p-3 border-2 ${
                    subQuestionFeedback.ai_flag.flag_level === 'hard'
                      ? 'bg-red-900/20 border-red-500'
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className={subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-400' : 'text-yellow-400'} size={16} />
                      <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${
                          subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                          {subQuestionFeedback.ai_flag.flag_level === 'hard' 
                            ? 'AI-Generated Content (Penalized)' 
                            : 'Possible AI-Generated Content'}
                        </p>
                        {subQuestionFeedback.ai_flag.original_score && subQuestionFeedback.ai_flag.penalized_score && (
                          <p className="text-xs text-gray-300 mb-1">
                            Original: <span className="line-through">{subQuestionFeedback.ai_flag.original_score.toFixed(1)}</span> → 
                            Penalized: <span className="font-bold text-red-300">{subQuestionFeedback.ai_flag.penalized_score.toFixed(1)}</span>
                          </p>
                        )}
                        {subQuestionFeedback.ai_flag.reasons && subQuestionFeedback.ai_flag.reasons.length > 0 && (
                          <div className="text-xs text-gray-300 mb-1">
                            <p className="font-medium">Detection Reasons:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              {subQuestionFeedback.ai_flag.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Confidence: {(subQuestionFeedback.ai_flag.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-900 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400 font-medium text-xs mb-2 flex items-center">
                    <Brain size={12} className="mr-1" />
                    AI Feedback
                  </p>
                  {subQuestionFeedback.score !== undefined && (
                    <div className="mb-2">
                      <span className="text-green-400 font-bold text-sm">
                        {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0} pts
                      </span>
                    </div>
                  )}
                  {subQuestionFeedback.breakdown && (
                    <div className="mb-2">
                      <p className="text-gray-400 text-xs mb-1">Breakdown:</p>
                      <p className="text-gray-200 text-xs whitespace-pre-wrap">{subQuestionFeedback.breakdown}</p>
                    </div>
                  )}
                  {subQuestionFeedback.strengths && (
                    <div className="mb-2">
                      <p className="text-green-400 text-xs mb-1">✓ Strengths:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.strengths}</p>
                    </div>
                  )}
                  {subQuestionFeedback.areas_for_improvement && (
                    <div>
                      <p className="text-orange-400 text-xs mb-1">→ Areas for Improvement:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'true_false':
      case 'true_false':
        return (
          <div className="space-y-2">
            <div className="bg-gray-800 rounded p-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                subAnswer === 'true' || subAnswer === true 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {subAnswer === 'true' || subAnswer === true ? 'True' : 'False'}
              </span>
            </div>
            {/* Sub-question feedback */}
            {subQuestionFeedback && (
              <div className="space-y-2">
                {/* AI Flag Warning Banner */}
                {subQuestionFeedback.ai_flag && subQuestionFeedback.ai_flag.flag_level !== 'none' && (
                  <div className={`rounded-lg p-3 border-2 ${
                    subQuestionFeedback.ai_flag.flag_level === 'hard'
                      ? 'bg-red-900/20 border-red-500'
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className={subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-400' : 'text-yellow-400'} size={16} />
                      <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${
                          subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                          {subQuestionFeedback.ai_flag.flag_level === 'hard' 
                            ? 'AI-Generated Content (Penalized)' 
                            : 'Possible AI-Generated Content'}
                        </p>
                        {subQuestionFeedback.ai_flag.original_score && subQuestionFeedback.ai_flag.penalized_score && (
                          <p className="text-xs text-gray-300 mb-1">
                            Original: <span className="line-through">{subQuestionFeedback.ai_flag.original_score.toFixed(1)}</span> → 
                            Penalized: <span className="font-bold text-red-300">{subQuestionFeedback.ai_flag.penalized_score.toFixed(1)}</span>
                          </p>
                        )}
                        {subQuestionFeedback.ai_flag.reasons && subQuestionFeedback.ai_flag.reasons.length > 0 && (
                          <div className="text-xs text-gray-300 mb-1">
                            <p className="font-medium">Detection Reasons:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              {subQuestionFeedback.ai_flag.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Confidence: {(subQuestionFeedback.ai_flag.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-900 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400 font-medium text-xs mb-2 flex items-center">
                    <Brain size={12} className="mr-1" />
                    AI Feedback
                  </p>
                  {subQuestionFeedback.score !== undefined && (
                    <div className="mb-2">
                      <span className="text-green-400 font-bold text-sm">
                        {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0} pts
                      </span>
                    </div>
                  )}
                  {subQuestionFeedback.breakdown && (
                    <div className="mb-2">
                      <p className="text-gray-400 text-xs mb-1">Breakdown:</p>
                      <p className="text-gray-200 text-xs whitespace-pre-wrap">{subQuestionFeedback.breakdown}</p>
                    </div>
                  )}
                  {subQuestionFeedback.strengths && (
                    <div className="mb-2">
                      <p className="text-green-400 text-xs mb-1">✓ Strengths:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.strengths}</p>
                    </div>
                  )}
                  {subQuestionFeedback.areas_for_improvement && (
                    <div>
                      <p className="text-orange-400 text-xs mb-1">→ Areas for Improvement:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'fill-blank':
      case 'fill_blank':
        return (
          <div className="space-y-2">
            <div className="bg-gray-800 rounded p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs bg-orange-600 px-2 py-1 rounded text-orange-100">
                  FILL IN THE BLANK
                </span>
              </div>
              <div className="bg-gray-900 rounded p-3">
                <p className="text-orange-300 font-medium text-sm">Student's Answer:</p>
                <p className="text-white mt-1 font-mono bg-gray-800 px-2 py-1 rounded inline-block">
                  "{subAnswer}"
                </p>
              </div>
            </div>
            {/* Sub-question feedback */}
            {subQuestionFeedback && (
              <div className="space-y-2">
                {/* AI Flag Warning Banner */}
                {subQuestionFeedback.ai_flag && subQuestionFeedback.ai_flag.flag_level !== 'none' && (
                  <div className={`rounded-lg p-3 border-2 ${
                    subQuestionFeedback.ai_flag.flag_level === 'hard'
                      ? 'bg-red-900/20 border-red-500'
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className={subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-400' : 'text-yellow-400'} size={16} />
                      <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${
                          subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                          {subQuestionFeedback.ai_flag.flag_level === 'hard' 
                            ? 'AI-Generated Content (Penalized)' 
                            : 'Possible AI-Generated Content'}
                        </p>
                        {subQuestionFeedback.ai_flag.original_score && subQuestionFeedback.ai_flag.penalized_score && (
                          <p className="text-xs text-gray-300 mb-1">
                            Original: <span className="line-through">{subQuestionFeedback.ai_flag.original_score.toFixed(1)}</span> → 
                            Penalized: <span className="font-bold text-red-300">{subQuestionFeedback.ai_flag.penalized_score.toFixed(1)}</span>
                          </p>
                        )}
                        {subQuestionFeedback.ai_flag.reasons && subQuestionFeedback.ai_flag.reasons.length > 0 && (
                          <div className="text-xs text-gray-300 mb-1">
                            <p className="font-medium">Detection Reasons:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              {subQuestionFeedback.ai_flag.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Confidence: {(subQuestionFeedback.ai_flag.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-900 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400 font-medium text-xs mb-2 flex items-center">
                    <Brain size={12} className="mr-1" />
                    AI Feedback
                  </p>
                  {subQuestionFeedback.score !== undefined && (
                    <div className="mb-2">
                      <span className="text-green-400 font-bold text-sm">
                        {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0} pts
                      </span>
                    </div>
                  )}
                  {subQuestionFeedback.breakdown && (
                    <div className="mb-2">
                      <p className="text-gray-400 text-xs mb-1">Breakdown:</p>
                      <p className="text-gray-200 text-xs whitespace-pre-wrap">{subQuestionFeedback.breakdown}</p>
                    </div>
                  )}
                  {subQuestionFeedback.strengths && (
                    <div className="mb-2">
                      <p className="text-green-400 text-xs mb-1">✓ Strengths:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.strengths}</p>
                    </div>
                  )}
                  {subQuestionFeedback.areas_for_improvement && (
                    <div>
                      <p className="text-orange-400 text-xs mb-1">→ Areas for Improvement:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'multi_part':
      case 'multi-part':
        // Recursively render nested multi-part questions
        // Pass the feedbackKey as the prefix for nested levels
        return (
          <div className="ml-4 border-l-2 border-blue-400/30 pl-4">
            {renderMultiPartAnswer(subQuestion, subAnswer, null, feedbackKey)}
          </div>
        );

      case 'short_answer':
      case 'short-answer':
      case 'long_answer':
      case 'long-answer':
      case 'diagram_analysis':
      case 'diagram-analysis':
        return (
          <div className="space-y-2">
            <div className="bg-gray-800 rounded p-3">
              <p className="text-gray-200 text-sm whitespace-pre-wrap">
                  {typeof subAnswer === 'string' ? subAnswer : subAnswer.text || JSON.stringify(subAnswer)}
                  {subAnswer.diagram && (
                    <div className="mt-3">
                      <p className="text-gray-400 text-xs mb-1">Attached Diagram:</p>
                      {renderDiagram(subAnswer.diagram, "Student's diagram")}
                    </div>
                  )}
              </p>
            </div>
            {/* Sub-question feedback */}
            {subQuestionFeedback && (
              <div className="space-y-2">
                {/* AI Flag Warning Banner */}
                {subQuestionFeedback.ai_flag && subQuestionFeedback.ai_flag.flag_level !== 'none' && (
                  <div className={`rounded-lg p-3 border-2 ${
                    subQuestionFeedback.ai_flag.flag_level === 'hard'
                      ? 'bg-red-900/20 border-red-500'
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className={subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-400' : 'text-yellow-400'} size={16} />
                      <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${
                          subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                          {subQuestionFeedback.ai_flag.flag_level === 'hard' 
                            ? 'AI-Generated Content (Penalized)' 
                            : 'Possible AI-Generated Content'}
                        </p>
                        {subQuestionFeedback.ai_flag.original_score && subQuestionFeedback.ai_flag.penalized_score && (
                          <p className="text-xs text-gray-300 mb-1">
                            Original: <span className="line-through">{subQuestionFeedback.ai_flag.original_score.toFixed(1)}</span> → 
                            Penalized: <span className="font-bold text-red-300">{subQuestionFeedback.ai_flag.penalized_score.toFixed(1)}</span>
                          </p>
                        )}
                        {subQuestionFeedback.ai_flag.reasons && subQuestionFeedback.ai_flag.reasons.length > 0 && (
                          <div className="text-xs text-gray-300 mb-1">
                            <p className="font-medium">Detection Reasons:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              {subQuestionFeedback.ai_flag.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Confidence: {(subQuestionFeedback.ai_flag.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-900 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400 font-medium text-xs mb-2 flex items-center">
                    <Brain size={12} className="mr-1" />
                    AI Feedback
                  </p>
                  {subQuestionFeedback.score !== undefined && (
                    <div className="mb-2">
                      <span className="text-green-400 font-bold text-sm">
                        {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0} pts
                      </span>
                    </div>
                  )}
                  {subQuestionFeedback.breakdown && (
                    <div className="mb-2">
                      <p className="text-gray-400 text-xs mb-1">Breakdown:</p>
                      <p className="text-gray-200 text-xs whitespace-pre-wrap">{subQuestionFeedback.breakdown}</p>
                    </div>
                  )}
                  {subQuestionFeedback.strengths && (
                    <div className="mb-2">
                      <p className="text-green-400 text-xs mb-1">✓ Strengths:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.strengths}</p>
                    </div>
                  )}
                  {subQuestionFeedback.areas_for_improvement && (
                    <div>
                      <p className="text-orange-400 text-xs mb-1">→ Areas for Improvement:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="bg-gray-800 rounded p-3">
              <p className="text-gray-200 text-sm whitespace-pre-wrap">
                {typeof subAnswer === 'string' ? subAnswer : JSON.stringify(subAnswer)}
              </p>
            </div>
            {/* Sub-question feedback */}
            {subQuestionFeedback && (
              <div className="space-y-2">
                {/* AI Flag Warning Banner */}
                {subQuestionFeedback.ai_flag && subQuestionFeedback.ai_flag.flag_level !== 'none' && (
                  <div className={`rounded-lg p-3 border-2 ${
                    subQuestionFeedback.ai_flag.flag_level === 'hard'
                      ? 'bg-red-900/20 border-red-500'
                      : 'bg-yellow-900/20 border-yellow-500'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className={subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-400' : 'text-yellow-400'} size={16} />
                      <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${
                          subQuestionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-300' : 'text-yellow-300'
                        }`}>
                          {subQuestionFeedback.ai_flag.flag_level === 'hard' 
                            ? 'AI-Generated Content (Penalized)' 
                            : 'Possible AI-Generated Content'}
                        </p>
                        {subQuestionFeedback.ai_flag.original_score && subQuestionFeedback.ai_flag.penalized_score && (
                          <p className="text-xs text-gray-300 mb-1">
                            Original: <span className="line-through">{subQuestionFeedback.ai_flag.original_score.toFixed(1)}</span> → 
                            Penalized: <span className="font-bold text-red-300">{subQuestionFeedback.ai_flag.penalized_score.toFixed(1)}</span>
                          </p>
                        )}
                        {subQuestionFeedback.ai_flag.reasons && subQuestionFeedback.ai_flag.reasons.length > 0 && (
                          <div className="text-xs text-gray-300 mb-1">
                            <p className="font-medium">Detection Reasons:</p>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              {subQuestionFeedback.ai_flag.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Confidence: {(subQuestionFeedback.ai_flag.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-900 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400 font-medium text-xs mb-2 flex items-center">
                    <Brain size={12} className="mr-1" />
                    AI Feedback
                  </p>
                  {subQuestionFeedback.score !== undefined && (
                    <div className="mb-2">
                      <span className="text-green-400 font-bold text-sm">
                        {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0} pts
                      </span>
                    </div>
                  )}
                  {subQuestionFeedback.breakdown && (
                    <div className="mb-2">
                      <p className="text-gray-400 text-xs mb-1">Breakdown:</p>
                      <p className="text-gray-200 text-xs whitespace-pre-wrap">{subQuestionFeedback.breakdown}</p>
                    </div>
                  )}
                  {subQuestionFeedback.strengths && (
                    <div className="mb-2">
                      <p className="text-green-400 text-xs mb-1">✓ Strengths:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.strengths}</p>
                    </div>
                  )}
                  {subQuestionFeedback.areas_for_improvement && (
                    <div>
                      <p className="text-orange-400 text-xs mb-1">→ Areas for Improvement:</p>
                      <p className="text-gray-200 text-xs">{subQuestionFeedback.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // Helper function to parse nested subAnswers structure
  const parseMultiPartAnswer = (answer) => {
    if (typeof answer === 'string') {
      try {
        answer = JSON.parse(answer);
      } catch (e) {
        return answer;
      }
    }

    // Handle the nested subAnswers format: {"subAnswers": {"id": {"subAnswers": {"nestedId": "value"}}}}
    if (answer && typeof answer === 'object' && answer.subAnswers) {
      const result = {};
      
      const processSubAnswers = (subAnswers, prefix = '') => {
        if (!subAnswers || typeof subAnswers !== 'object') return;
        
        Object.entries(subAnswers).forEach(([key, value]) => {
          if (value && typeof value === 'object' && value.subAnswers) {
            // This is a nested structure, process recursively
            processSubAnswers(value.subAnswers, key);
          } else {
            // This is a final answer value
            const finalKey = prefix ? `${prefix}.${key}` : key;
            result[finalKey] = value;
          }
        });
      };

      processSubAnswers(answer.subAnswers);
      return result;
    }

    return answer;
  };

  // Helper function to get nested answer for multi-part sub-questions
  const getNestedAnswer = (answer, subQuestionId) => {
    if (typeof answer === 'string') {
      try {
        answer = JSON.parse(answer);
      } catch (e) {
        return undefined;
      }
    }

    // If answer has subAnswers structure, look for the specific sub-question
    if (answer && typeof answer === 'object' && answer.subAnswers) {
      const subAnswer = answer.subAnswers[subQuestionId];
      return subAnswer;
    }

    return undefined;
  };

  // Helper function to find sub-question by various ID formats
  const findSubQuestionById = (subquestions, targetId) => {
    if (!subquestions || !Array.isArray(subquestions)) return null;
    
    // Convert targetId to string for comparison
    const targetIdStr = String(targetId);
    
    // Try exact match first
    let found = subquestions.find(sq => String(sq.id) === targetIdStr);
    if (found) return { question: found, index: subquestions.indexOf(found) };
    
    // Try to find by index if targetId looks like a number
    const targetIndex = parseInt(targetId) - 1;
    if (targetIndex >= 0 && targetIndex < subquestions.length) {
      return { question: subquestions[targetIndex], index: targetIndex };
    }
    
    // For nested IDs (like "parentId.childId"), try to find the parent first
    if (targetIdStr.includes('.')) {
      const [parentId, childId] = targetIdStr.split('.');
      const parent = subquestions.find(sq => String(sq.id) === parentId);
      if (parent && parent.subquestions) {
        const child = findSubQuestionById(parent.subquestions, childId);
        if (child) {
          return {
            question: child.question,
            index: child.index,
            parent: parent,
            parentIndex: subquestions.indexOf(parent)
          };
        }
      }
    }
    
    return null;
  };

  // Comprehensive multi-part question renderer
  // feedbackKeyPrefix is used for nested multi-part questions (e.g., "2" for top-level, "2.1" for nested)
  const renderMultiPartAnswer = (question, answer, questionId = null, feedbackKeyPrefix = null) => {
    if (!question || !question.subquestions) {
      return (
        <div className="bg-gray-700 rounded p-3">
          <p className="text-white">{typeof answer === 'string' ? answer : JSON.stringify(answer)}</p>
        </div>
      );
    }

    // Parse the answer structure
    const parsedAnswers = parseMultiPartAnswer(answer);
    
    return (
      <div className="space-y-4">
        {/* Main question code/diagram if present */}
        {question.hasMainCode && question.mainCode && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs bg-blue-600 px-2 py-1 rounded text-blue-100">
                MAIN CODE
              </span>
              <span className="text-xs text-gray-400">
                {question.mainCodeLanguage || 'code'}
              </span>
            </div>
            <pre className="text-gray-200 text-sm overflow-x-auto whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded">
              {question.mainCode}
            </pre>
          </div>
        )}

        {question.hasMainDiagram && question.mainDiagram && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs bg-purple-600 px-2 py-1 rounded text-purple-100">
                MAIN DIAGRAM
              </span>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <p className="text-gray-300 text-sm">Diagram: {JSON.stringify(question.mainDiagram)}</p>
            </div>
          </div>
        )}

        {/* Sub-questions and answers */}
        <div className="space-y-4">
          {question.subquestions.map((subQuestion, index) => {
            let subAnswer;

            // For multi-part sub-questions, try to get the nested structure
            if (subQuestion.type === 'multi-part' || subQuestion.type === 'multi_part') {
              subAnswer = getNestedAnswer(answer, subQuestion.id) || 
                         getNestedAnswer(answer, String(subQuestion.id)) ||
                         getNestedAnswer(answer, index + 1) ||
                         getNestedAnswer(answer, index);
            }
            
            // If not found or not multi-part, use the flattened approach
            if (subAnswer === undefined) {
              subAnswer = parsedAnswers[subQuestion.id] || 
                         parsedAnswers[index + 1] || 
                         parsedAnswers[index] ||
                         parsedAnswers[String(subQuestion.id)];
            }
            
            // If still not found, search through all parsed answers
            if (subAnswer === undefined) {
              const answerKeys = Object.keys(parsedAnswers);
              const matchingKey = answerKeys.find(key => {
                // Try to match timestamp-like IDs or nested IDs
                return key.includes(String(subQuestion.id)) || 
                       String(subQuestion.id).includes(key);
              });
              if (matchingKey) {
                subAnswer = parsedAnswers[matchingKey];
              }
            }
            
            const partNumber = index + 1;
            
            // Construct feedback key: for top-level it's "questionId.partNumber", for nested it extends the prefix
            // e.g., "2.1" for question 2 part 1, or "2.1.2" for question 2 part 1 sub-part 2
            const currentFeedbackKey = feedbackKeyPrefix 
              ? `${feedbackKeyPrefix}.${partNumber}` 
              : (questionId ? `${questionId}.${partNumber}` : null);
            
            // Get feedback for this sub-question if available
            const subQuestionFeedback = getSubQuestionFeedback(currentFeedbackKey);
            
            return (
              <div key={subQuestion.id || index} className="bg-gray-700 rounded-lg p-4 border-l-4 border-teal-500">
                {/* Sub-question header */}
                <div className="mb-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-teal-600 text-white px-2 py-1 rounded text-sm font-medium">
                      Part {partNumber}
                    </span>
                    <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs uppercase">
                      {subQuestion.type?.replace('_', ' ')}
                    </span>
                    {subQuestion.points && (
                      <span className="text-gray-400 text-xs">
                        {subQuestion.points} pts
                      </span>
                    )}
                    {/* Display score if feedback available */}
                    {subQuestionFeedback && subQuestionFeedback.score !== undefined && (
                      <div className="ml-auto bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                        <span className="text-green-400 font-bold text-xs">
                          {subQuestionFeedback.score || 0}/{subQuestionFeedback.max_points || subQuestion.points || 0}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Sub-question text */}
                  <div className="bg-gray-600 rounded p-3">
                    <p className="text-gray-100 font-medium text-sm">{subQuestion.question}</p>
                  </div>

                  {/* Sub-question code if present */}
                  {subQuestion.hasSubCode && subQuestion.subCode && (
                    <div className="mt-2 bg-gray-800 rounded p-3">
                      <p className="text-gray-400 text-xs mb-2">Reference Code:</p>
                      <pre className="text-gray-300 text-xs overflow-x-auto font-mono">
                        {subQuestion.subCode}
                      </pre>
                    </div>
                  )}

                  {/* Sub-question diagram if present */}
                  {subQuestion.hasDiagram && subQuestion.subDiagram && (
                    <div className="mt-2 bg-gray-800 rounded p-3">
                      <p className="text-gray-400 text-xs mb-2">Diagram:</p>
                      <p className="text-gray-300 text-xs">{JSON.stringify(subQuestion.subDiagram)}</p>
                    </div>
                  )}
                </div>

                {/* Sub-question answer */}
                <div>
                  <p className="text-gray-300 font-medium text-sm mb-2">Answer:</p>
                  {subAnswer !== undefined ? (
                    renderSubQuestionAnswer(subQuestion, subAnswer, currentFeedbackKey)
                  ) : (
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-gray-500 text-sm italic">No answer provided</p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper function to render answer based on question type
  const renderAnswer = (question, answer) => {
    if (!question) {
      return (
        <div className="bg-gray-700 rounded p-3">
          <p className="text-gray-300">{typeof answer === 'string' ? answer : JSON.stringify(answer)}</p>
        </div>
      );
    }

    switch (question.type) {
      case 'multiple_choice':
      case 'multiple-choice':
        // Handle both single answer (string/integer) and multiple answers (array)
        const selectedIndices = Array.isArray(answer) 
          ? answer.map(idx => parseInt(idx))
          : [parseInt(answer)];
        
        const selectedOptions = selectedIndices
          .map(idx => question.options?.[idx])
          .filter(opt => opt !== undefined);

        return (
          <div className="space-y-3">
            <div className="bg-gray-700 rounded p-3">
              <p className="text-gray-300 font-medium">Selected Answer{selectedOptions.length > 1 ? 's' : ''}:</p>
              {selectedOptions.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {selectedOptions.map((opt, idx) => (
                    <li key={idx} className="text-white">• {opt}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white mt-1">{answer}</p>
              )}
            </div>
            {question.options && (
              <div className="bg-gray-800 rounded p-3 border border-gray-600">
                <p className="text-gray-400 text-sm mb-2">Available Options:</p>
                <ul className="space-y-1">
                  {question.options.map((option, index) => (
                    <li 
                      key={index} 
                      className={`text-sm p-2 rounded ${
                        selectedIndices.includes(index)
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                          : 'text-gray-400'
                      }`}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'code_writing':
      case 'code-writing':
        return (
          <div className="space-y-3">
            <div className="bg-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 font-medium">Code Answer:</p>
                <span className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
                  {question.code_language || 'code'}
                </span>
              </div>
              <pre className="text-white text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                {answer}
              </pre>
            </div>
          </div>
        );

      case 'multi_part':
      case 'multi-part':
        // For top-level multi-part questions, we need to find the question ID from submission
        // The questionId is the key in submission.answers, which corresponds to feedback keys
        let topLevelQuestionId = null;
        if (submission?.answers) {
          const answerEntries = Object.entries(submission.answers);
          const questionIndex = questions.findIndex(q => q.id === question.id);
          if (questionIndex >= 0 && answerEntries[questionIndex]) {
            topLevelQuestionId = answerEntries[questionIndex][0];
          }
        }
        return renderMultiPartAnswer(question, answer, topLevelQuestionId, topLevelQuestionId);

      default:
        // For short_answer, long_answer, true_false, and other types
        return (
          <div className="bg-gray-700 rounded p-3">
            <p className="text-white whitespace-pre-wrap">{typeof answer === 'string' ? answer : JSON.stringify(answer)}</p>
          </div>
        );
    }
  };

  // Helper function to render answer with diagrams
  const renderAnswerWithDiagram = (answer) => {
    const answerText = typeof answer === 'string' ? answer : (answer?.text || '');
    const diagram = typeof answer === 'object' ? answer?.diagram : null;
    
    return (
      <div className="space-y-3">
        {answerText && (
          <div className="bg-gray-700 rounded p-3">
            <p className="text-white whitespace-pre-wrap">{answerText}</p>
          </div>
        )}
        {diagram && diagram.s3_key && (
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <ImageIcon size={16} className="text-teal-400" />
              <span className="text-sm text-gray-300">Attached Diagram</span>
            </div>
            <DiagramImage diagramData={diagram} displayName={diagram.filename || 'Student diagram'} />
          </div>
        )}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Assignment Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your assignment has been submitted successfully. You will receive a confirmation email shortly.
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{actualAssignment.title}</h2>
            <p className="text-gray-400 mt-1">
              {assignment.owner_name ? `by ${assignment.owner_name}` : 
               assignment.owner_email ? `by ${assignment.owner_email}` : 
               'Assignment'}
            </p>
            {actualAssignment.description && (
              <p className="text-gray-300 mt-2 text-sm max-w-2xl">
                {actualAssignment.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock size={16} />
              <span className="text-sm">
                {actualAssignment.due_date ? 
                  `Due: ${new Date(actualAssignment.due_date).toLocaleDateString()}` : 
                  'No due date'
                }
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isGraded ? (<>
            <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Grading Results - Show if graded */}
            {submission.status === 'graded' && submission.feedback && (
              <div className="mb-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <CheckCircle size={24} className="text-green-400 mr-2" />
                    Grading Results
                  </h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">
                      {submission.score && submission.percentage ? `${submission.percentage}%` : submission.score || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {submission.score ? `${submission.score} points` : ''}
                    </div>
                  </div>
                </div>
                
                {submission.overall_feedback && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-gray-300 font-medium mb-2">Overall Feedback:</p>
                    <p className="text-gray-200 whitespace-pre-wrap">{submission.overall_feedback}</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-400">
                  Graded at: {submission.graded_at ? formatDate(submission.graded_at) : 'N/A'}
                </div>
              </div>
            )}

            {/* Submission Content */}
            {submission.submission_method === 'in-app' || !submission.submission_method ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Questions & Answers</h3>
                {submission.answers && typeof submission.answers === 'object' ? 
                  Object.entries(submission.answers).map(([questionId, answer]) => {
                    const question = getQuestionById(questionId);
                    const questionNumber = getQuestionNumber(questionId);
                    const questionFeedback = submission.feedback?.[questionId];
                    
                    return (
                      <div key={questionId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        {/* Question Header */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Question {questionNumber}
                              </span>
                              {question?.type && (
                                <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs uppercase">
                                  {question.type.replace('_', ' ')}
                                </span>
                              )}
                              {question?.points && (
                                <span className="text-gray-400 text-sm">
                                  {question.points} {question.points === 1 ? 'point' : 'points'}
                                </span>
                              )}
                            </div>
                            
                            {/* Show score for this question if available */}
                            {questionFeedback && (
                              <div className="flex items-center space-x-2">
                                <div className="bg-green-900/30 px-3 py-1 rounded border border-green-500/30">
                                  <span className="text-green-400 font-bold">
                                    {questionFeedback.score || 0}/{questionFeedback.max_points || question?.points || 0}
                                  </span>
                                </div>
                                {/* AI Plagiarism Flag Indicator */}
                                {questionFeedback.ai_flag && questionFeedback.ai_flag.flag_level !== 'none' && (
                                  <div className={`px-3 py-1 rounded border text-sm font-medium ${
                                    questionFeedback.ai_flag.flag_level === 'hard' 
                                      ? 'bg-red-900/30 border-red-500/50 text-red-300' 
                                      : 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'
                                  }`}>
                                    {questionFeedback.ai_flag.flag_level === 'hard' ? '🚫 AI-Generated (Penalized)' : '⚠️ Possible AI-Generated'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Optional Parts Indicator */}
                          {question?.type === 'multi-part' && question?.optionalParts && (
                            <div className="mb-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-blue-300 font-medium">Optional Parts:</span>
                                <span className="text-gray-300">
                                  Student answered {answer?.subAnswers ? Object.keys(answer.subAnswers).filter(k => answer.subAnswers[k]).length : 0} of {question.requiredPartsCount} required parts
                                  {question.subquestions ? ` (${question.subquestions.length} total)` : ''}
                                </span>
                              </div>
                              {answer?.subAnswers && (
                                <div className="mt-2 text-xs text-blue-200">
                                  Answered parts: {Object.keys(answer.subAnswers)
                                    .filter(k => answer.subAnswers[k])
                                    .map(id => {
                                      const subq = question.subquestions?.find(sq => String(sq.id) === String(id));
                                      return subq ? `Part ${question.subquestions.indexOf(subq) + 1}` : id;
                                    })
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Question Text */}
                          {question?.question && (
                            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                              <p className="text-white font-medium mb-2">Question:</p>
                              <p className="text-gray-200 whitespace-pre-wrap">{question.question}</p>
                              
                              {/* Additional question content for specific types */}
                              {question.type === 'code_writing' && question.starter_code && (
                                <div className="mt-3">
                                  <p className="text-gray-400 text-sm mb-2">Starter Code:</p>
                                  <pre className="bg-gray-800 p-3 rounded text-sm text-gray-300 overflow-x-auto">
                                    {question.starter_code}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Answer Section */}
                        <div className="mb-4">
                          <p className="text-gray-300 font-medium mb-3">Student Answer:</p>
                          {(question?.type === 'short-answer' || question?.type === 'long-answer' || question?.type === 'diagram-analysis') 
                            ? renderAnswerWithDiagram(answer)
                            : renderAnswer(question, answer)
                          }
                        </div>
                        
                        {/* Question Feedback */}
                        {questionFeedback && (
                          <div className="space-y-3">
                            {/* AI Flag Warning Banner */}
                            {questionFeedback.ai_flag && questionFeedback.ai_flag.flag_level !== 'none' && (
                              <div className={`rounded-lg p-4 border-2 ${
                                questionFeedback.ai_flag.flag_level === 'hard'
                                  ? 'bg-red-900/20 border-red-500'
                                  : 'bg-yellow-900/20 border-yellow-500'
                              }`}>
                                <div className="flex items-start space-x-3">
                                  <AlertCircle className={questionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-400' : 'text-yellow-400'} size={20} />
                                  <div className="flex-1">
                                    <p className={`font-bold mb-2 ${
                                      questionFeedback.ai_flag.flag_level === 'hard' ? 'text-red-300' : 'text-yellow-300'
                                    }`}>
                                      {questionFeedback.ai_flag.flag_level === 'hard' 
                                        ? 'AI-Generated Content Detected (Score Penalized)' 
                                        : 'Possible AI-Generated Content'}
                                    </p>
                                    {questionFeedback.ai_flag.original_score && questionFeedback.ai_flag.penalized_score && (
                                      <p className="text-sm text-gray-300 mb-2">
                                        Original Score: <span className="line-through">{questionFeedback.ai_flag.original_score.toFixed(1)}</span> → 
                                        Penalized Score: <span className="font-bold text-red-300">{questionFeedback.ai_flag.penalized_score.toFixed(1)}</span> 
                                        <span className="text-red-400 ml-2">(50% penalty applied)</span>
                                      </p>
                                    )}
                                    {questionFeedback.ai_flag.reasons && questionFeedback.ai_flag.reasons.length > 0 && (
                                      <div className="text-sm text-gray-300">
                                        <p className="font-medium mb-1">Detection Reasons:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                          {questionFeedback.ai_flag.reasons.map((reason, idx) => (
                                            <li key={idx}>{reason}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                      Confidence: {(questionFeedback.ai_flag.confidence * 100).toFixed(1)}% | 
                                      Model Score: {(questionFeedback.ai_flag.model_score * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Regular Feedback */}
                            <div className="bg-gray-900 rounded-lg p-4 border border-green-500/20">
                              <p className="text-green-400 font-medium mb-3 flex items-center">
                                <Brain size={16} className="mr-2" />
                                AI Feedback
                              </p>
                              
                              {questionFeedback.breakdown && (
                                <div className="mb-3">
                                  <p className="text-gray-400 text-sm mb-1">Breakdown:</p>
                                  <p className="text-gray-200 text-sm whitespace-pre-wrap">{questionFeedback.breakdown}</p>
                                </div>
                              )}
                              
                              {questionFeedback.strengths && (
                                <div className="mb-3">
                                  <p className="text-green-400 text-sm mb-1">✓ Strengths:</p>
                                  <p className="text-gray-200 text-sm">{questionFeedback.strengths}</p>
                                </div>
                              )}
                              
                              {questionFeedback.areas_for_improvement && (
                                <div>
                                  <p className="text-orange-400 text-sm mb-1">→ Areas for Improvement:</p>
                                  <p className="text-gray-200 text-sm">{questionFeedback.areas_for_improvement}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }) :
                  <p className="text-gray-400">No answers available</p>
                }
              </div>
            ) : (
              <div className="space-y-6">
                {/* PDF Submission Header */}
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">PDF Submission</h3>
                  <p className="text-gray-400 mb-6">
                    This student submitted their answers as a PDF file.
                  </p>
                  <button 
                    onClick={() => handleDownloadPDF(submission)}
                    disabled={pdfLoading}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pdfLoading ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={18} className="mr-2" />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>

                {/* PDF Feedback by Question */}
                {submission.feedback && Object.keys(submission.feedback).length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Brain size={24} className="text-green-400 mr-2" />
                      Question-by-Question Feedback
                    </h3>
                    
                    {Object.entries(submission.feedback)
                      .sort(([a], [b]) => {
                        // Sort questions numerically, handling decimal formats like 1.1, 1.2
                        const aNum = parseFloat(a);
                        const bNum = parseFloat(b);
                        return aNum - bNum;
                      })
                      .map(([questionId, feedback]) => (
                        <div key={questionId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                          {/* Question Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Question {questionId}
                              </span>
                              {/* Optional Part Indicator for sub-questions */}
                              {questionId.includes('.') && (
                                <span className="text-blue-400 text-xs bg-blue-900/20 px-2 py-1 rounded">
                                  Selected Part
                                </span>
                              )}
                              <div className="bg-green-900/30 px-3 py-1 rounded border border-green-500/30">
                                <span className="text-green-400 font-bold">
                                  {feedback.score || 0}/{feedback.max_points || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Feedback Content */}
                          <div className="space-y-4">
                            {feedback.breakdown && (
                              <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                                <p className="text-gray-400 text-sm mb-2 font-medium">Detailed Breakdown:</p>
                                <p className="text-gray-200 text-sm whitespace-pre-wrap">{feedback.breakdown}</p>
                              </div>
                            )}
                            
                            {feedback.strengths && (
                              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                                <p className="text-green-400 text-sm mb-2 font-medium flex items-center">
                                  <CheckCircle size={16} className="mr-2" />
                                  Strengths:
                                </p>
                                <p className="text-gray-200 text-sm">{feedback.strengths}</p>
                              </div>
                            )}
                            
                            {feedback.areas_for_improvement && feedback.areas_for_improvement !== "None." && (
                              <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30">
                                <p className="text-orange-400 text-sm mb-2 font-medium flex items-center">
                                  <AlertCircle size={16} className="mr-2" />
                                  Areas for Improvement:
                                </p>
                                <p className="text-gray-200 text-sm">{feedback.areas_for_improvement}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            </div>
          </>) : (<>{submissionMethod === 'in-app' ? (
            <div className="h-full flex">
              {/* Questions List */}
              <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Questions</h3>
                  <div className="space-y-2">
                    {questions.map((question, index) => {
                      const getQuestionTypeColor = (type) => {
                        const colors = {
                          'code-writing': 'purple',
                          'diagram-analysis': 'orange', 
                          'multi-part': 'blue'
                        };
                        return colors[type] || 'teal';
                      };
                      
                      const color = getQuestionTypeColor(question.type);
                      const isAnswered = question.type === 'multi-part' 
                        ? answers[question.id]?.subAnswers && Object.keys(answers[question.id].subAnswers).length > 0
                        : answers[question.id];
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            currentQuestionIndex === index
                              ? `bg-${color}-600 text-white`
                              : isAnswered
                              ? `bg-${color}-600/20 text-${color}-400 border border-${color}-600/30`
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Q{index + 1}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                question.type === 'code-writing' ? 'bg-purple-500/20 text-purple-300' :
                                question.type === 'diagram-analysis' ? 'bg-orange-500/20 text-orange-300' :
                                question.type === 'multi-part' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {question.type === 'code-writing' ? 'Code' :
                                 question.type === 'diagram-analysis' ? 'Diagram' :
                                 question.type === 'multi-part' ? 'Multi-Part' :
                                 question.type.replace('-', ' ')}
                              </span>
                            </div>
                            <span className="text-sm">{question.points} pts</span>
                          </div>
                          <p className="text-sm mt-1 opacity-75">
                            {question.question.substring(0, 40)}...
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {renderQuestion(questions[currentQuestionIndex], currentQuestionIndex)}
                </div>
              </div>
            </div>
          ) : (
            /* PDF Upload Mode */
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Upload PDF Answer Sheet</h3>
                <p className="text-gray-400 mb-6">
                  Upload a PDF containing your answers. Diagrams will be automatically extracted and analyzed.
                </p>
                <div className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  isAlreadySubmitted 
                    ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    id="pdf-upload"
                    onChange={handlePdfFileChange}
                    disabled={isAlreadySubmitted}
                  />
                  {isAlreadySubmitted ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-yellow-400" />
                      </div>
                      <p className="text-yellow-400 font-medium mb-1">Assignment Already Submitted</p>
                      <p className="text-gray-300 text-sm mb-2">
                        PDF upload is disabled for submitted assignments
                      </p>
                    </div>
                  ) : pdfFile ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-green-400 font-medium mb-1">✓ PDF Selected</p>
                      <p className="text-gray-300 text-sm mb-2">{pdfFile.name}</p>
                      <button
                        onClick={() => setPdfFile(null)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload size={32} className="text-gray-400 mb-3" />
                      <p className="text-white font-medium mb-1">Click to upload PDF</p>
                      <p className="text-gray-400 text-sm">Maximum file size: 10MB</p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}</>)}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Submission Method:</span>
                <select
                  value={submissionMethod}
                  onChange={(e) => setSubmissionMethod(e.target.value)}
                  disabled={isAlreadySubmitted}
                  className={`px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isAlreadySubmitted ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="in-app">Answer In-App</option>
                  <option value="pdf">Upload PDF</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              {isAlreadySubmitted ? (
                <span className="text-green-400 font-medium">{isGraded ? '✓ Assignment graded - viewing feedback' : '✓ Assignment submitted - viewing submission'}</span>
              ) : (
                <>
                  {Object.keys(answers).length} of {questions.length} questions answered
                  {actualAssignment.total_points && (
                    <span className="ml-2">
                      • {actualAssignment.total_points} total points
                    </span>
                  )}
                </>
              )}
            </div>
            
            <div className="flex space-x-3">
              <div className="flex flex-col items-end">
                <button 
                  onClick={handleSaveDraft}
                  disabled={isSaving || isAlreadySubmitted}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                    isSaving || isAlreadySubmitted
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <Save size={16} className="mr-2 inline" />
                  {isSaving ? 'Saving...' : isAlreadySubmitted ? 'Submitted' : 'Save Draft'}
                </button>
                {lastSaved && (
                  <span className="text-xs text-gray-400 mt-1">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isAlreadySubmitted || pdfUploading}
                className={`px-6 py-2 font-medium rounded-lg transition-all duration-300 ${
                  isSubmitting || isAlreadySubmitted || pdfUploading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                }`}
              >
                {pdfUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing PDF...
                  </div>
                ) : isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : isAlreadySubmitted ? (
                  'Already Submitted'
                ) : (
                  'Submit Assignment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoAssignmentModal;

