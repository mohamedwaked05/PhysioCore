import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Chatbot from '../../components/Chatbot';
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

function EcgLogoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-6 4 12 2-6h10"
                stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
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

function BrainIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.5 13a3.5 3.5 0 00-3.5 3.5v1a3.5 3.5 0 007 0v-1.8"/>
            <path d="M8.5 13a3.5 3.5 0 013.5 3.5v1a3.5 3.5 0 01-7 0v-1.8"/>
            <path d="M17.5 16a3.5 3.5 0 000-7h-.5"/>
            <path d="M19 9.3v-2.8a3.5 3.5 0 00-7 0"/>
            <path d="M6.5 16a3.5 3.5 0 010-7h.5"/>
            <path d="M5 9.3v-2.8a3.5 3.5 0 017 0v10"/>
        </svg>
    );
}


function HamburgerIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    );
}


/* ── Landing Page ────────────────────────────────────────────── */
export default function LandingPage() {
    const navigate           = useNavigate();
    const { user }           = useAuth();
    const { theme, toggle }  = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (user?.role === 'clinic') return <Navigate to="/clinic/dashboard" replace />;
    if (user?.role === 'client') return <Navigate to="/client/dashboard" replace />;
    if (user?.role === 'admin')  return <Navigate to="/dashboard"        replace />;

    const isDark = theme === 'dark';

    return (
        <div className={`landing-page lp-new-shell ${isDark ? 'landing-dark' : 'landing-light'}`}>

            {/* ── Navbar ─────────────────────────────────────── */}
            <nav className="lp-nav">
                <div className="lp-nav-logo">
                    <div className="lp-nav-logo-icon">
                        <EcgLogoIcon />
                    </div>
                    <span className="lp-nav-logo-text">PhysioCore</span>
                </div>

                <div className="lp-nav-actions">
                    <button className="lp-nav-theme-btn" onClick={toggle} aria-label="Toggle theme">
                        {isDark ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <button className="lp-nav-signin lp-desktop-only" onClick={() => navigate('/login')}>
                        Sign in
                    </button>
                    <button className="lp-nav-cta lp-desktop-only" onClick={() => navigate('/register')}>
                        Get started
                    </button>
                    <button
                        className="lp-nav-burger lp-mobile-only"
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        onClick={() => setMobileOpen(o => !o)}
                    >
                        {mobileOpen ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        ) : (
                            <HamburgerIcon />
                        )}
                    </button>
                </div>
            </nav>

            {/* ── Mobile menu dropdown ────────────────────────── */}
            {mobileOpen && (
                <div className="lp-mobile-menu">
                    <button className="lp-mobile-menu-item" onClick={() => { navigate('/clinics'); setMobileOpen(false); }}>
                        <SearchIcon /> Find a Clinic
                    </button>
                    <button className="lp-mobile-menu-item" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                        Sign in
                    </button>
                    <button className="lp-mobile-menu-item lp-mobile-menu-cta" onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                        Get started
                    </button>
                    <div className="lp-mobile-menu-divider" />
                    <button className="lp-mobile-menu-item lp-mobile-menu-theme" onClick={toggle}>
                        {isDark ? <SunIcon /> : <MoonIcon />}
                        {isDark ? 'Light mode' : 'Dark mode'}
                    </button>
                </div>
            )}

            {/* ── Hero ────────────────────────────────────────── */}
            <div className="lp-new-hero">
              <div className="lp-new-hero-inner">

                <div className="lp-new-pill">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    Rehabilitation Platform
                </div>

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
