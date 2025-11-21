import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import ProfileEditor from './ProfileEditor';
import Breadcrumb from './Breadcrumb';

export default function Header({ title, subtitle, onMenuClick }) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [showProfile, setShowProfile] = useState(false);

  // refresh user from storage when modal closes (so updated profile shows immediately)
  useEffect(() => {
    if (!showProfile) setUser(authService.getCurrentUser());
  }, [showProfile]);

  return (
    <div className="sticky top-0 z-50">
      <div className="backdrop-blur-sm bg-white/70 border-b-2 border-blue-100 shadow-md">
        <div className="flex px-8 w-full lg:px-12 h-16">
          <div className="flex items-center space-x-4 justify-between w-full">
            {/* Mobile menu button + Title */}
            <div className="flex items-center gap-10">
              <button
                onClick={onMenuClick}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <Breadcrumb />
              </div>
            </div>

            {/* User profile */}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="hidden sm:flex items-center gap-3 pr-6">
                <div className="text-right pr-6">
                  <div className="text-sm lg:text-base font-semibold text-gray-900">
                    {user?.name || 'Guest'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</div>
                </div>
                <button
                  aria-label="Edit profile"
                  title="Edit profile"
                  onClick={() => setShowProfile(true)}
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 focus:outline-none cursor-pointer"
                >
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </button>
              </div>

              {/* Mobile user avatar only */}
              <button
                aria-label="Edit profile"
                title="Edit profile"
                onClick={() => setShowProfile(true)}
                className="sm:hidden w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 focus:outline-none cursor-pointer"
              >
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
    </div>
  );
}
