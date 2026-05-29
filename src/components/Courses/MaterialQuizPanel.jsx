// src/components/Courses/MaterialQuizPanel.jsx
// Functional clone of components/Chat/QuizPanel.jsx, retargeted at
// POST /api/material-chat/quiz with material_id. Same UX: progress bar,
// one question at a time, answer-then-next, score + correct-answer reveal.
// Restyled lightly to match the teal accent of the course context (gallery
// chat uses emerald).
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CorrectAnswers from '../Chat/CorrectAnswers';
import { api } from '../generic/utils.jsx';

const MaterialQuizPanel = ({ isOpen, materialId, onClose }) => {
  const [isFetchingQuiz, setIsFetchingQuiz] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !materialId) return;
    let cancelled = false;

    (async () => {
      setIsFetchingQuiz(true);
      setErrorMessage(null);
      setQuizData([]);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setQuizComplete(false);
      setQuizScore(0);
      setShowCorrectAnswers(false);

      try {
        const resp = await api.post(
          '/api/material-chat/quiz',
          { material_id: materialId, num_questions: 5, difficulty: 'medium', include_explanations: true },
          { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } }
        );
        if (cancelled) return;
        const questions = Array.isArray(resp.data?.quiz) ? resp.data.quiz : [];
        if (questions.length === 0) throw new Error('No quiz questions returned.');
        setQuizData(questions);
      } catch (err) {
        if (cancelled) return;
        const detail = err?.response?.data?.detail || err?.message || 'Failed to load quiz';
        setErrorMessage(detail);
      } finally {
        if (!cancelled) setIsFetchingQuiz(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, materialId]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen, currentQuestionIndex]);

  if (!isOpen) return null;

  const currentQuestion = quizData[currentQuestionIndex];

  const selectAnswer = (option) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const nextQuestion = () => {
    if (!currentQuestion) return;
    if (!userAnswers[currentQuestion.id]) return;
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return;
    }
    let score = 0;
    for (const q of quizData) {
      if (userAnswers[q.id] === q.answer) score += 1;
    }
    setQuizScore(score);
    setQuizComplete(true);
  };

  const restart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizComplete(false);
    setQuizScore(0);
    setShowCorrectAnswers(false);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
      {isFetchingQuiz ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="text-teal-400 animate-spin mr-3" />
          <span className="text-gray-300 text-sm">Building your quiz…</span>
        </div>
      ) : errorMessage ? (
        <div className="text-center py-12 px-4">
          <p className="text-sm text-red-300 mb-4">{errorMessage}</p>
          <button
            onClick={onClose}
            className="text-xs text-teal-300 hover:underline"
          >
            Back to chat
          </button>
        </div>
      ) : quizData.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No quiz available for this material.</div>
      ) : !quizComplete ? (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-white text-sm font-semibold">
              Question {currentQuestionIndex + 1} of {quizData.length}
            </h4>
            {currentQuestion?.difficulty && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize">
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          <div className="text-white text-sm leading-relaxed">
            {currentQuestion?.question}
          </div>

          <div className="space-y-2">
            {currentQuestion?.options?.map((opt, i) => {
              const checked = userAnswers[currentQuestion.id] === opt;
              return (
                <label
                  key={i}
                  className={`flex items-start p-3 rounded-lg cursor-pointer border transition-colors ${
                    checked
                      ? 'border-teal-500/70 bg-teal-600/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    className="mt-1 mr-3 accent-teal-500"
                    checked={checked}
                    onChange={() => selectAnswer(opt)}
                  />
                  <span className="text-sm text-gray-200 leading-relaxed">{opt}</span>
                </label>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={restart}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-md transition-colors"
            >
              Restart
            </button>
            <button
              onClick={nextQuestion}
              disabled={!userAnswers[currentQuestion?.id]}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors"
            >
              {currentQuestionIndex === quizData.length - 1 ? 'Submit Quiz' : 'Next Question'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="text-3xl mb-3">
              {quizScore === quizData.length
                ? '🎉'
                : quizScore >= quizData.length * 0.7
                ? '👏'
                : '📚'}
            </div>
            <h4 className="text-white font-bold text-base mb-1">Quiz complete</h4>
            <div className="text-2xl font-bold text-teal-300 mb-2">
              {quizScore} / {quizData.length}
            </div>
            <div className="text-xs text-gray-400">
              {quizScore === quizData.length
                ? 'Perfect score!'
                : quizScore >= quizData.length * 0.7
                ? 'Great job — you understand the material well.'
                : 'Good effort — review the material and try again.'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-md transition-colors"
            >
              {showCorrectAnswers ? 'Hide Answers' : 'Show Correct Answers'}
            </button>
            <button
              onClick={restart}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              Retake Quiz
            </button>
          </div>

          {showCorrectAnswers && (
            <CorrectAnswers quiz={quizData} userAnswers={userAnswers} />
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialQuizPanel;
