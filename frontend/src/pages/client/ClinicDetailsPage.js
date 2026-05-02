
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicClinic } from '../../api/public';
import { getAccessRequests, createAccessRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAuthModal } from '../../context/AuthModalContext';
import GuestLayout from '../../components/GuestLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Skeleton from '../../components/ui/Skeleton';
import ChatBox from '../../components/chat/ChatBox';
import '../../styles/ui.css';
import '../../styles/client.css';
import '../../styles/guest.css';
import '../../styles/chat.css';

/* ── Skeleton ───────────────────────────────────────────────── */
function ClinicDetailSkeleton() {
    return (
        <>
            <Skeleton height="14px" width="120px" radius="6px" style={{ marginBottom: '1.25rem' }} />
            <Card style={{ marginBottom: '1.25rem' }}>
                <div className="cd-hero">
                    <Skeleton width="200px" height="200px" radius="14px" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Skeleton height="28px" width="55%" radius="6px" />
                        <Skeleton height="13px" width="70%" />
                        <Skeleton height="13px" width="40%" />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Skeleton height="22px" width="110px" radius="999px" />
                            <Skeleton height="22px" width="80px" radius="999px" />
                        </div>
                        <Skeleton height="12px" />
                        <Skeleton height="12px" width="85%" />
                        <Skeleton height="12px" width="70%" />
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                            <Skeleton height="22px" width="90px" radius="999px" />
                            <Skeleton height="22px" width="75px" radius="999px" />
                        </div>
                        <Skeleton height="42px" width="160px" radius="10px" style={{ marginTop: '0.25rem' }} />
                    </div>
                </div>
            </Card>
            <div className="cd-info-row" style={{ marginBottom: '1.25rem' }}>
                <Card><Skeleton height="90px" /></Card>
                <Card><Skeleton height="90px" /></Card>
            </div>
            {[80, 120, 80].map((h, i) => (
                <Card key={i} style={{ marginBottom: '1.25rem' }}>
                    <Skeleton height={`${h}px`} />
                </Card>
            ))}
        </>
    );
}

/* ── Helpers ────────────────────────────────────────────────── */
function formatPrice(min, max) {
    if (min != null && max != null) return `$${min} – $${max} / session`;
    if (min != null)                return `From $${min} / session`;
    if (max != null)                return `Up to $${max} / session`;
    return null;
}

function getPriceLevel(min, max) {
    const ref = min ?? max;
    if (ref == null) return null;
    if (ref < 50)    return 'Budget';
    if (ref < 150)   return 'Medium';
    if (ref < 300)   return 'Premium';
    return 'Luxury';
}

function parseList(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
}

