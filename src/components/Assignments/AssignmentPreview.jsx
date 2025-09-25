// src/components/Assignments/AssignmentPreview.jsx
import { useState, useEffect } from 'react';
import { Eye, Clock, FileText, CheckCircle, Code, Image as ImageIcon, Layers } from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const AssignmentPreview = ({ title, description, questions, onSave, saving = false, validationStatus }) => {
  const calculateQuestionPoints = (question) => {
    if (question.type === 'multi-part') {
      // For multi-part questions, sum up all sub-question points
      const subQuestionPoints = (question.subquestions || []).reduce((sum, subq) => {
        if (subq.type === 'multi-part') {
          // Handle nested multi-part questions
          const nestedPoints = (subq.subquestions || []).reduce((nestedSum, nestedSubq) => {
            return nestedSum + (nestedSubq.points || 1);
          }, 0);
          return sum + nestedPoints;
        }
        return sum + (subq.points || 1);
      }, 0);
      return subQuestionPoints;
    }
    return question.points || 1;
  };

  const totalPoints = questions.reduce((sum, q) => sum + calculateQuestionPoints(q), 0);

  // Component for handling diagram images with URL fetching in preview
  const DiagramPreviewImage = ({ diagramData, displayName }) => {
    const [imageUrl, setImageUrl] = useState(diagramData.url || null);
    const [loading, setLoading] = useState(!diagramData.url && diagramData.file_id);
    const [error, setError] = useState(false);

    useEffect(() => {
      const loadImageUrl = async () => {
        // If we already have a URL (either direct or cached), use it
        if (imageUrl) return;
        
        // If no file_id, we can't fetch from server
        if (!diagramData.file_id) {
          setError(true);
          return;
        }

        try {
          setLoading(true);
          setError(false);
          const url = await assignmentApi.getDiagramUrl(diagramData.file_id);
          setImageUrl(url);
        } catch (error) {
          console.error('Failed to load diagram URL in preview:', error);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      loadImageUrl();
    }, [diagramData.file_id, diagramData.url, imageUrl]);

    if (loading) {
      return (
        <div className="mt-2 p-4 bg-gray-700 rounded border text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400 mx-auto mb-2"></div>
          <p className="text-gray-300 text-xs">Loading...</p>
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <div className="mt-2 p-2 bg-gray-700 rounded border text-center">
          <ImageIcon size={20} className="text-gray-500 mx-auto mb-1" />
          <p className="text-gray-400 text-xs">{displayName}</p>
        </div>
      );
    }

    return (
      <div className="mt-2 p-2 bg-gray-700 rounded border">
        <img 
          src={imageUrl}
          alt={displayName}
          className="w-full max-h-32 object-contain bg-gray-800 rounded"
          onError={() => setError(true)}
        />
      </div>
    );
  };

  // Helper function to render diagrams in preview
  const renderDiagramPreview = (diagramData, assignmentId = null) => {
    if (!diagramData) return null;

    const displayName = diagramData.filename || diagramData.file || 'diagram';
    
    // Always try to render with DiagramPreviewImage - it handles all cases internally
    return <DiagramPreviewImage diagramData={diagramData} displayName={displayName} />;
  };

  const renderQuestionPreview = (question, index) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Question text...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
            
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <input type="radio" disabled className="text-teal-500" />
                  <span className="text-gray-400 text-sm">{option || `Option ${optionIndex + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Question text...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
            
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" disabled className="text-teal-500 mr-2" />
                <span className="text-gray-400 text-sm">True</span>
              </label>
              <label className="flex items-center">
                <input type="radio" disabled className="text-teal-500 mr-2" />
                <span className="text-gray-400 text-sm">False</span>
              </label>
            </div>
          </div>
        );

      case 'fill-blank':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">
              {question.question || 'Question with blanks...'}
            </p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
            
            <div className="bg-gray-700 rounded p-2">
              <span className="text-gray-400 text-sm">Fill in the blanks</span>
            </div>
          </div>
        );

      case 'numerical':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Question text...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
          </div>
        );

      case 'short-answer':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Question text...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
          </div>
        );

      case 'long-answer':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Question text...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
          </div>
        );

      case 'code-writing':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Code size={16} className="text-purple-400" />
                <h4 className="text-white font-medium">Question {index + 1}</h4>
              </div>
              <span className="text-purple-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Programming question...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
            
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-400 text-xs font-medium">
                  {question.codeLanguage?.toUpperCase() || 'CODE'}
                </span>
                <span className="text-gray-400 text-xs">
                  {question.outputType?.replace('-', ' ') || 'Complete Code'}
                </span>
              </div>
              <div className="bg-gray-800 rounded p-2 font-mono text-sm text-gray-400">
                {question.starterCode || '// Write your code here...'}
              </div>
            </div>
          </div>
        );

      case 'diagram-analysis':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <ImageIcon size={16} className="text-orange-400" />
                  <h4 className="text-white font-medium">Question {index + 1}</h4>
                </div>
              <span className="text-orange-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Diagram analysis question...'}</p>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              {question.diagram ? renderDiagramPreview(question.diagram) : (
                <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center">
                    <ImageIcon size={24} className="text-gray-500 mx-auto mb-1" />
                    <p className="text-gray-400 text-xs">No diagram uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'multi-part':
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Layers size={16} className="text-blue-400" />
                <h4 className="text-white font-medium">Question {index + 1} - Multi-Part</h4>
              </div>
              <span className="text-blue-400 text-sm font-medium">{calculateQuestionPoints(question)} pts total</span>
            </div>
            <p className="text-gray-300 mb-4">{question.question || 'Multi-part question...'}</p>
            
            {/* Main Question Code Preview */}
            {((question.hasMainCode && question.mainCode) || (question.hasCode && question.code)) && (
              <div className="bg-gray-900 rounded-lg p-3 border border-purple-500/30 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 text-xs font-medium">
                    Main Code ({(question.mainCodeLanguage || question.codeLanguage)?.toUpperCase() || 'CODE'})
                  </span>
                </div>
                <div className="bg-gray-800 rounded p-2 font-mono text-xs text-gray-400 max-h-20 overflow-hidden">
                  {question.mainCode || question.code}
                </div>
              </div>
            )}
            
            {/* Main Question Diagram Preview */}
            {((question.hasMainDiagram && question.mainDiagram) || question.diagram) && (
              <div className="bg-gray-900 rounded-lg p-3 border border-orange-500/30 mb-4">
                <div className="text-orange-400 text-xs font-medium mb-2">Main Diagram</div>
                {question.mainDiagram ? renderDiagramPreview(question.mainDiagram) : 
                 question.diagram ? renderDiagramPreview(question.diagram) : (
                  <div className="w-full h-20 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                    <div className="text-center">
                      <ImageIcon size={16} className="text-gray-500 mx-auto mb-1" />
                      <p className="text-gray-400 text-xs">No diagram</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              {(question.subquestions || []).map((subq, subIndex) => (
                <div key={subq.id || subIndex} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm font-medium">Part {subIndex + 1}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        subq.type === 'code-writing' ? 'bg-purple-500/20 text-purple-300' :
                        subq.type === 'diagram-analysis' ? 'bg-orange-500/20 text-orange-300' :
                        subq.type === 'multi-part' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {subq.type === 'code-writing' ? 'Code' :
                         subq.type === 'diagram-analysis' ? 'Diagram' :
                         subq.type === 'multi-part' ? 'Multi-Part' :
                         subq.type?.replace('-', ' ') || 'Text'}
                      </span>
                      <span className="text-blue-400 text-xs">
                        {subq.type === 'multi-part' 
                          ? (subq.subquestions || []).reduce((sum, nestedSubq) => sum + (nestedSubq.points || 1), 0)
                          : subq.points || 1
                        } pts
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{subq.question || `Part ${subIndex + 1} question...`}</p>
                  
                  {/* Sub-question Diagram */}
                  {(subq.subDiagram || subq.diagram) && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-orange-500/30 mt-2">
                      <div className="text-orange-400 text-xs font-medium mb-2">Sub-question Diagram</div>
                      {subq.subDiagram ? renderDiagramPreview(subq.subDiagram) : 
                       subq.diagram ? renderDiagramPreview(subq.diagram) : null}
                    </div>
                  )}
                  
                  {/* Sub-question Code */}
                  {((subq.hasSubCode && subq.subCode) || (subq.hasCode && subq.code)) && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-purple-500/30 mt-2">
                      <div className="text-purple-400 text-xs font-medium mb-2">
                        Code ({(subq.codeLanguage)?.toUpperCase() || 'CODE'})
                      </div>
                      <div className="bg-gray-800 rounded p-2 font-mono text-xs text-gray-300 overflow-x-auto max-h-20">
                        {subq.subCode || subq.code}
                      </div>
                    </div>
                  )}
                  
                  {/* Show nested sub-questions for multi-part sub-questions */}
                  {subq.type === 'multi-part' && (subq.subquestions || []).length > 0 && (
                    <div className="mt-2 ml-3 space-y-1 border-l-2 border-blue-400/30 pl-3">
                      {subq.subquestions.map((nestedSubq, nestedIndex) => (
                        <div key={nestedSubq.id || nestedIndex} className="bg-gray-600 rounded p-2 border border-gray-500">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-200 text-xs font-medium">Part {subIndex + 1}.{nestedIndex + 1}</span>
                            <div className="flex items-center space-x-1">
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                nestedSubq.type === 'code-writing' ? 'bg-purple-500/20 text-purple-300' :
                                nestedSubq.type === 'diagram-analysis' ? 'bg-orange-500/20 text-orange-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {nestedSubq.type === 'code-writing' ? 'Code' :
                                 nestedSubq.type === 'diagram-analysis' ? 'Diagram' :
                                 nestedSubq.type?.replace('-', ' ') || 'Text'}
                              </span>
                              <span className="text-blue-400 text-xs">{nestedSubq.points || 1} pts</span>
                            </div>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">{nestedSubq.question || `Part ${subIndex + 1}.${nestedIndex + 1} question...`}</p>
                          
                          {/* Nested sub-question diagram */}
                          {nestedSubq.diagram && (
                            <div className="mt-2 bg-gray-700 rounded p-2 border border-orange-500/30">
                              <div className="text-orange-300 text-xs font-medium mb-1">Diagram</div>
                              <div className="max-h-16 overflow-hidden">
                                {renderDiagramPreview(nestedSubq.diagram)}
                              </div>
                            </div>
                          )}
                          
                          {/* Nested sub-question code */}
                          {((nestedSubq.hasCode && nestedSubq.code)) && (
                            <div className="mt-2 bg-gray-700 rounded p-2 border border-purple-500/30">
                              <div className="text-purple-300 text-xs font-medium mb-1">
                                Code ({(nestedSubq.codeLanguage)?.toUpperCase() || 'CODE'})
                              </div>
                              <div className="bg-gray-800 rounded p-1 font-mono text-xs text-gray-300 overflow-x-auto max-h-16">
                                {nestedSubq.code}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-300 mb-3">{question.question || 'Question text...'}</p>
            
            {/* Show diagram if available */}
            {question.diagram && renderDiagramPreview(question.diagram)}
            
            <p className="text-gray-400 text-sm">Unknown question type: {question.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 sticky top-8">
      <div className="flex items-center space-x-2 mb-6">
        <Eye size={20} className="text-teal-400" />
        <h2 className="text-xl font-bold text-white">Assignment Preview</h2>
      </div>

      {/* Assignment Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          {title || 'Untitled Assignment'}
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          {description || 'No description provided'}
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-teal-400" />
              <span className="text-white text-sm font-medium">{questions.length}</span>
            </div>
            <p className="text-gray-400 text-xs">Questions</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-teal-400" />
              <span className="text-white text-sm font-medium">{totalPoints}</span>
            </div>
            <p className="text-gray-400 text-xs">Total Points</p>
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      <div>
        <h4 className="text-white font-medium mb-4">Questions Preview</h4>
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">No questions added yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((question, index) => renderQuestionPreview(question, index))}
          </div>
        )}
      </div>

      {/* Preview Actions */}
      {questions.length > 0 && onSave && (
        <div className="mt-6 pt-4 border-t border-gray-700 space-y-2">
          <button 
            onClick={() => onSave('draft')}
            disabled={saving}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <div className="relative group">
            <button 
              onClick={() => onSave('published')}
              disabled={saving || (validationStatus && !validationStatus.isValid)}
              className={`w-full px-4 py-2 font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                (!validationStatus || validationStatus.isValid) 
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700' 
                  : 'bg-gray-600 text-gray-300'
              }`}
              title={(!validationStatus || validationStatus.isValid) ? 'Ready to publish' : `Cannot publish: ${validationStatus.errors.length} validation error(s)`}
            >
              {saving ? 'Publishing...' : 'Save & Publish'}
              {validationStatus && !validationStatus.isValid && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                  {validationStatus.errors.length}
                </span>
              )}
            </button>
            {validationStatus && !validationStatus.isValid && validationStatus.errors.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-full bg-red-900/90 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 z-20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="font-medium text-red-100 mb-2">Cannot publish - Fix these issues:</div>
                <ul className="space-y-1 text-xs">
                  {validationStatus.errors.slice(0, 3).map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-400 mr-1 flex-shrink-0">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                  {validationStatus.errors.length > 3 && (
                    <li className="text-red-300 italic">...and {validationStatus.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentPreview;

