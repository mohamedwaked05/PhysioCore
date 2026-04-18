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
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import GoogleCompleteRegistrationPage from './pages/GoogleCompleteRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Guest / public pages
import LandingPage from './pages/guest/LandingPage';
import ClinicListingPage from './pages/client/ClinicListingPage';
import ClinicDetailsPage from './pages/client/ClinicDetailsPage';

// Client pages (protected)
import DashboardLayout from './pages/client/dashboard/DashboardLayout';
import StatusPage from './pages/client/dashboard/pages/StatusPage';
import TodayPage from './pages/client/dashboard/pages/TodayPage';
import WeeklyPage from './pages/client/dashboard/pages/WeeklyPage';
import MessagesPage from './pages/client/dashboard/pages/MessagesPage';
import ClientProfilePage from './pages/client/ClientProfilePage';

// Admin pages (protected)
import AdminDashboardLayout from './pages/admin/dashboard/AdminDashboardLayout';
import AdminOverviewPage    from './pages/admin/dashboard/pages/OverviewPage';
import AdminClinicsPage     from './pages/admin/dashboard/pages/ClinicsPage';
import AdminUsersPage       from './pages/admin/dashboard/pages/UsersPage';
import AdminSafetyPage      from './pages/admin/dashboard/pages/SafetyPage';

// Clinic pages (protected)
import ClinicDashboardLayout from './pages/clinic/dashboard/ClinicDashboardLayout';
import OverviewPage from './pages/clinic/dashboard/pages/OverviewPage';
import RequestsPage from './pages/clinic/dashboard/pages/RequestsPage';
import SafetyFlagsPage from './pages/clinic/dashboard/pages/SafetyFlagsPage';
import PatientsPage from './pages/clinic/dashboard/pages/PatientsPage';
import PatientFeedbackPage from './pages/clinic/dashboard/pages/PatientFeedbackPage';
import InquiriesPage from './pages/clinic/dashboard/pages/InquiriesPage';
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
                    <Route path="/email-verified"         element={<EmailVerifiedPage />} />
                    <Route path="/auth/google/callback"   element={<GoogleCallbackPage />} />
                    <Route path="/auth/google/complete"   element={<GoogleCompleteRegistrationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password"  element={<ResetPasswordPage />} />

                    {/* Client protected routes — dashboard with nested sub-pages */}
                    <Route path="/client/dashboard" element={
                        <ProtectedRoute role="client"><DashboardLayout /></ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="status" replace />} />
                        <Route path="status"   element={<StatusPage />}   />
                        <Route path="today"    element={<TodayPage />}    />
                        <Route path="weekly"   element={<WeeklyPage />}   />
                        <Route path="messages" element={<MessagesPage />} />
                    </Route>
                    <Route path="/client/profile" element={
                        <ProtectedRoute role="client"><ClientProfilePage /></ProtectedRoute>
                    } />

                    {/* Redirect old clinic sub-routes to unified public routes */}
                    <Route path="/client/clinics"     element={<Navigate to="/clinics" replace />} />
                    <Route path="/client/clinics/:id" element={<ClinicIdRedirect />} />

                    {/* Clinic protected routes — dashboard with nested sub-pages */}
                    <Route path="/clinic/dashboard" element={
                        <ProtectedRoute role="clinic"><ClinicDashboardLayout /></ProtectedRoute>
                    }>
                        <Route index element={<OverviewPage />} />
                        <Route path="requests" element={<RequestsPage />} />
                        <Route path="flags"    element={<SafetyFlagsPage />} />
                        <Route path="patients" element={<PatientsPage />} />
                        <Route path="patients/:patientId/feedback" element={<PatientFeedbackPage />} />
                        <Route path="inquiries" element={<InquiriesPage />} />
                    </Route>
                    <Route path="/clinic/profile" element={
                        <ProtectedRoute role="clinic"><ClinicProfilePage /></ProtectedRoute>
                    } />

                    {/* Legacy redirects */}
                    <Route path="/onboarding" element={<Navigate to="/client/dashboard" replace />} />
                    <Route path="/setup"      element={<Navigate to="/clinic/dashboard" replace />} />

                    {/* Admin protected routes */}
                    <Route path="/admin/dashboard" element={
                        <ProtectedRoute role="admin"><AdminDashboardLayout /></ProtectedRoute>
                    }>
                        <Route index          element={<AdminOverviewPage />} />
                        <Route path="clinics" element={<AdminClinicsPage />}  />
                        <Route path="users"   element={<AdminUsersPage />}    />
                        <Route path="safety"  element={<AdminSafetyPage />}   />
                    </Route>
                    {/* Legacy admin redirect */}
                    <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
            </AuthModalProvider>
            </BrowserRouter>
        </AuthProvider>
        </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
