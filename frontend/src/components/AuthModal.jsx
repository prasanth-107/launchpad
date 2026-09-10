import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, Building, BookOpen, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { dal } from '../lib/supabaseClient';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onAuthSuccess }) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('PRASANTH');
  const [college, setCollege] = useState('Stanford Institute of Technology');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('4th Year / Final');
  const [skills, setSkills] = useState('Python, JavaScript, React, SQL, Git, DSA');
  const [programmingLanguages, setProgrammingLanguages] = useState('Python, JavaScript, C++');
  const [careerGoal, setCareerGoal] = useState('SDE-1 role at Tier-1 tech company');
  const [preferredJobRole, setPreferredJobRole] = useState('Full Stack Software Engineer');
  const [resumeText, setResumeText] = useState('PRASANTH\nB.Tech Computer Science & Engineering\nSkills: Python, React, SQL, Git, REST APIs\nProjects: Campus Placement Preparation Portal');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Supabase Authentication
      const authRes = await dal.auth.signIn(email, password);
      if (authRes.error) {
        throw new Error(authRes.error.message || 'Supabase authentication failed');
      }

      const authedUser = authRes.data?.user || {};
      const profile = await dal.profiles.get(authedUser.id) || authedUser;

      // 2. Sync companion backend session
      try {
        await apiClient.login(email, password);
      } catch (backendErr) {
        console.warn('Companion backend login sync:', backendErr.message);
      }

      onAuthSuccess({
        id: profile.id || authedUser.id,
        name: profile.name || 'PRASANTH',
        email: profile.email || email,
        college: profile.college || college,
        department: profile.department || department,
        year: profile.year || year,
        preferred_job_role: profile.preferred_job_role || preferredJobRole,
        career_goal: profile.career_goal || careerGoal
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Supabase Sign Up
      const authRes = await dal.auth.signUp(email, password, {
        name,
        college,
        department,
        year,
        preferred_job_role: preferredJobRole
      });

      if (authRes.error) {
        throw new Error(authRes.error.message || 'Supabase registration failed');
      }

      const authedUser = authRes.data?.user || {};

      // 2. Sync companion backend
      try {
        const userData = {
          name,
          email,
          password,
          college,
          department,
          year,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          programming_languages: programmingLanguages.split(',').map(s => s.trim()).filter(Boolean),
          career_goal: careerGoal,
          preferred_job_role: preferredJobRole,
          resume_text: resumeText
        };
        await apiClient.register(userData);
      } catch (backendErr) {
        console.warn('Companion backend registration sync:', backendErr.message);
      }

      onAuthSuccess({
        id: authedUser.id || 'usr-' + Date.now(),
        name,
        email,
        college,
        department,
        year,
        preferred_job_role: preferredJobRole,
        career_goal: careerGoal
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
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
        console.warn('Companion backend demo login sync:', backendErr.message);
      }

      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError('Demo login unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await apiClient.forgotPassword(email);
      setSuccessMsg(res.message);
    } catch (err) {
      setError('Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Candidate Portal</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            {tab === 'login' && 'Sign in to Candidate Portal'}
            {tab === 'register' && 'Create Your Student Profile'}
            {tab === 'forgot' && 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Access your personalized learning path, assessment scores, and AI mock interviews.
          </p>
        </div>

        {/* 1-Click Evaluation Mode */}
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Evaluation Mode
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">Instant access with pre-populated placement telemetry.</p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors shrink-0 ml-3"
          >
            1-Click Demo
          </button>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-slate-200 mb-6 text-xs sm:text-sm">
          <button
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors mr-6 ${
              tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors mr-6 ${
              tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Student
          </button>
          <button
            onClick={() => { setTab('forgot'); setError(''); setSuccessMsg(''); }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors ${
              tab === 'forgot' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prasanth@university.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>
        )}

        {/* Tab 2: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">College</label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prasanth@university.edu"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year / Final">4th Year / Final</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Placement Role</label>
              <input
                type="text"
                value={preferredJobRole}
                onChange={(e) => setPreferredJobRole(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Key Skills (Comma-separated)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Tab 3: Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prasanth@university.edu"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
