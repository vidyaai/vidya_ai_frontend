// src/components/generic/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Menu, X, Settings, CreditCard, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from './utils';

const TopBar = ({ onNavigateToHome }) => {
  const { currentUser, logout } = useAuth();
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user subscription status
  const fetchSubscription = async () => {
    if (!currentUser) {
      console.log('No current user, skipping subscription fetch');
      return;
    }
    
    try {
      console.log('Fetching subscription for user:', currentUser.email);
      const token = await currentUser.getIdToken();
      console.log('Got Firebase token, making API call...');
      console.log('Firebase Token:', token);
      
      const response = await fetch(`${API_URL}/api/payments/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription data received:', data);
        console.log('Setting subscription to:', data.subscription);
        setSubscription(data.subscription);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch subscription:', response.status, errorText);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    }
  };

  // Fetch subscription when component mounts and when dropdown opens
  useEffect(() => {
    if (currentUser) {
      fetchSubscription();
    }
  }, [currentUser]);

  useEffect(() => {
    if (isUserDropdownOpen && currentUser) {
      fetchSubscription();
    }
  }, [isUserDropdownOpen, currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      console.log('Attempting to cancel subscription...');
      
      const response = await fetch(`${API_URL}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      console.log('Cancel subscription response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Cancel subscription result:', result);
        
        await fetchSubscription(); // Refresh subscription data
        setShowCancelModal(false);
        alert('✅ Subscription cancelled successfully!\n\nYour subscription will remain active until the end of your current billing period.');
      } else {
        const errorText = await response.text();
        console.error('Cancel subscription failed:', response.status, errorText);
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
    // Navigate to pricing page to change subscription
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

  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
      {isNavigatingHome && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin" width="80" height="80" viewBox="0 0 80 80">
              <defs>
                <mask id="crescent-mask-topbar">
                  <circle cx="40" cy="40" r="36" fill="white" />
                  <circle cx="43" cy="40" r="37" fill="black" />
                </mask>
              </defs>
              <circle cx="40" cy="40" r="36" fill="white" mask="url(#crescent-mask-topbar)" />
            </svg>
          </div>
        </div>
      )}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-6">
        <div className="flex justify-between items-center py-3">
          <button
            onClick={() => onNavigateToHome && setIsNavigatingHome(true)}
            className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg transition-all duration-200 hover:opacity-80"
            aria-label="Go to Home Page"
          >
            <img 
              src="/logo-new-2.png" 
              alt="VidyaAI Logo" 
              className="h-16 w-auto rounded-lg border-2 border-white"
            />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 h-16">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2 h-16 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {currentUser?.displayName || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {subscription?.plan_name || 'Free Plan'}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        {currentUser?.photoURL ? (
                          <img 
                            src={currentUser.photoURL} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                            }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={24} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">
                          {currentUser?.displayName || 'User'}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {/* Subscription Status */}
                    <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {subscription?.plan_name || 'Free Plan'}
                          </p>
                          {subscription && subscription.plan_name !== 'Free' && (
                            <>
                              <p className="text-xs text-gray-500 capitalize">
                                Status: {subscription.cancel_at_period_end ? 'cancelled' : subscription.status} • {subscription.billing_period}
                              </p>
                              {subscription.current_period_end && (
                                <p className="text-xs text-gray-500">
                                  {subscription.cancel_at_period_end 
                                    ? `Active until: ${new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    : `Renews: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                                  }
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          subscription?.cancel_at_period_end
                            ? 'bg-orange-100 text-orange-800'
                            : subscription?.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : subscription?.status
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription?.cancel_at_period_end ? 'cancelling' : subscription?.status || 'free'}
                        </div>
                      </div>
                      
                      {/* Cancellation Notice */}
                      {subscription?.cancel_at_period_end && subscription.current_period_end && (
                        <div className="mt-2 px-2 py-1.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                          ⚠️ Subscription cancelled. Plan active until {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>

                    {/* Subscription Management Options */}
                    <div className="space-y-1">
                      <button
                        onClick={handleChangeSubscription}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <RefreshCw size={16} className="mr-3 text-gray-500" />
                        Change Subscription
                      </button>

                      {/* Show cancel button for paid active subscriptions not already marked for cancellation */}
                      {subscription && 
                       subscription.plan_name !== 'Free' && 
                       subscription.status === 'active' && 
                       !subscription.cancel_at_period_end && (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          disabled={loading}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                          <XCircle size={16} className="mr-3" />
                          Cancel Subscription
                        </button>
                      )}

                      <button
                        onClick={openDeleteAccountModal}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 size={16} className="mr-3" />
                        Delete Account
                      </button>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          <LogOut size={16} className="mr-3 text-gray-500" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4 space-y-4">
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={24} className="text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-base truncate">
                  {currentUser?.displayName || 'User'}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            {/* Mobile Subscription Management */}
            {subscription && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {subscription.plan_name || 'Current Plan'}
                    </p>
                    <p className="text-gray-400 text-xs capitalize">
                      Status: {subscription.status} • {subscription.billing_period}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscription.status}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleChangeSubscription}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <RefreshCw size={16} className="mr-3" />
                    Change Subscription
                  </button>

                  {subscription?.status === 'active' && !subscription?.cancel_at_period_end && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={loading}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <XCircle size={16} className="mr-3" />
                    Cancel Subscription
                  </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={openDeleteAccountModal}
              className="flex items-center w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium"
            >
              <Trash2 size={20} className="mr-3" />
              Delete Account
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 font-medium"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancel plan</h2>
              <p className="text-gray-700 mb-6">
                Cancel to stop recurring billing. You can still use {subscription?.plan_name || 'Vidya AI Plus'} until{' '}
                {subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'the end of your billing period'}.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Go back
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:bg-red-400"
                >
                  {loading ? 'Cancelling...' : 'Cancel plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
              </div>

              <p className="text-gray-700 mb-3">
                This will <strong>permanently delete</strong> your account and all associated data including videos, assignments, courses, and summaries. This action cannot be undone.
              </p>

              {subscription && subscription.plan_name !== 'Free' && subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                  You have an active <strong>{subscription.plan_name}</strong> subscription. It will be cancelled immediately upon deletion.
                </div>
              )}

              <p className="text-gray-700 mb-2">
                Type <strong className="font-mono text-red-600">DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoComplete="off"
              />

              {deleteError && (
                <p className="text-red-600 text-sm mb-3">{deleteError}</p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:bg-red-400"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;
