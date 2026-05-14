import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicClinics } from '../../api/public';
import { createAccessRequest, getAccessRequests } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAuthModal } from '../../context/AuthModalContext';
import GuestLayout from '../../components/GuestLayout';
import Skeleton from '../../components/ui/Skeleton';
import '../../styles/ui.css';
import '../../styles/client.css';
import '../../styles/guest.css';

const getInitials = (name) => {
    if (!name) return 'PC';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

const getSpecialtyTags = (clinic) => {
    const text = clinic.specialty_text || clinic.services || '';
    if (!text) return [];
    return text.split(/[,،;]+/).map(s => s.trim()).filter(Boolean);
};

function EmptyState({ hasFilters, onClear }) {
    return (
        <div className="clinic-empty-state">
            <div className="clinic-empty-icon">
                {hasFilters ? (
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                ) : (
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                )}
            </div>
            <h3 className="clinic-empty-title">
                {hasFilters ? 'No results found' : 'No clinics yet'}
            </h3>
            <p className="clinic-empty-desc">
                {hasFilters
                    ? 'No clinics match your current search or filters. Try adjusting your criteria.'
                    : 'There are no verified clinics on the platform yet. Check back soon.'}
            </p>
            {hasFilters && (
                <button className="clinic-empty-clear" onClick={onClear}>
                    Clear all filters
                </button>
            )}
        </div>
    );
}

function ClinicCardSkeleton() {
    return (
        <div className="clinic-card">
            <div className="clinic-card-banner" style={{ background: 'var(--surface-dim)' }}>
                <div style={{
                    position: 'absolute', bottom: -24, left: '1.25rem',
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--surface)', border: '2px solid var(--bg)',
                }} />
            </div>
            <div className="clinic-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem', paddingTop: '0.5rem' }}>
                    <Skeleton height="15px" width="55%" />
                    <Skeleton height="11px" width="38%" />
                </div>
                <Skeleton height="11px" style={{ marginBottom: '0.25rem' }} />
                <Skeleton height="11px" width="80%" style={{ marginBottom: '0.85rem' }} />
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                    <Skeleton height="20px" width="75px" radius="999px" />
                    <Skeleton height="20px" width="90px" radius="999px" />
                </div>
                <Skeleton height="36px" radius="10px" />
            </div>
        </div>
    );
}

const PRICE_BRACKETS = [
    { label: 'Any Price',    max: null },
    { label: 'Up to $50',   max: 50   },
    { label: 'Up to $100',  max: 100  },
    { label: 'Up to $200',  max: 200  },
    { label: 'Up to $500',  max: 500  },
];

function formatPrice(min, max) {
    if (min != null && max != null) return `$${min} – $${max} / session`;
    if (min != null)                return `From $${min} / session`;
    if (max != null)                return `Up to $${max} / session`;
    return null;
}

