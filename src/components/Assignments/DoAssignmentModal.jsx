// src/components/Assignments/DoAssignmentModal.jsx
import { useState, useEffect, memo, useCallback } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { assignmentApi } from './assignmentApi';
import { TextWithEquations, EquationList } from './EquationRenderer';

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
  const [lastSaved, setLastSaved] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [selectedParts, setSelectedParts] = useState({}); // Track which optional parts are selected

  const actualAssignment = assignment.assignment || assignment;
  
  const questions = actualAssignment.questions && actualAssignment.questions.length > 0 
    ? actualAssignment.questions 
    : [];

  // Load existing draft/submission on component mount
  useEffect(() => {
    loadExistingSubmission();
  }, []);

  const loadExistingSubmission = async () => {
    try {
      const submission = await assignmentApi.getMySubmission(actualAssignment.id);
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      let submissionData = {
        answers,
        submission_method: submissionMethod,
        time_spent: "0", // Could track actual time spent
        submitted_files: null
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
    const currentAnswer = answers[question.id] || '';

    switch (question.type) {
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
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted answer" : "Enter your answer here..."}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        );

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
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || '')}
              onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted answer" : "Enter your answer here..."}
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
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted answer" : "Enter your numerical answer..."}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        );

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
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || '')}
              onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted answer" : "Enter your detailed answer here..."}
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
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-orange-400 text-sm font-medium">{question.points} points</span>
            </div>
            <p className="text-gray-300 text-lg">{question.question}</p>
            
            {question.diagram && renderDiagram(question.diagram, "Diagram")}
            
            <textarea
              value={typeof currentAnswer === 'string' ? currentAnswer : (currentAnswer?.text || '')}
              onChange={(e) => !isAlreadySubmitted && handleTextChangeWithDiagram(question.id, e.target.value)}
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
                        placeholder="Enter your answer..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
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
                        placeholder={subq.type === 'diagram-analysis' ? "Enter your diagram analysis..." : "Enter your answer..."}
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
                          
                          {/* Render sub-sub-questions */}
                          {subSubq.type === 'multiple-choice' ? (
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
                          ) : subSubq.type === 'true-false' ? (
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
                          ) : subSubq.type === 'fill-blank' ? (
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
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
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
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                            />
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
                              placeholder="Enter your answer..."
                              rows={2}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-sm"
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
          {submissionMethod === 'in-app' ? (
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
          )}
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
                <span className="text-green-400 font-medium">{isGraded ? '✓ Assignment graded - viewing submission' : '✓ Assignment submitted - viewing submission'}</span>
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

