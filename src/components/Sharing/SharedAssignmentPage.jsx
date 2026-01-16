import { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, User, LogIn, ArrowRight, Loader, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../generic/utils';

const SharedAssignmentPage = ({ sharedData }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const claimAttempted = useRef(false);

  const assignment = sharedData.assignment;
  const isPublic = sharedData.is_public !== false; // Default to public if not specified

  // Auto-claim the assignment when a logged-in user views a public assignment
  useEffect(() => {
    const claimAssignment = async () => {
      // Only attempt once
      if (claimAttempted.current) return;
      if (!currentUser || !isPublic) return;
      
      // Don't claim if user is the owner
      if (sharedData.owner_id === currentUser.uid) {
        claimAttempted.current = true;
        return;
      }
      
      claimAttempted.current = true;
      setClaiming(true);
      setClaimError(null);
      try {
        await api.post(`/api/sharing/claim/${sharedData.share_token}`, {}, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        setClaimed(true);
      } catch (err) {
        console.error('Error claiming assignment:', err);
        // Don't show error if already claimed or owner tried to claim
        if (err.response?.status === 400) {
          // Already have access or is owner - treat as success
          setClaimed(true);
        } else {
          setClaimError(err.response?.data?.detail || 'Failed to add assignment. Please try again.');
        }
      } finally {
        setClaiming(false);
      }
    };

    claimAssignment();
  }, [currentUser, isPublic, sharedData.share_token, sharedData.owner_id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewAssignment = () => {
    setRedirecting(true);
    // Navigate to assignments page with assigned-to-me view
    window.location.href = '/assignments?view=assigned-to-me';
  };

  const handleLogin = () => {
    // Store the current shared page URL to return after login
    const currentPath = window.location.pathname;
    window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Assignment Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <FileText size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {assignment?.title || sharedData.title || 'Shared Assignment'}
            </h2>
            {sharedData.owner_display_name && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <User size={14} />
                <span>Shared by {sharedData.owner_display_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="p-6 space-y-6">
        {/* Description */}
        {(assignment?.description || sharedData.description) && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed">
              {assignment?.description || sharedData.description}
            </p>
          </div>
        )}

        {/* Assignment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Due Date */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Calendar size={16} />
              <span className="text-sm font-medium">Due Date</span>
            </div>
            <p className="text-white">
              {assignment?.due_date ? formatDate(assignment.due_date) : 'No due date set'}
            </p>
          </div>

          {/* Question Count */}
          {assignment?.total_questions && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <FileText size={16} />
                <span className="text-sm font-medium">Questions</span>
              </div>
              <p className="text-white">
                {assignment.total_questions} Question{assignment.total_questions !== 1 ? 's' : ''}
                {assignment.total_points && ` • ${assignment.total_points} Points`}
              </p>
            </div>
          )}
        </div>

        {/* Claim Status (for public assignments - not shown to owners) */}
        {currentUser && isPublic && sharedData.owner_id !== currentUser.uid && (claiming || claimed || claimError) && (
          <div className={`rounded-lg p-3 border ${claimed ? 'bg-green-900/30 border-green-700' : claiming ? 'bg-blue-900/30 border-blue-700' : 'bg-red-900/30 border-red-700'}`}>
            {claiming ? (
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Loader size={16} className="animate-spin" />
                <span>Adding to your assignments...</span>
              </div>
            ) : claimed ? (
              <div className="flex items-center gap-2 text-green-300 text-sm">
                <Check size={16} />
                <span>This assignment has been added to your "Assigned to Me" list</span>
              </div>
            ) : claimError ? (
              <div className="text-red-300 text-sm">{claimError}</div>
            ) : null}
          </div>
        )}

        {/* Action Section */}
        <div className="pt-4 border-t border-gray-700">
          {currentUser ? (
            // Logged in - Show View Assignment button
            <div className="text-center">
              <button
                onClick={handleViewAssignment}
                disabled={redirecting || claiming}
                className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white font-medium rounded-lg transition-colors"
              >
                {redirecting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  <>
                    <span>View Assignment</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <p className="text-gray-400 text-sm mt-3">
                View and submit your responses to this assignment
              </p>
            </div>
          ) : (
            // Not logged in - Show login prompt
            <div className="text-center bg-gray-800 rounded-lg p-6 border border-gray-700">
              <LogIn size={32} className="text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">
                Login Required
              </h3>
              <p className="text-gray-400 mb-4">
                Please log in to view and submit this assignment
              </p>
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <LogIn size={18} />
                <span>Log In to Continue</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedAssignmentPage;
