
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicClinic } from '../../api/public';
import { getAccessRequests, createAccessRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAuthModal } from '../../context/AuthModalContext';
import GuestLayout from '../../components/GuestLayout';
import Skeleton from '../../components/ui/Skeleton';
import ChatBox from '../../components/chat/ChatBox';
import '../../styles/ui.css';
import '../../styles/client.css';
import '../../styles/guest.css';
import '../../styles/chat.css';

/* ── Helpers ────────────────────────────────────────────────── */
function parseList(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
}

function getInitials(name) {
    return (name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
}

function getPriceLevel(min, max) {
    const ref = min ?? max;
    if (ref == null) return null;
    if (ref < 50)    return { label: 'Budget' };
    if (ref < 150)   return { label: 'Medium' };
    if (ref < 300)   return { label: 'Premium' };
    return               { label: 'Luxury' };
}

function formatPriceRange(min, max) {
    if (min != null && max != null) return `$${min} – $${max}`;
    if (min != null)                return `From $${min}`;
    if (max != null)                return `Up to $${max}`;
    return null;
}

/* ── Skeleton ───────────────────────────────────────────────── */
function ClinicDetailSkeleton() {
    return (
        <div className="cd-page">
            <div className="cd-back-row">
                <Skeleton height="13px" width="110px" radius="6px" />
            </div>
            <div className="cd-card-wrap">
                <Skeleton height="120px" width="100%" radius="0" />
                <div className="cd-stats-bar">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="cd-stat-cell">
                            <Skeleton height="14px" width="80px" radius="4px" style={{ marginBottom: '5px' }} />
                            <Skeleton height="11px" width="60px" radius="4px" />
                        </div>
                    ))}
                </div>
                <div className="cd-scrollable">
                    <div className="cd-content">
                        <Skeleton height="13px" width="50px" radius="4px" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton height="14px" width="100%" radius="4px" style={{ marginBottom: '4px' }} />
                        <Skeleton height="14px" width="75%" radius="4px" style={{ marginBottom: '1rem' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
                            <Skeleton height="54px" radius="8px" />
                            <Skeleton height="54px" radius="8px" />
                        </div>
                        <Skeleton height="44px" radius="8px" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function ClinicDetailsPage() {
    const { id }             = useParams();
    const { user }           = useAuth();
    const { addToast }       = useToast();
    const { openAuthModal }  = useAuthModal();

    const [clinic, setClinic]         = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(false);
    const [hasRequest, setHasRequest] = useState(false);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        setLoading(true);
        getPublicClinic(id)
            .then(res => setClinic(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (user?.role !== 'client' || !clinic) return;
        getAccessRequests()
            .then(res => {
                const active = res.data.some(
                    r => r.clinic_id === clinic.id &&
                         (r.status === 'pending' || r.status === 'approved')
                );
                setHasRequest(active);
            })
            .catch(() => {});
    }, [user, clinic]);

    const doRequest = async () => {
        setRequesting(true);
        try {
            await createAccessRequest({ clinic_id: clinic.id });
            setHasRequest(true);
            addToast('Access request sent successfully.', 'success');
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Failed to send request. Please try again.', 'error');
        } finally {
            setRequesting(false);
        }
    };

    const handleRequest = () => {
        if (!user) { openAuthModal(doRequest); return; }
        doRequest();
    };

    if (loading) {
        return (
            <GuestLayout>
                <ClinicDetailSkeleton />
            </GuestLayout>
        );
    }

    if (error || !clinic) {
        return (
            <GuestLayout>
                <div className="cd-page">
                    <div className="cd-back-row">
                        <Link to="/clinics" className="cd-back-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back to clinics
                        </Link>
                    </div>
                    <div className="cd-scrollable">
                        <div className="cd-content">
                            <div className="client-empty">This clinic could not be found or is no longer available.</div>
                        </div>
                    </div>
                </div>
            </GuestLayout>
        );
    }

    const name       = clinic.commercial_name || clinic.legal_name;
    const initials   = getInitials(name);
    const services   = parseList(clinic.services);
    const priceInfo  = getPriceLevel(clinic.min_price, clinic.max_price);
    const priceRange = formatPriceRange(clinic.min_price, clinic.max_price);

    const heroStyle = clinic.cover_photo_url
        ? { backgroundImage: `url("${clinic.cover_photo_url}")` }
        : {};

    return (
        <GuestLayout>
            <div className="cd-page">

                {/* Back link — full width outside card */}
                <div className="cd-back-row">
                    <Link to="/clinics" className="cd-back-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Back to clinics
                    </Link>
                </div>

                {/* ── Card wrap (centered 860px) ──────────────────── */}
                <div className="cd-card-wrap">

                {/* ── Hero banner ─────────────────────────────────── */}
                <div
                    className={`cd-banner${!clinic.cover_photo_url ? ' cd-banner--fallback' : ''}`}
                    style={heroStyle}
                >
                    <div className="cd-banner-overlay" />

                    <div className="cd-banner-verified">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <polyline points="9 12 11 14 15 10"/>
                        </svg>
                        Verified
                    </div>

                    <div className="cd-banner-identity">
                        <div className="cd-banner-avatar">
                            {clinic.profile_photo_url
                                ? <img src={clinic.profile_photo_url} alt={name} />
                                : <span>{initials}</span>}
                        </div>
                        <div className="cd-banner-meta">
                            <div className="cd-banner-name">{name}</div>
                            {clinic.address && (
                                <div className="cd-banner-location">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {clinic.address}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Stats bar ───────────────────────────────────── */}
                <div className="cd-stats-bar">
                    <div className="cd-stat-cell">
                        <div className="cd-stat-value">{priceRange ?? '—'}</div>
                        <div className="cd-stat-label">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                            </svg>
                            per session
                        </div>
                    </div>
                    <div className="cd-stat-cell">
                        <div className="cd-stat-value">{clinic.working_hours || '—'}</div>
                        <div className="cd-stat-label">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            working hours
                        </div>
                    </div>
                    <div className="cd-stat-cell">
                        <div className="cd-stat-value cd-stat-teal">{clinic.estimated_response_time || '—'}</div>
                        <div className="cd-stat-label">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                            response time
                        </div>
                    </div>
                </div>

                {/* ── Scrollable content ──────────────────────────── */}
                <div className="cd-scrollable">
                    <div className="cd-content">

                        {/* About */}
                        {(clinic.description || services.length > 0) && (
                            <div className="cd-section">
                                <div className="cd-section-label">About</div>
                                {clinic.description && (
                                    <p className="cd-section-text">{clinic.description}</p>
                                )}
                                {services.length > 0 && (
                                    <div className="cd-tags">
                                        {services.map((s, i) => (
                                            <span key={i} className="cd-tag">{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info grid */}
                        {(clinic.payment_methods || priceInfo) && (
                            <div className="cd-info-grid">
                                {clinic.payment_methods && (
                                    <div className="cd-info-cell">
                                        <div className="cd-info-label">Payment methods</div>
                                        <div className="cd-info-value">{clinic.payment_methods}</div>
                                    </div>
                                )}
                                {priceInfo && (
                                    <div className="cd-info-cell">
                                        <div className="cd-info-label">Price tier</div>
                                        <div className="cd-info-value">{priceInfo.label}</div>
                                    </div>
                                )}
                                {clinic.experience && (
                                    <div className="cd-info-cell">
                                        <div className="cd-info-label">Experience</div>
                                        <div className="cd-info-value">{clinic.experience}</div>
                                    </div>
                                )}
                                {clinic.certifications && (
                                    <div className="cd-info-cell">
                                        <div className="cd-info-label">Certifications</div>
                                        <div className="cd-info-value">{clinic.certifications}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chat section */}
                        <div className="cd-chat-section">
                            <div className="cd-chat-header">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                                </svg>
                                Discuss your case
                            </div>

                            {user ? (
                                <div className="cd-chat-wrap">
                                    <ChatBox
                                        context="inquiry"
                                        referenceId={clinic.id}
                                        receiverId={clinic.user_id}
                                        onGuestAction={() => openAuthModal()}
                                    />
                                </div>
                            ) : (
                                <div className="cd-chat-signin">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                    </svg>
                                    <span>Discuss your case with the clinic</span>
                                    <button onClick={() => openAuthModal()}>Sign in</button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* ── Action bar — bottom of card ────────────────── */}
                <div className="cd-action-bar">
                    <button
                        className={`cd-request-btn${hasRequest ? ' cd-request-btn--sent' : ''}`}
                        disabled={hasRequest || requesting}
                        onClick={handleRequest}
                    >
                        {requesting ? (
                            <span className="cd-request-spinner" />
                        ) : hasRequest ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Request Sent
                            </>
                        ) : (
                            'Request Access'
                        )}
                    </button>
                </div>

                </div>{/* end cd-card-wrap */}

            </div>
        </GuestLayout>
    );
}
