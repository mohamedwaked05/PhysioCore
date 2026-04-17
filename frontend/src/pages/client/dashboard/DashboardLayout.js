import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ClientLayout from '../../../components/ClientLayout';
import '../../../styles/dashboard.css';

function StatusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
    );
}

function TodayIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
            <line x1="12" y1="15" x2="12" y2="15" strokeWidth="3"/>
        </svg>
    );
}

function WeeklyIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
            <line x1="8"  y1="14" x2="16" y2="14"/>
            <line x1="8"  y1="18" x2="14" y2="18"/>
        </svg>
    );
}

function MessagesIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
}

const subnav = [
    { to: 'status',   label: 'Status',      icon: <StatusIcon />   },
    { to: 'today',    label: 'Today',        icon: <TodayIcon />    },
    { to: 'weekly',   label: 'Weekly Plan',  icon: <WeeklyIcon />   },
    { to: 'messages', label: 'Messages',     icon: <MessagesIcon /> },
];

export default function DashboardLayout() {
    const { user } = useAuth();

    return (
        <ClientLayout>
            <div className="cd-layout">
                {/* ── Page Header ─── */}
                <div className="cd-header">
                    <h1 className="cd-title">
                        Recovery Dashboard
                    </h1>
                    <p className="cd-subtitle">
                        Welcome back, {user?.first_name ?? 'there'} — track your rehabilitation progress.
                    </p>
                </div>

                {/* ── Sub Navigation ─── */}
                <div className="cd-subnav-wrapper">
                    <nav className="cd-subnav" aria-label="Dashboard sections">
                        {subnav.map(({ to, label, icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `cd-subnav-link${isActive ? ' active' : ''}`}
                            >
                                <span className="cd-subnav-icon">{icon}</span>
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* ── Page Content (nested route) ─── */}
                <Outlet />
            </div>
        </ClientLayout>
    );
}
