import { useState, useEffect } from 'react';
import { getAdminSafetyFlags, adminResolveFlag } from '../../../../api/admin';
import { useToast } from '../../../../context/ToastContext';
import Skeleton from '../../../../components/ui/Skeleton';

const SEVERITY_FILTERS = ['all', 'critical', 'warning'];

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Active flag row ─────────────────────────────────────────── */
function FlagRow({ flag, onResolved }) {
    const { addToast } = useToast();
    const [resolving,   setResolving]   = useState(false);
    const [resolved,    setResolved]    = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [note,        setNote]        = useState('');

    const handleResolve = async () => {
        setResolving(true);
        try {
            await adminResolveFlag(flag.id, { resolution_note: note.trim() || undefined });
            setResolved(true);
            addToast('Flag resolved.', 'success');
            setTimeout(() => onResolved(flag.id), 500);
        } catch {
            addToast('Failed to resolve.', 'error');
            setResolving(false);
        }
    };

    return (
        <tr style={{ opacity: resolved ? 0.4 : 1, transition: 'opacity 0.3s' }}>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="adm-list-avatar" style={{
                        width: 32, height: 32, fontSize: '0.72rem',
                        background: flag.severity === 'critical' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                        color: flag.severity === 'critical' ? '#dc2626' : '#d97706',
                    }}>
                        {flag.initials}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>{flag.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{flag.condition}</div>
                    </div>
                </div>
            </td>
            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 220 }}>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {flag.flag_reason}
                </span>
            </td>
            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{flag.clinic_name}</td>
            <td>
                <span className={`adm-badge adm-badge--${flag.severity}`}>
                    {flag.severity === 'critical' ? '🚨 Critical' : '⚠️ Warning'}
                </span>
            </td>
            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {timeAgo(flag.created_at)}
            </td>
            <td style={{ minWidth: 160 }}>
                {!resolved && (
                    showConfirm ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <textarea
                                rows={2}
                                placeholder="Resolution note (optional)"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--text)', resize: 'none', width: '100%' }}
                            />
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button
                                    className="adm-btn adm-btn--resolve"
                                    disabled={resolving}
                                    onClick={handleResolve}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    {resolving ? '…' : (
                                        <>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            Confirm
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', background: 'var(--surface-dim)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="adm-btn adm-btn--resolve" onClick={() => setShowConfirm(true)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Resolve
                        </button>
                    )
                )}
            </td>
        </tr>
    );
}

/* ── Resolved flag row (audit view) ──────────────────────────── */
function ResolvedFlagRow({ flag }) {
    return (
        <tr style={{ opacity: 0.75 }}>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="adm-list-avatar" style={{
                        width: 32, height: 32, fontSize: '0.72rem',
                        background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                    }}>
                        {flag.initials}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>{flag.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{flag.condition}</div>
                    </div>
                </div>
            </td>
            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 220 }}>
                <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {flag.flag_reason}
                </div>
                {flag.resolution_note && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        "{flag.resolution_note}"
                    </div>
                )}
            </td>
            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{flag.clinic_name}</td>
            <td>
                <span className={`adm-badge adm-badge--${flag.severity}`} style={{ opacity: 0.6 }}>
                    {flag.severity === 'critical' ? '🚨 Critical' : '⚠️ Warning'}
                </span>
            </td>
            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>{timeAgo(flag.created_at)}</div>
            </td>
            <td style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Resolved
                </div>
                {flag.resolved_by && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        by {flag.resolved_by}
                    </div>
                )}
                {flag.resolved_at && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {fmtDate(flag.resolved_at)}
                    </div>
                )}
            </td>
        </tr>
    );
}

export default function SafetyPage() {
    const [flags,        setFlags]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filter,       setFilter]       = useState('all');
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        setLoading(true);
        getAdminSafetyFlags({ resolved: showResolved ? 1 : 0 })
            .then(res => setFlags(res.data))
            .catch(() => setFlags([]))
            .finally(() => setLoading(false));
    }, [showResolved]);

    const handleResolved = (id) => setFlags(prev => prev.filter(f => f.id !== id));

    const filtered = filter === 'all'
        ? flags
        : flags.filter(f => f.severity === filter);

    const criticalCount = flags.filter(f => f.severity === 'critical').length;
    const warningCount  = flags.filter(f => f.severity === 'warning').length;

    return (
        <div className="adm-page">
            <div className="adm-section">
                <div className="adm-section-header">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="adm-filter-bar" style={{ marginBottom: 0 }}>
                            {SEVERITY_FILTERS.map(s => (
                                <button
                                    key={s}
                                    className={`adm-filter-btn${filter === s ? ' active' : ''}`}
                                    onClick={() => setFilter(s)}
                                >
                                    {s === 'all' ? 'All' : s === 'critical' ? `🚨 Critical (${criticalCount})` : `⚠️ Warning (${warningCount})`}
                                </button>
                            ))}
                        </div>
                        <button
                            className={`adm-filter-btn${showResolved ? ' active' : ''}`}
                            onClick={() => setShowResolved(p => !p)}
                            style={{ marginLeft: 'auto' }}
                        >
                            {showResolved ? '← Active flags' : 'Resolved history'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[1,2,3,4].map(i => <Skeleton key={i} height="58px" radius="8px" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="adm-table-wrap">
                        <div className="adm-empty">
                            <div className="adm-empty-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <p className="adm-empty-text">
                                {showResolved ? 'No resolved flags in history.' : 'No active safety flags — system is clear.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Flag Reason {showResolved && '/ Resolution'}</th>
                                    <th>Clinic</th>
                                    <th>Severity</th>
                                    <th>Time</th>
                                    <th>{showResolved ? 'Resolved By' : 'Action'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(flag =>
                                    showResolved
                                        ? <ResolvedFlagRow key={flag.id} flag={flag} />
                                        : <FlagRow key={flag.id} flag={flag} onResolved={handleResolved} />
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