export default function ClinicListingPage() {
    const { user }          = useAuth();
    const { addToast }      = useToast();
    const { openAuthModal } = useAuthModal();
    const navigate          = useNavigate();

    const [clinics, setClinics]               = useState([]);
    const [activeRequests, setActiveRequests] = useState(new Set());
    const [loading, setLoading]               = useState(true);
    const [requesting, setRequesting]         = useState(null);

    const [search, setSearch]               = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [priceFilter, setPriceFilter]     = useState('');

    useEffect(() => {
        getPublicClinics()
            .then(res => setClinics(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));

        if (user?.role === 'client') {
            getAccessRequests()
                .then(res => {
                    const active = new Set(
                        res.data
                            .filter(r => r.status === 'pending' || r.status === 'approved')
                            .map(r => r.clinic_id)
                    );
                    setActiveRequests(active);
                })
                .catch(() => {});
        }
    }, [user]);

    const paymentOptions = useMemo(() => {
        const set = new Set();
        clinics.forEach(c => {
            if (c.payment_methods) {
                c.payment_methods.split(',').forEach(m => {
                    const t = m.trim();
                    if (t) set.add(t);
                });
            }
        });
        return Array.from(set).sort();
    }, [clinics]);

    const filtered = useMemo(() => {
        const q         = search.trim().toLowerCase();
        const maxBudget = priceFilter !== '' ? parseInt(priceFilter, 10) : null;

        return clinics.filter(clinic => {
            if (q) {
                const name      = (clinic.commercial_name || clinic.legal_name || '').toLowerCase();
                const specialty = (clinic.specialty_text  || '').toLowerCase();
                const desc      = (clinic.description     || '').toLowerCase();
                const address   = (clinic.address         || '').toLowerCase();
                if (!name.includes(q) && !specialty.includes(q) && !desc.includes(q) && !address.includes(q)) {
                    return false;
                }
            }
            if (paymentFilter) {
                const methods = (clinic.payment_methods || '').toLowerCase();
                if (!methods.includes(paymentFilter.toLowerCase())) return false;
            }
            if (maxBudget !== null && clinic.min_price != null) {
                if (clinic.min_price > maxBudget) return false;
            }
            return true;
        });
    }, [clinics, search, paymentFilter, priceFilter]);

    const doRequest = async (clinicId) => {
        setRequesting(clinicId);
        try {
            await createAccessRequest({ clinic_id: clinicId });
            setActiveRequests(prev => new Set([...prev, clinicId]));
            addToast('Access request sent successfully.', 'success');
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Failed to send request.', 'error');
        } finally {
            setRequesting(null);
        }
    };

    const handleRequest = (clinicId, e) => {
        e.stopPropagation();
        if (!user) {
            openAuthModal(() => doRequest(clinicId));
            return;
        }
        doRequest(clinicId);
    };

    const clearFilters = () => { setSearch(''); setPriceFilter(''); setPaymentFilter(''); };
    const hasFilters   = !!(search || priceFilter || paymentFilter);

    if (loading) {
        return (
            <GuestLayout>
                <div className="client-content">
                    <div className="client-page-header">
                        <Skeleton height="22px" width="160px" radius="6px" style={{ marginBottom: '0.4rem' }} />
                        <Skeleton height="13px" width="220px" radius="6px" />
                    </div>
                    <div className="clinics-grid">
                        {Array.from({ length: 6 }).map((_, i) => <ClinicCardSkeleton key={i} />)}
                    </div>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <div className="client-content">
                <div className="client-page-header">
                    <h1 className="client-page-title">Browse Clinics</h1>
                    <p className="client-page-subtitle">
                        {filtered.length} of {clinics.length} verified {clinics.length === 1 ? 'clinic' : 'clinics'} shown.
                    </p>
                </div>

                {/* Search & Filter Bar */}
                <div className="clinic-filter-bar">
                    <div className="clinic-search-wrap">
                        <svg className="clinic-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            className="clinic-search-input"
                            type="text"
                            placeholder="Search by name, specialty, or location…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="clinic-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    <select className="clinic-filter-select" value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
                        {PRICE_BRACKETS.map(b => (
                            <option key={b.label} value={b.max ?? ''}>{b.label}</option>
                        ))}
                    </select>

                    <select
                        className="clinic-filter-select"
                        value={paymentFilter}
                        onChange={e => setPaymentFilter(e.target.value)}
                        disabled={paymentOptions.length === 0}
                    >
                        <option value="">All Payment Methods</option>
                        {paymentOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    {hasFilters && (
                        <button className="clinic-filter-reset" onClick={clearFilters}>Clear filters</button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                ) : (
                    <div className="clinics-grid">
                        {filtered.map((clinic, i) => {
                            const hasActive    = activeRequests.has(clinic.id);
                            const isRequesting = requesting === clinic.id;
                            const name         = clinic.commercial_name || clinic.legal_name;
                            const priceLabel   = formatPrice(clinic.min_price, clinic.max_price);
                            const tags         = getSpecialtyTags(clinic);

                            return (
                                <div
                                    key={clinic.id}
                                    className="clinic-card"
                                    style={{ '--i': i }}
                                    onClick={() => navigate(`/clinics/${clinic.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => e.key === 'Enter' && navigate(`/clinics/${clinic.id}`)}
                                >
                                    {/* Banner */}
                                    <div className="clinic-card-banner">
                                        <div className="clinic-card-verified">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            </svg>
                                            <span>Verified</span>
                                        </div>
                                        <div className="clinic-card-logo">
                                            {clinic.profile_photo_url ? (
                                                <img src={clinic.profile_photo_url} alt={name} />
                                            ) : (
                                                <span>{getInitials(name)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="clinic-card-body">
                                        <div className="clinic-card-top">
                                            <div>
                                                <h3 className="clinic-card-name">{name}</h3>
                                                <div className="clinic-card-location">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                        <circle cx="12" cy="10" r="3"/>
                                                    </svg>
                                                    <span>{clinic.address || 'Lebanon'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="clinic-card-description">
                                            {clinic.specialty_text
                                                ? clinic.specialty_text.slice(0, 100) + (clinic.specialty_text.length > 100 ? '…' : '')
                                                : clinic.description
                                                    ? clinic.description.slice(0, 100) + (clinic.description.length > 100 ? '…' : '')
                                                    : 'Verified physiotherapy clinic offering personalized rehabilitation plans.'}
                                        </p>

                                        {tags.length > 0 && (
                                            <div className="clinic-card-tags">
                                                {tags.slice(0, 3).map((tag, j) => (
                                                    <span key={j} className={`clinic-tag ${j < 2 ? 'clinic-tag-primary' : 'clinic-tag-secondary'}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="clinic-card-stats">
                                            {clinic.working_hours && (
                                                <div className="clinic-stat">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <polyline points="12 6 12 12 16 14"/>
                                                    </svg>
                                                    <span>Mon – Sat</span>
                                                </div>
                                            )}
                                            {priceLabel && (
                                                <div className="clinic-stat">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <line x1="12" y1="1" x2="12" y2="23"/>
                                                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                                    </svg>
                                                    <span>{priceLabel}</span>
                                                </div>
                                            )}
                                            {clinic.estimated_response_time && (
                                                <div className="clinic-stat clinic-stat-green">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                                    </svg>
                                                    <span>Responds {clinic.estimated_response_time}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="clinic-card-actions">
                                            <button
                                                className={`clinic-card-btn-primary${hasActive ? ' clinic-card-btn-sent' : ''}`}
                                                onClick={e => handleRequest(clinic.id, e)}
                                                disabled={hasActive || isRequesting}
                                            >
                                                {isRequesting ? '…' : hasActive ? (
                                                    <>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <polyline points="20 6 9 17 4 12"/>
                                                        </svg>
                                                        Request Sent
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14z"/>
                                                        </svg>
                                                        Request Access
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="clinic-card-btn-icon"
                                                onClick={e => { e.stopPropagation(); navigate(`/clinics/${clinic.id}`); }}
                                                title="View profile"
                                                aria-label="View clinic profile"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
