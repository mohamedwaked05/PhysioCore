import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../../../api/admin';
import Skeleton from '../../../../components/ui/Skeleton';

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ label, value, sub, variant }) {
    return (
        <div className={`adm-stat-card${variant ? ` ${variant}` : ''}`}>
            <div className="adm-stat-label">{label}</div>
            <div className="adm-stat-value">{value ?? '—'}</div>
            {sub && <div className="adm-stat-sub">{sub}</div>}
        </div>
    );
}

export default function AdminOverviewPage() {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);

    useEffect(() => {
        getAdminStats()
            .then(res => setData(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="adm-page">
            <div className="adm-stats-grid">
                {[1,2,3,4].map(i => <Skeleton key={i} height="100px" radius="12px" />)}
            </div>
            <div className="adm-overview-grid">
                <Skeleton height="260px" radius="12px" />
                <Skeleton height="260px" radius="12px" />
            </div>
        </div>
    );

    if (error) return (
        <div className="adm-page">
            <div className="adm-card">
                <div className="adm-empty">
                    <div className="adm-empty-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <p className="adm-empty-text">Failed to load dashboard data.</p>
                </div>
            </div>
        </div>
    );

    const { clinics, users, flags, recent_clinics, recent_flags } = data;

    return (
        <div className="adm-page">
            {/* ── Stats ── */}
            <div className="adm-stats-grid">
                <StatCard
                    label="Total Users"
                    value={users?.total}
                    sub={`${users?.clients ?? 0} clients · ${users?.clinics ?? 0} clinics`}
                />
                <StatCard
                    label="Pending Clinics"
                    value={clinics?.pending}
                    sub={`${clinics?.verified ?? 0} verified · ${clinics?.rejected ?? 0} rejected`}
                    variant={clinics?.pending > 0 ? 'warning' : ''}
                />
                <StatCard
                    label="Safety Flags"
                    value={flags?.unresolved}
                    sub="unresolved alerts"
                    variant={flags?.unresolved > 0 ? 'danger' : ''}
                />
                <StatCard
                    label="Critical Alerts"
                    value={flags?.critical}
                    sub="require immediate attention"
                    variant={flags?.critical > 0 ? 'danger' : ''}
                />
            </div>

            {/* ── Recent panels ── */}
            <div className="adm-overview-grid">
                {/* Pending clinics */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <span className="adm-card-title">Pending Clinic Approvals</span>
                        <Link to="clinics" className="adm-card-link">View all →</Link>
                    </div>
                    {recent_clinics?.length === 0 ? (
                        <div className="adm-empty">
                            <div className="adm-empty-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <p className="adm-empty-text">No pending approvals.</p>
                        </div>
                    ) : (
                        recent_clinics.map(c => {
                            const initials = c.name?.slice(0, 2).toUpperCase() ?? '??';
                            return (
                                <div key={c.id} className="adm-list-item">
                                    <div className="adm-list-avatar" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>
                                        {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="adm-list-name">{c.name}</div>
                                        <div className="adm-list-meta">{c.email} · {timeAgo(c.created_at)}</div>
                                    </div>
                                    <span className="adm-badge adm-badge--pending">Pending</span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Recent safety flags */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <span className="adm-card-title">Recent Safety Flags</span>
                        <Link to="safety" className="adm-card-link">View all →</Link>
                    </div>
                    {recent_flags?.length === 0 ? (
                        <div className="adm-empty">
                            <div className="adm-empty-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <p className="adm-empty-text">No active safety flags.</p>
                        </div>
                    ) : (
                        recent_flags.map(f => (
                            <div key={f.id} className="adm-list-item">
                                <div className="adm-list-avatar" style={{
                                    background: f.severity === 'critical' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                                    color: f.severity === 'critical' ? '#dc2626' : '#d97706',
                                }}>
                                    {f.severity === 'critical' ? '🚨' : '⚠️'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="adm-list-name">{f.patient}</div>
                                    <div className="adm-list-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {f.flag_reason} · {f.clinic_name}
                                    </div>
                                </div>
                                <span className={`adm-badge adm-badge--${f.severity}`}>{f.severity}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
