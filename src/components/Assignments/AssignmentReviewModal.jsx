import { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { assignmentApi } from './assignmentApi';

const AssignmentReviewModal = ({ assignmentId, isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen || !assignmentId) return;
    let cancelled = false;
    setError(null);
    setSubmitted(false);
    setRating(0);
    setHoverRating(0);
    setComment('');
    setLoading(true);
    assignmentApi
      .getAssignmentReview(assignmentId)
      .then((existing) => {
        if (cancelled || !existing) return;
        setRating(existing.rating || 0);
        setComment(existing.comment || '');
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load existing review:', err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, assignmentId]);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      await assignmentApi.submitAssignmentReview(assignmentId, {
        rating,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err?.response?.data?.detail || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1f38] rounded-xl border border-[#182842] w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#182842]">
          <h3 className="text-lg font-semibold text-white">Review this assignment</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate-400">
            How was the AI-generated output? Your feedback helps improve future generations.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              Loading…
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                <div className="flex items-center space-x-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= displayRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={28}
                          className={filled ? 'text-yellow-400' : 'text-slate-500'}
                          fill={filled ? 'currentColor' : 'none'}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-3 text-sm text-slate-400">
                    {displayRating > 0 ? `${displayRating} / 5` : 'Tap to rate'}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Comments <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="What worked well? What could be better?"
                  className="w-full px-4 py-3 bg-white/5 border border-[#1a2943] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {submitted && (
                <div className="text-sm text-green-400 bg-green-900/20 border border-green-900/50 rounded-lg px-3 py-2">
                  Thanks for your feedback!
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-[#182842]">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-white/[0.08] hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || submitting || rating < 1}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Submitting…
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentReviewModal;
