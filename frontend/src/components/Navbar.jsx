import React, { useState } from 'react';
import { 
  Rocket, 
  Compass, 
  CheckCircle2, 
  BookOpen, 
  Mic2, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  User, 
  LogOut, 
  Menu, 
  X,
  Target
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, readinessScore }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'roadmap', label: 'Learning Path', icon: Target },
    { id: 'assessments', label: 'Assessments', icon: CheckCircle2 },
    { id: 'resources', label: 'Resources & Videos', icon: BookOpen },
    { id: 'interview', label: 'AI Mock Interview', icon: Mic2 },
    { id: 'resume', label: 'Resume AI', icon: FileText },
    { id: 'recommendations', label: 'AI Insights', icon: Sparkles },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                MODERN PLACEMENT LAUNCHPAD
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AI Career Accelerator
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* User Controls & CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {readinessScore !== undefined && (
                  <div 
                    onClick={() => setActiveTab('dashboard')}
                    className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-medium hover:border-indigo-400 transition-colors"
                    title="Your Current Placement Readiness Score"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span>Readiness: <strong className="text-white font-bold">{readinessScore}%</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
                    {user.name ? user.name[0].toUpperCase() : 'S'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{user.preferred_job_role || 'Candidate'}</p>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && readinessScore !== undefined && (
              <div className="px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-semibold">
                {readinessScore}%
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                  {user.name ? user.name[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  <p className="text-[11px] text-indigo-400 font-medium">{user.preferred_job_role}</p>
                </div>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => { onLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => { onOpenAuth('login'); setMobileOpen(false); }}
                className="w-full py-2.5 rounded-lg text-center font-medium text-slate-200 bg-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => { onOpenAuth('register'); setMobileOpen(false); }}
                className="w-full py-2.5 rounded-lg text-center font-semibold text-white bg-indigo-600"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
