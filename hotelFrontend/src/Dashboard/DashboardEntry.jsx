import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import UserDashboard from './UserDashboard';

export default function DashboardEntry() {
  const user = authService.getCurrentUser();
  const role = (user?.role || '').toString().toLowerCase();

  if (role.includes('admin')) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (role.includes('owner') || role.includes('hotelowner') || role.includes('hotel')) {
    return <Navigate to="/dashboard/owner" replace />;
  }

  // default: render regular user dashboard
  return <UserDashboard />;
}
