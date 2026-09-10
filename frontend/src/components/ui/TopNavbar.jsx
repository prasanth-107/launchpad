import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function TopNavbar({ 
  onToggleSidebar, 
  activeTab, 
  user, 
  onLogout, 
  onOpenProfile,
  readinessScore 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'overall-report': return 'Overall Report';
      case 'placement-readiness': return 'Placement Readiness';
      case 'roadmap': return 'Learning Paths';
      case 'courses': return 'Course Catalog';
      case 'assessments': return 'Assessments';
      case 'dsa-sheets': return 'DSA Problem Sheets';
      case 'resources': return 'Practice & Verified Resources';
      case 'interview': return 'AI Mock Interview';
      case 'interview-history': return 'Interview History';
      case 'resume': return 'Resume / ATS Score';
      case 'job-opportunities': return 'Job Opportunities';
      case 'skills': return 'Skills & Endorsements';
      case 'certificates': return 'Certificates';
      case 'profile': return 'Student Profile';
      case 'settings': return 'Settings';
      default: return 'Portal';
    }
  };

  const notifications = [
    { id: 1, title: 'Upcoming Placement Drive', desc: 'Google campus recruitment registrations open next week.', time: '2h ago', unread: true, target: 'job-opportunities' },
    { id: 2, title: 'Assessment Recommendation', desc: 'Complete SQL assessment to increase your readiness score past 80%.', time: '1d ago', unread: true, target: 'assessments' },
    { id: 3, title: 'Resume ATS Verified', desc: 'Your ATS score has improved to 92/100.', time: '2d ago', unread: false, target: 'resume' }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      
      {/* Left: Sidebar toggle & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-slate-400 font-normal hidden sm:inline">Modern Placement Launchpad</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h1 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications, Readiness Tag, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Search input (desktop) */}
        <div className="relative hidden md:block w-56 lg:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search topics, tests, drives..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onNavigate) {
                const val = e.currentTarget.value.toLowerCase();
                if (val.includes('drive') || val.includes('job')) onNavigate('job-opportunities');
                else if (val.includes('test') || val.includes('assess')) onNavigate('assessments');
                else if (val.includes('resume') || val.includes('ats')) onNavigate('resume');
                else if (val.includes('interview') || val.includes('mock')) onNavigate('interview');
                else if (val.includes('course') || val.includes('learn')) onNavigate('courses');
                else if (val.includes('dsa') || val.includes('code')) onNavigate('dsa-sheets');
                else onNavigate('placement-readiness');
              }
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Live Placement Readiness Pill */}
        {readinessScore !== undefined && (
          <button
            onClick={() => onNavigate && onNavigate('placement-readiness')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors"
            title="Click to view Placement Readiness Breakdown"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Readiness: <strong>{readinessScore}%</strong></span>
          </button>
        )}

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-left">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      setNotificationsOpen(false);
                      if (onNavigate && n.target) onNavigate(n.target);
                    }}
                    className="p-3 hover:bg-slate-50 text-xs cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative border-l border-slate-200 pl-3">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'PRASANTH'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">Candidate</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-left text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{user?.name || 'PRASANTH'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'prasanth@university.edu'}</p>
              </div>
              <button
                onClick={() => { onOpenProfile(); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => { onOpenProfile('settings'); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => { onLogout(); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
