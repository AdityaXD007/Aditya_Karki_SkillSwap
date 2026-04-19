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
  const isProfileRoute = currentPath.startsWith('/profile');
  const isSettingsRoute = currentPath.startsWith('/settings');

  if (user && !user.isEmailVerified && !isProfileRoute && !isSettingsRoute && currentPath !== '/onboarding' && currentPath !== '/dashboard') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="max-w-md w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 -rotate-3">
               <rect width="20" height="16" x="2" y="4" rx="2"></rect>
               <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
             </svg>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Verification Required</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
            You need to verify your email address to access this feature, send requests, or chat with others.
          </p>
          
          <div className="space-y-3">
             {/* Note: since resend logic might require state, redirect them to check-email is easier, but here we can just show instructions */}
             <button 
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  btn.innerText = "Sending...";
                  btn.disabled = true;
                  try {
                    await fetch('http://localhost:8000/api/resend-verification/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: user.email }),
                    });
                     btn.innerText = "Sent! Check your inbox";
                     btn.classList.replace('bg-blue-600', 'bg-green-600');
                     btn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
                  } catch (err) {
                     btn.innerText = "Failed. Try again.";
                     btn.disabled = false;
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/30"
             >
                Resend Verification Email
             </button>
             <button 
                onClick={() => window.location.href = '/profile'}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold h-12 rounded-xl transition-all"
               >
                Go to Profile
             </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
