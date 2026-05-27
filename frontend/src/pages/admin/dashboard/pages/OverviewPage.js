import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../../../api/admin';
import Skeleton from '../../../../components/ui/Skeleton';
import GenderAvatar from '../../../../components/ui/GenderAvatar';

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

    const { clinics, users, recent_clinics } = data;

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
                    sub={`${clinics?.approved ?? 0} approved · ${clinics?.rejected ?? 0} rejected`}
                    variant={clinics?.pending > 0 ? 'warning' : ''}
                />
                <StatCard
                    label="Total Clinics"
                    value={(clinics?.pending ?? 0) + (clinics?.approved ?? 0) + (clinics?.rejected ?? 0)}
                    sub="registered on the platform"
                />
            </div>

            {/* ── Recent pending clinics ── */}
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
                        return (
                            <div key={c.id} className="adm-list-item">
                                <GenderAvatar gender={undefined} size={34} />
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
        </div>
    );
}
