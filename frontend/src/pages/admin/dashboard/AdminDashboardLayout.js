import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getAdminStats } from '../../../api/admin';
import AdminLayout from '../../../components/AdminLayout';
import '../../../styles/admin-dashboard.css';

function OverviewIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
    );
}

function ClinicsIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V7l9-4 9 4v14"/><rect x="9" y="13" width="6" height="8"/><path d="M10 6h4M12 4v4"/>
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
    );
}

export default function AdminDashboardLayout() {
    const { user }   = useAuth();
    const [counts, setCounts] = useState(null);

    useEffect(() => {
        getAdminStats()
            .then(res => setCounts(res.data))
            .catch(() => {});
    }, []);

    const pendingClinics = counts?.clinics?.pending ?? null;

    const subnav = [
        { to: '.',       end: true,  label: 'Overview', icon: <OverviewIcon />, badge: null },
        { to: 'clinics', end: false, label: 'Clinics',  icon: <ClinicsIcon />, badge: pendingClinics || null },
        { to: 'users',   end: false, label: 'Users',    icon: <UsersIcon />,   badge: null },
    ];

    return (
        <AdminLayout>
            <div className="adm-layout">
                <div className="adm-header">
                    <h1 className="adm-title">Admin Dashboard</h1>
                    <p className="adm-subtitle">
                        Welcome, {user?.first_name ?? 'Admin'} — manage clinics, users, and system safety.
                    </p>
                </div>

                <div className="adm-subnav-wrapper">
                    <nav className="adm-subnav" aria-label="Admin sections">
                        {subnav.map(({ to, end, label, icon, badge }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) => `adm-subnav-link${isActive ? ' active' : ''}`}
                            >
                                <span className="adm-subnav-icon">{icon}</span>
                                {label}
                                {badge !== null && (
                                    <span className="adm-subnav-badge">{badge}</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <Outlet />
            </div>
        </AdminLayout>
    );
}
