// src/components/AuthForm.jsx
import { useState } from 'react';
import { Mail, Lock, AlertCircle, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const mapFirebaseError = (error) => {
  const code = error?.code || '';
  const message = (error?.message || '').toLowerCase();
  if (code.includes('auth/invalid-credential') || code.includes('auth/invalid-login-credentials')) return 'Incorrect email or password';
  if (code.includes('auth/user-not-found')) return 'No account found for this email';
  if (code.includes('auth/wrong-password')) return 'Incorrect email or password';
  if (code.includes('auth/too-many-requests')) return 'Too many attempts. Try again later or reset your password';
  if (code.includes('auth/invalid-email')) return 'Please enter a valid email address';
  if (code.includes('auth/popup-closed-by-user')) return 'Sign-in was cancelled';
  if (code.includes('auth/popup-blocked')) return 'Popup was blocked by your browser';
  if (code.includes('auth/network-request-failed')) return 'Network error. Check your connection and try again';
  if (code.includes('auth/operation-not-allowed')) return 'This sign-in method is disabled for this project';
  if (code.includes('auth/user-disabled')) return 'This account has been disabled';
  if (code.includes('auth/weak-password')) return 'Please choose a stronger password';
  if (message.includes('invalid login credentials')) return 'Incorrect email or password';
  return 'Something went wrong. Please try again';
};

const inputClass =
  'appearance-none relative block w-full px-12 py-3 bg-[#071224] border border-[#182842] placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50 focus:border-[#43ead6]/50 transition';

const FormFields = ({
  idSuffix = '',
  isLogin,
  displayName,
  setDisplayName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  handleSubmit,
  handleForgotPassword,
  handleGoogleSignIn,
}) => (
  <form onSubmit={handleSubmit} className="space-y-5">
    {!isLogin && (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User className="h-5 w-5 text-slate-500" />
        </div>
        <input
          id={`displayName${idSuffix}`}
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
          placeholder="Full Name"
        />
      </div>
    )}

    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Mail className="h-5 w-5 text-slate-500" />
      </div>
      <input
        id={`email${idSuffix}`}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
        placeholder="Email address"
      />
    </div>

    <div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-slate-500" />
        </div>
        <input
          id={`password${idSuffix}`}
          type={showPassword ? 'text' : 'password'}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} pr-12`}
          placeholder="Password"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword
            ? <EyeOff className="h-5 w-5 text-slate-500 hover:text-slate-300" />
            : <Eye className="h-5 w-5 text-slate-500 hover:text-slate-300" />}
        </button>
      </div>
      {isLogin && (
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            className="text-sm text-[#43ead6] hover:text-[#43ead6]/80 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}
    </div>

    <button
      type="submit"
      disabled={loading}
      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full bg-[#43ead6] text-[#051224] text-sm font-medium hover:bg-[#43ead6]/90 focus:outline-none focus:ring-2 focus:ring-[#43ead6]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-[#051224] border-t-transparent rounded-full animate-spin" />
          {isLogin ? 'Signing in…' : 'Creating account…'}
        </>
      ) : (
        isLogin ? 'Sign In' : 'Create Account'
      )}
    </button>

    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#182842]" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-[#0d1f38] text-slate-400">Or continue with</span>
      </div>
    </div>

    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full border border-white/20 bg-white/5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Connecting…' : 'Sign in with Google'}
    </button>
  </form>
);

const Alerts = ({ isFirebaseConfigured, error, info }) => (
  <>
    {!isFirebaseConfigured && (
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-blue-400 text-sm">
          🚀 <strong>Demo Mode:</strong> Firebase not configured. You can preview the interface with any email/password.
        </p>
      </div>
    )}
    {error && (
      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <span className="text-red-400 text-sm">{error}</span>
      </div>
    )}
    {info && (
      <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <span className="text-emerald-400 text-sm">{info}</span>
      </div>
    )}
  </>
);

const SwitchLink = ({ isLogin, setIsLogin, onNavigateToLanding }) => (
  <div className="mt-6 text-center space-y-2">
    <p className="text-slate-400 text-sm">
      {isLogin ? "Don't have an account? " : "Already have an account? "}
      <button
        type="button"
        onClick={() => setIsLogin(!isLogin)}
        className="font-medium text-[#43ead6] hover:text-[#43ead6]/80 transition-colors"
      >
        {isLogin ? 'Sign up' : 'Sign in'}
      </button>
    </p>
    {onNavigateToLanding && (
      <button
        type="button"
        onClick={onNavigateToLanding}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        ← Back to Home
      </button>
    )}
  </div>
);

const AuthForm = ({ returnUrl, onNavigateToLanding }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, signInWithGoogle, resetPassword, isFirebaseConfigured } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!displayName.trim()) throw new Error('Display name is required');
        await signup(email, password, displayName);
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
    } catch (error) {
      setError(mapFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email) { setError('Please enter your email to reset your password'); return; }
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
    <div className="min-h-screen bg-[#071224] flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(67,234,214,0.10),transparent_45%)]" />

      {/* Mobile */}
      <div className="lg:hidden relative max-w-md w-full space-y-8 py-12">
        <div className="text-center">
          <img
            src="/images/vidya-ai-logo-1.png"
            alt="VidyaAI Logo"
            className="mx-auto h-12 w-auto mb-6"
          />
          <h2 className="text-3xl font-semibold text-white">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-slate-400 text-sm">
            {isLogin ? 'Sign in to your VidyaAI account' : 'Start your AI-powered learning journey'}
          </p>
          {returnUrl && (
            <p className="mt-2 text-xs text-[#43ead6]">You'll be redirected back after signing in</p>
          )}
        </div>

        <div className="bg-[#0d1f38] border border-[#182842] rounded-2xl shadow-2xl p-8">
          <Alerts isFirebaseConfigured={isFirebaseConfigured} error={error} info={info} />
          <FormFields
            idSuffix="-mobile"
            isLogin={isLogin}
            displayName={displayName}
            setDisplayName={setDisplayName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            handleSubmit={handleSubmit}
            handleForgotPassword={handleForgotPassword}
            handleGoogleSignIn={handleGoogleSignIn}
          />
          <SwitchLink isLogin={isLogin} setIsLogin={setIsLogin} onNavigateToLanding={onNavigateToLanding} />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex relative max-w-5xl w-full gap-16 items-center py-12">
        {/* Left: branding */}
        <div className="flex-1 text-center">
          <img
            src="/images/vidya-ai-logo-1.png"
            alt="VidyaAI Logo"
            className="mx-auto h-14 w-auto mb-8"
          />
          <h2 className="text-4xl font-semibold text-white mb-4">
            {isLogin ? 'Welcome back' : 'Join VidyaAI'}
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">
            {isLogin
              ? 'Sign in to continue your AI-powered learning journey.'
              : 'Unlock the future of learning with artificial intelligence.'}
          </p>
        </div>

        {/* Right: form */}
        <div className="flex-1">
          <div className="bg-[#0d1f38] border border-[#182842] rounded-2xl shadow-2xl p-8">
            <Alerts isFirebaseConfigured={isFirebaseConfigured} error={error} info={info} />
            <FormFields
              idSuffix="-desktop"
              isLogin={isLogin}
              displayName={displayName}
              setDisplayName={setDisplayName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              handleSubmit={handleSubmit}
              handleForgotPassword={handleForgotPassword}
              handleGoogleSignIn={handleGoogleSignIn}
            />
            <SwitchLink isLogin={isLogin} setIsLogin={setIsLogin} onNavigateToLanding={onNavigateToLanding} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
