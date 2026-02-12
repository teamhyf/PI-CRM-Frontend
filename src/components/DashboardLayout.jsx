/**
 * Dashboard Layout Component
 * Wrapper component that provides sidebar and header for dashboard pages
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/intake': 'Case Intake',
  '/cases': 'Cases',
  '/clients': 'Clients',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 lg:ml-0">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{pageTitle}</h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="relative">
                  <img
                    src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff'}
                    alt={user?.name || 'User'}
                    className="w-10 h-10 rounded-xl ring-2 ring-gray-200 hover:ring-blue-500 transition-all duration-200 cursor-pointer"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="py-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
