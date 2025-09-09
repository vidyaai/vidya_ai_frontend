// src/components/Assignments/AssignmentPreview.jsx
import { Eye, Clock, FileText, CheckCircle } from 'lucide-react';

const AssignmentPreview = ({ title, description, questions }) => {
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const estimatedTime = questions.length * 2; // 2 minutes per question estimate

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
            <input
              type="number"
              disabled
              placeholder="Enter numerical answer..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400 text-sm"
            />
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
            <textarea
              disabled
              placeholder="Enter your answer..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400 text-sm resize-none"
            />
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
            <textarea
              disabled
              placeholder="Enter your detailed answer..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400 text-sm resize-none"
            />
          </div>
        );

      default:
        return (
          <div key={question.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-white font-medium">Question {index + 1}</h4>
              <span className="text-teal-400 text-sm font-medium">{question.points || 1} pts</span>
            </div>
            <p className="text-gray-400 text-sm">Unknown question type</p>
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
        
        <div className="mt-4 bg-gray-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-teal-400" />
            <span className="text-white text-sm font-medium">{estimatedTime} min</span>
          </div>
          <p className="text-gray-400 text-xs">Estimated Time</p>
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
      {questions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300">
            Save Assignment
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentPreview;

