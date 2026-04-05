import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClinics, createAccessRequest, getAccessRequests } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import '../../styles/ui.css';
import '../../styles/client.css';

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
                        <line x1="9" y1="8" x2="9.01" y2="8"/>
                        <line x1="15" y1="8" x2="15.01" y2="8"/>
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
        <div className="clinic-card" style={{ gap: '0.75rem' }}>
            <div className="clinic-card-header">
                <Skeleton circle width="64px" height="64px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <Skeleton height="14px" width="60%" />
                    <Skeleton height="12px" width="40%" radius="999px" />
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <Skeleton height="12px" />
                <Skeleton height="12px" width="90%" />
                <Skeleton height="12px" width="75%" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <Skeleton height="11px" width="55%" />
                <Skeleton height="11px" width="45%" />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Skeleton height="22px" width="70px" radius="999px" />
                <Skeleton height="22px" width="80px" radius="999px" />
                <Skeleton height="22px" width="65px" radius="999px" />
            </div>
            <div style={{ paddingTop: '0.9rem', borderTop: '0.5px solid #f0ede8' }}>
                <Skeleton height="34px" radius="8px" />
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
    const [clinics, setClinics]               = useState([]);
    const [activeRequests, setActiveRequests] = useState(new Set());
    const [loading, setLoading]               = useState(true);
    const [requesting, setRequesting]         = useState(null);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [search, setSearch]                 = useState('');
    const [paymentFilter, setPaymentFilter]   = useState('');
    const [priceFilter, setPriceFilter]       = useState('');

    useEffect(() => {
        Promise.all([getClinics(), getAccessRequests()])
            .then(([clinicsRes, requestsRes]) => {
                setClinics(clinicsRes.data);
                const active = new Set(
                    requestsRes.data
                        .filter(r => r.status === 'pending' || r.status === 'approved')
                        .map(r => r.clinic_id)
                );
                setActiveRequests(active);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Collect unique payment methods from all clinics
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

    // Apply filters
    const filtered = useMemo(() => {
        const q          = search.trim().toLowerCase();
        const maxBudget  = priceFilter !== '' ? parseInt(priceFilter, 10) : null;

        return clinics.filter(clinic => {
            // Search
            if (q) {
                const name      = (clinic.commercial_name || clinic.legal_name || '').toLowerCase();
                const specialty = (clinic.specialty_text  || '').toLowerCase();
                const desc      = (clinic.description     || '').toLowerCase();
                const address   = (clinic.address         || '').toLowerCase();
                if (!name.includes(q) && !specialty.includes(q) && !desc.includes(q) && !address.includes(q)) {
                    return false;
                }
            }

            // Payment method
            if (paymentFilter) {
                const methods = (clinic.payment_methods || '').toLowerCase();
                if (!methods.includes(paymentFilter.toLowerCase())) return false;
            }

            // Price (max budget — only exclude if clinic has a min_price set above the budget)
            if (maxBudget !== null && clinic.min_price != null) {
                if (clinic.min_price > maxBudget) return false;
            }

            return true;
        });
    }, [clinics, search, paymentFilter, priceFilter]);

    const handleRequest = async (clinicId) => {
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

    if (loading) {
        return (
            <ClientLayout>
                <div className="client-page-header">
                    <Skeleton height="22px" width="160px" radius="6px" style={{ marginBottom: '0.4rem' }} />
                    <Skeleton height="13px" width="220px" radius="6px" />
                </div>
                <div className="clinic-grid">
                    {Array.from({ length: 6 }).map((_, i) => <ClinicCardSkeleton key={i} />)}
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
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

                <select
                    className="clinic-filter-select"
                    value={priceFilter}
                    onChange={e => setPriceFilter(e.target.value)}
                >
                    {PRICE_BRACKETS.map(b => (
                        <option key={b.label} value={b.max ?? ''}>
                            {b.label}
                        </option>
                    ))}
                </select>

                <select
                    className="clinic-filter-select"
                    value={paymentFilter}
                    onChange={e => setPaymentFilter(e.target.value)}
                    disabled={paymentOptions.length === 0}
                >
                    <option value="">All Payment Methods</option>
                    {paymentOptions.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {(search || priceFilter || paymentFilter) && (
                    <button
                        className="clinic-filter-reset"
                        onClick={() => { setSearch(''); setPriceFilter(''); setPaymentFilter(''); }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    hasFilters={!!(search || priceFilter || paymentFilter)}
                    onClear={() => { setSearch(''); setPriceFilter(''); setPaymentFilter(''); }}
                />
            ) : (
                <div className="clinic-grid">
                    {filtered.map((clinic, i) => {
                        const hasActive    = activeRequests.has(clinic.id);
                        const isRequesting = requesting === clinic.id;
                        const name         = clinic.commercial_name || clinic.legal_name;
                        const priceLabel   = formatPrice(clinic.min_price, clinic.max_price);

                        return (
                            <div
                                key={clinic.id}
                                className="clinic-card clinic-card-clickable"
                                style={{ '--i': i }}
                                onClick={() => navigate(`/client/clinics/${clinic.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && navigate(`/client/clinics/${clinic.id}`)}
                            >
                                {/* Header */}
                                <div className="clinic-card-header">
                                    <Avatar src={clinic.profile_photo_url} name={name} size="md" />
                                    <div className="clinic-card-header-info">
                                        <span className="clinic-card-name">{name}</span>
                                        {clinic.specialty_text && (
                                            <span className="clinic-card-specialty">{clinic.specialty_text}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="clinic-card-desc">
                                    {clinic.description ?? 'No description provided.'}
                                </p>

                                {/* Meta info */}
                                <div className="clinic-card-meta">
                                    {clinic.address && (
                                        <span className="clinic-card-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            {clinic.address}
                                        </span>
                                    )}
                                    {clinic.working_hours && (
                                        <span className="clinic-card-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <circle cx="12" cy="12" r="10"/>
                                                <polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            {clinic.working_hours}
                                        </span>
                                    )}
                                    {clinic.clinic_mobile && (
                                        <span className="clinic-card-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                                            </svg>
                                            {clinic.clinic_mobile}
                                        </span>
                                    )}
                                    {clinic.estimated_response_time && (
                                        <span className="clinic-card-meta-item clinic-card-meta-response">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                            </svg>
                                            Responds {clinic.estimated_response_time}
                                        </span>
                                    )}
                                </div>

                                {/* Price badge */}
                                {priceLabel && (
                                    <div className="clinic-card-price">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <line x1="12" y1="1" x2="12" y2="23"/>
                                            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                        </svg>
                                        {priceLabel}
                                    </div>
                                )}

                                {/* Services tags */}
                                {clinic.services && (
                                    <div className="clinic-card-tags">
                                        {clinic.services.split(',').slice(0, 3).map((s, i) => (
                                            <span key={i} className="clinic-card-tag">{s.trim()}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="clinic-card-footer">
                                    <Button
                                        variant={hasActive ? 'secondary' : 'primary'}
                                        size="sm"
                                        onClick={e => { e.stopPropagation(); handleRequest(clinic.id); }}
                                        disabled={hasActive}
                                        loading={isRequesting}
                                        style={{ width: '100%' }}
                                    >
                                        {hasActive ? 'Request Sent' : 'Request Access'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </ClientLayout>
    );
}
