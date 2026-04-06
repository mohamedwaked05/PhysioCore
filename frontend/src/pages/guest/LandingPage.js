import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GuestLayout from '../../components/GuestLayout';
import Button from '../../components/ui/Button';
import '../../styles/guest.css';
import '../../styles/ui.css';

function scrollToHowItWorks() {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Feature icons ──────────────────────────────────────────── */
function IconClinic() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
    );
}

function IconPlan() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
        </svg>
    );
}

function IconSafe() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
        </svg>
    );
}

/* ── Payment method icons ───────────────────────────────────── */
function IconCard() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
    );
}

function IconCash() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M5 12h.01M19 12h.01"/>
        </svg>
    );
}

function IconInsurance() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
    );
}

function IconBank() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="22" x2="21" y2="22"/>
            <line x1="6" y1="18" x2="6" y2="11"/>
            <line x1="10" y1="18" x2="10" y2="11"/>
            <line x1="14" y1="18" x2="14" y2="11"/>
            <line x1="18" y1="18" x2="18" y2="11"/>
            <polygon points="12 2 20 7 4 7"/>
        </svg>
    );
}

function IconMobile() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
    );
}

/* ── Decorative clinic mockup ───────────────────────────────── */
function ClinicMockup() {
    return (
        <div className="landing-mockup">
            {/* Card header */}
            <div className="landing-mockup-header">
                <div className="landing-mockup-avatar" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div className="landing-mockup-line landing-mockup-line--dark" style={{ width: '65%' }} />
                    <div className="landing-mockup-line" style={{ width: '45%' }} />
                </div>
            </div>

            {/* Description lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="landing-mockup-line" style={{ width: '100%' }} />
                <div className="landing-mockup-line" style={{ width: '88%' }} />
                <div className="landing-mockup-line" style={{ width: '72%' }} />
            </div>

            {/* Badges */}
            <div className="landing-mockup-badge-row">
                <div className="landing-mockup-badge" style={{ width: '80px' }} />
                <div className="landing-mockup-badge" style={{ width: '64px' }} />
                <div className="landing-mockup-badge" style={{ width: '72px' }} />
            </div>

            <div className="landing-mockup-divider" />

            {/* Stats row */}
            <div className="landing-mockup-stat-row">
                {[null, null, null].map((_, i) => (
                    <div key={i} className="landing-mockup-stat">
                        <div className="landing-mockup-stat-num" />
                        <div className="landing-mockup-stat-label" />
                    </div>
                ))}
            </div>

            {/* CTA button */}
            <div className="landing-mockup-btn-row" />
        </div>
    );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function LandingPage() {
    const navigate    = useNavigate();
    const { user }    = useAuth();

    // Authenticated users have no reason to see the marketing landing page
    if (user?.role === 'clinic')  return <Navigate to="/clinic/dashboard"  replace />;
    if (user?.role === 'client')  return <Navigate to="/client/dashboard"  replace />;
    if (user?.role === 'admin')   return <Navigate to="/dashboard"         replace />;

    return (
        <GuestLayout>
            {/* ── 1. Hero ────────────────────────────────────────── */}
            <section className="landing-hero">
                <div className="landing-hero-card">
                    <div className="landing-hero-pill">
                        <span className="landing-hero-pill-dot" />
                        Rehabilitation Platform
                    </div>

                    <h1 className="landing-hero-title">
                        Rehab, guided by your clinic.{' '}
                        <em>Nothing extra.</em>
                    </h1>

                    <p className="landing-hero-subtitle">
                        Connect with verified physiotherapy clinics, follow a structured
                        rehabilitation plan, and track your recovery — all from one secure,
                        clinic-driven platform.
                    </p>

                    <div className="landing-hero-actions">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/clinics')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            Browse clinics
                        </Button>
                        <Button variant="ghost" size="lg" onClick={scrollToHowItWorks}>
                            How it works
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── 2. Features ────────────────────────────────────── */}
            <section id="how-it-works" className="landing-features">
                <div className="landing-container">
                    <p className="landing-section-label">How it works</p>
                    <h2 className="landing-section-title">Your rehab journey, structured.</h2>
                    <p className="landing-section-sub">
                        Three simple steps from finding the right clinic to completing your recovery plan safely.
                    </p>

                    <div className="landing-features-grid">
                        {/* Card 1 */}
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <IconClinic />
                            </div>
                            <h3 className="landing-feature-title">Pick a clinic</h3>
                            <p className="landing-feature-desc">
                                Browse verified physiotherapy clinics, filter by specialty,
                                location, and budget — then send a direct access request in seconds.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <IconPlan />
                            </div>
                            <h3 className="landing-feature-title">Follow your plan</h3>
                            <p className="landing-feature-desc">
                                Your clinic builds a personalized rehabilitation program. Log
                                your pain and effort levels after each session so your therapist
                                can monitor real progress.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <IconSafe />
                            </div>
                            <h3 className="landing-feature-title">Stay safe</h3>
                            <p className="landing-feature-desc">
                                Our system continuously evaluates your exercise data and surfaces
                                safety alerts before overexertion becomes a setback.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3. Join as a clinic ────────────────────────────── */}
            <section className="landing-join">
                <div className="landing-container landing-join-inner">
                    {/* Left: text */}
                    <div className="landing-join-text">
                        <p className="landing-section-label">For clinics</p>
                        <h2 className="landing-section-title">Bring your clinic online.</h2>
                        <p className="landing-join-desc">
                            Create a professional clinic profile, manage patient access requests,
                            and deliver structured rehabilitation plans — all from one dashboard.
                            PhysioCore handles the coordination so you can focus on care.
                        </p>
                        <Button variant="primary" size="lg" onClick={() => navigate('/register', { state: { role: 'clinic' } })}>
                            Register your clinic
                        </Button>
                    </div>

                    {/* Right: decorative mockup */}
                    <div className="landing-join-visual">
                        <ClinicMockup />
                    </div>
                </div>
            </section>

            {/* ── 4. Payment options ─────────────────────────────── */}
            <section className="landing-payment">
                <div className="landing-container">
                    <div className="landing-payment-card">
                        <div className="landing-payment-header">
                            <div>
                                <p className="landing-section-label" style={{ marginBottom: '0.4rem' }}>
                                    Billing flexibility
                                </p>
                                <h2 className="landing-section-title" style={{ marginBottom: 0 }}>
                                    Flexible payment options
                                </h2>
                            </div>
                            <p className="landing-payment-note">
                                Clinics on PhysioCore support a range of payment methods.
                                Confirm preferred billing with your clinic once access is approved.
                            </p>
                        </div>

                        <div className="landing-payment-methods">
                            {[
                                { icon: <IconCard />,      label: 'Credit & Debit Card' },
                                { icon: <IconCash />,      label: 'Cash Payment' },
                                { icon: <IconInsurance />, label: 'Health Insurance' },
                                { icon: <IconBank />,      label: 'Bank Transfer' },
                                { icon: <IconMobile />,    label: 'Mobile Payment' },
                            ].map(({ icon, label }) => (
                                <div key={label} className="landing-payment-method">
                                    <div className="landing-payment-method-icon">{icon}</div>
                                    <span className="landing-payment-method-label">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="landing-footer">
                <div className="landing-footer-logo">PhysioCore</div>
                <p className="landing-footer-text">
                    &copy; {new Date().getFullYear()} PhysioCore. All rights reserved.
                </p>
            </footer>
        </GuestLayout>
    );
}
