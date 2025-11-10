import React, { useState } from 'react';
import { authService } from '../../services/authService';
import ProfileEditor from './ProfileEditor';

export default function Header({ title, subtitle, onMenuClick }) {
  const [user, setUser] = React.useState(authService.getCurrentUser());
  const [showProfile, setShowProfile] = useState(false);

  // refresh user from storage when modal closes (so updated profile shows immediately)
  React.useEffect(() => {
    if (!showProfile) {
      setUser(authService.getCurrentUser());
    }
  }, [showProfile]);
  
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
              <button aria-label="Edit profile" title="Edit profile" onClick={() => setShowProfile(true)} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md focus:outline-none">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </button>
            </div>

            {/* Mobile user avatar only */}
            <button aria-label="Edit profile" title="Edit profile" onClick={() => setShowProfile(true)} className="sm:hidden w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md focus:outline-none">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </button>
            {showProfile && <ProfileEditor open={showProfile} onClose={() => setShowProfile(false)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
