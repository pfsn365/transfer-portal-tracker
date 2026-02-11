'use client';

import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import CFBSidebar from '@/components/CFBSidebar';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [sidebarCollapsed]);

  return (
    <div className="flex flex-1 bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 h-screen z-10 transition-all duration-300 ${
          sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'
        }`}
      >
        <CFBSidebar />
      </aside>

      {/* Desktop toggle button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`hidden lg:flex items-center justify-center fixed top-10 z-20 w-8 h-8 bg-black text-white transition-all duration-300 cursor-pointer hover:bg-gray-800 ${
          sidebarCollapsed
            ? 'left-0 rounded-tr-md rounded-br-md'
            : 'left-64 rounded-tr-md rounded-br-md'
        }`}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="w-4 h-4" />
        ) : (
          <PanelLeftClose className="w-4 h-4" />
        )}
      </button>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30">
        <CFBSidebar isMobile />
      </div>

      {/* Content wrapper */}
      <div
        className={`flex-1 min-w-0 mt-[48px] lg:mt-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
