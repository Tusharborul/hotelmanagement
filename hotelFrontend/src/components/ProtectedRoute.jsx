import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ProtectedRoute({ roles = [], children }) {
  const isAuthed = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
