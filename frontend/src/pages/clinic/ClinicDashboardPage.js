import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClinicProfile } from '../../api/clinic';
import ClinicLayout from '../../components/ClinicLayout';
import '../../styles/clinic.css';

function VerificationBanner({ status }) {
    const config = {
        pending: {
            title: 'Under Review',
            desc: 'Your registration has been submitted and is currently being reviewed by our team. You will be notified once a decision is made.',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
            ),
        },
        approved: {
            title: 'Verified',
            desc: 'Your clinic has been verified and is now visible to clients on the platform.',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            ),
        },
        rejected: {
            title: 'Registration Rejected',
            desc: 'Your registration was not approved. Please review your submitted information and contact support if you believe this is an error.',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            ),
        },
    };

    const { title, desc, icon } = config[status] ?? config.pending;

    return (
        <div className={`verification-banner ${status}`}>
            <div className="verification-banner-icon">{icon}</div>
            <div className="verification-banner-body">
                <p className="verification-banner-title">{title}</p>
                <p className="verification-banner-desc">{desc}</p>
            </div>
        </div>
    );
}

export default function ClinicDashboardPage() {
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getClinicProfile()
            .then(res => setClinic(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const isRegistered = !!clinic?.clinic_email;

    return (
        <ClinicLayout>
            <div className="client-page-header">
                <h1 className="client-page-title">Clinic Dashboard</h1>
                <p className="client-page-subtitle">Manage your clinic registration and verification status.</p>
            </div>

            {loading ? (
                <div className="client-loading"><div className="client-spinner" /></div>
            ) : (
                <>
                    <VerificationBanner status={clinic?.verification_status ?? 'pending'} />

                    <div className="client-dashboard-grid">
                        {/* Clinic Summary */}
                        <div className="client-card">
                            <div className="client-card-header">
                                <span className="client-card-title">Clinic Information</span>
                                <Link
                                    to="/clinic/profile"
                                    className="client-action-btn secondary"
                                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                                >
                                    {isRegistered ? 'Edit' : 'Complete Registration'}
                                </Link>
                            </div>

                            {isRegistered ? (
                                <>
                                    <div className="client-summary-row">
                                        <span className="client-summary-label">Legal name</span>
                                        <span className="client-summary-value">{clinic.legal_name}</span>
                                    </div>
                                    <div className="client-summary-row">
                                        <span className="client-summary-label">Commercial name</span>
                                        {clinic.commercial_name
                                            ? <span className="client-summary-value">{clinic.commercial_name}</span>
                                            : <span className="client-summary-empty">Not set</span>}
                                    </div>
                                    <div className="client-summary-row">
                                        <span className="client-summary-label">Clinic email</span>
                                        <span className="client-summary-value">{clinic.clinic_email}</span>
                                    </div>
                                    <div className="client-summary-row">
                                        <span className="client-summary-label">Phone</span>
                                        {clinic.clinic_mobile
                                            ? <span className="client-summary-value">{clinic.clinic_mobile}</span>
                                            : <span className="client-summary-empty">Not set</span>}
                                    </div>
                                    <div className="client-summary-row">
                                        <span className="client-summary-label">Specialty</span>
                                        {clinic.specialty_text
                                            ? <span className="client-summary-value">{clinic.specialty_text}</span>
                                            : <span className="client-summary-empty">Not set</span>}
                                    </div>
                                    <div className="client-summary-row">
                                        <span className="client-summary-label">License file</span>
                                        {clinic.license_file_url
                                            ? (
                                                <a
                                                    href={clinic.license_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="file-current-link"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                        <polyline points="14 2 14 8 20 8"/>
                                                    </svg>
                                                    View file
                                                </a>
                                            )
                                            : <span className="client-summary-empty">Not uploaded</span>}
                                    </div>
                                </>
                            ) : (
                                <div className="client-empty">
                                    Registration not completed yet.{' '}
                                    <Link to="/clinic/profile" style={{ color: '#3E4772', fontWeight: 500 }}>
                                        Complete your registration
                                    </Link>{' '}
                                    to submit your clinic for verification.
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="client-card">
                            <div className="client-card-header">
                                <span className="client-card-title">Quick Actions</span>
                            </div>
                            <div className="client-actions-row">
                                <Link to="/clinic/profile" className="client-action-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    {isRegistered ? 'Edit Registration' : 'Complete Registration'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ClinicLayout>
    );
}
