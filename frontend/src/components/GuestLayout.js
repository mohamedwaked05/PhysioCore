import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NavBar from './NavBar';
import MobileMenu from './MobileMenu';
import useMobileMenu from '../hooks/useMobileMenu';
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
function HomeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
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

/* ── New ECG logo icon ────────────────────────────────────── */
function EcgLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
                d="M2 12h4l2-6 4 12 2-6h10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
            />
        </svg>
    );
}

const GUEST_LINKS = [
    { to: '/',       label: 'Home',          icon: <HomeIcon />        },
    { to: '/clinics', label: 'Find a Clinic', icon: <FindClinicIcon /> },
];

export default function GuestLayout({ children }) {
    const { user }   = useAuth();
    const navigate   = useNavigate();
    const location   = useLocation();
    const { isOpen: menuOpen, toggle: menuToggle, close: menuClose } = useMobileMenu();

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
                <NavLink to="/" className="client-nav-logo">
                    <div className="client-nav-logo-icon">
                        <EcgLogo />
                    </div>
                    <span className="client-nav-logo-text">PhysioCore</span>
                </NavLink>

                {/* Desktop links */}
                <div className="client-nav-links">
                    <NavLink
                        to="/clinics"
                        className={({ isActive }) => 'client-nav-link' + (isActive ? ' active' : '')}
                    >
                        <span className="nav-link-icon"><FindClinicIcon /></span>
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

                    {/* Mobile burger */}
                    <button
                        className={`burger-btn${menuOpen ? ' open' : ''}`}
                        onClick={menuToggle}
                        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={menuOpen}
                    >
                        <span className="burger-bar" />
                        <span className="burger-bar" />
                        <span className="burger-bar" />
                    </button>
                </div>
            </nav>

            {/* Mobile menu (guest mode) */}
            <MobileMenu
                isOpen={menuOpen}
                onClose={menuClose}
                links={GUEST_LINKS}
                homeRoute="/"
                profileRoute={null}
            />

            <main className="guest-main">{children}</main>
        </div>
    );
}
