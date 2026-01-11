"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Upload
} from 'lucide-react';
import { api } from '../../components/generic/utils.jsx';

export default function CanvasAssignmentGenerator() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const courseName = searchParams.get('course_name');
  const courseId = searchParams.get('course_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canvasFiles, setCanvasFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);
  const [isSubmittingToCanvas, setIsSubmittingToCanvas] = useState(false);

  // Assignment generation options
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalPoints, setTotalPoints] = useState(100);
  const [questionTypes, setQuestionTypes] = useState({
    'multiple-choice': true,
    'short-answer': true,
    'true-false': false,
    'numerical': false,
    'multi-part': false
  });

  // Note: Canvas Access Token should be obtained via OAuth flow
  // For now, this is a placeholder - you'll need to implement OAuth
  const [canvasAccessToken, setCanvasAccessToken] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetchCanvasFiles();
    }
  }, [sessionId]);

  const fetchCanvasFiles = async () => {
    try {
      setLoading(true);
      
      // In production, you'd need to implement OAuth flow to get Canvas token
      // For now, we'll use a placeholder
      const token = prompt('Please enter your Canvas access token (for testing):');
      setCanvasAccessToken(token);
      
      const response = await api.get(`/lti/api/canvas/files`, {
        params: {
          session_id: sessionId,
          canvas_access_token: token
        }
      });

      setCanvasFiles(response.data.files || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Canvas files:', err);
      setError('Failed to fetch lecture notes from Canvas. Please try again.');
      setLoading(false);
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleQuestionType = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleGenerateAssignment = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one lecture note file');
      return;
    }

    if (!assignmentTitle) {
      alert('Please enter an assignment title');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Download selected files from Canvas
      const downloadedFiles = await Promise.all(
        selectedFiles.map(async (fileId) => {
          const file = canvasFiles.find(f => f.id === fileId);
          const response = await api.post('/lti/api/canvas/download-file', {
            session_id: sessionId,
            file_id: fileId,
            canvas_access_token: canvasAccessToken
          });
          return {
            ...file,
            s3_key: response.data.s3_key,
            presigned_url: response.data.presigned_url
          };
        })
      );

      // Generate assignment using the existing API
      const generationOptions = {
        numQuestions,
        totalPoints,
        difficultyLevel: 'mixed',
        perQuestionDifficulty: false,
        engineeringLevel: 'undergraduate',
        engineeringDiscipline: 'general',
        questionTypes: questionTypes,
        includeRubric: true,
        includeSolutions: true,
        includePointDistribution: true,
        requireWorkShown: true,
        allowPartialCredit: true
      };

      const generateResponse = await api.post('/api/assignments/generate', {
        title: assignmentTitle,
        description: assignmentDescription,
        generation_options: generationOptions,
        linked_videos: [],
        uploaded_files: downloadedFiles.map(f => ({
          file_name: f.name,
          file_type: f.content_type,
          s3_key: f.s3_key
        })),
        generation_prompt: `Generate assignment from Canvas lecture notes: ${selectedFiles.map(id => {
          const file = canvasFiles.find(f => f.id === id);
          return file?.name;
        }).join(', ')}`
      });

      setGeneratedAssignment(generateResponse.data);
      setIsGenerating(false);
    } catch (err) {
      console.error('Error generating assignment:', err);
      setError(err.response?.data?.detail || 'Failed to generate assignment');
      setIsGenerating(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (!generatedAssignment) return;

    setIsSubmittingToCanvas(true);
    setError(null);

    try {
      const response = await api.post('/lti/deeplink/response', {
        session_id: sessionId,
        assignment_id: generatedAssignment.id
      });

      // The response will be HTML with an auto-submit form
      // We need to render it and let it submit
      const htmlContent = response.data;
      document.body.innerHTML = htmlContent;
      
      // The form should auto-submit via JavaScript in the HTML
    } catch (err) {
      console.error('Error adding to Canvas:', err);
      setError('Failed to add assignment to Canvas');
      setIsSubmittingToCanvas(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading Canvas lecture notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🎓 Vidya AI Assignment Generator</h1>
              <p className="text-blue-100">Course: {courseName}</p>
            </div>
            <Sparkles className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!generatedAssignment ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: File Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Select Lecture Notes
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm">
                Choose the PDF lecture notes you want to generate questions from
              </p>

              {canvasFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No PDF files found in this course.</p>
                  <p className="text-sm mt-2">Upload lecture notes to Canvas first.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {canvasFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedFiles.includes(file.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className={`w-5 h-5 ${selectedFiles.includes(file.id) ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        {selectedFiles.includes(file.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Assignment Configuration */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Assignment Settings
              </h2>

              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g., Midterm Exam - Data Structures"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  placeholder="Describe the assignment purpose..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Number Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question Types
                </label>
                <div className="space-y-2">
                  {Object.entries(questionTypes).map(([type, enabled]) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleQuestionType(type)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {type.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAssignment}
                disabled={isGenerating || selectedFiles.length === 0 || !assignmentTitle}
                className={`
                  w-full py-3 px-6 rounded-xl font-semibold text-white
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${isGenerating || selectedFiles.length === 0 || !assignmentTitle
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Assignment...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Assignment Preview */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {generatedAssignment.title}
                  </h2>
                  <p className="text-gray-600">{generatedAssignment.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Points</p>
                  <p className="text-3xl font-bold text-blue-600">{generatedAssignment.total_points}</p>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm text-gray-600">
                <span>📝 {generatedAssignment.total_questions} Questions</span>
                <span>•</span>
                <span>⏱️ Estimated: {Math.ceil(generatedAssignment.total_questions * 3)} minutes</span>
              </div>
            </div>

            {/* Questions Preview */}
            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
              {generatedAssignment.questions?.map((question, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">Question {idx + 1}</span>
                    <span className="text-sm text-blue-600 font-medium">{question.points} pts</span>
                  </div>
                  <p className="text-gray-700 mb-2">{question.question}</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {question.type}
                  </span>
                  {question.rubric && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Grading Rubric:</p>
                      <p className="text-sm text-gray-700">{question.rubric}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setGeneratedAssignment(null)}
                className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                Regenerate
              </button>
              <button
                onClick={handleAddToCanvas}
                disabled={isSubmittingToCanvas}
                className={`
                  flex-1 py-3 px-6 rounded-xl font-semibold text-white
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${isSubmittingToCanvas
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg'
                  }
                `}
              >
                {isSubmittingToCanvas ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding to Canvas...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Add to Canvas Course
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
