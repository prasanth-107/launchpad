import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import TopNavbar from './TopNavbar';

export function AppShell({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  readinessScore 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Fixed Left Sidebar (260px desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Wrapper with Left Margin on Desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Navbar Header */}
        <TopNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={setActiveTab}
          user={user}
          onLogout={onLogout}
          onOpenProfile={(tab = 'profile') => setActiveTab(tab)}
          readinessScore={readinessScore}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>© 2026 MODERN PLACEMENT LAUNCHPAD • Placement Management System</span>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <span>Campus Drive Ready</span>
              <span>•</span>
              <span>AI Placement Coach</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
