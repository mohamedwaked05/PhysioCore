import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import Avatar from './ui/Avatar';
import '../styles/mobile-menu.css';

/* ── Icons ───────────────────────────────────────────────────── */
function EcgLogo() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-6 4 12 2-6h10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6"  y1="6" x2="18" y2="18"/>
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
    );
}

function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2"  x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22"   x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
            <line x1="2"  y1="12" x2="5"  y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66"/>
            <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"/>
        </svg>
    );
}

function SignOutIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
    );
}

function ProfileIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/>
            <path d="M4 21v-1a8 8 0 0116 0v1"/>
        </svg>
    );
}

/* ── MobileMenu ──────────────────────────────────────────────── */
export default function MobileMenu({ isOpen, onClose, links, homeRoute, profileRoute }) {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const photoUrl = useProfilePhoto(user?.role);

    if (!isOpen) return null;

    const fullName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '';
    const isGuest  = !user;

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div className="mm-overlay" onClick={onClose} aria-hidden="true" />

            {/* Panel */}
            <div
                className="mm-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Header */}
                <div className="mm-header">
                    <Link to={homeRoute ?? '/'} className="mm-logo" onClick={onClose}>
                        <div className="mm-logo-icon"><EcgLogo /></div>
                        <span className="mm-logo-text">PhysioCore</span>
                    </Link>
                    <button className="mm-close-btn" onClick={onClose} aria-label="Close menu">
                        <CloseIcon />
                    </button>
                </div>

                {/* User info (authenticated only) */}
                {!isGuest && (
                    <div className="mm-user">
                        <Avatar size="sm" name={fullName} src={photoUrl} />
                        <div className="mm-user-info">
                            <div className="mm-user-name">{fullName}</div>
                            <div className="mm-user-role">{user.role}</div>
                        </div>
                        <button
                            className="mm-user-signout"
                            onClick={handleLogout}
                            aria-label="Sign out"
                        >
                            <SignOutIcon />
                        </button>
                    </div>
                )}

                {/* Nav links */}
                <nav className="mm-nav" aria-label="Mobile navigation">
                    {links?.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `mm-nav-link${isActive ? ' active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="mm-nav-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}

                    {/* Guest links */}
                    {isGuest && (
                        <>
                            <div className="mm-divider" />
                            <div className="mm-guest-ctas">
                                <Link to="/login"    className="mm-signin-btn"   onClick={onClose}>Sign In</Link>
                                <Link to="/register" className="mm-register-btn" onClick={onClose}>Create Account</Link>
                            </div>
                        </>
                    )}
                </nav>

                {/* Footer: theme toggle + profile */}
                <div className="mm-footer">
                    <button className="mm-footer-btn" onClick={() => toggle()}>
                        <span className="mm-footer-icon">
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </span>
                        <span>Night Mode</span>
                        <span className={`mm-theme-pill${theme === 'dark' ? ' on' : ''}`}>
                            {theme === 'dark' ? 'ON' : 'OFF'}
                        </span>
                    </button>

                    {!isGuest && profileRoute && (
                        <Link to={profileRoute} className="mm-footer-btn" onClick={onClose}>
                            <span className="mm-footer-icon"><ProfileIcon /></span>
                            <span>Profile</span>
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
