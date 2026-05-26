import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Chatbot from '../../components/Chatbot';
import PhysioCoreLogo from '../../components/PhysioCoreLogo';
import '../../styles/guest.css';

/* ── Icons ──────────────────────────────────────────────────── */
function SunIcon() {
    return (
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
    );
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    );
}

/* ── Landing Page ────────────────────────────────────────────── */
export default function LandingPage() {
    const navigate           = useNavigate();
    const { user }           = useAuth();
    const { theme, toggle }  = useTheme();

    if (user?.role === 'clinic') return <Navigate to="/clinic/dashboard" replace />;
    if (user?.role === 'client') return <Navigate to="/client/dashboard" replace />;
    if (user?.role === 'admin')  return <Navigate to="/dashboard"        replace />;

    const isDark = theme === 'dark';

    return (
        <div className={`landing-page lp-new-shell ${isDark ? 'landing-dark' : 'landing-light'}`}>

            {/* ── Navbar ─────────────────────────────────────── */}
            <nav className="lp-nav">
                <PhysioCoreLogo textColor={isDark ? '#e8ecf8' : '#0f1629'} />

                <div className="lp-nav-actions">
                    <button className="lp-nav-theme-btn" onClick={toggle} aria-label="Toggle theme">
                        {isDark ? <SunIcon /> : <MoonIcon />}
                    </button>

                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────── */}
            <div className="lp-new-hero">
              <div className="lp-new-hero-inner">

                <h1 className="lp-new-h1">
                    The smarter way to <em>recover.</em>
                </h1>

                <p className="lp-new-sub">
                    AI-powered rehab management connecting patients with verified physiotherapy clinics.
                </p>

                <div className="lp-new-btns">
                    <button className="lp-btn-primary" onClick={() => navigate('/clinics')}>
                        <SearchIcon />
                        Find a clinic
                    </button>
                    <button className="lp-btn-secondary" onClick={() => navigate('/login')}>
                        Sign in
                    </button>
                </div>

                <p className="lp-chat-hint">Describe your injury and I'll help find the right clinic.</p>

                <div className="lp-chat-embed">
                    <Chatbot embedded />
                </div>

              </div>
            </div>
        </div>
    );
}
