import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  KeyRound, 
  ShieldCheck 
} from 'lucide-react';
import { dal } from '../lib/supabaseClient';
import { apiClient } from '../api/client';

export default function AuthView({ onAuthSuccess, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Detect recovery mode from URL hash
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setTab('reset');
      setSuccess('Recovery link verified. Please enter your new password.');
    }
  }, []);

  const formatAuthError = (err) => {
    if (!err) return '';
    const msg = typeof err === 'string' ? err : err.message || '';
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
      return 'Your email address has not been confirmed yet. Please verify your email or use 1-Click Demo.';
    }
    if (msg.includes('User already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('network') || msg.includes('Failed to fetch')) {
      return 'Network connectivity error. Please check your internet connection.';
    }
    return msg || 'Authentication request could not be completed. Please try again.';
  };

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // 1. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your university or candidate email.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await dal.auth.signIn(email.trim(), password);
      if (res.error) {
        throw res.error;
      }
      const authed = res.data?.user;
      const profile = await dal.profiles.get(authed?.id) || authed;

      // Companion backend sync
      try {
        await apiClient.login(email.trim(), password);
      } catch (backendErr) {
        console.warn('Backend login sync notice:', backendErr.message);
      }

      setSuccess('Signed in successfully. Loading dashboard...');
      setTimeout(() => {
        onAuthSuccess(profile || authed);
      }, 400);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setError('Please provide a valid university email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await dal.auth.signUp(email.trim(), password, {
        name: name.trim()
      });
      if (res.error) {
        throw res.error;
      }

      const authed = res.data?.user;
      
      // Ensure initial profile entry exists in profiles table
      if (authed?.id) {
        await dal.profiles.update(authed.id, {
          name: name.trim(),
          email: email.trim(),
          college: 'Stanford Institute of Technology',
          department: 'Computer Science & Engineering',
          year: '4th Year / Final',
          preferred_job_role: 'Full Stack Software Engineer',
          career_goal: 'SDE-1 campus placement at Tier-1 tech company'
        });
      }

      // Sync with companion backend
      try {
        await apiClient.register({
          name: name.trim(),
          email: email.trim(),
          password: password,
          preferred_job_role: 'Full Stack Software Engineer'
        });
      } catch (backendErr) {
        console.warn('Backend registration sync notice:', backendErr.message);
      }

      const profile = await dal.profiles.get(authed?.id) || authed;
      setSuccess('Student profile registered successfully! Redirecting...');
      setTimeout(() => {
        onAuthSuccess(profile || { id: authed?.id, name, email });
      }, 500);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !validateEmail(email)) {
      setError('Please enter the email address linked to your student account.');
      return;
    }

    setLoading(true);
    try {
      const res = await dal.auth.resetPasswordForEmail(email.trim());
      if (res.error) {
        throw res.error;
      }
      setSuccess('Password reset link sent! Check your inbox to set a new password.');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await dal.auth.updatePassword(newPassword);
      if (res.error) {
        throw res.error;
      }
      setSuccess('Your password has been successfully reset! You can now sign in.');
      setTimeout(() => {
        setTab('login');
      }, 1500);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 5. 1-Click Evaluation / Demo Login
  const handleDemoEvaluation = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const demoRes = await dal.auth.signIn('prasanth@university.edu', 'demo123');
      const user = demoRes.data?.user || {
        id: 'dcd807f7-9b13-4476-abc5-b34f60905f82',
        name: 'PRASANTH',
        email: 'prasanth@university.edu',
        college: 'Stanford Institute of Technology',
        department: 'Computer Science & Engineering',
        year: '4th Year / Final',
        preferred_job_role: 'Full Stack Software Engineer',
        career_goal: 'Crack SDE-1 placement drive at Tier-1 tech company'
      };

      try {
        await apiClient.demoLogin();
      } catch (backendErr) {
        console.warn('Companion demo sync note:', backendErr.message);
      }

      setSuccess('Evaluation session initialized! Loading candidate portal...');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 300);
    } catch (err) {
      setError('Unable to load evaluation session. Please try regular login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900">
      
      {/* Brand Header */}
      <div className="text-center mb-8 max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-md mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          MODERN PLACEMENT LAUNCHPAD
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Campus Recruitment Preparation & Placement Management Portal
        </p>
      </div>

      {/* Main SaaS Card */}
      <div className="saas-card w-full max-w-md p-6 sm:p-8 shadow-sm">
        
        {/* Tab Switcher */}
        {tab !== 'reset' && (
          <div className="flex border-b border-slate-200 mb-6 text-xs sm:text-sm">
            <button
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
              className={`pb-3 font-semibold border-b-2 mr-6 transition-colors ${
                tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
              className={`pb-3 font-semibold border-b-2 mr-6 transition-colors ${
                tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Register Candidate
            </button>
            <button
              onClick={() => { setTab('forgot'); setError(''); setSuccess(''); }}
              className={`pb-3 font-semibold border-b-2 transition-colors ${
                tab === 'forgot' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Reset Password
            </button>
          </div>
        )}

        {/* 1-Click Evaluation Mode Banner */}
        {tab === 'login' && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                1-Click Evaluator Mode
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Instant access with preloaded campus candidate records.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoEvaluation}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
            >
              Enter Demo
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-left text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">University / Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-xs">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                />
                <span>Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-left text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Candidate Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">University / Candidate Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Create Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? 'Creating Profile...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-left text-xs">
            <p className="text-slate-600 text-xs leading-relaxed">
              Enter your registered account email and we will send a password reset authorization link.
            </p>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{loading ? 'Sending Link...' : 'Send Password Reset Link'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: RESET PASSWORD */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left text-xs">
            <h3 className="text-sm font-bold text-slate-900">Set New Account Password</h3>
            <p className="text-slate-500 text-xs">Choose a secure password with at least 6 characters.</p>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{loading ? 'Updating...' : 'Update Password & Sign In'}</span>
            </button>
          </form>
        )}

      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-xs text-slate-400">
        <span>© 2026 MODERN PLACEMENT LAUNCHPAD • Secure Supabase Authentication</span>
      </div>

    </div>
  );
}