function PhotoOrPlaceholder({ src, name }) {
    const initials = (name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

    if (src) return <img src={src} alt={name} className="cd-hero-photo" />;
    return (
        <div className="cd-hero-photo cd-hero-photo-placeholder">{initials}</div>
    );
}

/* ── Hero card ──────────────────────────────────────────────── */
function HeroCard({ clinic, hasRequest, requesting, onRequest }) {
    const name       = clinic.commercial_name || clinic.legal_name;
    const services   = parseList(clinic.services);
    const priceLevel = getPriceLevel(clinic.min_price, clinic.max_price);

    return (
        <Card style={{ marginBottom: '1.25rem' }}>
            <div className="cd-hero">
                <div className="cd-hero-photo-wrap">
                    <PhotoOrPlaceholder src={clinic.profile_photo_url} name={name} />
                </div>

                <div className="cd-hero-content">
                    <h1 className="cd-hero-name">{name}</h1>

                    <div className="cd-hero-meta">
                        {clinic.address && (
                            <span className="cd-hero-meta-item">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                {clinic.address}
                            </span>
                        )}
                        {clinic.clinic_mobile && (
                            <span className="cd-hero-meta-item">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                                </svg>
                                {clinic.clinic_mobile}
                            </span>
                        )}
                    </div>

                    <div className="cd-hero-badges">
                        {clinic.estimated_response_time && (
                            <StatusBadge status="info" label={`Responds ${clinic.estimated_response_time}`} />
                        )}
                        {priceLevel && <StatusBadge status="neutral" label={priceLevel} />}
                        {clinic.working_hours && <StatusBadge status="neutral" label={clinic.working_hours} />}
                    </div>

                    {clinic.description && (
                        <p className="cd-hero-desc">{clinic.description}</p>
                    )}

                    {services.length > 0 && (
                        <div className="cd-hero-tags">
                            {services.map((s, i) => (
                                <span key={i} className="cd-hero-tag">{s}</span>
                            ))}
                        </div>
                    )}

                    <div className="cd-hero-action">
                        <Button
                            variant={hasRequest ? 'secondary' : 'primary'}
                            size="lg"
                            disabled={hasRequest}
                            loading={requesting}
                            onClick={onRequest}
                        >
                            {hasRequest ? 'Request Sent' : 'Request Access'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}

/* ── Info cards ─────────────────────────────────────────────── */
function BudgetCard({ clinic }) {
    const priceLabel = formatPrice(clinic.min_price, clinic.max_price);
    const priceLevel = getPriceLevel(clinic.min_price, clinic.max_price);

    return (
        <Card>
            <SectionHeader title="Budget" />
            <div className="cd-budget-body">
                <div className="cd-budget-amount">{priceLabel ?? 'Contact for pricing'}</div>
                {priceLevel && (
                    <div className="cd-budget-level">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                        Price tier: <strong>{priceLevel}</strong>
                    </div>
                )}
                <div className="cd-budget-note">
                    Session prices may vary based on treatment type and duration.
                </div>
            </div>
        </Card>
    );
}

function PaymentCard({ clinic }) {
    const methods = parseList(clinic.payment_methods);

    return (
        <Card>
            <SectionHeader title="Payment Methods" />
            {methods.length > 0 ? (
                <ul className="cd-payment-list">
                    {methods.map((m, i) => (
                        <li key={i} className="cd-payment-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="1" y="4" width="22" height="16" rx="2"/>
                                <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            {m}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="cd-empty-note">Payment method information not provided.</p>
            )}
        </Card>
    );
}

function HowPaymentWorksCard() {
    return (
        <Card style={{ marginBottom: '1.25rem' }}>
            <SectionHeader title="How Payment Works" />
            <p className="cd-prose">
                Once your access request is approved, the clinic will contact you to schedule
                your first session. Payment is handled directly between you and the clinic
                according to their billing policy. Always confirm the billing process with
                the clinic after your request is approved.
            </p>
        </Card>
    );
}

/* ── Discuss card — powered by ChatBox ──────────────────────── */
function DiscussCard({ clinic, onGuestAction }) {
    return (
        <Card style={{ marginBottom: '1.25rem' }}>
            <SectionHeader title="Discuss Your Case" />
            <p className="cd-prose" style={{ marginBottom: '1rem' }}>
                Have questions before committing? Send the clinic a brief message to describe
                your condition and what you're looking for.
            </p>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                <ChatBox
                    context="inquiry"
                    referenceId={clinic.id}
                    receiverId={clinic.user_id}
                    onGuestAction={onGuestAction}
                />
            </div>
        </Card>
    );
}

function WhyDiscussCard() {
    const reasons = [
        "Understand the clinic's area of specialization before committing.",
        'Clarify the treatment approach and what to expect in sessions.',
        'Ask about session pricing, insurance, and payment flexibility.',
        'Make an informed decision that fits your schedule and needs.',
    ];

    return (
        <Card style={{ marginBottom: '1.25rem' }}>
            <SectionHeader title="Why Discuss First?" />
            <ul className="cd-bullet-list">
                {reasons.map((r, i) => (
                    <li key={i} className="cd-bullet-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {r}
                    </li>
                ))}
            </ul>
        </Card>
    );
}

function GettingStartedCard() {
    const steps = [
        { title: 'Request Access',        desc: 'Submit an access request to the clinic from this page.' },
        { title: 'Complete Your Profile', desc: 'Make sure your medical portfolio is up to date for review.' },
        { title: 'Clinic Approves',       desc: 'The clinic reviews your request and accepts you as a patient.' },
        { title: 'Start Your Rehab Plan', desc: 'Your physiotherapist creates a personalized rehabilitation plan.' },
    ];

    return (
        <Card>
            <SectionHeader title="Getting Started" />
            <div className="cd-steps">
                {steps.map((step, i) => (
                    <div key={i} className="cd-step">
                        <div className="cd-step-num">{i + 1}</div>
                        <div className="cd-step-body">
                            <div className="cd-step-title">{step.title}</div>
                            <div className="cd-step-desc">{step.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
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

    // Clinic fetch — only re-runs when id changes, never on auth state change
    // so logging in via the modal doesn't flash a loading screen
    useEffect(() => {
        setLoading(true);
        getPublicClinic(id)
            .then(res => setClinic(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    // Access request check — only for authenticated clients
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

    // The actual API call — shared between guest-then-login flow and direct authenticated flow
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
        if (!user) {
            openAuthModal(doRequest);
            return;
        }
        doRequest();
    };

    if (loading) {
        return (
            <GuestLayout>
                <div className="client-content">
                    <ClinicDetailSkeleton />
                </div>
            </GuestLayout>
        );
    }

    if (error || !clinic) {
        return (
            <GuestLayout>
                <div className="client-content">
                    <Link to="/clinics" className="cd-back-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Back to clinics
                    </Link>
                    <Card style={{ marginTop: '1.5rem' }}>
                        <div className="client-empty">This clinic could not be found or is no longer available.</div>
                    </Card>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <div className="client-content">
                <Link to="/clinics" className="cd-back-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Back to clinics
                </Link>

                <HeroCard
                    clinic={clinic}
                    hasRequest={hasRequest}
                    requesting={requesting}
                    onRequest={handleRequest}
                />

                <div className="cd-info-row">
                    <BudgetCard clinic={clinic} />
                    <PaymentCard clinic={clinic} />
                </div>

                <HowPaymentWorksCard />
                <DiscussCard clinic={clinic} onGuestAction={() => openAuthModal()} />
                <WhyDiscussCard />
                <GettingStartedCard />
            </div>
        </GuestLayout>
    );
}
