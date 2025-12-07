import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = false, requireOnboarding = false }) => {
  const { isAuthenticated, hasCompletedOnboarding, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (requireOnboarding && isAuthenticated && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;

