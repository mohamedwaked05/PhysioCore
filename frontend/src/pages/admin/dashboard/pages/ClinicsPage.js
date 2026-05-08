import { useState, useEffect, useCallback } from 'react';
import { getAdminClinics, getAdminClinic, getAdminStats, approveClinic, rejectClinic } from '../../../../api/admin';
import { useToast } from '../../../../context/ToastContext';
import Skeleton from '../../../../components/ui/Skeleton';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];

function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Clinic Profile Detail Panel ──────────────────────────── */
function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.55rem 0', borderBottom: '0.5px solid var(--border-light)' }}>
            <span style={{ width: 150, flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '0.05rem' }}>
                {label}
            </span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {value}
            </span>
        </div>
    );
}

function FileLink({ label, url }) {
    if (!url) return null;
    return (
        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.55rem 0', borderBottom: '0.5px solid var(--border-light)', alignItems: 'center' }}>
            <span style={{ width: 150, flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
            </span>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                View Document
            </a>
        </div>
    );
}

function ClinicDetailPanel({ clinicId, onClose, onApproved, onRejected }) {
    const { addToast }    = useToast();
    const [clinic,        setClinic]        = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [rejectMode,    setRejectMode]    = useState(false);
    const [reason,        setReason]        = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getAdminClinic(clinicId)
            .then(res => setClinic(res.data))
            .catch(() => addToast('Failed to load clinic profile.', 'error'))
            .finally(() => setLoading(false));
    }, [clinicId]); // eslint-disable-line

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await approveClinic(clinicId);
            addToast('Clinic approved successfully.', 'success');
            onApproved(clinicId);
            onClose();
        } catch {
            addToast('Failed to approve clinic.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) return;
        setActionLoading(true);
        try {
            await rejectClinic(clinicId, { reason: reason.trim() });
            addToast('Clinic rejected.', 'success');
            onRejected(clinicId);
            onClose();
        } catch {
            addToast('Failed to reject clinic.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const isPending = clinic?.verification_status === 'pending';

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1100, padding: '1rem',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                width: '100%', maxWidth: 620, maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.1rem 1.5rem', borderBottom: '0.5px solid var(--border-light)',
                    flexShrink: 0,
                }}>
                    <div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>
                            Clinic Review
                        </p>
                        {clinic && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                                Submitted {formatDate(clinic.created_at)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[1,2,3,4,5].map(i => <Skeleton key={i} height="38px" radius="6px" />)}
                        </div>
                    ) : !clinic ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Could not load clinic data.</p>
                    ) : (
                        <>
                            {/* Status badge */}
                            <div style={{ marginBottom: '1rem' }}>
                                <span className={`adm-badge adm-badge--${clinic.verification_status}`}>
                                    {clinic.verification_status}
                                </span>
                                {clinic.rejection_reason && (
                                    <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.5rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '0.5px solid #fca5a5' }}>
                                        Rejection reason: {clinic.rejection_reason}
                                    </p>
                                )}
                            </div>

                            {/* Identity */}
                            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Identity</p>
                            <InfoRow label="Legal Name"       value={clinic.legal_name} />
                            <InfoRow label="Commercial Name"  value={clinic.commercial_name} />
                            <InfoRow label="Tax ID"           value={clinic.tax_id} />
                            <InfoRow label="License No."      value={clinic.license_number} />
                            <InfoRow label="Account Owner"    value={clinic.user ? `${clinic.user.first_name} ${clinic.user.last_name}` : null} />
                            <InfoRow label="Email (Account)"  value={clinic.user?.email} />
                            <InfoRow label="Email (Clinic)"   value={clinic.clinic_email} />
                            <InfoRow label="Phone"            value={clinic.clinic_mobile} />
                            <InfoRow label="Address"          value={clinic.address} />

                            {/* Documents */}
                            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.1rem 0 0.4rem' }}>Documents</p>
                            <FileLink label="License File"   url={clinic.license_file_url} />
                            <FileLink label="Certification"  url={clinic.cert_file_url} />

                            {/* Practice */}
                            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.1rem 0 0.4rem' }}>Practice</p>
                            <InfoRow label="Specialty"       value={clinic.specialty_text} />
                            <InfoRow label="Description"     value={clinic.description} />
                            <InfoRow label="Certifications"  value={clinic.certifications} />
                            <InfoRow label="Experience"      value={clinic.experience ? `${clinic.experience} years` : null} />
                            <InfoRow label="Services"        value={clinic.services} />
                            <InfoRow label="Price Range"     value={clinic.min_price && clinic.max_price ? `$${clinic.min_price} – $${clinic.max_price}` : null} />
                            <InfoRow label="Payment Methods" value={clinic.payment_methods} />
                            <InfoRow label="Working Hours"   value={clinic.working_hours} />
                            <InfoRow label="Response Time"   value={clinic.estimated_response_time} />
                            <InfoRow label="Social"          value={clinic.social_media_link} />
                        </>
                    )}
                </div>

                {/* Footer — actions */}
                {!loading && clinic && isPending && (
                    <div style={{
                        padding: '1rem 1.5rem', borderTop: '0.5px solid var(--border-light)',
                        flexShrink: 0, background: 'var(--surface)',
                    }}>
                        {!rejectMode ? (
                            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                                <button className="adm-btn adm-btn--reject" disabled={actionLoading} onClick={() => setRejectMode(true)}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    Reject
                                </button>
                                <button className="adm-btn adm-btn--approve" disabled={actionLoading} onClick={handleApprove}>
                                    {actionLoading ? 'Approving…' : (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            Approve Clinic
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Rejection reason:</p>
                                <textarea
                                    className="adm-modal"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="e.g. License documentation incomplete, invalid credentials..."
                                    maxLength={500}
                                    style={{
                                        width: '100%', minHeight: 80, padding: '0.6rem 0.85rem',
                                        border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg)', color: 'var(--text)', fontSize: '0.84rem',
                                        resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                                    <button className="adm-btn adm-btn--resolve" disabled={actionLoading} onClick={() => { setRejectMode(false); setReason(''); }}>
                                        Cancel
                                    </button>
                                    <button className="adm-btn adm-btn--reject" disabled={actionLoading || !reason.trim()} onClick={handleReject}>
                                        {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main Clinics Page ─────────────────────────────────────── */
export default function ClinicsPage() {
    const { addToast } = useToast();
    const [clinics,      setClinics]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filter,       setFilter]       = useState('pending');
    const [search,       setSearch]       = useState('');
    const [page,         setPage]         = useState(1);
    const [meta,         setMeta]         = useState(null);
    const [reviewId,     setReviewId]     = useState(null);
    const [counts,       setCounts]       = useState({});

    const fetchClinics = useCallback(() => {
        setLoading(true);
        const params = { page };
        if (filter !== 'all') params.status = filter;
        if (search.trim())    params.search  = search.trim();

        getAdminClinics(params)
            .then(res => { setClinics(res.data.data); setMeta(res.data); })
            .catch(() => addToast('Failed to load clinics.', 'error'))
            .finally(() => setLoading(false));
    }, [filter, search, page]); // eslint-disable-line

    useEffect(() => { fetchClinics(); }, [fetchClinics]);
    useEffect(() => { setPage(1); }, [filter, search]);

    // Load tab counts from stats
    useEffect(() => {
        getAdminStats()
            .then(res => setCounts(res.data?.clinics ?? {}))
            .catch(() => {});
    }, []);

    // Remove approved/rejected clinic from filtered list and refresh counts
    const handleApproved = (id) => {
        setClinics(prev => prev.filter(c => c.id !== id));
        setCounts(prev => ({ ...prev, pending: Math.max((prev.pending ?? 1) - 1, 0), approved: (prev.approved ?? 0) + 1 }));
    };
    const handleRejected = (id) => {
        setClinics(prev => prev.filter(c => c.id !== id));
        setCounts(prev => ({ ...prev, pending: Math.max((prev.pending ?? 1) - 1, 0), rejected: (prev.rejected ?? 0) + 1 }));
    };

    const tabLabel = (s) => {
        const count = s === 'pending' ? counts.pending : s === 'approved' ? counts.approved : s === 'rejected' ? counts.rejected : null;
        return (
            <>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {count != null && <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', fontWeight: 700, background: filter === s ? 'rgba(255,255,255,0.25)' : 'var(--surface-dim)', color: filter === s ? '#fff' : 'var(--text-muted)', padding: '1px 6px', borderRadius: 999 }}>{count}</span>}
            </>
        );
    };

    return (
        <div className="adm-page">
            {reviewId && (
                <ClinicDetailPanel
                    clinicId={reviewId}
                    onClose={() => setReviewId(null)}
                    onApproved={handleApproved}
                    onRejected={handleRejected}
                />
            )}

            <div className="adm-section">
                <div className="adm-section-header">
                    <div className="adm-filter-bar">
                        {STATUS_FILTERS.map(s => (
                            <button key={s} className={`adm-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
                                {tabLabel(s)}
                            </button>
                        ))}
                    </div>
                    <div className="adm-search">
                        <span className="adm-search-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        </span>
                        <input type="text" placeholder="Search clinics…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[1,2,3,4,5].map(i => <Skeleton key={i} height="58px" radius="8px" />)}
                    </div>
                ) : clinics.length === 0 ? (
                    <div className="adm-table-wrap">
                        <div className="adm-empty">
                            <div className="adm-empty-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 21V7l9-4 9 4v14"/><rect x="9" y="13" width="6" height="8"/></svg>
                            </div>
                            <p className="adm-empty-text">No clinics found.</p>
                        </div>
                    </div>
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Clinic</th>
                                    <th>Email</th>
                                    <th>License</th>
                                    <th>Registered</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clinics.map(c => {
                                    const name     = c.commercial_name ?? c.legal_name ?? '—';
                                    const initials = name.slice(0, 2).toUpperCase();

                                    return (
                                        <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setReviewId(c.id)}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <div className="adm-list-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>{name}</div>
                                                        {c.rejection_reason && (
                                                            <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.1rem' }}>
                                                                Rejected: {c.rejection_reason.slice(0, 50)}{c.rejection_reason.length > 50 ? '…' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.clinic_email ?? c.user?.email ?? '—'}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.license_number ?? '—'}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{c.created_at ? formatDate(c.created_at) : '—'}</td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <span className={`adm-badge adm-badge--${c.verification_status}`}>{c.verification_status}</span>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <button className="adm-btn adm-btn--resolve" onClick={() => setReviewId(c.id)}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {meta && meta.last_page > 1 && (
                            <div className="adm-pagination">
                                <button className="adm-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                                    .map((p, i) => p === '…'
                                        ? <span key={`e${i}`} style={{ padding: '0 0.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>…</span>
                                        : <button key={p} className={`adm-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                    )
                                }
                                <button className="adm-page-btn" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>›</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
