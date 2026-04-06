import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModalProvider } from './context/AuthModalContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import GoogleCompleteRegistrationPage from './pages/GoogleCompleteRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Guest / public pages
import LandingPage from './pages/guest/LandingPage';
import ClinicListingPage from './pages/client/ClinicListingPage';
import ClinicDetailsPage from './pages/client/ClinicDetailsPage';

// Client pages (protected)
import ClientDashboardPage from './pages/client/ClientDashboardPage';
import ClientProfilePage from './pages/client/ClientProfilePage';

// Clinic pages (protected)
import ClinicDashboardPage from './pages/clinic/ClinicDashboardPage';
import ClinicProfilePage from './pages/clinic/ClinicProfilePage';

// Forwards /client/clinics/:id → /clinics/:id preserving the param
function ClinicIdRedirect() {
    const { id } = useParams();
    return <Navigate to={`/clinics/${id}`} replace />;
}

function App() {
    return (
        <ThemeProvider>
        <ToastProvider>
        <AuthProvider>
            <BrowserRouter>
            {/* AuthModalProvider must be inside BrowserRouter — the modal uses Link */}
            <AuthModalProvider>
                <Routes>
                    {/* Landing page — guest entry point (auth-aware, redirects by role) */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Public clinic browsing — no login required */}
                    <Route path="/clinics"     element={<ClinicListingPage />} />
                    <Route path="/clinics/:id" element={<ClinicDetailsPage />} />

                    {/* Auth routes */}
                    <Route path="/login"    element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email/:id/:hash" element={<VerifyEmailPage />} />
                    <Route path="/auth/google/callback"   element={<GoogleCallbackPage />} />
                    <Route path="/auth/google/complete"   element={<GoogleCompleteRegistrationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password"  element={<ResetPasswordPage />} />

                    {/* Client protected routes */}
                    <Route path="/client/dashboard" element={
                        <ProtectedRoute role="client"><ClientDashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/client/profile" element={
                        <ProtectedRoute role="client"><ClientProfilePage /></ProtectedRoute>
                    } />

                    {/* Redirect old clinic sub-routes to unified public routes */}
                    <Route path="/client/clinics"     element={<Navigate to="/clinics" replace />} />
                    <Route path="/client/clinics/:id" element={<ClinicIdRedirect />} />

                    {/* Clinic protected routes */}
                    <Route path="/clinic/dashboard" element={
                        <ProtectedRoute role="clinic"><ClinicDashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/clinic/profile" element={
                        <ProtectedRoute role="clinic"><ClinicProfilePage /></ProtectedRoute>
                    } />

                    {/* Legacy redirects */}
                    <Route path="/onboarding" element={<Navigate to="/client/dashboard" replace />} />
                    <Route path="/setup"      element={<Navigate to="/clinic/dashboard" replace />} />

                    {/* Admin placeholder */}
                    <Route path="/dashboard" element={<h1>Admin Dashboard (Sprint 4)</h1>} />
                </Routes>
            </AuthModalProvider>
            </BrowserRouter>
        </AuthProvider>
        </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
