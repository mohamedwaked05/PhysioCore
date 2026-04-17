import { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import useMobileMenu from '../hooks/useMobileMenu';
import { getNotifications } from '../api/messages';
import Avatar from './ui/Avatar';
import MobileMenu from './MobileMenu';

const NOTIF_POLL = 12000;

/* ── Brand logo (ECG pulse line) ──────────────────────────── */
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

/* ── Settings gear ────────────────────────────────────────── */
function GearIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
    );
}

/* ── Dropdown item icons ──────────────────────────────────── */
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
            <line x1="12" y1="2" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
            <line x1="2" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
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
function SignOutIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
    );
}

/* ── Bell icon ────────────────────────────────────────────── */
function BellIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
    );
}

/* ── Shared NavBar component ──────────────────────────────── */
export default function NavBar({ homeRoute, links, profileRoute }) {
    const { user, logout }          = useAuth();
    const { theme, toggle }         = useTheme();
    const photoUrl                  = useProfilePhoto(user?.role);
    const navigate                  = useNavigate();
    const [open, setOpen]           = useState(false);
    const [hasMessages, setHasMessages] = useState(false);
    const wrapRef                   = useRef(null);
    const { isOpen: menuOpen, toggle: menuToggle, close: menuClose } = useMobileMenu();

    const pollNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await getNotifications();
            setHasMessages(res.data.has_new_messages);
        } catch {
            // silent
        }
    }, [user]);

    useEffect(() => {
        pollNotifications();
        const id = setInterval(pollNotifications, NOTIF_POLL);
        return () => clearInterval(id);
    }, [pollNotifications]);

    const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

    /* Close settings dropdown on outside click */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <>
            <nav className="client-nav">
                {/* ── Logo ── */}
                <NavLink to={homeRoute} className="client-nav-logo">
                    <div className="client-nav-logo-icon">
                        <EcgLogo />
                    </div>
                    <span className="client-nav-logo-text">PhysioCore</span>
                </NavLink>

                {/* ── Nav links (desktop only) ── */}
                <div className="client-nav-links">
                    {links.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => 'client-nav-link' + (isActive ? ' active' : '')}
                        >
                            <span className="nav-link-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* ── Right: avatar + settings (desktop) + burger (mobile) ── */}
                <div className="client-nav-right">
                    {/* Desktop: user chip + settings */}
                    <div className="client-nav-user-chip">
                        <Avatar size="sm" name={fullName} src={photoUrl} />
                        <span className="client-nav-user">{fullName}</span>
                    </div>

                    {/* Notification bell */}
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <button
                            className="nav-settings-btn"
                            aria-label="Notifications"
                            title="Messages"
                            onClick={() => navigate(
                                user?.role === 'client' ? '/client/dashboard/messages' : '/clinic/dashboard'
                            )}
                            style={{ position: 'relative' }}
                        >
                            <BellIcon />
                            {hasMessages && (
                                <span style={{
                                    position: 'absolute', top: 6, right: 6,
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#ef4444',
                                    border: '1.5px solid var(--surface)',
                                }} />
                            )}
                        </button>
                    </div>

                    <div className="nav-settings-wrap" ref={wrapRef}>
                        <button
                            className={`nav-settings-btn${open ? ' open' : ''}`}
                            onClick={() => setOpen(o => !o)}
                            aria-label="Settings"
                            title="Settings"
                        >
                            <GearIcon />
                        </button>

                        {open && (
                            <div className="nav-settings-dropdown" role="menu">
                                {/* Night Mode */}
                                <button
                                    className="nav-settings-item"
                                    role="menuitem"
                                    onClick={() => toggle()}
                                >
                                    <span className="nav-settings-item-icon">
                                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                                    </span>
                                    <span>Night Mode</span>
                                    <span className={`nav-settings-pill${theme === 'dark' ? ' on' : ''}`}>
                                        {theme === 'dark' ? 'ON' : 'OFF'}
                                    </span>
                                </button>

                                {/* Profile */}
                                <button
                                    className="nav-settings-item"
                                    role="menuitem"
                                    onClick={() => { navigate(profileRoute); setOpen(false); }}
                                >
                                    <span className="nav-settings-item-icon"><ProfileIcon /></span>
                                    <span>Profile</span>
                                </button>

                                <div className="nav-settings-divider" />

                                {/* Sign Out */}
                                <button
                                    className="nav-settings-item danger"
                                    role="menuitem"
                                    onClick={() => { setOpen(false); logout(); }}
                                >
                                    <span className="nav-settings-item-icon"><SignOutIcon /></span>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile burger button */}
                    <button
                        className={`burger-btn${menuOpen ? ' open' : ''}`}
                        onClick={menuToggle}
                        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                    >
                        <span className="burger-bar" />
                        <span className="burger-bar" />
                        <span className="burger-bar" />
                    </button>
                </div>
            </nav>

            {/* Mobile slide-in menu */}
            <MobileMenu
                isOpen={menuOpen}
                onClose={menuClose}
                links={links}
                homeRoute={homeRoute}
                profileRoute={profileRoute}
            />
        </>
    );
}
