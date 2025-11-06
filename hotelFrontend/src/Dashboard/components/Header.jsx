import React from 'react';
import { authService } from '../../services/authService';

export default function Header({ title, subtitle, onMenuClick }) {
  const user = authService.getCurrentUser();
  
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          {/* Mobile menu button + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
                {title || `Hello, ${user?.name || 'User'}`}
              </h1>
              {subtitle && (
                <p className="text-sm lg:text-base text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Notifications (hidden on mobile) */}
            <button className="hidden sm:block relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm lg:text-base font-semibold text-gray-900">
                  {user?.name || 'Guest'}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role || 'User'}
                </div>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>

            {/* Mobile user avatar only */}
            <div className="sm:hidden w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
