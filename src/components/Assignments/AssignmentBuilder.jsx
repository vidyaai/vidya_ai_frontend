// src/components/Assignments/AssignmentBuilder.jsx
import { useState } from 'react';
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
import QuestionCard from './QuestionCard';
import AssignmentPreview from './AssignmentPreview';

const AssignmentBuilder = ({ onBack, onNavigateToHome }) => {
  const [questions, setQuestions] = useState([]);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');

  const questionTypes = [
    { type: 'multiple-choice', label: 'Multiple Choice', icon: '○' },
    { type: 'fill-blank', label: 'Fill in the Blank', icon: '___' },
    { type: 'short-answer', label: 'Short Answer', icon: 'A' },
    { type: 'numerical', label: 'Numerical', icon: '123' },
    { type: 'long-answer', label: 'Long Answer', icon: '¶' },
    { type: 'true-false', label: 'True/False', icon: 'T/F' }
  ];

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      type,
      question: '',
      options: type === 'multiple-choice' ? ['', '', '', ''] : [],
      correctAnswer: '',
      points: 1,
      rubric: '',
      order: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
    setShowQuestionTypes(false);
  };

  const updateQuestion = (id, updates) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const moveQuestion = (fromIndex, toIndex) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    setQuestions(newQuestions);
  };

  const saveAssignment = () => {
    // TODO: Implement save functionality
    console.log('Saving assignment:', {
      title: assignmentTitle,
      description: assignmentDescription,
      questions
    });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
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
                <p className="text-gray-400 mt-2">Create your assignment manually</p>
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
              <button
                onClick={saveAssignment}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300"
              >
                <Save size={18} className="mr-2" />
                Save Assignment
              </button>
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
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
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
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        {questionTypes.map((type) => (
                          <button
                            key={type.type}
                            onClick={() => addQuestion(type.type)}
                            className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center"
                          >
                            <span className="text-lg mr-3">{type.icon}</span>
                            <span>{type.label}</span>
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentBuilder;

