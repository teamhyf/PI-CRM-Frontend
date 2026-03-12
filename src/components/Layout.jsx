/**
 * Layout Component
 * Wraps authenticated pages with sidebar navigation
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50">
      {/* Sidebar (fixed, overlays on mobile, visible on desktop) */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isCollapsed={sidebarCollapsed} />

      {/* Main Content (offset on desktop to account for fixed sidebar) */}
      <div className={`flex flex-col h-full transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 -ml-2"
            title="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex text-gray-600 hover:text-gray-900 p-2 -ml-2"
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5H7a2 2 0 00-2 2v12a2 2 0 002 2h6m8-8l4 4m0 0l-4 4m4-4H9" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19H5a2 2 0 01-2-2V7a2 2 0 012-2h6m8 8l-4-4m0 0l4-4m-4 4H9" />
              </svg>
            )}
          </button>

          <div className="flex-1"></div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {user?.role || 'user'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
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
