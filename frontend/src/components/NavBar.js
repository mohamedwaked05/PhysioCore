import { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import useMobileMenu from '../hooks/useMobileMenu';
import { useNotifications } from '../hooks/useNotifications';
import Avatar from './ui/Avatar';
import MobileMenu from './MobileMenu';

/* ── Brand logo ───────────────────────────────────────────── */
function EcgLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-6 4 12 2-6h10" stroke="white" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
        </svg>
    );
}

/* ── Inline SVG icons ─────────────────────────────────────── */
function GearIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
    );
}
function MoonIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
}
function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
            <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
        </svg>
    );
}
function ProfileIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/>
        </svg>
    );
}
function SignOutIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
    );
}
function BellIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
    );
}

/* ── Notification display helpers ─────────────────────────── */
const COLORS = {
    safety:   { bg: 'rgba(220,38,38,0.1)',   text: '#dc2626' },
    approved: { bg: 'rgba(22,163,74,0.1)',   text: '#16a34a' },
    rejected: { bg: 'rgba(220,38,38,0.1)',   text: '#dc2626' },
    inquiry:  { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6' },
    default:  { bg: 'rgba(123,143,232,0.1)', text: 'var(--primary)' },
};

function notifColor(type, ctx) {
    if (type === 'safety_flag' || ctx === 'safety_alert') return COLORS.safety;
    if (type === 'clinic_approved' || type === 'user_activated') return COLORS.approved;
    if (type === 'clinic_rejected' || type === 'user_suspended') return COLORS.rejected;
    if (ctx === 'inquiry') return COLORS.inquiry;
    return COLORS.default;
}

function NotifIcon({ type, ctx, size = 13 }) {
    const color = notifColor(type, ctx).text;
    if (type === 'safety_flag' || ctx === 'safety_alert') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
    );
    if (type === 'clinic_approved' || type === 'user_activated') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
    if (type === 'clinic_rejected' || type === 'user_suspended') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
    );
    if (ctx === 'inquiry') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
}

function notifTitle(type, data) {
    if (type === 'message')         return data?.sender_name ?? 'New message';
    if (type === 'safety_flag')     return data?.patient_name ?? 'Safety Alert';
    if (type === 'clinic_approved') return 'Clinic Application Approved';
    if (type === 'clinic_rejected') return 'Clinic Application Rejected';
    if (type === 'user_suspended')  return 'Account Suspended';
    if (type === 'user_activated')  return 'Account Reactivated';
    return 'Notification';
}

function notifBody(type, data) {
    if (type === 'message')         return data?.content ?? '';
    if (type === 'safety_flag')     return data?.flag_reason ?? 'Safety concern detected.';
    if (type === 'clinic_approved') return `Your clinic "${data?.clinic_name}" has been approved and is now active.`;
    if (type === 'clinic_rejected') return data?.rejection_reason ?? 'Your application was not approved.';
    if (type === 'user_suspended')  return 'Your account has been suspended. Please contact support.';
    if (type === 'user_activated')  return 'Your account has been reactivated.';
    return '';
}

function notifLabel(type, ctx) {
    if (type === 'safety_flag' || ctx === 'safety_alert') return { text: '⚠ Safety Alert', color: '#dc2626' };
    if (type === 'clinic_approved') return { text: '✓ Approved', color: '#16a34a' };
    if (type === 'clinic_rejected') return { text: '✕ Rejected', color: '#dc2626' };
    if (type === 'user_suspended')  return { text: 'Suspended', color: '#dc2626' };
    if (type === 'user_activated')  return { text: '✓ Activated', color: '#16a34a' };
    if (ctx === 'inquiry')          return { text: 'Inquiry', color: '#3b82f6' };
    if (ctx === 'treatment')        return { text: 'Treatment', color: 'var(--primary)' };
    if (ctx === 'safety_alert')     return { text: '⚠ Safety Alert', color: '#dc2626' };
    return { text: 'Message', color: 'var(--primary)' };
}

function resolveRoute(type, data, role) {
    if (type === 'safety_flag' || data?.context === 'safety_alert') {
        return role === 'admin' ? '/admin/dashboard/safety' : '/clinic/dashboard/flags';
    }
    if (type === 'clinic_approved' || type === 'clinic_rejected') return '/clinic/dashboard';
    if (type === 'user_suspended' || type === 'user_activated')    return `/${role}/dashboard`;
    if (type === 'message') {
        const ctx = data?.context;
        if (role === 'client') return '/client/dashboard/messages';
        if (role === 'admin')  return '/admin/dashboard';
        if (ctx === 'inquiry') return '/clinic/dashboard/inquiries';
        return '/clinic/dashboard/patients';
    }
    return `/${role}/dashboard`;
}

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Notification grouping ────────────────────────────────── */
const GROUP_THRESHOLD = 3;

