import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NavBar from './NavBar';
import Chatbot from './Chatbot';
import PhysioCoreLogo from './PhysioCoreLogo';
import '../styles/client.css';
import '../styles/guest.css';

/* ── Icon definitions (shared with layouts) ──────────────── */
function DashboardIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
    );
}
function ProfileIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/>
            <path d="M4 21v-1a8 8 0 0116 0v1"/>
        </svg>
    );
}
function BrowseClinicsIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="10.5" r="7.5"/>
            <path d="M21 21l-4.35-4.35"/>
            <path d="M10.5 7.5v6M7.5 10.5h6"/>
        </svg>
    );
}
function ClinicProfileIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V7l9-4 9 4v14"/>
            <rect x="9" y="13" width="6" height="8"/>
            <path d="M10 6h4M12 4v4"/>
        </svg>
    );
}
function FindClinicIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="10.5" r="7.5"/>
            <path d="M21 21l-4.35-4.35"/>
            <path d="M10.5 7.5v6M7.5 10.5h6"/>
        </svg>
    );
}

/* ── Guest-only theme toggle (no dropdown, no user) ─────── */
function GuestThemeToggle() {
    const { theme, toggle } = useTheme();
    return (
        <button
            className="client-theme-toggle"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1"  x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1"  y1="12" x2="3"  y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
                    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
                </svg>
            ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
            )}
        </button>
    );
}

export default function GuestLayout({ children }) {
    const { user }   = useAuth();
    const navigate   = useNavigate();
    const location   = useLocation();

    /* ── Authenticated client ───────────────────────────── */
    if (user?.role === 'client') {
        return (
            <div className="client-shell">
                <NavBar
                    homeRoute="/client/dashboard"
                    links={[
                        { to: '/client/dashboard', label: 'Dashboard',      icon: <DashboardIcon /> },
                        { to: '/client/profile',   label: 'Profile',        icon: <ProfileIcon /> },
                        { to: '/clinics',           label: 'Browse Clinics', icon: <BrowseClinicsIcon /> },
                    ]}
                    profileRoute="/client/profile"
                />
                <main className="guest-main">{children}</main>
                <Chatbot />
            </div>
        );
    }

    /* ── Authenticated clinic ───────────────────────────── */
    if (user?.role === 'clinic') {
        return (
            <div className="client-shell">
                <NavBar
                    homeRoute="/clinic/dashboard"
                    links={[
                        { to: '/clinic/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
                        { to: '/clinic/profile',   label: 'Profile',   icon: <ClinicProfileIcon /> },
                    ]}
                    profileRoute="/clinic/profile"
                />
                <main className="guest-main">{children}</main>
            </div>
        );
    }

    /* ── Guest (unauthenticated) ────────────────────────── */
    return (
        <div className="guest-shell">
            <nav className="client-nav">
                <NavLink to="/" className="client-nav-logo" style={{ textDecoration: 'none' }}>
                    <PhysioCoreLogo />
                </NavLink>

                {/* Desktop links */}
                <div className="client-nav-links">
                    <NavLink to="/clinics" className="guest-find-clinic-btn">
                        <FindClinicIcon />
                        Find a Clinic
                    </NavLink>
                </div>

                {/* Desktop right actions */}
                <div className="client-nav-right">
                    <div className="client-nav-desktop-actions">
                        <GuestThemeToggle />
                        <button
                            className="guest-signin-btn"
                            onClick={() => navigate('/login', { state: { from: location } })}
                        >
                            Sign in
                        </button>
                    </div>

                    {/* Mobile-only: Find a Clinic visible without opening menu */}
                    <NavLink to="/clinics" className="guest-mobile-find-btn">
                        <FindClinicIcon />
                        Find Clinics
                    </NavLink>
                </div>
            </nav>

            <main className="guest-main">{children}</main>
            <Chatbot />
        </div>
    );
}
