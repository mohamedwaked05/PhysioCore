import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/client.css';

export default function ClientLayout({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();

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
                    <button
                        className="client-theme-toggle"
                        onClick={toggle}
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    >
                        {theme === 'dark' ? (
                            /* Sun icon */
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="5"/>
                                <line x1="12" y1="1" x2="12" y2="3"/>
                                <line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/>
                                <line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                            </svg>
                        ) : (
                            /* Moon icon */
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                            </svg>
                        )}
                    </button>
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