function buildGroups(items) {
    const groups = [];
    const byKey  = new Map();

    for (const item of items) {
        const ctx = item.data?.context;
        const key = item.type === 'message' ? `msg_${ctx ?? 'other'}` : item.type;

        if (!byKey.has(key)) {
            const group = { key, type: item.type, ctx, items: [], unread: 0 };
            byKey.set(key, group);
            groups.push(group);
        }
        const g = byKey.get(key);
        g.items.push(item);
        if (item.status !== 'seen') g.unread++;
    }

    return groups;
}

function GroupRow({ group, role, onGroupClick }) {
    const col    = notifColor(group.type, group.ctx);
    const label  = notifLabel(group.type, group.ctx);
    const latest = group.items[0];

    const headerText = () => {
        if (group.type === 'message') {
            const ctx = group.ctx;
            if (ctx === 'safety_alert') return `${group.items.length} safety alert messages`;
            if (ctx === 'inquiry')      return `${group.items.length} new inquiries`;
            return `${group.items.length} new messages`;
        }
        if (group.type === 'safety_flag') return `${group.items.length} safety flags`;
        return notifTitle(group.type, latest.data);
    };

    return (
        <button
            onClick={() => onGroupClick(group)}
            style={{
                width: '100%', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                padding: '0.75rem 1rem', background: group.unread > 0 ? 'rgba(123,143,232,0.04)' : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = group.unread > 0 ? 'rgba(123,143,232,0.04)' : 'none'}
        >
            <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                <NotifIcon type={group.type} ctx={group.ctx} />
                {group.items.length > 1 && (
                    <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        minWidth: 14, height: 14, borderRadius: 999,
                        background: col.text, color: '#fff',
                        fontSize: '0.55rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--surface)', padding: '0 2px',
                    }}>{group.items.length}</span>
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {headerText()}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {timeAgo(latest.created_at)}
                    </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {group.items.length > 1
                        ? notifBody(latest.type, latest.data)
                        : notifBody(group.type, latest.data)}
                </p>
                <span style={{ marginTop: '0.3rem', display: 'inline-block', fontSize: '0.68rem', fontWeight: 600, color: label.color }}>
                    {label.text}
                </span>
            </div>

            {group.unread > 0 && (
                <div style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginTop: 6 }} />
            )}
        </button>
    );
}

