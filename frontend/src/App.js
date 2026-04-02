import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import GoogleCompleteRegistrationPage from './pages/GoogleCompleteRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email/:id/:hash" element={<VerifyEmailPage />} />
                    <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                    <Route path="/auth/google/complete" element={<GoogleCompleteRegistrationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Placeholder routes for post-login */}
                    <Route path="/onboarding" element={<h1>Client Onboarding (Sprint 2)</h1>} />
                    <Route path="/setup" element={<h1>Clinic Setup (Sprint 2)</h1>} />
                    <Route path="/dashboard" element={<h1>Admin Dashboard (Sprint 2)</h1>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
