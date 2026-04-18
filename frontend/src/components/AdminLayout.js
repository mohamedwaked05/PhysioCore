import NavBar from './NavBar';
import '../styles/client.css';

function AdminDashIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
    );
}

const ADMIN_LINKS = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <AdminDashIcon /> },
];

export default function AdminLayout({ children }) {
    return (
        <div className="client-shell">
            <NavBar
                homeRoute="/admin/dashboard"
                links={ADMIN_LINKS}
                profileRoute="/admin/dashboard"
            />
            <main className="client-content">
                {children}
            </main>
        </div>
    );
}
