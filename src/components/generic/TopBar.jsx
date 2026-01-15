// src/components/generic/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Menu, X, Settings, CreditCard, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from './utils';

const TopBar = ({ onNavigateToHome }) => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

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

  // Fetch subscription when dropdown opens
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
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to cancel your subscription?\n\n" +
      "Your subscription will remain active until the end of your current billing period. " +
      "You will continue to have access to all premium features until then."
    );

    if (!isConfirmed) {
      return; // User cancelled the confirmation
    }

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
        alert('✅ Subscription has been cancelled successfully!\n\nYour subscription will remain active until the end of your current billing period.');
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

  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <button
            onClick={onNavigateToHome}
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
                    {currentUser?.email}
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
                    {subscription && (
                      <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {subscription.plan_name || 'Current Plan'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              Status: {subscription.status} • {subscription.billing_period}
                            </p>
                            {/* Debug info - remove after testing */}
                            <p className="text-xs text-red-500">
                              Debug: cancel_at_period_end={String(subscription.cancel_at_period_end)}
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
                      </div>
                    )}

                    {/* Show subscription info even if null for debugging */}
                    {!subscription && (
                      <div className="px-3 py-2 mb-2 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600">Debug: No subscription data found</p>
                      </div>
                    )}

                    {/* Subscription Management Options */}
                    <div className="space-y-1">
                      <button
                        onClick={handleChangeSubscription}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <RefreshCw size={16} className="mr-3 text-gray-500" />
                        Change Subscription
                      </button>

                      {/* More relaxed conditions for cancel button - show if any subscription exists */}
                      {(() => {
                        const shouldShow = subscription && subscription.status !== 'cancelled' && !subscription?.cancel_at_period_end;
                        console.log('Cancel button conditions:', {
                          hasSubscription: !!subscription,
                          status: subscription?.status,
                          notCancelled: subscription?.status !== 'cancelled',
                          notCancelAtPeriodEnd: !subscription?.cancel_at_period_end,
                          shouldShow
                        });
                        return shouldShow;
                      })() && (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={loading}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                          <XCircle size={16} className="mr-3" />
                          {loading ? 'Cancelling...' : 'Cancel Subscription'}
                        </button>
                      )}

                      {subscription?.cancel_at_period_end && (
                        <div className="px-3 py-2 text-sm text-orange-600 bg-orange-50 rounded-lg">
                          <div className="flex items-center">
                            <XCircle size={16} className="mr-2" />
                            {subscription.current_period_end ? 
                              `Subscription will end on ${new Date(subscription.current_period_end).toLocaleDateString()}` :
                              'Subscription has been cancelled'
                            }
                          </div>
                        </div>
                      )}

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
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <XCircle size={16} className="mr-3" />
                      {loading ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  )}
                </div>
              </div>
            )}

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
    </header>
  );
};

export default TopBar;
