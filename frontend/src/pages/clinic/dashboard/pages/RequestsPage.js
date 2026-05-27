import { useEffect, useState } from 'react';
import { getClinicAccessRequests, updateAccessRequest } from '../../../../api/clinic';
import { useToast } from '../../../../context/ToastContext';
import Skeleton from '../../../../components/ui/Skeleton';
import GenderAvatar from '../../../../components/ui/GenderAvatar';

const FILTERS = ['All', 'Pending', 'Approved', 'Denied'];

function initials(first, last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function formatDate(iso) {
    const d = new Date(iso);
    const diff = Math.round((Date.now() - d.getTime()) / 60000);
    if (diff < 60)  return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
}

// Normalize API shape → UI shape
function normalize(r) {
    const user    = r.client_profile?.user ?? {};
    // DB stores 'rejected'; UI uses 'denied'
    const status  = r.status === 'rejected' ? 'denied' : r.status;
    return {
        id:          r.id,
        clientName:  `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unknown',
        initials:    initials(user.first_name, user.last_name),
        gender:      r.client_profile?.gender ?? null,
        condition:   r.client_profile?.condition_summary ?? '—',
        payment:     r.payment_preference ?? '—',
        requestedAt: formatDate(r.created_at),
        status,
        raw:         r,
    };
}

export default function RequestsPage() {
    const { addToast }                = useToast();
    const [filter, setFilter]         = useState('All');
    const [requests, setRequests]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [acting, setActing]         = useState(null); // id of request being actioned

    useEffect(() => {
        getClinicAccessRequests()
            .then(res => setRequests(res.data.map(normalize)))
            .catch(() => addToast('Failed to load access requests.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    async function handleAction(id, action) {
        setActing(id);
        try {
            const res = await updateAccessRequest(id, action);
            const updated = normalize(res.data);
            setRequests(prev => prev.map(r => r.id === id ? updated : r));
            addToast(
                action === 'approve' ? 'Request approved.' : 'Request rejected.',
                action === 'approve' ? 'success' : 'info'
            );
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Action failed. Please try again.', 'error');
        } finally {
            setActing(null);
        }
    }

    const filtered = filter === 'All'
        ? requests
        : requests.filter(r => r.status === filter.toLowerCase());

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    if (loading) {
        return (
            <div className="cld-page">
                <div className="cld-page-header">
                    <Skeleton height="22px" width="180px" radius="6px" />
                    <Skeleton height="14px" width="300px" radius="6px" style={{ marginTop: '0.4rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height="72px" radius="10px" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Access Requests</h2>
                <p className="cld-page-subtitle">
                    {pendingCount} pending — review and respond to incoming client requests.
                </p>
            </div>

            <div className="cld-filter-bar">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        className={`cld-filter-btn${filter === f ? ' active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                        {f === 'Pending' && pendingCount > 0 && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                                background: filter === 'Pending' ? 'rgba(255,255,255,0.25)' : 'rgba(62,71,114,0.1)',
                                color: filter === 'Pending' ? '#fff' : 'var(--primary)',
                                fontSize: '0.68rem', fontWeight: 700,
                            }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="client-card">
                {filtered.length === 0 ? (
                    <div className="cld-empty">
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 15s1.5 2 4 2 4-2 4-2"/>
                                <line x1="9" y1="9" x2="9.01" y2="9"/>
                                <line x1="15" y1="9" x2="15.01" y2="9"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">No {filter.toLowerCase()} requests found.</p>
                    </div>
                ) : (
                    <div className="cld-request-list">
                        {filtered.map(req => (
                            <RequestRow
                                key={req.id}
                                req={req}
                                acting={acting === req.id}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RequestRow({ req, acting, onAction }) {
    const isPending = req.status === 'pending';

    return (
        <div className="cld-request-item" style={{ opacity: isPending ? 1 : 0.65 }}>
            <div className="cld-request-avatar" style={{ padding: 0, overflow: 'hidden' }}>
                <GenderAvatar gender={req.gender} size={36} />
            </div>

            <div className="cld-request-info">
                <p className="cld-request-name">{req.clientName}</p>
                <div className="cld-request-meta">
                    <span className="cld-request-condition">{req.condition}</span>
                    <span className="cld-request-payment">{req.payment}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.requestedAt}</span>
                </div>
            </div>

            <div className="cld-request-actions">
                {isPending ? (
                    <>
                        <button
                            className="cld-btn-approve"
                            disabled={acting}
                            onClick={() => onAction(req.id, 'approve')}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {acting ? '…' : 'Approve'}
                        </button>
                        <button
                            className="cld-btn-deny"
                            disabled={acting}
                            onClick={() => onAction(req.id, 'reject')}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            {acting ? '…' : 'Deny'}
                        </button>
                    </>
                ) : (
                    <span style={{
                        fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.75rem',
                        borderRadius: 'var(--radius-pill)',
                        background: req.status === 'approved' ? '#f0fdf4' : '#fef2f2',
                        color:      req.status === 'approved' ? '#15803d' : '#b91c1c',
                        border:     `0.5px solid ${req.status === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                        {req.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                    </span>
                )}
            </div>
        </div>
    );
}
