import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Lock,
  Mail,
  User as UserIcon,
  Store,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    authView,
    setAuthView,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    firebaseProjectId,
    authErrorCode,
    setAuthErrorCode,
  } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('Bangalore Flagship Store');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear messages on view change
  const changeView = (view: 'login' | 'register' | 'forgot-password') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthErrorCode(null);
    setAuthView(view);
  };

  const isOperationNotAllowed =
    authErrorCode === 'auth/operation-not-allowed' ||
    errorMessage?.includes('operation-not-allowed') ||
    errorMessage?.includes('Email/Password sign-in provider is disabled');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthErrorCode(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthErrorCode(null);

    if (!name.trim()) {
      setErrorMessage('Full name is required to register as Store Manager.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('A valid email address is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password, storeName);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthErrorCode(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication was not completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAuthErrorCode(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email to receive the password reset link.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage('Password reset email sent! Check your inbox to choose a new password.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-3 border border-indigo-400/30">
            <Boxes className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            STOCKFLOW
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wider">
              PRO
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Smart Inventory. Smarter Decisions.</p>
        </div>

        {/* Card Frame */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* View Tab Selector */}
          <div className="flex border-b border-slate-800 mb-6 pb-2 gap-4">
            <button
              onClick={() => changeView('login')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                authView === 'login'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => changeView('register')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                authView === 'register'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Register Store Manager
            </button>
            {authView === 'forgot-password' && (
              <span className="text-sm font-semibold pb-2 border-b-2 border-amber-500 text-amber-400">
                Reset Password
              </span>
            )}
          </div>

          {/* Dedicated Firebase Configuration Required Banner when auth/operation-not-allowed is returned */}
          {isOperationNotAllowed && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-left animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Firebase Authentication Setup Required</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Firebase returned <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">auth/operation-not-allowed</code>.
                The <strong>Email/Password</strong> sign-in method is currently disabled in your Firebase Project <span className="font-mono text-white">({firebaseProjectId})</span>.
              </p>

              <div className="mt-3 p-3 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>How to enable Email/Password in Firebase:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                  <li>
                    Open Firebase Console:{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>Authentication &gt; Sign-in providers</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click on <strong>Email/Password</strong> in the provider list.</li>
                  <li>Toggle the <strong>Enable</strong> switch to ON and click <strong>Save</strong>.</li>
                  <li>Return here and click <strong>Retry Now</strong>.</li>
                </ol>
              </div>

              <div className="mt-3.5 flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Open Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setAuthErrorCode(null);
                    if (authView === 'register') {
                      handleSignUp({ preventDefault: () => {} } as any);
                    } else {
                      handleSignIn({ preventDefault: () => {} } as any);
                    }
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>I Enabled It, Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* Standard error and success alerts */}
          {!isOperationNotAllowed && errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign-In with Firebase (works immediately) */}
          <div className="space-y-4 mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-98 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Firebase)</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-semibold text-[10px] tracking-wider">
                  Or use Email &amp; Password
                </span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          {authView === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@store.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => changeView('forgot-password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to StockFlow</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {authView === 'register' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Store Manager Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aanas Ahmad"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Store / Retail Outlet Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Bangalore Flagship Store"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@store.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Register Store Manager</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {authView === 'forgot-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter your registered store email. We'll send you a password reset link securely.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@store.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => changeView('login')}
                  className="w-1/2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Connected Firebase Project Verification Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Firebase Connected</span>
            </span>
            <span className="font-mono text-slate-400 truncate max-w-[170px]" title={firebaseProjectId}>
              {firebaseProjectId}
            </span>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="flex items-center justify-center gap-1.5 bg-slate-900/50 py-2 px-1 rounded-lg border border-slate-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Multi-User Isolated</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-slate-900/50 py-2 px-1 rounded-lg border border-slate-800/60">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Multi-Pay POS</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-slate-900/50 py-2 px-1 rounded-lg border border-slate-800/60">
            <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Firebase Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
