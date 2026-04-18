import { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import useMobileMenu from '../hooks/useMobileMenu';
import { getNotifications, markAllNotificationsRead, markMessageRead } from '../api/messages';
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

/* ── Notification context helpers ────────────────────────── */
function notifIcon(context) {
    if (context === 'safety_alert') return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
    );
    if (context === 'inquiry') return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7b8fe8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
}

function notifRoute(item, role) {
    if (role === 'admin') {
        if (item.context === 'safety_alert') return '/admin/dashboard/safety';
        return '/admin/dashboard';
    }
    if (item.context === 'safety_alert') return '/clinic/dashboard/flags';
    if (item.context === 'inquiry')      return '/clinic/dashboard/inquiries';
    return '/clinic/dashboard/patients';
}

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Shared NavBar component ──────────────────────────────── */
export default function NavBar({ homeRoute, links, profileRoute }) {
    const { user, logout }          = useAuth();
    const { theme, toggle }         = useTheme();
    const photoUrl                  = useProfilePhoto(user?.role);
    const navigate                  = useNavigate();
    const [open, setOpen]           = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifData, setNotifData] = useState({ count: 0, has_new_messages: false, items: [] });
    const wrapRef                   = useRef(null);
    const notifRef                  = useRef(null);
    const { isOpen: menuOpen, toggle: menuToggle, close: menuClose } = useMobileMenu();

    const pollNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await getNotifications();
            setNotifData(res.data);
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
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    /* Close notification dropdown on outside click */
    useEffect(() => {
        if (!notifOpen) return;
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [notifOpen]);

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifData({ count: 0, has_new_messages: false, items: [] });
        } catch {
            // silent
        }
    };

    const handleNotifClick = (item) => {
        markMessageRead(item.id).catch(() => {});
        setNotifData(prev => {
            const items = prev.items.filter(n => n.id !== item.id);
            return { items, count: items.length, has_new_messages: items.length > 0 };
        });
        setNotifOpen(false);
        navigate(notifRoute(item, user?.role));
    };

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
                    <div style={{ position: 'relative', display: 'flex' }} ref={notifRef}>
                        <button
                            className="nav-settings-btn"
                            aria-label="Notifications"
                            title="Notifications"
                            onClick={() => {
                                if (user?.role === 'clinic' || user?.role === 'admin') {
                                    setNotifOpen(o => !o);
                                } else {
                                    navigate('/client/dashboard/messages');
                                }
                            }}
                            style={{ position: 'relative' }}
                        >
                            <BellIcon />
                            {notifData.count > 0 && (
                                <span style={{
                                    position: 'absolute', top: 3, right: 3,
                                    minWidth: 16, height: 16, borderRadius: 999,
                                    background: '#ef4444',
                                    border: '1.5px solid var(--surface)',
                                    fontSize: '0.6rem', fontWeight: 700,
                                    color: '#fff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    lineHeight: 1, padding: '0 3px',
                                }}>
                                    {notifData.count > 99 ? '99+' : notifData.count}
                                </span>
                            )}
                        </button>

                        {/* Notification dropdown (clinic + admin) */}
                        {(user?.role === 'clinic' || user?.role === 'admin') && notifOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                width: 320, background: 'var(--surface)',
                                border: '0.5px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 1000, overflow: 'hidden',
                            }}>
                                {/* Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    borderBottom: '0.5px solid var(--border-light)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                                            Notifications
                                        </span>
                                        {notifData.count > 0 && (
                                            <span style={{
                                                background: '#ef4444', color: '#fff',
                                                fontSize: '0.65rem', fontWeight: 700,
                                                padding: '1px 6px', borderRadius: 999,
                                            }}>
                                                {notifData.count}
                                            </span>
                                        )}
                                    </div>
                                    {notifData.count > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            style={{
                                                fontSize: '0.73rem', color: 'var(--primary)',
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', fontWeight: 600, padding: 0,
                                            }}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Items */}
                                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                    {notifData.items.length === 0 ? (
                                        <div style={{
                                            padding: '2rem 1rem', textAlign: 'center',
                                            color: 'var(--text-muted)', fontSize: '0.82rem',
                                        }}>
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifData.items.map((item, i) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNotifClick(item)}
                                                style={{
                                                    width: '100%', display: 'flex', gap: '0.75rem',
                                                    alignItems: 'flex-start', padding: '0.75rem 1rem',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    textAlign: 'left',
                                                    borderBottom: i < notifData.items.length - 1
                                                        ? '0.5px solid var(--border-light)' : 'none',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-dim)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                {/* Icon bubble */}
                                                <div style={{
                                                    flexShrink: 0, width: 30, height: 30,
                                                    borderRadius: '50%',
                                                    background: item.context === 'safety_alert'
                                                        ? 'rgba(220,38,38,0.1)'
                                                        : item.context === 'inquiry'
                                                            ? 'rgba(59,130,246,0.1)'
                                                            : 'rgba(123,143,232,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {notifIcon(item.context)}
                                                </div>

                                                {/* Text */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {item.sender}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                            {timeAgo(item.created_at)}
                                                        </span>
                                                    </div>
                                                    <p style={{
                                                        fontSize: '0.75rem', color: 'var(--text-secondary)',
                                                        margin: 0, lineHeight: 1.4,
                                                        display: '-webkit-box', WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                    }}>
                                                        {item.content}
                                                    </p>
                                                    <span style={{
                                                        marginTop: '0.3rem', display: 'inline-block',
                                                        fontSize: '0.68rem', fontWeight: 600,
                                                        color: item.context === 'safety_alert' ? '#dc2626'
                                                            : item.context === 'inquiry' ? '#3b82f6'
                                                            : 'var(--primary)',
                                                    }}>
                                                        {item.context === 'safety_alert' ? '⚠ Safety Alert'
                                                            : item.context === 'inquiry' ? 'Inquiry'
                                                            : item.context === 'treatment' ? 'Treatment'
                                                            : 'Feedback'}
                                                    </span>
                                                </div>

                                                {/* Unread dot */}
                                                <div style={{
                                                    flexShrink: 0, width: 7, height: 7,
                                                    borderRadius: '50%', background: '#ef4444',
                                                    marginTop: 6,
                                                }} />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
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
