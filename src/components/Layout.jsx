/**
 * Layout Component
 * Wraps authenticated pages with sidebar navigation
 */

import { useState } from 'react';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50">
      {/* Sidebar (fixed, overlays on mobile, visible on desktop) */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content (offset on desktop to account for fixed sidebar) */}
      <div className="flex flex-col h-full lg:ml-64">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 -ml-2"
            title="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1"></div>
          {/* Right side of top bar can have additional items */}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
