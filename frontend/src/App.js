import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import GoogleCompleteRegistrationPage from './pages/GoogleCompleteRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Client pages
import ClientDashboardPage from './pages/client/ClientDashboardPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClinicListingPage from './pages/client/ClinicListingPage';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/login" />} />

                    {/* Auth routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email/:id/:hash" element={<VerifyEmailPage />} />
                    <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                    <Route path="/auth/google/complete" element={<GoogleCompleteRegistrationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Client routes */}
                    <Route path="/client/dashboard" element={
                        <ProtectedRoute role="client"><ClientDashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/client/profile" element={
                        <ProtectedRoute role="client"><ClientProfilePage /></ProtectedRoute>
                    } />
                    <Route path="/client/clinics" element={
                        <ProtectedRoute role="client"><ClinicListingPage /></ProtectedRoute>
                    } />

                    {/* Legacy redirect from Sprint 1 placeholder */}
                    <Route path="/onboarding" element={<Navigate to="/client/dashboard" replace />} />

                    {/* Placeholder routes for future sprints */}
                    <Route path="/setup" element={<h1>Clinic Setup (Sprint 3)</h1>} />
                    <Route path="/dashboard" element={<h1>Admin Dashboard (Sprint 3)</h1>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
