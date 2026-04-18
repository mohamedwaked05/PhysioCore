import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSafetyFlags, resolveSafetyFlag } from '../../../../api/clinic';
import Skeleton from '../../../../components/ui/Skeleton';

const PRIORITY_FILTERS = ['All', 'High', 'Medium', 'Low'];

function severityToPriority(severity) {
    if (severity === 'critical') return 'high';
    if (severity === 'warning')  return 'medium';
    return 'low';
}

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function FlagCard({ flag, onResolved }) {
    const [resolving, setResolving] = useState(false);
    const [resolved,  setResolved]  = useState(false);

    const priority = severityToPriority(flag.severity);

    const handleResolve = async () => {
        setResolving(true);
        try {
            await resolveSafetyFlag(flag.id);
            setResolved(true);
            setTimeout(() => onResolved(flag.id), 600);
        } catch {
            setResolving(false);
        }
    };

    return (
        <div className={`cld-flag-item ${priority}`} style={{ opacity: resolved ? 0.45 : 1, transition: 'opacity 0.3s' }}>
            <div className="cld-request-avatar" style={{
                background: priority === 'high'   ? 'rgba(220,38,38,0.1)'  :
                            priority === 'medium' ? 'rgba(217,119,6,0.1)'  :
                                                    'rgba(22,163,74,0.1)',
                color:      priority === 'high'   ? '#dc2626' :
                            priority === 'medium' ? '#d97706' :
                                                    '#16a34a',
            }}>
                {flag.initials}
            </div>

            <div className="cld-flag-info" style={{ flex: 1 }}>
                <p className="cld-flag-name">{flag.patient_name}</p>
                <p className="cld-flag-issue">{flag.flag_reason}</p>
                <span className="cld-flag-time" style={{ marginTop: '0.2rem', display: 'block' }}>
                    {timeAgo(flag.created_at)}
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
                {resolved ? (
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 600, color: '#15803d',
                        background: '#f0fdf4', border: '0.5px solid #bbf7d0',
                        padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-pill)',
                    }}>
                        ✓ Resolved
                    </span>
                ) : (
                    <>
                        <Link
                            to={`/clinic/dashboard/patients/${flag.client_profile_id}/feedback`}
                            className="cld-btn-review"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                            Review
                        </Link>
                        <button className="cld-btn-action" onClick={handleResolve} disabled={resolving}>
                            {resolving ? (
                                '...'
                            ) : (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Resolve
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SafetyFlagsPage() {
    const [flags,   setFlags]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter,  setFilter]  = useState('All');

    useEffect(() => {
        getSafetyFlags()
            .then(res => setFlags(res.data))
            .catch(() => setFlags([]))
            .finally(() => setLoading(false));
    }, []);

    const handleResolved = (id) => setFlags(prev => prev.filter(f => f.id !== id));

    const withPriority = flags.map(f => ({ ...f, priority: severityToPriority(f.severity) }));

    const filtered = filter === 'All'
        ? withPriority
        : withPriority.filter(f => f.priority === filter.toLowerCase());

    const grouped = {
        high:   filtered.filter(f => f.priority === 'high'),
        medium: filtered.filter(f => f.priority === 'medium'),
        low:    filtered.filter(f => f.priority === 'low'),
    };

    const counts = {
        high:   withPriority.filter(f => f.priority === 'high').length,
        medium: withPriority.filter(f => f.priority === 'medium').length,
        low:    withPriority.filter(f => f.priority === 'low').length,
    };

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Safety Flags</h2>
                <p className="cld-page-subtitle">
                    {loading ? 'Loading...' : `${counts.high} high · ${counts.medium} medium · ${counts.low} low — review and resolve patient alerts.`}
                </p>
            </div>

            <div className="cld-filter-bar">
                {PRIORITY_FILTERS.map(f => (
                    <button
                        key={f}
                        className={`cld-filter-btn${filter === f ? ' active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f !== 'All' && (
                            <span className="cld-flag-dot" style={{
                                background: f === 'High' ? '#ef4444' : f === 'Medium' ? '#f59e0b' : '#22c55e',
                            }}/>
                        )}
                        {f}
                        {f !== 'All' && !loading && (
                            <span style={{
                                fontSize: '0.68rem', fontWeight: 700,
                                background: filter === f ? 'rgba(255,255,255,0.25)' : 'var(--bg)',
                                color: filter === f ? '#fff' : 'var(--text-secondary)',
                                padding: '0 5px', borderRadius: 999, minWidth: 18,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 18,
                            }}>
                                {counts[f.toLowerCase()]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height="80px" radius="10px" />)}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {grouped.high.length > 0 && (
                        <div className="client-card">
                            <div className="cld-flag-group-label high" style={{ marginBottom: '1rem' }}>
                                <span className="cld-flag-dot high"/>
                                High Priority
                                <span style={{ marginLeft: '0.25rem', fontWeight: 700 }}>({grouped.high.length})</span>
                            </div>
                            <div className="cld-flag-list">
                                {grouped.high.map(flag => <FlagCard key={flag.id} flag={flag} onResolved={handleResolved} />)}
                            </div>
                        </div>
                    )}

                    {grouped.medium.length > 0 && (
                        <div className="client-card">
                            <div className="cld-flag-group-label medium" style={{ marginBottom: '1rem' }}>
                                <span className="cld-flag-dot medium"/>
                                Medium Priority
                                <span style={{ marginLeft: '0.25rem', fontWeight: 700 }}>({grouped.medium.length})</span>
                            </div>
                            <div className="cld-flag-list">
                                {grouped.medium.map(flag => <FlagCard key={flag.id} flag={flag} onResolved={handleResolved} />)}
                            </div>
                        </div>
                    )}

                    {grouped.low.length > 0 && (
                        <div className="client-card">
                            <div className="cld-flag-group-label low" style={{ marginBottom: '1rem' }}>
                                <span className="cld-flag-dot low"/>
                                Low Priority
                                <span style={{ marginLeft: '0.25rem', fontWeight: 700 }}>({grouped.low.length})</span>
                            </div>
                            <div className="cld-flag-list">
                                {grouped.low.map(flag => <FlagCard key={flag.id} flag={flag} onResolved={handleResolved} />)}
                            </div>
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="client-card">
                            <div className="cld-empty">
                                <div className="cld-empty-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <p className="cld-empty-text">
                                    {filter === 'All' ? 'No active safety flags.' : `No ${filter.toLowerCase()} priority flags.`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
