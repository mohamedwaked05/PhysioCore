export default function AuthSidebar() {
    return (
        <aside className="auth-sidebar">
            {/* Logo */}
            <div className="auth-sidebar-logo">
                <div className="auth-sidebar-logo-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 7v5c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V7l-8-5z" fill="white" opacity="0.9"/>
                    </svg>
                </div>
                <span className="auth-sidebar-logo-text">PhysioCore</span>
            </div>

            {/* Headline */}
            <p className="auth-sidebar-headline">Recover smarter,<br />not harder.</p>
            <p className="auth-sidebar-desc">
                Your AI-powered rehabilitation companion — connecting patients and clinics for better outcomes.
            </p>

            {/* Features */}
            <div className="auth-sidebar-features">
                <div className="auth-feature-row">
                    <div className="auth-feature-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12l2-2 4 4 8-8 2 2-10 10z" fill="white" opacity="0.85"/>
                        </svg>
                    </div>
                    <div className="auth-feature-text">
                        <strong>Progress Tracking</strong>
                        <span>Log pain and effort levels daily and visualise your recovery over time.</span>
                    </div>
                </div>
                <div className="auth-feature-row">
                    <div className="auth-feature-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 5v5l3 3-1.5 1.5L10 13V7h2z" fill="white" opacity="0.85"/>
                        </svg>
                    </div>
                    <div className="auth-feature-text">
                        <strong>AI Safety Alerts</strong>
                        <span>Rule-based AI monitors your logs and flags unsafe patterns instantly.</span>
                    </div>
                </div>
                <div className="auth-feature-row">
                    <div className="auth-feature-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.85"/>
                        </svg>
                    </div>
                    <div className="auth-feature-text">
                        <strong>Clinic Connect</strong>
                        <span>Request access to a verified clinic and follow structured rehab plans.</span>
                    </div>
                </div>
            </div>

            <p className="auth-sidebar-footer">© 2025 PhysioCore</p>
        </aside>
    );
}
