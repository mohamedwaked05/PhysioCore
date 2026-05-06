import NavBar from './NavBar';
import '../styles/client.css';

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

function ClinicProfileIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V7l9-4 9 4v14"/>
            <rect x="9" y="13" width="6" height="8"/>
            <path d="M10 6h4M12 4v4"/>
        </svg>
    );
}

const CLINIC_LINKS = [
    { to: '/clinic/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/clinic/profile',   label: 'Profile',   icon: <ClinicProfileIcon /> },
];

export default function ClinicLayout({ children, clinicId = null }) {
    return (
        <div className="client-shell">
            <NavBar
                homeRoute="/clinic/dashboard"
                links={CLINIC_LINKS}
                profileRoute="/clinic/profile"
                qrClinicId={clinicId}
            />
            <main className="client-content">
                {children}
            </main>
        </div>
    );
}
