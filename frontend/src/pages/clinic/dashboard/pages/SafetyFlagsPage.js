import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { getSafetyFlags, resolveSafetyFlag } from '../../../../api/clinic';
import { getEcho } from '../../../../services/echo';
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

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Active flag card ────────────────────────────────────────── */
function FlagCard({ flag, onResolved }) {
    const [resolving,   setResolving]   = useState(false);
    const [resolved,    setResolved]    = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [note,        setNote]        = useState('');

    const priority = severityToPriority(flag.severity);

    const handleResolve = async () => {
        setResolving(true);
        try {
            await resolveSafetyFlag(flag.id, { resolution_note: note.trim() || undefined });
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0, minWidth: 120 }}>
                {resolved ? (
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 600, color: '#15803d',
                        background: '#f0fdf4', border: '0.5px solid #bbf7d0',
                        padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-pill)',
                    }}>
                        ✓ Resolved
                    </span>
                ) : showConfirm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <textarea
                            rows={2}
                            placeholder="Resolution note (optional)"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            style={{ fontSize: '0.73rem', padding: '0.3rem 0.45rem', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--text)', resize: 'none', width: '100%' }}
                        />
                        <button className="cld-btn-action" onClick={handleResolve} disabled={resolving}
                            style={{ fontSize: '0.73rem', padding: '0.3rem', justifyContent: 'center', background: 'rgba(22,163,74,0.1)', color: '#15803d', border: '0.5px solid rgba(22,163,74,0.3)' }}>
                            {resolving ? '…' : '✓ Confirm resolve'}
                        </button>
                        <button onClick={() => setShowConfirm(false)}
                            style={{ fontSize: '0.71rem', padding: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <>
                        <Link
                            to={`/clinic/dashboard/patients/${flag.client_profile_id}/feedback`}
                            className="cld-btn-review"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                            Review
                        </Link>
                        <button className="cld-btn-action" onClick={() => setShowConfirm(true)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Resolve
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Resolved flag card (audit view) ─────────────────────────── */
function ResolvedFlagCard({ flag }) {
    const priority = severityToPriority(flag.severity);
    return (
        <div className={`cld-flag-item ${priority}`} style={{ opacity: 0.65 }}>
            <div className="cld-request-avatar" style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                {flag.initials}
            </div>
            <div className="cld-flag-info" style={{ flex: 1 }}>
                <p className="cld-flag-name">{flag.patient_name}</p>
                <p className="cld-flag-issue">{flag.flag_reason}</p>
                {flag.resolution_note && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        "{flag.resolution_note}"
                    </p>
                )}
                <span className="cld-flag-time" style={{ marginTop: '0.2rem', display: 'block' }}>
                    Flagged {timeAgo(flag.created_at)}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flexShrink: 0, alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Resolved
                </span>
                {flag.resolved_by && (
                    <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>by {flag.resolved_by}</span>
                )}
                {flag.resolved_at && (
                    <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>{fmtDate(flag.resolved_at)}</span>
                )}
            </div>
        </div>
    );
}

export default function SafetyFlagsPage() {
    const { user }             = useAuth();
    const { clinicId }         = useOutletContext() ?? {};
    const { addToast }         = useToast();

    const [flags,        setFlags]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filter,       setFilter]       = useState('All');
    const [showResolved, setShowResolved] = useState(false);

    // Keep ref in sync so the silent-refetch closure always reads current showResolved
    const showResolvedRef = useRef(showResolved);
    useEffect(() => { showResolvedRef.current = showResolved; }, [showResolved]);

    // Data load (shows loading state — used on mount and filter toggle)
    useEffect(() => {
        setLoading(true);
        getSafetyFlags({ resolved: showResolved ? 1 : 0 })
            .then(res => setFlags(res.data))
            .catch(() => setFlags([]))
            .finally(() => setLoading(false));
    }, [showResolved]);

    // Silent background refetch — called by WebSocket handler, no loading flash
    const silentRefetch = useCallback(() => {
        getSafetyFlags({ resolved: showResolvedRef.current ? 1 : 0 })
            .then(res => setFlags(res.data))
            .catch(() => {});
    }, []);

    // WebSocket: listen for incoming safety flags on the clinic's private channel
    useEffect(() => {
        if (!user || !clinicId) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const echo = getEcho(token);
        const ch   = echo.private(`clinic.${clinicId}`);

        ch.listen('.SafetyFlagBroadcast', (e) => {
            silentRefetch();
            const isCritical = e.severity === 'critical' || e.is_critical;
            const patient    = e.patient_name ? ` — ${e.patient_name}` : '';
            const msg = isCritical
                ? `🚨 Critical safety flag raised${patient}`
                : `⚠️ Safety flag raised${patient}`;
            addToast(msg, isCritical ? 'error' : 'warning');
        });

        return () => {
            try { echo.leave(`clinic.${clinicId}`); } catch {}
        };
    }, [user, clinicId, silentRefetch, addToast]);

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
                    {loading ? 'Loading...' : showResolved
                        ? `${flags.length} resolved flag${flags.length !== 1 ? 's' : ''} — audit history`
                        : `${counts.high} high · ${counts.medium} medium · ${counts.low} low — review and resolve patient alerts.`}
                </p>
            </div>

            <div className="cld-filter-bar" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                {!showResolved && PRIORITY_FILTERS.map(f => (
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
                <button
                    className={`cld-filter-btn${showResolved ? ' active' : ''}`}
                    style={{ marginLeft: showResolved ? 0 : 'auto' }}
                    onClick={() => { setShowResolved(p => !p); setFilter('All'); }}
                >
                    {showResolved ? '← Active flags' : 'Resolved history'}
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height="80px" radius="10px" />)}
                </div>
            ) : showResolved ? (
                /* ── Resolved history view ── */
                <div className="client-card">
                    {filtered.length === 0 ? (
                        <div className="cld-empty">
                            <div className="cld-empty-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <p className="cld-empty-text">No resolved flags yet.</p>
                        </div>
                    ) : (
                        <div className="cld-flag-list" style={{ padding: '0.75rem' }}>
                            {filtered.map(flag => <ResolvedFlagCard key={flag.id} flag={flag} />)}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Active flags view ── */
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
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
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
