// src/components/Assignments/DoAssignmentModal.jsx
import { useState, useEffect } from 'react';
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

const DoAssignmentModal = ({ assignment, onClose, onAssignmentUpdate }) => {
  const [answers, setAnswers] = useState({});
  const [submissionMethod, setSubmissionMethod] = useState('in-app'); // 'in-app' or 'pdf'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  // Extract the actual assignment data from the shared assignment
  const actualAssignment = assignment.assignment || assignment;
  
  // Use actual assignment questions or fallback to mock data for development
  const questions = actualAssignment.questions && actualAssignment.questions.length > 0 
    ? actualAssignment.questions 
    : [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'What is the primary consideration when designing a digital filter?',
      options: ['Frequency response', 'Power consumption', 'Cost', 'All of the above'],
      points: 2
    },
    {
      id: 2,
      type: 'code-writing',
      question: 'Write a Python function to implement the Fast Fourier Transform (FFT) algorithm.',
      codeLanguage: 'python',
      outputType: 'function',
      points: 10
    },
    {
      id: 3,
      type: 'diagram-analysis',
      question: 'Analyze the given circuit diagram and calculate the total impedance.',
      analysisType: 'calculation',
      diagram: { file: 'circuit_diagram.png', url: '/mock-circuit.png' },
      points: 8
    },
    {
      id: 4,
      type: 'multi-part',
      question: 'Design and analyze a control system for temperature regulation in a smart building.',
      hasMainCode: true,
      mainCodeLanguage: 'matlab',
      mainCode: '% Transfer function for temperature control system\n% Plant model: G(s) = K / (tau*s + 1)\ns = tf(\'s\');\nK = 2.5;  % System gain\ntau = 300; % Time constant (seconds)\nG_plant = K / (tau*s + 1);\n\n% Display plant characteristics\nfprintf(\'Plant DC Gain: %.2f\\n\', K);\nfprintf(\'Plant Time Constant: %.0f seconds\\n\', tau);',
      hasMainDiagram: true,
      mainDiagram: { file: 'control_system_block_diagram.png', url: '/mock-control-diagram.png' },
      subquestions: [
        { 
          id: 1, 
          question: 'Part A: Based on the given plant model, what is the steady-state response to a unit step input?', 
          points: 4, 
          type: 'multiple-choice',
          options: ['2.5', '1.0', '0.5', 'Depends on time constant'],
          hasSubCode: false,
          hasSubDiagram: false
        },
        { 
          id: 2, 
          question: 'Part B: Implement a PID controller for the system', 
          points: 6, 
          type: 'code-writing', 
          codeLanguage: 'matlab',
          hasSubCode: true,
          subCode: '% Starter code for PID controller\n% Tune the PID parameters\nKp = 0; % Proportional gain\nKi = 0; % Integral gain\nKd = 0; % Derivative gain',
          hasSubDiagram: false
        },
        { 
          id: 3, 
          question: 'Part C: Analyze the closed-loop system stability', 
          points: 5, 
          type: 'diagram-analysis',
          hasSubCode: false,
          hasSubDiagram: true,
          subDiagram: { file: 'root_locus_plot.png', url: '/mock-root-locus.png' }
        },
        {
          id: 4,
          question: 'Part D: System Performance Analysis',
          points: 8,
          type: 'multi-part',
          subquestions: [
            { id: 1, question: 'Calculate the settling time for 2% criteria', points: 3, type: 'numerical' },
            { id: 2, question: 'True or False: The system is overdamped', points: 2, type: 'true-false' },
            { id: 3, question: 'Fill in the blank: The damping ratio is ___', points: 3, type: 'fill-blank' }
          ]
        }
      ],
      points: 23
    },
    {
      id: 5,
      type: 'multi-part',
      question: 'Digital Signal Processing: Design and implement a digital filter for audio processing.',
      hasMainCode: true,
      mainCodeLanguage: 'python',
      mainCode: 'import numpy as np\nimport matplotlib.pyplot as plt\nfrom scipy import signal\n\n# Sample audio signal parameters\nfs = 44100  # Sampling frequency (Hz)\nt = np.linspace(0, 1, fs, endpoint=False)\n\n# Create a test signal with noise\nf_signal = 1000  # Signal frequency (Hz)\nf_noise = 8000   # Noise frequency (Hz)\ntest_signal = np.sin(2*np.pi*f_signal*t) + 0.3*np.sin(2*np.pi*f_noise*t)',
      hasMainDiagram: true,
      mainDiagram: { file: 'frequency_spectrum.png', url: '/mock-spectrum.png' },
      subquestions: [
        {
          id: 1,
          question: 'Part A: Filter Design Theory',
          points: 12,
          type: 'multi-part',
          subquestions: [
            { id: 1, question: 'What type of filter is most appropriate for removing high-frequency noise?', points: 3, type: 'multiple-choice', options: ['Low-pass', 'High-pass', 'Band-pass', 'Band-stop'] },
            { id: 2, question: 'Calculate the Nyquist frequency for the given sampling rate', points: 4, type: 'numerical' },
            { id: 3, question: 'The cutoff frequency should be set to ___ Hz to preserve the signal', points: 5, type: 'fill-blank' }
          ]
        },
        {
          id: 2,
          question: 'Part B: Implement the digital filter using Python',
          points: 10,
          type: 'code-writing',
          codeLanguage: 'python',
          hasSubCode: true,
          subCode: '# Design a Butterworth low-pass filter\n# Your task: Complete the filter design and application\n\nfrom scipy.signal import butter, filtfilt\n\ndef design_lowpass_filter(cutoff, fs, order=5):\n    # TODO: Implement filter design\n    pass\n\ndef apply_filter(data, cutoff, fs):\n    # TODO: Apply filter to data\n    pass',
          hasSubDiagram: false
        }
      ],
      points: 22
    }
  ];

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
        if (submission.status === 'submitted') {
          setIsAlreadySubmitted(true);
        }
      }
    } catch (error) {
      // No existing submission - this is fine for new assignments
      console.log('No existing submission found');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const submissionData = {
        answers,
        submission_method: submissionMethod,
        time_spent: "0" // Could track actual time spent
      };

      await assignmentApi.submitAssignment(actualAssignment.id, submissionData);
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
            <p className="text-gray-300 text-lg">{question.question}</p>
            <div className="space-y-3">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionIndex}
                    checked={currentAnswer === optionIndex.toString()}
                    onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
                    disabled={isAlreadySubmitted}
                    className={`text-teal-500 focus:ring-teal-500 ${isAlreadySubmitted ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                  <span className="text-white">{option}</span>
                </label>
              ))}
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
            <p className="text-gray-300 text-lg">{question.question}</p>
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
            <p className="text-gray-300 text-lg">{question.question}</p>
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
            <p className="text-gray-300 text-lg">{question.question}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted answer" : "Enter your answer here..."}
              rows={4}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
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
            <p className="text-gray-300 text-lg">{question.question}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted answer" : "Enter your detailed answer here..."}
              rows={8}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        );

      case 'code-writing':
        return (
          <div key={question.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1}</h3>
              <span className="text-purple-400 text-sm font-medium">{question.points} points</span>
            </div>
            <p className="text-gray-300 text-lg">{question.question}</p>
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
            
            {question.diagram && (
              <div className="bg-gray-800 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-orange-400 text-sm font-medium">Circuit Diagram</span>
                  <span className="text-gray-400 text-sm">
                    Analysis Type: {question.analysisType?.replace('-', ' ') || 'General'}
                  </span>
                </div>
                <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-700">
                  <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                    <div className="text-center">
                      <ImageIcon size={32} className="text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Circuit Diagram</p>
                      <p className="text-gray-500 text-xs">{question.diagram.file}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <textarea
              value={currentAnswer}
              onChange={(e) => !isAlreadySubmitted && handleAnswerChange(question.id, e.target.value)}
              placeholder={isAlreadySubmitted ? "Submitted analysis" : "Enter your analysis here..."}
              rows={8}
              readOnly={isAlreadySubmitted}
              className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                isAlreadySubmitted ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        );


      case 'multi-part':
        return (
          <div key={question.id} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Question {index + 1} - Multi-Part</h3>
              <span className="text-blue-400 text-sm font-medium">{question.points} points total</span>
            </div>
            <p className="text-gray-300 text-lg">{question.question}</p>
            
            {/* Main Question Code */}
            {question.hasMainCode && question.mainCode && (
              <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-purple-400 text-sm font-medium">
                    Main Code ({question.mainCodeLanguage?.toUpperCase() || 'CODE'})
                  </span>
                </div>
                <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto font-mono border border-gray-700">
                  <code>{question.mainCode}</code>
                </pre>
              </div>
            )}
            
            {/* Main Question Diagram */}
            {question.hasMainDiagram && question.mainDiagram && (
              <div className="bg-gray-800 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-orange-400 text-sm font-medium">Main Diagram</span>
                </div>
                <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-700">
                  <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                    <div className="text-center">
                      <ImageIcon size={32} className="text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">System Diagram</p>
                      <p className="text-gray-500 text-xs">{question.mainDiagram.file}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {(question.subquestions || []).map((subq, subIndex) => (
                <div key={subq.id} className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-blue-300 font-medium">{subq.question}</h4>
                    <div className="flex items-center space-x-2">
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
                  {subq.hasSubCode && subq.subCode && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-purple-500/30 mb-3">
                      <div className="text-purple-400 text-xs font-medium mb-2">
                        Starter Code ({subq.codeLanguage?.toUpperCase() || 'CODE'})
                      </div>
                      <pre className="bg-gray-800 rounded p-2 text-xs text-gray-300 overflow-x-auto font-mono">
                        <code>{subq.subCode}</code>
                      </pre>
                    </div>
                  )}
                  
                  {/* Sub-question Diagram */}
                  {subq.hasSubDiagram && subq.subDiagram && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-orange-500/30 mb-3">
                      <div className="text-orange-400 text-xs font-medium mb-2">Diagram</div>
                      <div className="w-full h-32 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                        <div className="text-center">
                          <ImageIcon size={20} className="text-gray-500 mx-auto mb-1" />
                          <p className="text-gray-400 text-xs">{subq.subDiagram.file}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Render different sub-question types */}
                  {subq.type === 'multiple-choice' ? (
                    <div className="space-y-2">
                      {(subq.options || []).map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`subq-${question.id}-${subq.id}`}
                            value={optionIndex}
                            checked={(currentAnswer?.subAnswers || {})[subq.id] === optionIndex.toString()}
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
                            className="text-teal-500 focus:ring-teal-500"
                          />
                          <span className="text-white text-sm">{option}</span>
                        </label>
                      ))}
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
                      type="number"
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
                  ) : subq.type === 'diagram-analysis' ? (
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
                      placeholder="Enter your diagram analysis..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                    />
                  ) : subq.type === 'multi-part' ? (
                    <div className="space-y-3 ml-4 border-l-2 border-blue-400/30 pl-4">
                      {(subq.subquestions || []).map((subSubq, subSubIndex) => (
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
                              {(subSubq.options || []).map((option, optionIndex) => (
                                <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`subsubq-${question.id}-${subq.id}-${subSubq.id}`}
                                    value={optionIndex}
                                    checked={(currentAnswer?.subAnswers?.[subq.id]?.subAnswers || {})[subSubq.id] === optionIndex.toString()}
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
                                    className="text-teal-500 focus:ring-teal-500"
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
                              type="number"
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
                      ))}
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
              ))}
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
                  disabled={isAlreadySubmitted}
                  className={`px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isAlreadySubmitted ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="in-app">Answer In-App</option>
                  <option value="pdf">Upload PDF</option>
                </select>
              </div>
              <div className="text-sm text-gray-400">
                {isAlreadySubmitted ? (
                  <span className="text-green-400 font-medium">✓ Assignment submitted - viewing submission</span>
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
                disabled={isSubmitting || isAlreadySubmitted}
                className={`px-6 py-2 font-medium rounded-lg transition-all duration-300 ${
                  isSubmitting || isAlreadySubmitted
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                }`}
              >
                {isSubmitting ? (
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

