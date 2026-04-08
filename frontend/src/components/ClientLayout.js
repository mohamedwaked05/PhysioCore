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

const CLIENT_LINKS = [
    { to: '/client/dashboard', label: 'Dashboard',     icon: <DashboardIcon /> },
    { to: '/client/profile',   label: 'Profile',       icon: <ProfileIcon /> },
    { to: '/clinics',          label: 'Browse Clinics', icon: <BrowseClinicsIcon /> },
];

export default function ClientLayout({ children }) {
    return (
        <div className="client-shell">
            <NavBar
                homeRoute="/client/dashboard"
                links={CLIENT_LINKS}
                profileRoute="/client/profile"
            />
            <main className="client-content">
                {children}
            </main>
        </div>
    );
}
