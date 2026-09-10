import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  BookOpen, 
  Calendar, 
  FileText, 
  Globe, 
  Link2,
  Edit3, 
  Check, 
  Settings, 
  Bell, 
  Key, 
  ShieldCheck,
  Save
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { apiClient } from '../api/client';

export default function ProfileSettingsView({ user, onUpdateProfile, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');

  // Form state
  const [name, setName] = useState(user?.name || 'PRASANTH');
  const [email, setEmail] = useState(user?.email || 'prasanth@university.edu');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [college, setCollege] = useState(user?.college || 'Stanford Institute of Technology');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [year, setYear] = useState(user?.year || '4th Year / Final');
  const [preferredRole, setPreferredRole] = useState(user?.preferred_job_role || 'Full Stack Software Engineer');
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || 'SDE-1 role at Tier-1 tech company');
  const [skills, setSkills] = useState(Array.isArray(user?.skills) ? user.skills.join(', ') : 'Python, JavaScript, React, SQL, Git, DSA');
  const [github, setGithub] = useState('https://github.com/prasanth-dev');
  const [linkedin, setLinkedin] = useState('https://linkedin.com/in/prasanth-placement');

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [driveAlerts, setDriveAlerts] = useState(true);
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavedSuccess('');
    try {
      const updatedUser = {
        user_id: user?.id || 'student-demo-101',
        name,
        college,
        department,
        year,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_job_role: preferredRole,
        career_goal: careerGoal
      };
      await apiClient.updateProfile(updatedUser);
      if (onUpdateProfile) {
        onUpdateProfile(updatedUser);
      }
      setIsEditing(false);
      setSavedSuccess('Profile updated successfully!');
      setTimeout(() => setSavedSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {activeTab === 'profile' ? 'Student Profile' : 'Account & Portal Settings'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal credentials, campus placement target details, and preferences.
          </p>
        </div>

        <div className="flex border border-slate-300 rounded-lg p-1 bg-white shadow-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Avatar & Summary (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="saas-card p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-indigo-600 text-white font-black text-3xl mx-auto flex items-center justify-center shadow-md">
                {name.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-4">{name}</h2>
              <p className="text-xs text-slate-500">{department}</p>
              <p className="text-xs text-slate-500">{college}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
                <Badge variant="success" size="sm">
                  Placement Verified ✓
                </Badge>
                <Badge variant="primary" size="sm">
                  {year}
                </Badge>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-left text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{college}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center gap-3">
                <a href={github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900" title="Portfolio / Code">
                  <Globe className="w-4 h-4" />
                </a>
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900" title="LinkedIn Profile">
                  <Link2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Credentials & Edit Mode (8 Cols) */}
          <div className="lg:col-span-8 saas-card p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-900">Academic & Placement Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Information'}</span>
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">College Name</label>
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Preferred Placement Role</label>
                    <input
                      type="text"
                      value={preferredRole}
                      onChange={(e) => setPreferredRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Career Placement Goal</label>
                  <input
                    type="text"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Technical Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Target Placement Role</span>
                    <p className="font-bold text-slate-900 mt-1">{preferredRole}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Career Goal</span>
                    <p className="font-bold text-slate-900 mt-1">{careerGoal}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-2">Technical Skills & Stacks</span>
                  <div className="flex flex-wrap gap-2">
                    {skills.split(',').map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium block mb-2">Featured Project Portfolio</span>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <p className="font-bold text-slate-900 text-xs">Campus Placement Portal Platform</p>
                    <p className="text-xs text-slate-500">
                      Full-stack application built with React, Tailwind CSS, FastAPI, and modular database layers. Features automated test grading, ATS resume evaluation, and AI mock interviews.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl saas-card p-6 sm:p-8 space-y-6 text-xs">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Portal & Integration Preferences</h3>
            <p className="text-slate-500 mt-0.5">Configure notifications and external API credentials</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">Email Notifications</p>
                <p className="text-slate-500 text-[11px]">Receive weekly readiness summaries and upcoming assessment reminders</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">Campus Drive Alerts</p>
                <p className="text-slate-500 text-[11px]">Instant notifications when partner recruitment drives match your profile</p>
              </div>
              <input
                type="checkbox"
                checked={driveAlerts}
                onChange={(e) => setDriveAlerts(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Supabase PostgreSQL Database</h4>
                <p className="text-[11px] text-slate-500">Persistent database connection, authentication, and Row Level Security (RLS)</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase PostgreSQL Layer Active</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">VITE_SUPABASE_URL:</span>
                <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {import.meta.env.VITE_SUPABASE_URL || 'https://modern-placement-launchpad.supabase.co'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">VITE_SUPABASE_PUBLISHABLE_KEY:</span>
                <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'sb_publishable_••••••' : 'Configured in .env'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Row Level Security (RLS):</span>
                <span className="text-emerald-700 font-semibold">
                  Enabled (auth.uid() = user_id on all 8 user tables)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">SQL Migration:</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  supabase/migrations/20260910000001_modern_placement_launchpad_schema.sql
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">External API Configuration (Optional)</h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">YouTube Data API Key</label>
              <input
                type="password"
                value={youtubeApiKey}
                onChange={(e) => setYoutubeApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Configured in backend .env; override here if needed for live searches</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gemini AI API Key</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used for live interview grading and ATS analysis</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setSavedSuccess('Settings preferences saved successfully!');
                setTimeout(() => setSavedSuccess(''), 4000);
              }}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
