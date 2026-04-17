import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getClinicProfile, getDashboardCounts } from '../../../api/clinic';
import ClinicLayout from '../../../components/ClinicLayout';
import '../../../styles/clinic-dashboard.css';

function OverviewIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
    );
}

function RequestsIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 .02h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
    );
}

function FlagsIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
    );
}

function PatientsIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
    );
}

function InquiriesIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
}

export default function ClinicDashboardLayout() {
    const { user } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [counts, setCounts] = useState(null);

    useEffect(() => {
        getClinicProfile()
            .then(res => setVerificationStatus(res.data?.verification_status ?? 'pending'))
            .catch(() => {});

        getDashboardCounts()
            .then(res => setCounts(res.data))
            .catch(() => setCounts(null));
    }, []);

    // Poll while pending
    useEffect(() => {
        if (verificationStatus !== 'pending') return;
        const interval = setInterval(() => {
            getClinicProfile()
                .then(res => {
                    const s = res.data?.verification_status;
                    if (s && s !== 'pending') setVerificationStatus(s);
                })
                .catch(() => {});
        }, 8000);
        return () => clearInterval(interval);
    }, [verificationStatus]);

    const subnav = [
        { to: '.',         end: true,  label: 'Overview',     icon: <OverviewIcon />,  badge: null },
        { to: 'requests',  end: false, label: 'Requests',     icon: <RequestsIcon />,  badge: counts?.requests_count     || null },
        { to: 'flags',     end: false, label: 'Safety Flags', icon: <FlagsIcon />,     badge: counts?.safety_flags_count || null },
        { to: 'patients',  end: false, label: 'Patients',     icon: <PatientsIcon />,  badge: counts?.patients_count     || null },
        { to: 'inquiries', end: false, label: 'Inquiries',    icon: <InquiriesIcon />, badge: counts?.inquiries_count    || null },
    ];

    return (
        <ClinicLayout>
            <div className="cld-layout">
                {/* ── Page Header ─── */}
                <div className="cld-header">
                    <h1 className="cld-title">Clinic Dashboard</h1>
                    <p className="cld-subtitle">
                        Welcome back, {user?.first_name ?? 'Doctor'} — manage your patients and clinic operations.
                    </p>
                </div>

                {/* ── Sub Navigation ─── */}
                <div className="cld-subnav-wrapper">
                    <nav className="cld-subnav" aria-label="Dashboard sections">
                        {subnav.map(({ to, end, label, icon, badge }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) => `cld-subnav-link${isActive ? ' active' : ''}`}
                            >
                                <span className="cld-subnav-icon">{icon}</span>
                                {label}
                                {badge !== null && (
                                    <span className="cld-subnav-badge">{badge}</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* ── Nested Page Content ─── */}
                <Outlet context={{ verificationStatus }} />
            </div>
        </ClinicLayout>
    );
}
