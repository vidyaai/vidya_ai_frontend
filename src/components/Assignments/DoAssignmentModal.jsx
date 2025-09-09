// src/components/Assignments/DoAssignmentModal.jsx
import { useState } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';

const DoAssignmentModal = ({ assignment, onClose }) => {
  const [answers, setAnswers] = useState({});
  const [submissionMethod, setSubmissionMethod] = useState('in-app'); // 'in-app' or 'pdf'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Mock questions for the assignment
  const questions = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'What is the main topic discussed in the content?',
      options: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      points: 2
    },
    {
      id: 2,
      type: 'true-false',
      question: 'The content discusses advanced topics.',
      points: 1
    },
    {
      id: 3,
      type: 'short-answer',
      question: 'Explain the key concepts mentioned in the content.',
      points: 5
    },
    {
      id: 4,
      type: 'numerical',
      question: 'What is the value of x in the equation 2x + 5 = 15?',
      points: 3
    },
    {
      id: 5,
      type: 'long-answer',
      question: 'Provide a detailed analysis of the main themes discussed in the content.',
      points: 10
    }
  ];

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate submission process
    setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
    }, 2000);
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
            <p className="text-gray-300 text-lg">{question.question}</p>
            <div className="space-y-3">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionIndex}
                    checked={currentAnswer === optionIndex.toString()}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-white">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            <p className="text-gray-300 text-lg">{question.question}</p>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="true"
                  checked={currentAnswer === 'true'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="text-teal-500 focus:ring-teal-500"
                />
                <span className="text-white text-lg">True</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="false"
                  checked={currentAnswer === 'false'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="text-teal-500 focus:ring-teal-500"
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
            <p className="text-gray-300 text-lg">{question.question}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer here..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'numerical':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-teal-400 text-sm font-medium">{question.points} points</span>
            </div>
            <p className="text-gray-300 text-lg">{question.question}</p>
            <input
              type="number"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your numerical answer..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            <p className="text-gray-300 text-lg">{question.question}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your detailed answer here..."
              rows={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        );

      default:
        return (
          <div key={question.id} className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
            <p className="text-gray-400">Unknown question type</p>
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
          <div>
            <h2 className="text-2xl font-bold text-white">{assignment.title}</h2>
            <p className="text-gray-400 mt-1">by {assignment.instructor}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock size={16} />
              <span className="text-sm">{assignment.timeRemaining}</span>
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
                    {questions.map((question, index) => (
                      <button
                        key={question.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentQuestionIndex === index
                            ? 'bg-teal-600 text-white'
                            : answers[question.id]
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Question {index + 1}</span>
                          <span className="text-sm">{question.points} pts</span>
                        </div>
                        <p className="text-sm mt-1 opacity-75">
                          {question.question.substring(0, 50)}...
                        </p>
                      </button>
                    ))}
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
                  Upload a PDF file containing your complete answers to all questions.
                </p>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 hover:border-gray-600 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={32} className="text-gray-400 mb-3" />
                    <p className="text-white font-medium mb-1">Click to upload PDF</p>
                    <p className="text-gray-400 text-sm">Maximum file size: 10MB</p>
                  </label>
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
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="in-app">Answer In-App</option>
                  <option value="pdf">Upload PDF</option>
                </select>
              </div>
              <div className="text-sm text-gray-400">
                {Object.keys(answers).length} of {questions.length} questions answered
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors">
                <Save size={16} className="mr-2 inline" />
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 font-medium rounded-lg transition-all duration-300 ${
                  isSubmitting
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
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

