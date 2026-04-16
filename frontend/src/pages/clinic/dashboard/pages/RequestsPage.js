import { useState } from 'react';
import { mockAccessRequests } from '../data/mockData';

const FILTERS = ['All', 'Pending', 'Approved', 'Denied'];

export default function RequestsPage() {
    const [filter, setFilter] = useState('All');
    const [requests, setRequests] = useState(
        mockAccessRequests.map(r => ({ ...r, status: 'pending' }))
    );

    function handleAction(id, action) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    }

    const filtered = filter === 'All'
        ? requests
        : requests.filter(r => r.status === filter.toLowerCase());

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Access Requests</h2>
                <p className="cld-page-subtitle">{requests.filter(r => r.status === 'pending').length} pending — review and respond to incoming client requests.</p>
            </div>

            <div className="cld-filter-bar">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        className={`cld-filter-btn${filter === f ? ' active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                        {f === 'Pending' && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                                background: filter === 'Pending' ? 'rgba(255,255,255,0.25)' : 'rgba(62,71,114,0.1)',
                                color: filter === 'Pending' ? '#fff' : 'var(--primary)',
                                fontSize: '0.68rem', fontWeight: 700,
                            }}>
                                {requests.filter(r => r.status === 'pending').length}
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
                                <circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">No {filter.toLowerCase()} requests found.</p>
                    </div>
                ) : (
                    <div className="cld-request-list">
                        {filtered.map(req => (
                            <RequestRow key={req.id} req={req} onAction={handleAction} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RequestRow({ req, onAction }) {
    const isPending = req.status === 'pending';

    return (
        <div className="cld-request-item" style={{ opacity: isPending ? 1 : 0.65 }}>
            <div className="cld-request-avatar">{req.initials}</div>

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
                        <button className="cld-btn-approve" onClick={() => onAction(req.id, 'approved')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Approve
                        </button>
                        <button className="cld-btn-deny" onClick={() => onAction(req.id, 'denied')}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Deny
                        </button>
                    </>
                ) : (
                    <span style={{
                        fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)',
                        background: req.status === 'approved' ? '#f0fdf4' : '#fef2f2',
                        color: req.status === 'approved' ? '#15803d' : '#b91c1c',
                        border: `0.5px solid ${req.status === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                        {req.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                    </span>
                )}
            </div>
        </div>
    );
}