/* ── Shared NavBar ────────────────────────────────────────── */
export default function NavBar({ homeRoute, links, profileRoute }) {
    const { user, logout }          = useAuth();
    const { theme, toggle }         = useTheme();
    const photoUrl                  = useProfilePhoto(user?.role);
    const navigate                  = useNavigate();
    const [open, setOpen]           = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const wrapRef                   = useRef(null);
    const notifRef                  = useRef(null);
    const { isOpen: menuOpen, toggle: menuToggle, close: menuClose } = useMobileMenu();

    const { items, unreadCount, markSeen, markAllSeen } = useNotifications(user);

    const groups = useMemo(() => buildGroups(items), [items]);

    const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

    // Keep a ref so the dropdown-open effect always reads the latest count
    // without re-running every time the badge number changes
    const unreadCountRef = useRef(unreadCount);
    useEffect(() => { unreadCountRef.current = unreadCount; }, [unreadCount]);

    // Close settings dropdown on outside click
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    // Close notification dropdown on outside click
    useEffect(() => {
        if (!notifOpen) return;
        const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [notifOpen]);

    // Mark all seen when the dropdown opens.
    // Debounced 350ms so any in-flight WS state updates settle first
    // (prevents race where markAllSeen fires before new notification lands in state)
    useEffect(() => {
        if (!notifOpen) return;
        if (unreadCountRef.current === 0) return;
        const timer = setTimeout(markAllSeen, 350);
        return () => clearTimeout(timer);
    }, [notifOpen, markAllSeen]);

    const handleGroupClick = (group) => {
        // Mark all items in the group as seen
        const route = resolveRoute(group.type, group.items[0]?.data, user?.role);
        for (const item of group.items) {
            if (item.status !== 'seen') markSeen(item.id);
        }
        setNotifOpen(false);
        navigate(route);
    };

    const handleBellClick = () => {
        setNotifOpen(o => !o);
    };

    return (
        <>
            <nav className="client-nav">
                {/* ── Logo ── */}
                <NavLink to={homeRoute} className="client-nav-logo">
                    <div className="client-nav-logo-icon"><EcgLogo /></div>
                    <span className="client-nav-logo-text">PhysioCore</span>
                </NavLink>

                {/* ── Nav links ── */}
                <div className="client-nav-links">
                    {links.map(({ to, label, icon }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => 'client-nav-link' + (isActive ? ' active' : '')}>
                            <span className="nav-link-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* ── Right side ── */}
                <div className="client-nav-right">
                    <div className="client-nav-user-chip">
                        <Avatar size="sm" name={fullName} src={photoUrl} />
                        <span className="client-nav-user">{fullName}</span>
                    </div>

                    {/* ── Notification bell ── */}
                    <div style={{ position: 'relative', display: 'flex' }} ref={notifRef}>
                        <button className="nav-settings-btn" aria-label="Notifications" title="Notifications"
                            onClick={handleBellClick} style={{ position: 'relative' }}>
                            <BellIcon />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: 3, right: 3,
                                    minWidth: 16, height: 16, borderRadius: 999,
                                    background: '#ef4444', border: '1.5px solid var(--surface)',
                                    fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    lineHeight: 1, padding: '0 3px',
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {notifOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                width: 340, background: 'var(--surface)',
                                border: '0.5px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden',
                            }}>
                                {/* Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', borderBottom: '0.5px solid var(--border-light)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                                            Notifications
                                        </span>
                                        {groups.reduce((s, g) => s + g.unread, 0) > 0 && (
                                            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>
                                                {groups.reduce((s, g) => s + g.unread, 0)}
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                                    </span>
                                </div>

                                {/* Groups */}
                                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                                    {groups.length === 0 ? (
                                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                            No new notifications
                                        </div>
                                    ) : (
                                        groups.map((group, i) => (
                                            <div key={group.key} style={{ borderBottom: i < groups.length - 1 ? '0.5px solid var(--border-light)' : 'none' }}>
                                                <GroupRow group={group} role={user?.role} onGroupClick={handleGroupClick} />

                                                {/* Show individual items when group is small enough */}
                                                {group.items.length <= GROUP_THRESHOLD && group.items.length > 1 && (
                                                    <div style={{ paddingLeft: '1rem', borderTop: '0.5px solid var(--border-light)' }}>
                                                        {group.items.map((item, j) => (
                                                            <button key={item.id}
                                                                onClick={() => { markSeen(item.id); setNotifOpen(false); navigate(resolveRoute(item.type, item.data, user?.role)); }}
                                                                style={{
                                                                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                                    padding: '0.45rem 1rem 0.45rem 0',
                                                                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                                                                    borderBottom: j < group.items.length - 1 ? '0.5px solid var(--border-light)' : 'none',
                                                                    opacity: item.status === 'seen' ? 0.6 : 1,
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-dim)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                            >
                                                                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {notifTitle(item.type, item.data)}
                                                                </span>
                                                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                                    {timeAgo(item.created_at)}
                                                                </span>
                                                                {item.status !== 'seen' && (
                                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Settings gear ── */}
                    <div className="nav-settings-wrap" ref={wrapRef}>
                        <button className={`nav-settings-btn${open ? ' open' : ''}`}
                            onClick={() => setOpen(o => !o)} aria-label="Settings" title="Settings">
                            <GearIcon />
                        </button>
                        {open && (
                            <div className="nav-settings-dropdown" role="menu">
                                <button className="nav-settings-item" role="menuitem" onClick={toggle}>
                                    <span className="nav-settings-item-icon">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
                                    <span>Night Mode</span>
                                    <span className={`nav-settings-pill${theme === 'dark' ? ' on' : ''}`}>{theme === 'dark' ? 'ON' : 'OFF'}</span>
                                </button>
                                <button className="nav-settings-item" role="menuitem" onClick={() => { navigate(profileRoute); setOpen(false); }}>
                                    <span className="nav-settings-item-icon"><ProfileIcon /></span>
                                    <span>Profile</span>
                                </button>
                                <div className="nav-settings-divider" />
                                <button className="nav-settings-item danger" role="menuitem" onClick={() => { setOpen(false); logout(); }}>
                                    <span className="nav-settings-item-icon"><SignOutIcon /></span>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Mobile burger ── */}
                    <button className={`burger-btn${menuOpen ? ' open' : ''}`} onClick={menuToggle}
                        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={menuOpen} aria-controls="mobile-menu">
                        <span className="burger-bar" /><span className="burger-bar" /><span className="burger-bar" />
                    </button>
                </div>
            </nav>

            <MobileMenu isOpen={menuOpen} onClose={menuClose} links={links} homeRoute={homeRoute} profileRoute={profileRoute} />
        </>
    );
}
