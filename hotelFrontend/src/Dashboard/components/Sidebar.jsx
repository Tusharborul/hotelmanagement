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
  ],
  owner: [
    { label: 'Dashboard', to: '/dashboard/owner', icon: '📊' },
    { label: 'Objectives', to: '/dashboard/owner/objectives', icon: '🎯' },
    { label: 'Bookings', to: '/dashboard/owner/bookings', icon: '📅' },
    { label: 'Photos', to: '/dashboard/owner/photos', icon: '📷' },
    { label: 'Treasures', to: '/dashboard/owner/treasures', icon: '💎' },
    { label: 'Refunds', to: '/dashboard/owner/refunds', icon: '💰' },
  ],
  user: [
    { label: 'Explore', to: '/dashboard/hotels', icon: '🏨' },
    { label: 'Dashboard', to: '/dashboard', icon: '📊' },
    { label: 'Bookings', to: '/dashboard/bookings', icon: '📅' },
    { label: 'Refunds', to: '/dashboard/refunds', icon: '💰' },
  ],
};

export default function Sidebar({ role = 'user', isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedRole = role === 'hotelOwner' ? 'owner' : role;
  const items = itemsByRole[normalizedRole] || itemsByRole.user;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30
        w-64 lg:w-72 xl:w-80
        bg-white border-r border-gray-200 shadow-lg
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex px-6 lg:px-8 h-16 border-b-2 border-blue-100 bg-linear-to-r from-blue-50 to-white">
        <div className="flex items-center space-x-4 justify-between w-full">
          <Link to="/home" className="text-2xl  lg:text-3xl font-bold bg-linear-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
            LankaStay.
          </Link>
          <button
            onClick={onClose}
            className=" text-gray-500 hover:text-gray-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="space-y-1">
          {items.map((it) => {
            const isActive = location.pathname === it.to;
            return (
              <Link
                key={it.label}
                to={it.to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300
                  ${isActive
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 hover:shadow-md'
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
      <div className="px-4 lg:px-6  h-16 ">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
            text-gray-700 hover:bg-linear-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:scale-105 hover:shadow-lg
            transition-all duration-300 cursor-pointer font-medium"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm lg:text-base font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
