/**
 * Sidebar Component
 * Main navigation sidebar for CRM dashboard
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AISparklesIcon } from './AIIcon';

const baseNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    name: 'Case Leads',
    href: '/leads',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    ),
  },
  {
    name: 'Case Intake',
    href: '/ai-intake',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    name: 'Cases',
    href: '/cases',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
  },
];

const adminNavigation = [
  {
    name: 'Users',
    href: '/users',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
  },
];

export function Sidebar({ isOpen, setIsOpen, isCollapsed = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20 lg:w-20' : 'w-64 lg:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-4 lg:px-6 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
            {!isCollapsed && (
              <div className="flex items-center space-x-3 flex-1">
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                    <AISparklesIcon className="w-2.5 h-2.5 text-white" />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">PI CRM</span>
                  <span className="text-[10px] text-violet-400 font-medium uppercase tracking-wider">Powered by AI</span>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <AISparklesIcon className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isCollapsed ? 'px-2 py-6' : 'px-4 py-6'} space-y-1 overflow-y-auto`}>
            {/* Base Navigation */}
            {baseNavigation.map((item, index) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform scale-105'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  title={isCollapsed ? item.name : ''}
                >
                  <svg className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                  {!isCollapsed && <span className="font-semibold">{item.name}</span>}
                </Link>
              );
            })}

            {/* Admin Navigation */}
            {user?.role === 'admin' && (
              <>
                {!isCollapsed && <div className="my-4 border-t border-gray-700/50"></div>}
                {adminNavigation.map((item, index) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform scale-105'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                      }`}
                      style={{ animationDelay: `${(baseNavigation.length + index) * 0.05}s` }}
                      title={isCollapsed ? item.name : ''}
                    >
                      <svg className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                      {!isCollapsed && <span className="font-semibold">{item.name}</span>}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User Profile */}
          {!isCollapsed && (
            <div className="border-t border-gray-700/50 p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl ring-2 ring-blue-500/30 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate capitalize">{user?.role || 'user'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all duration-200 border border-gray-700/50 hover:border-red-500/30 group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
