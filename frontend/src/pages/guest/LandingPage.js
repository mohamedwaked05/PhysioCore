import { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GuestLayout from '../../components/GuestLayout';
import Button from '../../components/ui/Button';
import '../../styles/guest.css';
import '../../styles/ui.css';

/* ── Scroll-trigger hook ────────────────────────────────────── */
function useInView(threshold = 0.1) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

/* ── Icons ──────────────────────────────────────────────────── */
function IconSearch() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    );
}
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
function IconPin() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
        </svg>
    );
}
function IconStar() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
    );
}
function IconArrowRight() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
        </svg>
    );
}
function IconLock() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
    );
}
function IconCheck() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
}

/* ── Hero Visual ─────────────────────────────────────────────── */
function HeroVisual() {
    return (
        <div className="lp-hero-visual">
            {/* Floating chip — top */}
            <div className="lp-hero-chip lp-hero-chip--top">
                <span className="lp-hero-chip-icon lp-hero-chip-icon--green"><IconCheck /></span>
                Access request sent!
            </div>

            {/* Main clinic card */}
            <div className="lp-hero-card">
                <div className="lp-hero-card-header">
                    <div className="lp-hero-card-avatar">AN</div>
                    <div className="lp-hero-card-meta">
                        <div className="lp-hero-card-name">Al Noor Physiotherapy</div>
                        <div className="lp-hero-card-loc"><IconPin /> Dubai, UAE</div>
                    </div>
                    <div className="lp-hero-card-verified">Verified</div>
                </div>

                <div className="lp-tag-row">
                    <span className="lp-tag">Sports Recovery</span>
                    <span className="lp-tag">Post-Surgery</span>
                    <span className="lp-tag">Manual Therapy</span>
                </div>

                <div className="lp-hero-card-rating">
                    <span className="lp-stars">
                        {[0,1,2,3,4].map(i => <IconStar key={i} />)}
                    </span>
                    <span className="lp-rating-text">4.9 · 128 reviews</span>
                </div>

                <div className="lp-hero-card-btn">View Profile</div>
            </div>

            {/* Floating chip — bottom */}
            <div className="lp-hero-chip lp-hero-chip--bottom">
                <span className="lp-hero-chip-dot" />
                <strong>500+</strong>&nbsp;verified clinics
            </div>
        </div>
    );
}

/* ── Steps data ──────────────────────────────────────────────── */
const STEPS = [
    {
        Icon: IconClinic,
        title: 'Pick a clinic',
        desc: 'Browse verified physiotherapy clinics, filter by specialty, location, and budget — then send a direct access request in seconds.',
    },
    {
        Icon: IconPlan,
        title: 'Follow your plan',
        desc: 'Your clinic builds a personalized rehabilitation program. Log your pain and effort levels after each session so your therapist can monitor real progress.',
    },
    {
        Icon: IconSafe,
        title: 'Stay safe',
        desc: 'Our system continuously evaluates your exercise data and surfaces safety alerts before overexertion becomes a setback.',
    },
];

/* ── Clinic preview data ─────────────────────────────────────── */
const MOCK_CLINICS = [
    {
        initials: 'AN',
        bg: 'linear-gradient(135deg, #3E4772 0%, #4d5690 100%)',
        name: 'Al Noor Physiotherapy',
        location: 'Dubai, UAE',
        rating: '4.9',
        reviews: 128,
        tags: ['Sports Recovery', 'Post-Surgery'],
    },
    {
        initials: 'LB',
        bg: 'linear-gradient(135deg, #1d6a4f 0%, #2d8a66 100%)',
        name: 'LifeBack Clinic',
        location: 'Abu Dhabi, UAE',
        rating: '4.8',
        reviews: 94,
        tags: ['Orthopedic', 'Dry Needling'],
    },
    {
        initials: 'MH',
        bg: 'linear-gradient(135deg, #7b4f12 0%, #9a6520 100%)',
        name: 'Motion Health Center',
        location: 'Sharjah, UAE',
        rating: '4.7',
        reviews: 67,
        tags: ['Neurological', 'Manual Therapy'],
    },
];

