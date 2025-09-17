// src/components/Assignments/QuestionCard.jsx
import { useState } from 'react';
import { 
  GripVertical, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Plus,
  X,
  Edit3,
  Code,
  Image as ImageIcon,
  Calculator,
  Layers,
  FileText,
  Zap
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

  const handleSubquestionChange = (subIndex, field, value) => {
    const newSubquestions = [...(question.subquestions || [])];
    newSubquestions[subIndex] = { ...newSubquestions[subIndex], [field]: value };
    onUpdate({ subquestions: newSubquestions });
  };

  const addSubquestion = () => {
    const newSubquestions = [...(question.subquestions || []), {
      id: Date.now(),
      question: '',
      points: 1,
      type: 'short-answer',
      hasSubCode: false,
      hasSubDiagram: false,
      subCode: '',
      subDiagram: null,
      options: ['', '', '', ''], // for multiple choice
      subquestions: [] // for nested multi-part
    }];
    onUpdate({ subquestions: newSubquestions });
  };

  const removeSubquestion = (subIndex) => {
    const newSubquestions = (question.subquestions || []).filter((_, index) => index !== subIndex);
    onUpdate({ subquestions: newSubquestions });
  };

  const handleCodeLanguageChange = (language) => {
    onUpdate({ codeLanguage: language });
  };

  const handleDiagramChange = (diagramData) => {
    onUpdate({ diagram: diagramData });
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
      case 'code-writing':
        return <Code size={18} className="text-purple-400" />;
      case 'diagram-analysis':
        return <ImageIcon size={18} className="text-orange-400" />;
      case 'multi-part':
        return <Layers size={18} className="text-blue-400" />;
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

            {/* Enhanced options for multiple choice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            onUpdate({ diagram: { file: file.name, url: URL.createObjectURL(file) } });
                          }
                        }}
                        className="hidden"
                        id={`diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {question.diagram && (
                        <div className="mt-2 text-orange-400 text-xs">
                          📎 {question.diagram.file}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

            {/* Enhanced options for true/false */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            onUpdate({ diagram: { file: file.name, url: URL.createObjectURL(file) } });
                          }
                        }}
                        className="hidden"
                        id={`diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {question.diagram && (
                        <div className="mt-2 text-orange-400 text-xs">
                          📎 {question.diagram.file}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

            {/* Enhanced options for fill-blank */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            onUpdate({ diagram: { file: file.name, url: URL.createObjectURL(file) } });
                          }
                        }}
                        className="hidden"
                        id={`diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {question.diagram && (
                        <div className="mt-2 text-orange-400 text-xs">
                          📎 {question.diagram.file}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

            {/* Enhanced options for numerical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            onUpdate({ diagram: { file: file.name, url: URL.createObjectURL(file) } });
                          }
                        }}
                        className="hidden"
                        id={`diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {question.diagram && (
                        <div className="mt-2 text-orange-400 text-xs">
                          📎 {question.diagram.file}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

            {/* Enhanced options for basic questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasCode || false}
                    onChange={(e) => onUpdate({ hasCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code
                  </span>
                </label>
                {question.hasCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.codeLanguage || 'python'}
                      onChange={(e) => onUpdate({ codeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                      <option value="verilog">Verilog</option>
                      <option value="vhdl">VHDL</option>
                    </select>
                    <textarea
                      value={question.code || ''}
                      onChange={(e) => onUpdate({ code: e.target.value })}
                      placeholder="// Enter code for this question..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasDiagram || false}
                    onChange={(e) => onUpdate({ hasDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram
                  </span>
                </label>
                {question.hasDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            onUpdate({ diagram: { file: file.name, url: URL.createObjectURL(file) } });
                          }
                        }}
                        className="hidden"
                        id={`diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {question.diagram && (
                        <div className="mt-2 text-orange-400 text-xs">
                          📎 {question.diagram.file}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      case 'code-writing':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Programming Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your programming problem description..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Programming Language
                </label>
                <select
                  value={question.codeLanguage || 'python'}
                  onChange={(e) => handleCodeLanguageChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="javascript">JavaScript</option>
                  <option value="matlab">MATLAB</option>
                  <option value="verilog">Verilog</option>
                  <option value="vhdl">VHDL</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Output Type
                </label>
                <select
                  value={question.outputType || 'code'}
                  onChange={(e) => onUpdate({ outputType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="code">Complete Code</option>
                  <option value="function">Function Only</option>
                  <option value="algorithm">Algorithm/Pseudocode</option>
                  <option value="output">Program Output</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Starter Code (Optional)
              </label>
              <textarea
                value={question.starterCode || ''}
                onChange={(e) => onUpdate({ starterCode: e.target.value })}
                placeholder="// Provide starter code or template here..."
                rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Solution (Optional)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter sample solution code..."
                rows={6}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'diagram-analysis':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter your diagram analysis question..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Diagram/Image Upload
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,.svg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // In a real implementation, you'd upload the file and get a URL
                      handleDiagramChange({ file: file.name, url: URL.createObjectURL(file) });
                    }
                  }}
                  className="hidden"
                  id={`diagram-upload-${question.id}`}
                />
                <label
                  htmlFor={`diagram-upload-${question.id}`}
                  className="cursor-pointer flex flex-col items-center"
                >
                    <ImageIcon size={32} className="text-gray-400 mb-2" />
                    <p className="text-white font-medium mb-1">Upload Diagram</p>
                    <p className="text-gray-400 text-sm">PNG, JPG, SVG, PDF supported</p>
                </label>
                {question.diagram && (
                  <div className="mt-3 text-orange-400 text-sm">
                    📎 {question.diagram.file}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Analysis Type
              </label>
              <select
                value={question.analysisType || 'description'}
                onChange={(e) => onUpdate({ analysisType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="description">Describe Components</option>
                <option value="analysis">Technical Analysis</option>
                <option value="calculation">Calculations from Diagram</option>
                <option value="identification">Component Identification</option>
                <option value="troubleshooting">Troubleshooting</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sample Answer (Optional)
              </label>
              <textarea
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                placeholder="Enter sample analysis or key points..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        );

      case 'multi-part':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Main Question
              </label>
              <textarea
                value={question.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter the main question or problem statement..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Rubric Configuration for Multi-part Questions */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Rubric Configuration
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`rubric-type-${question.id}`}
                      checked={question.rubricType === 'overall' || !question.rubricType}
                      onChange={() => onUpdate({ rubricType: 'overall' })}
                      className="text-blue-500 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-white text-sm">Overall Rubric</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`rubric-type-${question.id}`}
                      checked={question.rubricType === 'per-subquestion'}
                      onChange={() => onUpdate({ rubricType: 'per-subquestion' })}
                      className="text-blue-500 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-white text-sm">Per Sub-question Rubric</span>
                  </label>
                </div>
                
                {(question.rubricType === 'overall' || !question.rubricType) && (
                  <div>
                    <label className="block text-xs font-medium text-blue-300 mb-2">
                      Overall Rubric for Entire Question
                    </label>
                    <textarea
                      value={question.rubric || ''}
                      onChange={(e) => onUpdate({ rubric: e.target.value })}
                      placeholder="Enter overall grading criteria for this multi-part question..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                )}
                
                {question.rubricType === 'per-subquestion' && (
                  <div className="text-blue-300 text-sm bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
                    <p className="font-medium mb-1">Per Sub-question Rubrics</p>
                    <p className="text-xs text-blue-200">Individual rubrics can be added to each sub-question below.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Question Enhancements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasMainCode || false}
                    onChange={(e) => onUpdate({ hasMainCode: e.target.checked })}
                    className="text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Code in Main Question
                  </span>
                </label>
                {question.hasMainCode && (
                  <div className="mt-3 space-y-2">
                    <select
                      value={question.mainCodeLanguage || 'python'}
                      onChange={(e) => onUpdate({ mainCodeLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="javascript">JavaScript</option>
                      <option value="matlab">MATLAB</option>
                    </select>
                    <textarea
                      value={question.mainCode || ''}
                      onChange={(e) => onUpdate({ mainCode: e.target.value })}
                      placeholder="// Main question code here..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={question.hasMainDiagram || false}
                    onChange={(e) => onUpdate({ hasMainDiagram: e.target.checked })}
                    className="text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Include Diagram in Main Question
                  </span>
                </label>
                {question.hasMainDiagram && (
                  <div className="mt-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            onUpdate({ mainDiagram: { file: file.name, url: URL.createObjectURL(file) } });
                          }
                        }}
                        className="hidden"
                        id={`main-diagram-upload-${question.id}`}
                      />
                      <label
                        htmlFor={`main-diagram-upload-${question.id}`}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <ImageIcon size={24} className="text-gray-500 mb-2" />
                        <p className="text-white font-medium text-sm mb-1">Upload Main Diagram</p>
                        <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                      </label>
                      {question.mainDiagram && (
                        <div className="mt-2 text-orange-400 text-xs">
                          📎 {question.mainDiagram.file}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Sub-questions
                </label>
                <button
                  onClick={addSubquestion}
                  className="inline-flex items-center px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Add Part
                </button>
              </div>
              
              <div className="space-y-3">
                {(question.subquestions || []).map((subq, subIndex) => (
                  <div key={subq.id || subIndex} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-300 font-medium text-sm">Part {subIndex + 1}</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={subq.type === 'multi-part' 
                            ? (subq.subquestions || []).reduce((sum, nestedSubq) => sum + (nestedSubq.points || 1), 0)
                            : subq.points || 1
                          }
                          onChange={(e) => handleSubquestionChange(subIndex, 'points', parseInt(e.target.value) || 1)}
                          min="1"
                          disabled={subq.type === 'multi-part'}
                          className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-gray-400 text-sm">pts</span>
                        {subq.type === 'multi-part' && (
                          <span className="text-xs text-gray-500">(auto-calc)</span>
                        )}
                        <button
                          onClick={() => removeSubquestion(subIndex)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={subq.question || ''}
                      onChange={(e) => handleSubquestionChange(subIndex, 'question', e.target.value)}
                      placeholder={`Enter part ${subIndex + 1} question...`}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                    
                    {/* Sub-question type selection */}
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={subq.type || 'short-answer'}
                          onChange={(e) => handleSubquestionChange(subIndex, 'type', e.target.value)}
                          className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="short-answer">Short Answer</option>
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True/False</option>
                          <option value="fill-blank">Fill in Blank</option>
                          <option value="numerical">Numerical</option>
                          <option value="code-writing">Code Writing</option>
                          <option value="diagram-analysis">Diagram Analysis</option>
                          <option value="multi-part">Multi-Part</option>
                        </select>
                        
                        {subq.type === 'code-writing' && (
                          <select
                            value={subq.codeLanguage || 'python'}
                            onChange={(e) => handleSubquestionChange(subIndex, 'codeLanguage', e.target.value)}
                            className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="matlab">MATLAB</option>
                            <option value="c">C</option>
                            <option value="javascript">JavaScript</option>
                          </select>
                        )}
                      </div>

                      {/* Sub-question content options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={subq.hasSubCode || false}
                            onChange={(e) => handleSubquestionChange(subIndex, 'hasSubCode', e.target.checked)}
                            className="text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300">Include Code</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={subq.hasSubDiagram || false}
                            onChange={(e) => handleSubquestionChange(subIndex, 'hasSubDiagram', e.target.checked)}
                            className="text-orange-600 bg-gray-600 border-gray-500 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300">Include Diagram</span>
                        </label>
                      </div>

                      {/* Sub-question code editor */}
                      {subq.hasSubCode && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-purple-300 mb-2">
                            Sub-question Code
                          </label>
                          <textarea
                            value={subq.subCode || ''}
                            onChange={(e) => handleSubquestionChange(subIndex, 'subCode', e.target.value)}
                            placeholder="// Enter starter code for this sub-question..."
                            rows={4}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                          />
                        </div>
                      )}

                      {/* Sub-question diagram upload */}
                      {subq.hasSubDiagram && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-orange-300 mb-2">
                            Sub-question Diagram
                          </label>
                          <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors">
                            <input
                              type="file"
                              accept="image/*,.pdf,.svg"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleSubquestionChange(subIndex, 'subDiagram', { file: file.name, url: URL.createObjectURL(file) });
                                }
                              }}
                              className="hidden"
                              id={`subq-diagram-upload-${question.id}-${subIndex}`}
                            />
                            <label
                              htmlFor={`subq-diagram-upload-${question.id}-${subIndex}`}
                              className="cursor-pointer flex flex-col items-center"
                            >
                              <ImageIcon size={20} className="text-gray-500 mb-1" />
                              <p className="text-white font-medium text-xs mb-1">Upload Diagram</p>
                              <p className="text-gray-400 text-xs">PNG, JPG, SVG, PDF</p>
                            </label>
                            {subq.subDiagram && (
                              <div className="mt-2 text-orange-400 text-xs">
                                📎 {subq.subDiagram.file}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multiple choice options for sub-questions */}
                      {subq.type === 'multiple-choice' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-teal-300 mb-2">
                            Multiple Choice Options
                          </label>
                          <div className="space-y-2">
                            {(subq.options || ['', '', '', '']).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-sub-${question.id}-${subIndex}`}
                                  checked={subq.correctAnswer === optionIndex.toString()}
                                  onChange={() => handleSubquestionChange(subIndex, 'correctAnswer', optionIndex.toString())}
                                  className="text-teal-500 focus:ring-teal-500"
                                />
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...(subq.options || ['', '', '', ''])];
                                    newOptions[optionIndex] = e.target.value;
                                    handleSubquestionChange(subIndex, 'options', newOptions);
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* True/False correct answer for sub-questions */}
                      {subq.type === 'true-false' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-teal-300 mb-2">
                            Correct Answer
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`tf-sub-${question.id}-${subIndex}`}
                                checked={subq.correctAnswer === 'true'}
                                onChange={() => handleSubquestionChange(subIndex, 'correctAnswer', 'true')}
                                className="text-teal-500 focus:ring-teal-500 mr-2"
                              />
                              <span className="text-white text-sm">True</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`tf-sub-${question.id}-${subIndex}`}
                                checked={subq.correctAnswer === 'false'}
                                onChange={() => handleSubquestionChange(subIndex, 'correctAnswer', 'false')}
                                className="text-teal-500 focus:ring-teal-500 mr-2"
                              />
                              <span className="text-white text-sm">False</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Correct answer for other sub-question types */}
                      {!['multiple-choice', 'true-false'].includes(subq.type) && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-teal-300 mb-2">
                            {subq.type === 'numerical' ? 'Correct Answer' : 'Sample Answer (Optional)'}
                          </label>
                          <textarea
                            value={subq.correctAnswer || ''}
                            onChange={(e) => handleSubquestionChange(subIndex, 'correctAnswer', e.target.value)}
                            placeholder={subq.type === 'numerical' ? 'Enter the correct numerical answer...' : 'Enter sample answer or key points...'}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                          />
                        </div>
                      )}

                      {/* Per sub-question rubric */}
                      {question.rubricType === 'per-subquestion' && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-blue-300 mb-2">
                            Rubric for Part {subIndex + 1}
                          </label>
                          <textarea
                            value={subq.rubric || ''}
                            onChange={(e) => handleSubquestionChange(subIndex, 'rubric', e.target.value)}
                            placeholder={`Enter grading criteria for part ${subIndex + 1}...`}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          />
                        </div>
                      )}

                      {/* Nested multi-part sub-questions */}
                      {subq.type === 'multi-part' && (
                        <div className="mt-3 border-l-2 border-blue-400/30 pl-4 ml-2">
                          {/* Rubric Configuration for Nested Multi-part Sub-questions */}
                          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 mb-3">
                            <label className="block text-xs font-medium text-blue-300 mb-2">
                              Rubric Configuration for Part {subIndex + 1}
                            </label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`nested-rubric-type-${question.id}-${subIndex}`}
                                    checked={subq.rubricType === 'overall' || !subq.rubricType}
                                    onChange={() => handleSubquestionChange(subIndex, 'rubricType', 'overall')}
                                    className="text-blue-500 focus:ring-blue-500 mr-2"
                                  />
                                  <span className="text-white text-xs">Overall Rubric</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`nested-rubric-type-${question.id}-${subIndex}`}
                                    checked={subq.rubricType === 'per-subquestion'}
                                    onChange={() => handleSubquestionChange(subIndex, 'rubricType', 'per-subquestion')}
                                    className="text-blue-500 focus:ring-blue-500 mr-2"
                                  />
                                  <span className="text-white text-xs">Per Sub-part Rubric</span>
                                </label>
                              </div>
                              
                              {(subq.rubricType === 'overall' || !subq.rubricType) && (
                                <div>
                                  <label className="block text-xs font-medium text-blue-300 mb-1">
                                    Overall Rubric for Part {subIndex + 1}
                                  </label>
                                  <textarea
                                    value={subq.rubric || ''}
                                    onChange={(e) => handleSubquestionChange(subIndex, 'rubric', e.target.value)}
                                    placeholder={`Enter overall grading criteria for part ${subIndex + 1}...`}
                                    rows={2}
                                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                  />
                                </div>
                              )}
                              
                              {subq.rubricType === 'per-subquestion' && (
                                <div className="text-blue-300 text-xs bg-blue-900/20 p-2 rounded border border-blue-700/30">
                                  <p className="font-medium mb-1">Per Sub-part Rubrics</p>
                                  <p className="text-xs text-blue-200">Individual rubrics can be added to each sub-part below.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-blue-300">
                              Sub-sub-questions
                            </label>
                            <button
                              onClick={() => {
                                const newSubSubquestions = [...(subq.subquestions || []), {
                                  id: Date.now(),
                                  question: '',
                                  points: 1,
                                  type: 'short-answer'
                                }];
                                handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Plus size={12} className="mr-1" />
                              Add Sub-part
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {(subq.subquestions || []).map((subSubq, subSubIndex) => (
                              <div key={subSubq.id || subSubIndex} className="bg-gray-600 rounded-lg p-3 border border-gray-500">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-blue-200 text-xs font-medium">Part {subIndex + 1}.{subSubIndex + 1}</span>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={subSubq.points || 1}
                                      onChange={(e) => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], points: parseInt(e.target.value) || 1 };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      min="1"
                                      className="w-12 px-1 py-1 bg-gray-500 border border-gray-400 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-300 text-xs">pts</span>
                                    <button
                                      onClick={() => {
                                        const newSubSubquestions = (subq.subquestions || []).filter((_, i) => i !== subSubIndex);
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={subSubq.question || ''}
                                  onChange={(e) => {
                                    const newSubSubquestions = [...(subq.subquestions || [])];
                                    newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], question: e.target.value };
                                    handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                  }}
                                  placeholder={`Enter part ${subIndex + 1}.${subSubIndex + 1} question...`}
                                  className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs mb-2"
                                />
                                <select
                                  value={subSubq.type || 'short-answer'}
                                  onChange={(e) => {
                                    const newSubSubquestions = [...(subq.subquestions || [])];
                                    newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], type: e.target.value };
                                    handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                  }}
                                  className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="short-answer">Short Answer</option>
                                  <option value="multiple-choice">Multiple Choice</option>
                                  <option value="true-false">True/False</option>
                                  <option value="fill-blank">Fill in Blank</option>
                                  <option value="numerical">Numerical</option>
                                  <option value="code-writing">Code Writing</option>
                                  <option value="diagram-analysis">Diagram Analysis</option>
                                </select>
                                
                                {/* Add options for MC questions in sub-sub-questions */}
                                {subSubq.type === 'multiple-choice' && (
                                  <div className="mt-2 space-y-1">
                                    {(subSubq.options || ['', '', '']).map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          name={`correct-subsub-${question.id}-${subIndex}-${subSubIndex}`}
                                          checked={subSubq.correctAnswer === optionIndex.toString()}
                                          onChange={() => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: optionIndex.toString() };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          className="text-teal-500 focus:ring-teal-500"
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            const newOptions = [...(newSubSubquestions[subSubIndex].options || ['', '', ''])];
                                            newOptions[optionIndex] = e.target.value;
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], options: newOptions };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          placeholder={`Option ${optionIndex + 1}`}
                                          className="flex-1 px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* True/False correct answer for sub-sub-questions */}
                                {subSubq.type === 'true-false' && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-teal-300 mb-1">
                                      Correct Answer
                                    </label>
                                    <div className="flex space-x-3">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`tf-subsub-${question.id}-${subIndex}-${subSubIndex}`}
                                          checked={subSubq.correctAnswer === 'true'}
                                          onChange={() => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: 'true' };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          className="text-teal-500 focus:ring-teal-500 mr-1"
                                        />
                                        <span className="text-white text-xs">True</span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`tf-subsub-${question.id}-${subIndex}-${subSubIndex}`}
                                          checked={subSubq.correctAnswer === 'false'}
                                          onChange={() => {
                                            const newSubSubquestions = [...(subq.subquestions || [])];
                                            newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: 'false' };
                                            handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                          }}
                                          className="text-teal-500 focus:ring-teal-500 mr-1"
                                        />
                                        <span className="text-white text-xs">False</span>
                                      </label>
                                    </div>
                                  </div>
                                )}

                                {/* Correct answer for other sub-sub-question types */}
                                {!['multiple-choice', 'true-false'].includes(subSubq.type) && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-teal-300 mb-1">
                                      {subSubq.type === 'numerical' ? 'Correct Answer' : 'Sample Answer (Optional)'}
                                    </label>
                                    <input
                                      type="text"
                                      value={subSubq.correctAnswer || ''}
                                      onChange={(e) => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], correctAnswer: e.target.value };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      placeholder={subSubq.type === 'numerical' ? 'Correct answer...' : 'Sample answer...'}
                                      className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                                    />
                                  </div>
                                )}

                                {/* Per sub-sub-question rubric for nested multi-part */}
                                {subq.rubricType === 'per-subquestion' && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-blue-300 mb-1">
                                      Rubric for Part {subIndex + 1}.{subSubIndex + 1}
                                    </label>
                                    <input
                                      type="text"
                                      value={subSubq.rubric || ''}
                                      onChange={(e) => {
                                        const newSubSubquestions = [...(subq.subquestions || [])];
                                        newSubSubquestions[subSubIndex] = { ...newSubSubquestions[subSubIndex], rubric: e.target.value };
                                        handleSubquestionChange(subIndex, 'subquestions', newSubSubquestions);
                                      }}
                                      placeholder={`Enter grading criteria for part ${subIndex + 1}.${subSubIndex + 1}...`}
                                      className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!question.subquestions || question.subquestions.length === 0) && (
                  <div className="text-center py-6 text-gray-400">
                    <Layers size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sub-questions yet. Click "Add Part" to create parts.</p>
                  </div>
                )}
              </div>
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
              value={question.type === 'multi-part' 
                ? (question.subquestions || []).reduce((sum, subq) => {
                    if (subq.type === 'multi-part') {
                      // Handle nested multi-part questions - sum their sub-questions
                      const nestedPoints = (subq.subquestions || []).reduce((nestedSum, nestedSubq) => {
                        return nestedSum + (nestedSubq.points || 1);
                      }, 0);
                      return sum + nestedPoints;
                    }
                    return sum + (subq.points || 1);
                  }, 0)
                : question.points
              }
              onChange={(e) => handlePointsChange(e.target.value)}
              min="1"
              max="100"
              disabled={question.type === 'multi-part'}
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-400 text-sm">pts</span>
          </div>
          {question.type === 'multi-part' && (
            <span className="text-xs text-gray-500">(auto-calculated)</span>
          )}
          
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
          
          {/* Rubric Section - Only show for non-multi-part questions */}
          {question.type !== 'multi-part' && (
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
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;

