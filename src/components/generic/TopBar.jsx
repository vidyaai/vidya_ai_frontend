// src/components/generic/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Menu, X, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from './utils';

const TopBar = ({ onNavigateToHome }) => {
  const { currentUser, logout, isEmbed } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isNavigatingHome) return;
    onNavigateToHome?.();
  }, [isNavigatingHome]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSubscription = async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/payments/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    }
  };

  useEffect(() => {
    if (currentUser && !isEmbed) fetchSubscription();
  }, [currentUser, isEmbed]);

  useEffect(() => {
    if (isUserDropdownOpen && currentUser && !isEmbed) fetchSubscription();
  }, [isUserDropdownOpen, currentUser, isEmbed]);

  // Embed pages render entirely without Vidya's top nav / account chrome.
  if (isEmbed) return null;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (response.ok) {
        await fetchSubscription();
        setShowCancelModal(false);
        alert('✅ Subscription cancelled successfully!\n\nYour subscription will remain active until the end of your current billing period.');
      } else {
        alert('❌ Failed to cancel subscription. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('❌ Failed to cancel subscription. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSubscription = () => {
    window.location.href = '/pricing';
  };

  const openDeleteAccountModal = () => {
    setDeleteConfirmText('');
    setDeleteError('');
    setShowDeleteAccountModal(true);
    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (response.ok) {
        setShowDeleteAccountModal(false);
        await logout();
        window.location.href = '/login';
      } else {
        const data = await response.json().catch(() => ({}));
        setDeleteError(data.detail || 'Failed to delete account. Please try again.');
      }
    } catch {
      setDeleteError('Failed to delete account. Please check your connection and try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const avatarContent = currentUser?.photoURL ? (
    <img
      src={currentUser.photoURL}
      alt="Profile"
      className="w-full h-full rounded-full object-cover"
      onError={(e) => { e.target.style.display = 'none'; }}
      referrerPolicy="no-referrer"
    />
  ) : (
    <User className="text-[#43ead6]" />
  );

  return (
    <header className="relative z-50 bg-[#071224]/90 backdrop-blur-md border-b border-[#12213a]">
      {isNavigatingHome && (
        <div className="fixed inset-0 z-50 bg-[#071224] flex items-center justify-center">
          <svg className="animate-spin" width="80" height="80" viewBox="0 0 80 80">
            <defs>
              <mask id="crescent-mask-topbar">
                <circle cx="40" cy="40" r="36" fill="white" />
                <circle cx="43" cy="40" r="37" fill="black" />
              </mask>
            </defs>
            <circle cx="40" cy="40" r="36" fill="#43ead6" mask="url(#crescent-mask-topbar)" />
          </svg>
        </div>
      )}

      <div className="mx-auto max-w-full px-5 sm:px-6">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">

          {/* Logo */}
          <button
            onClick={() => onNavigateToHome && setIsNavigatingHome(true)}
            className="flex items-center gap-2 transition hover:opacity-90 focus:outline-none"
            aria-label="Go to Home Page"
          >
            <img
              src="/images/vidya-ai-logo-1.png"
              alt="VidyaAI Logo"
              className="h-8 w-auto"
            />
          </button>

          {/* Desktop user menu */}
          <div className="hidden md:flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-3 rounded-full border border-[#1a2943] bg-white/5 px-4 py-2 transition hover:bg-white/10 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#43ead6]/15 flex items-center justify-center overflow-hidden">
                {avatarContent}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-white font-medium text-sm truncate leading-tight">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-slate-400 text-xs truncate leading-tight">
                  {subscription?.plan_name || 'Free Plan'}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute right-4 top-[4.5rem] w-80 bg-[#0d1f38] border border-[#182842] rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* User info header */}
                <div className="p-4 border-b border-[#182842] flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#43ead6]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={22} className="text-[#43ead6]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{currentUser?.displayName || 'User'}</p>
                    <p className="text-slate-400 text-xs truncate">{currentUser?.email}</p>
                  </div>
                </div>

                <div className="p-2">
                  {/* Subscription status */}
                  <div className="px-3 py-2.5 mb-2 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {subscription?.plan_name || 'Free Plan'}
                        </p>
                        {subscription && subscription.plan_name !== 'Free' && (
                          <>
                            <p className="text-xs text-slate-400 capitalize">
                              {subscription.cancel_at_period_end ? 'Cancelled' : subscription.status} · {subscription.billing_period}
                            </p>
                            {subscription.current_period_end && (
                              <p className="text-xs text-slate-400">
                                {subscription.cancel_at_period_end
                                  ? `Active until: ${new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                  : `Renews: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                        subscription?.cancel_at_period_end
                          ? 'bg-orange-500/20 text-orange-300'
                          : subscription?.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : subscription?.status
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-white/10 text-slate-300'
                      }`}>
                        {subscription?.cancel_at_period_end ? 'cancelling' : subscription?.status || 'free'}
                      </span>
                    </div>
                    {subscription?.cancel_at_period_end && subscription.current_period_end && (
                      <div className="mt-2 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-300">
                        ⚠️ Plan active until {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-0.5">
                    <button
                      onClick={handleChangeSubscription}
                      className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                    >
                      <RefreshCw size={15} className="mr-3 text-slate-400" />
                      Change Subscription
                    </button>

                    {subscription && subscription.plan_name !== 'Free' && subscription.status === 'active' && !subscription.cancel_at_period_end && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={loading}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={15} className="mr-3" />
                        Cancel Subscription
                      </button>
                    )}

                    <button
                      onClick={openDeleteAccountModal}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} className="mr-3" />
                      Delete Account
                    </button>

                    <div className="border-t border-[#182842] my-1" />

                    <button
                      onClick={() => { handleLogout(); setIsUserDropdownOpen(false); }}
                      className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                    >
                      <LogOut size={15} className="mr-3 text-slate-400" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden rounded-full border border-[#1a2943] bg-white/5 p-2 text-white transition hover:bg-white/10"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#12213a] py-4 space-y-3">
            {/* User info */}
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
              <div className="w-11 h-11 rounded-full bg-[#43ead6]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={22} className="text-[#43ead6]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-sm truncate">{currentUser?.displayName || 'User'}</p>
                <p className="text-slate-400 text-sm truncate">{currentUser?.email}</p>
              </div>
            </div>

            {/* Mobile subscription */}
            {subscription && (
              <div className="rounded-xl bg-white/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{subscription.plan_name || 'Current Plan'}</p>
                    <p className="text-slate-400 text-xs capitalize">
                      {subscription.status} · {subscription.billing_period}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    subscription.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                <button
                  onClick={handleChangeSubscription}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={15} className="mr-3" />
                  Change Subscription
                </button>
                {subscription?.status === 'active' && !subscription?.cancel_at_period_end && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={loading}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle size={15} className="mr-3" />
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}

            <button
              onClick={openDeleteAccountModal}
              className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
            >
              <Trash2 size={18} className="mr-3" />
              Delete Account
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium"
            >
              <LogOut size={18} className="mr-3" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1f38] border border-[#182842] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Cancel plan</h2>
            <p className="text-slate-300 text-sm mb-6">
              Cancel to stop recurring billing. You can still use {subscription?.plan_name || 'Vidya AI Plus'} until{' '}
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'the end of your billing period'}.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Go back
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelling…' : 'Cancel plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1f38] border border-[#182842] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4 gap-3">
              <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Delete Account</h2>
            </div>

            <p className="text-slate-300 text-sm mb-3">
              This will <strong className="text-white">permanently delete</strong> your account and all associated data including videos, assignments, courses, and summaries. This action cannot be undone.
            </p>

            {subscription && subscription.plan_name !== 'Free' && subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-300">
                You have an active <strong>{subscription.plan_name}</strong> subscription. It will be cancelled immediately upon deletion.
              </div>
            )}

            <p className="text-slate-300 text-sm mb-2">
              Type <strong className="font-mono text-red-400">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full bg-[#071224] text-white placeholder-slate-500 border border-[#182842] rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              autoComplete="off"
            />

            {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;
