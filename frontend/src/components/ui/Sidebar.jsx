import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Target, 
  Compass, 
  BookOpen, 
  CheckSquare, 
  Code, 
  BrainCircuit, 
  Mic2, 
  History, 
  FileText, 
  Briefcase, 
  Sparkles, 
  Award, 
  User, 
  Settings, 
  LogOut,
  GraduationCap,
  ChevronRight,
  Layers,
  Bot
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, user, onLogout, isOpen, onClose }) {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'career-coach', label: 'AI Career Coach', icon: Bot },
        { id: 'skill-gap', label: 'Skill Gap Analysis', icon: Target },
        { id: 'placement-readiness', label: 'Placement Readiness', icon: Sparkles },
        { id: 'overall-report', label: 'Overall Report', icon: BarChart3 },
      ]
    },
    {
      title: 'LEARNING',
      items: [
        { id: 'roadmap', label: 'Learning Paths', icon: Compass },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'assessments', label: 'Assessments', icon: CheckSquare },
        { id: 'dsa-sheets', label: 'DSA Sheets', icon: Code },
        { id: 'resources', label: 'Practice & Resources', icon: BrainCircuit },
      ]
    },
    {
      title: 'INTERVIEW',
      items: [
        { id: 'interview', label: 'AI Mock Interview', icon: Mic2 },
        { id: 'interview-history', label: 'Interview History', icon: History },
      ]
    },
    {
      title: 'CAREER',
      items: [
        { id: 'resume', label: 'Resume / ATS Score', icon: FileText },
        { id: 'job-opportunities', label: 'Placement Drives & Jobs', icon: Briefcase },
        { id: 'applications', label: 'Application Pipeline', icon: Layers },
        { id: 'skills', label: 'Skills & Endorsements', icon: Sparkles },
        { id: 'certificates', label: 'Certificates', icon: Award },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Sidebar Header & Brand */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block leading-none">
                MODERN PLACEMENT
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1 block">
                Launchpad Portal
              </span>
            </div>
          </div>

          {/* Navigation Items List */}
          <div className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-140px)] space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive 
                            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Profile Mini-Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
            <div 
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              onClick={() => handleNavClick('profile')}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {user?.name || 'PRASANTH'}
                </p>
                <p className="text-[10px] text-slate-500 truncate leading-tight">
                  {user?.department ? `${user.department.split(' ')[0]} • ${user.year || '4th Yr'}` : 'CSE • 4th Year'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleNavClick('settings')}
                title="Settings"
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
