import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const itemsByRole = {
  admin: [
    { label: 'Dashboard', to: '/dashboard/admin', icon: '📊' },
    { label: 'Users', to: '/dashboard/admin/users', icon: '👥' },
    { label: 'Hotel Owners', to: '/dashboard/admin/owners', icon: '🏨' },
    { label: 'Hotels', to: '/dashboard/admin/hotels', icon: '🏩' },
    { label: 'Booking Details', to: '/dashboard/admin/bookings', icon: '📅' },
    { label: 'Refunds', to: '/dashboard/admin/refunds', icon: '💰' },
    // { label: 'Message', to: '#', icon: '💬' },
    // { label: 'Help', to: '#', icon: '❓' },
    // { label: 'Setting', to: '#', icon: '⚙️' },
  ],
  owner: [
    { label: 'Dashboard', to: '/dashboard/owner', icon: '📊' },
    { label: 'Objectives', to: '/dashboard/owner/objectives', icon: '🎯' },
    { label: 'Bookings', to: '/dashboard/owner/bookings', icon: '📅' },
    { label: 'Photos', to: '/dashboard/owner/photos', icon: '📷' },
    { label: 'Treasures', to: '/dashboard/owner/treasures', icon: '💎' },
    { label: 'Refunds', to: '/dashboard/owner/refunds', icon: '💰' },
    // { label: 'Message', to: '#', icon: '💬' },
    // { label: 'Help', to: '#', icon: '❓' },
    // { label: 'Setting', to: '#', icon: '⚙️' },
  ],
  user: [
   
     { label: 'Explore', to: '/dashboard/hotels', icon: '🏨' },
      { label: 'Dashboard', to: '/dashboard', icon: '📊' },
    { label: 'Bookings', to: '/dashboard/bookings', icon: '📅' },
    { label: 'Refunds', to: '/dashboard/refunds', icon: '💰' },
    // { label: 'Photos', to: '/dashboard/owner/photos', icon: '📷' },
    // { label: 'Treasures', to: '/dashboard/owner/treasures', icon: '💎' },
    // { label: 'Help', to: '#', icon: '❓' },
    // { label: 'Setting', to: '#', icon: '⚙️' },
  ],
};

export default function Sidebar({ role = 'user', isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  // normalize role keys: backend may use 'hotelOwner' while Sidebar keys use 'owner'
  const normalizedRole = role === 'hotelOwner' ? 'owner' : role;
  const items = itemsByRole[normalizedRole] || itemsByRole.user;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30
        w-64 lg:w-72 xl:w-80
        bg-white border-r border-gray-200 shadow-lg lg:shadow-none
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 lg:p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Link to="/home" className="text-2xl lg:text-3xl font-bold text-blue-600">
              Lanka<span className="text-gray-900">Stay.</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 lg:p-6">
          <div className="space-y-1">
            {items.map((it) => {
              const isActive = location.pathname === it.to;
              return (
                <Link
                  key={it.label}
                  to={it.to}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }
                  `}
                >
                  <span className="text-xl">{it.icon}</span>
                  <span className="text-sm lg:text-base">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout button */}
        <div className="p-4 lg:p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-gray-700 hover:bg-red-50 hover:text-red-600
              transition-all duration-200"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm lg:text-base font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
