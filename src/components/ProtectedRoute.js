import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = false, requireOnboarding = false, preventIfOnboardingComplete = false }) => {
  const { isAuthenticated, hasCompletedOnboarding, loading } = useAuth();

  // Wait for auth to finish loading
  if (loading) {
    return <div>Loading...</div>;
  }

  // Only require auth if explicitly set (guests can access routes with requireAuth=false)
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Only require onboarding for authenticated users (guests don't need onboarding)
  if (requireOnboarding && isAuthenticated && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding and tries to access onboarding page, redirect to dashboard
  if (preventIfOnboardingComplete && isAuthenticated && hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

