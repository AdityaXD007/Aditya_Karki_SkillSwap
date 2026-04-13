import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/components/Context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AIChatBubble } from '@/components/AIChatBubble';

// Pages
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Profile } from '@/pages/Profile';
import { Matches } from '@/pages/Matches';
import { Bookings } from '@/pages/Bookings';
import { Messages } from '@/pages/Messages';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Contact } from '@/pages/Contact';
import { Landing } from '@/pages/Landing';
import { Settings } from '@/pages/Settings';
import { Feedback } from '@/pages/Feedback';
import { PaymentCallback } from '@/pages/PaymentCallback';
import { ResetPassword } from '@/pages/ResetPassword';
import { OnboardingWizard } from '@/pages/OnboardingWizard';
import { ErrorPage } from '@/pages/ErrorPage';

// Home redirect component
const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  if (user && !user.isOnboarded) return <Navigate to="/onboarding" replace />;
  
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-callback"
              element={
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              }
            />

            {/* Root and Error Routes */}
            <Route path="/500" element={<ErrorPage code={500} />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<ErrorPage code={404} />} />
          </Routes>
          <AIChatBubble />
        </div>
      </Router>
    </AuthProvider>
  );
}