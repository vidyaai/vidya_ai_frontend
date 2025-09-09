// src/components/Assignments/QuestionCard.jsx
import { useState } from 'react';
import { 
  GripVertical, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Plus,
  X,
  Edit3
} from 'lucide-react';

const QuestionCard = ({ 
  question, 
  index, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const handlePointsChange = (value) => {
    onUpdate({ points: parseInt(value) || 1 });
  };

  const handleRubricChange = (value) => {
    onUpdate({ rubric: value });
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctAnswer === optionIndex.toString()}
                      onChange={() => handleCorrectAnswerChange(optionIndex.toString())}
                      className="text-teal-500 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correct Answer
              </label>
              <input
                type="number"
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Answer (Optional)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter a sample answer or key points..."
                rows={question.type === 'long-answer' ? 4 : 2}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
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
              value={question.points}
              onChange={(e) => handlePointsChange(e.target.value)}
              min="1"
              max="100"
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-gray-400 text-sm">pts</span>
          </div>
          
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
          
          {/* Rubric Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rubric (Optional)
            </label>
            <textarea
              value={question.rubric}
              onChange={(e) => handleRubricChange(e.target.value)}
              placeholder="Enter grading criteria or rubric..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;

