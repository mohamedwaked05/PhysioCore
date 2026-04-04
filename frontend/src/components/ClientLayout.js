import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/client.css';

export default function ClientLayout({ children }) {
    const { user, logout } = useAuth();

    return (
        <div className="client-shell">
            <nav className="client-nav">
                {/* Logo */}
                <NavLink to="/client/dashboard" className="client-nav-logo">
                    <div className="client-nav-logo-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L4 7v5c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V7l-8-5z" fill="white" opacity="0.9"/>
                        </svg>
                    </div>
                    <span className="client-nav-logo-text">PhysioCore</span>
                </NavLink>

                {/* Nav links */}
                <div className="client-nav-links">
                    <NavLink
                        to="/client/dashboard"
                        className={({ isActive }) => 'client-nav-link' + (isActive ? ' active' : '')}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/client/profile"
                        className={({ isActive }) => 'client-nav-link' + (isActive ? ' active' : '')}
                    >
                        My Profile
                    </NavLink>
                    <NavLink
                        to="/client/clinics"
                        className={({ isActive }) => 'client-nav-link' + (isActive ? ' active' : '')}
                    >
                        Browse Clinics
                    </NavLink>
                </div>

                {/* User + logout */}
                <div className="client-nav-right">
                    <span className="client-nav-user">
                        {user?.first_name} {user?.last_name}
                    </span>
                    <button className="client-logout-btn" onClick={logout}>
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="client-content">
                {children}
            </main>
        </div>
    );
}
