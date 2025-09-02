// src/components/AuthForm.jsx
import { useState } from 'react';
import { Mail, Lock, AlertCircle, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const mapFirebaseError = (error) => {
  const code = error?.code || '';
  const message = (error?.message || '').toLowerCase();
  // Common mappings
  if (code.includes('auth/invalid-credential') || code.includes('auth/invalid-login-credentials')) {
    return 'Incorrect email or password';
  }
  if (code.includes('auth/user-not-found')) {
    return 'No account found for this email';
  }
  if (code.includes('auth/wrong-password')) {
    return 'Incorrect email or password';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many attempts. Try again later or reset your password';
  }
  if (code.includes('auth/invalid-email')) {
    return 'Please enter a valid email address';
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return 'Sign-in was cancelled';
  }
  if (code.includes('auth/popup-blocked')) {
    return 'Popup was blocked by your browser';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network error. Check your connection and try again';
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is disabled for this project';
  }
  if (code.includes('auth/user-disabled')) {
    return 'This account has been disabled';
  }
  if (code.includes('auth/weak-password')) {
    return 'Please choose a stronger password';
  }
  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password';
  }
  return 'Something went wrong. Please try again';
};

const AuthForm = ({ returnUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, signInWithGoogle, resetPassword, isFirebaseConfigured } = useAuth();

  const handleSuccessfulAuth = () => {
    if (returnUrl) {
      // Decode the return URL and navigate to it
      const decodedUrl = decodeURIComponent(returnUrl);
      window.location.href = decodedUrl;
    }
    // If no return URL, the default behavior will take over
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        handleSuccessfulAuth();
      } else {
        if (!displayName.trim()) {
          throw new Error('Display name is required');
        }
        await signup(email, password, displayName);
        handleSuccessfulAuth();
      }
    } catch (error) {
      setError(mapFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await signInWithGoogle();
      handleSuccessfulAuth();
    } catch (error) {
      setError(mapFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Please enter your email to reset your password');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo('Password reset email sent. Check your inbox (and spam).');
    } catch (e) {
      setError(mapFirebaseError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      {/* Mobile Layout */}
      <div className="lg:hidden max-w-md w-full space-y-8 mt-8">
        <div className="text-center">
          <img 
            src="logo-new-2.png" 
            alt="VidyaAI Logo" 
            className="mx-auto h-32 w-auto rounded-lg border-2 border-white mb-4"
          />
          <h2 className="text-3xl font-bold text-white">
            {isLogin ? 'Ready to Level Up?' : 'Join the Revolution'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isLogin 
              ? 'Your AI-powered learning adventure awaits! 🚀' 
              : 'Unlock the future of learning with artificial intelligence ✨'
            }
          </p>
          {returnUrl && (
            <p className="mt-2 text-sm text-indigo-400">
              🔗 You'll be redirected back after signing in
            </p>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
          {!isFirebaseConfigured && (
            <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
              <p className="text-blue-400 text-sm">
                🚀 <strong>Demo Mode:</strong> Firebase not configured. You can still preview the interface with any email/password.
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg flex items-center">
              <AlertCircle size={18} className="text-red-400 mr-2" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg">
              <span className="text-green-400 text-sm">{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="displayName" className="sr-only">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required={!isLogin}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="appearance-none relative block w-full px-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Full Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-12 pr-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {isLogin && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-gray-700 text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Connecting...' : 'Sign in with Google'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-6xl w-full">
        {/* Logo and Text Section - Left Side */}
        <div className="flex-1 flex items-center justify-center pr-8">
          <div className="text-center max-w-lg">
            <img 
              src="logo-new-2.png" 
              alt="VidyaAI Logo" 
              className="mx-auto h-40 w-auto rounded-lg border-2 border-white mb-8"
            />
            <h2 className="text-4xl font-bold text-white mb-4">
              {isLogin ? 'Ready to Level Up?' : 'Join the Revolution'}
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              {isLogin 
                ? 'Your AI-powered learning adventure awaits! 🚀' 
                : 'Unlock the future of learning with artificial intelligence ✨'
              }
            </p>
            <div className="mt-8 text-gray-500">
              <p className="text-sm">
                Transform the way you learn with personalized AI assistance
              </p>
            </div>
          </div>
        </div>

        {/* Form Section - Right Side */}
        <div className="flex-1 flex items-center justify-center pl-8">
          <div className="max-w-md w-full">
            <div className="bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
              {!isFirebaseConfigured && (
                <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    🚀 <strong>Demo Mode:</strong> Firebase not configured. You can still preview the interface with any email/password.
                  </p>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg flex items-center">
                  <AlertCircle size={18} className="text-red-400 mr-2" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}
              {info && (
                <div className="mb-4 p-3 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg">
                  <span className="text-green-400 text-sm">{info}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label htmlFor="displayName-desktop" className="sr-only">
                      Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="displayName-desktop"
                        name="displayName"
                        type="text"
                        required={!isLogin}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="appearance-none relative block w-full px-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Full Name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email-desktop" className="sr-only">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-desktop"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none relative block w-full px-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password-desktop" className="sr-only">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password-desktop"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full px-12 pr-12 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                      </div>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-gray-700 text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {loading ? 'Connecting...' : 'Sign in with Google'}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;