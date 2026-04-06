import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const currentPath = window.location.pathname;

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not onboarded, redirect to onboarding
  // Allow access to /onboarding even if not onboarded
  if (user && !user.isOnboarded && currentPath !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If already onboarded and trying to go to onboarding, go to dashboard
  if (user && user.isOnboarded && currentPath === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if authenticated and (onboarded or on onboarding page)
  return <>{children}</>;
};