/* ── Clinic preview card ─────────────────────────────────────── */
function ClinicPreviewCard({ clinic, visible, delay }) {
    return (
        <div
            className={`lp-clinic-card ${visible ? 'is-visible' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="lp-clinic-card-header">
                <div className="lp-clinic-avatar" style={{ background: clinic.bg }}>
                    {clinic.initials}
                </div>
                <div className="lp-clinic-info">
                    <div className="lp-clinic-name">{clinic.name}</div>
                    <div className="lp-clinic-loc"><IconPin /> {clinic.location}</div>
                </div>
            </div>

            <div className="lp-tag-row">
                {clinic.tags.map(t => <span key={t} className="lp-tag">{t}</span>)}
            </div>

            <div className="lp-clinic-footer">
                <div className="lp-clinic-rating">
                    <span className="lp-stars"><IconStar /></span>
                    {clinic.rating}
                    <span className="lp-clinic-reviews">({clinic.reviews})</span>
                </div>
                <div className="lp-clinic-hint">
                    <IconLock /> Sign in to request
                </div>
            </div>
        </div>
    );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [stepsRef,   stepsInView]   = useInView();
    const [previewRef, previewInView] = useInView();
    const [ctaRef,     ctaInView]     = useInView();

    if (user?.role === 'clinic')  return <Navigate to="/clinic/dashboard"  replace />;
    if (user?.role === 'client')  return <Navigate to="/client/dashboard"  replace />;
    if (user?.role === 'admin')   return <Navigate to="/dashboard"         replace />;

    return (
        <GuestLayout>

            {/* ── 1. Hero ─────────────────────────────────────────── */}
            <section className="landing-hero">
                <div className="lp-hero-inner">

                    {/* Left: content */}
                    <div className="lp-hero-content">
                        <div className="landing-hero-pill">
                            <span className="landing-hero-pill-dot" />
                            Rehabilitation Platform
                        </div>

                        <h1 className="landing-hero-title">
                            Rehab, guided<br />
                            by your clinic.<br />
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
                                <IconSearch />
                                Browse clinics
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            >
                                How it works
                            </Button>
                        </div>

                        <div className="lp-hero-stats">
                            <div className="lp-hero-stat">
                                <strong>500+</strong>
                                <span>Verified clinics</span>
                            </div>
                            <div className="lp-stat-divider" />
                            <div className="lp-hero-stat">
                                <strong>12k+</strong>
                                <span>Active clients</span>
                            </div>
                            <div className="lp-stat-divider" />
                            <div className="lp-hero-stat">
                                <strong>4.9 ★</strong>
                                <span>Avg. rating</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: visual */}
                    <div className="lp-hero-visual-col">
                        <HeroVisual />
                    </div>
                </div>
            </section>

            {/* ── 2. How it Works ─────────────────────────────────── */}
            <section id="how-it-works" className="landing-steps" ref={stepsRef}>
                <div className="landing-container">
                    <div className={`lp-steps-head ${stepsInView ? 'is-visible' : ''}`}>
                        <p className="landing-section-label">How it works</p>
                        <h2 className="landing-section-title">Three steps to recovery.</h2>
                        <p className="landing-section-sub">
                            From finding the right clinic to completing your rehabilitation plan safely.
                        </p>
                    </div>

                    <div className="lp-steps-grid">
                        {STEPS.map(({ Icon, title, desc }, i) => (
                            <div
                                key={i}
                                className={`lp-step-card ${stepsInView ? 'is-visible' : ''}`}
                                style={{ animationDelay: `${i * 110}ms` }}
                            >
                                <div className="lp-step-num">0{i + 1}</div>
                                <div className="lp-step-icon"><Icon /></div>
                                <h3 className="lp-step-title">{title}</h3>
                                <p className="lp-step-desc">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 3. Clinic Browse Preview ─────────────────────────── */}
            <section className="landing-preview" ref={previewRef}>
                <div className="landing-container">
                    <div className={`lp-preview-head ${previewInView ? 'is-visible' : ''}`}>
                        <div>
                            <p className="landing-section-label">Browse clinics</p>
                            <h2 className="landing-section-title">Find the right clinic for you.</h2>
                            <p className="landing-section-sub">
                                Explore verified physiotherapy clinics filtered by specialty,
                                location, and availability. Start browsing — no account required.
                            </p>
                        </div>
                        <Button variant="primary" size="lg" onClick={() => navigate('/clinics')}>
                            View all clinics <IconArrowRight />
                        </Button>
                    </div>

                    <div className="lp-clinics-grid">
                        {MOCK_CLINICS.map((clinic, i) => (
                            <ClinicPreviewCard
                                key={i}
                                clinic={clinic}
                                visible={previewInView}
                                delay={i * 90}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 4. CTA ──────────────────────────────────────────── */}
            <section className="landing-cta" ref={ctaRef}>
                <div className={`lp-cta-inner ${ctaInView ? 'is-visible' : ''}`}>
                    <p className="lp-cta-label">Get started today</p>
                    <h2 className="lp-cta-title">Ready to start your recovery?</h2>
                    <p className="lp-cta-sub">
                        Browse verified clinics and connect with your physiotherapist today.
                        No commitment required — explore freely as a guest.
                    </p>
                    <div className="lp-cta-actions">
                        <Button variant="primary" size="lg" onClick={() => navigate('/clinics')}>
                            <IconSearch /> Browse clinics
                        </Button>
                        <button className="lp-cta-outline-btn" onClick={() => navigate('/register')}>
                            Create account <IconArrowRight />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────── */}
            <footer className="landing-footer">
                <div className="landing-footer-logo">PhysioCore</div>
                <p className="landing-footer-text">
                    &copy; {new Date().getFullYear()} PhysioCore. All rights reserved.
                </p>
            </footer>

        </GuestLayout>
    );
}
