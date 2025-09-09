// src/components/Assignments/AIAssignmentGenerator.jsx
import { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Video, 
  Sparkles,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AIAssignmentGenerator = ({ onBack, onNavigateToHome }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      type: file.type,
      name: file.name,
      size: file.size
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) {
      return <Video size={20} className="text-blue-400" />;
    } else if (type === 'application/pdf') {
      return <FileText size={20} className="text-red-400" />;
    } else {
      return <FileText size={20} className="text-gray-400" />;
    }
  };

  const canGenerate = uploadedFiles.length > 0 || prompt.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    
    // Simulate AI generation process
    setTimeout(() => {
      const mockAssignment = {
        title: "AI Generated Assignment",
        description: "This assignment was generated using AI based on your uploaded content and prompt.",
        questions: [
          {
            id: 1,
            type: 'multiple-choice',
            question: 'What is the main topic discussed in the content?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: '0',
            points: 2
          },
          {
            id: 2,
            type: 'short-answer',
            question: 'Explain the key concepts mentioned in the content.',
            correctAnswer: 'Sample answer...',
            points: 5
          },
          {
            id: 3,
            type: 'true-false',
            question: 'The content discusses advanced topics.',
            correctAnswer: 'true',
            points: 1
          }
        ]
      };
      
      setGeneratedAssignment(mockAssignment);
      setIsGenerating(false);
    }, 3000);
  };

  const handleContinueToBuilder = () => {
    // TODO: Navigate to AssignmentBuilder with generated content
    console.log('Continuing to builder with:', generatedAssignment);
    onBack(); // For now, just go back
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
                <h1 className="text-3xl font-bold text-white">AI Assignment Generator</h1>
                <p className="text-gray-400 mt-2">Generate assignments from your content using AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedAssignment ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Upload Content</h2>
              <p className="text-gray-400 mb-6">
                Upload videos, PDFs, or provide a text prompt to generate your assignment. 
                You must provide at least one of these options.
              </p>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Files (Videos, PDFs)
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="video/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload size={48} className="text-gray-400 mb-4" />
                    <p className="text-white font-medium mb-2">Click to upload files</p>
                    <p className="text-gray-400 text-sm">Videos and PDFs supported</p>
                  </label>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-3">Uploaded Files</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-white text-sm font-medium">{file.name}</p>
                            <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or provide a text prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want your assignment to cover, or paste text content here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Generation Options */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Generation Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="15">15 Questions</option>
                    <option value="20">20 Questions</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={`inline-flex items-center px-8 py-4 font-bold rounded-xl transition-all duration-300 ${
                  canGenerate && !isGenerating
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 shadow-lg'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating Assignment...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="mr-2" />
                    Generate Assignment
                  </>
                )}
              </button>
              
              {!canGenerate && (
                <p className="text-orange-400 text-sm mt-3 flex items-center justify-center">
                  <AlertCircle size={16} className="mr-1" />
                  Please upload at least one file or provide a text prompt
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Generated Assignment Preview */
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle size={24} className="text-green-400" />
                <h2 className="text-xl font-bold text-white">Assignment Generated Successfully!</h2>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{generatedAssignment.title}</h3>
                <p className="text-gray-400 mb-4">{generatedAssignment.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-400">{generatedAssignment.questions.length}</p>
                    <p className="text-gray-400 text-sm">Questions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-400">
                      {generatedAssignment.questions.reduce((sum, q) => sum + q.points, 0)}
                    </p>
                    <p className="text-gray-400 text-sm">Total Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-teal-400">Mixed</p>
                    <p className="text-gray-400 text-sm">Question Types</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium">Generated Questions Preview:</h4>
                {generatedAssignment.questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Question {index + 1}</span>
                      <span className="text-teal-400 text-sm">{question.points} pts</span>
                    </div>
                    <p className="text-gray-300 text-sm">{question.question}</p>
                    <span className="text-gray-500 text-xs">
                      {question.type.replace('-', ' ')} question
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleContinueToBuilder}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Sparkles size={20} className="mr-2" />
                Continue to Assignment Builder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssignmentGenerator;

