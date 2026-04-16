import { useState } from 'react';
import { mockSafetyFlags } from '../data/mockData';

const PRIORITY_FILTERS = ['All', 'High', 'Medium', 'Low'];

function FlagCard({ flag }) {
    const [resolved, setResolved] = useState(false);

    return (
        <div className={`cld-flag-item ${flag.priority}`} style={{ opacity: resolved ? 0.5 : 1 }}>
            <div className="cld-request-avatar" style={{
                background: flag.priority === 'high'   ? 'rgba(220,38,38,0.1)'  :
                            flag.priority === 'medium' ? 'rgba(217,119,6,0.1)'  :
                                                         'rgba(22,163,74,0.1)',
                color:      flag.priority === 'high'   ? '#dc2626' :
                            flag.priority === 'medium' ? '#d97706' :
                                                         '#16a34a',
            }}>
                {flag.initials}
            </div>

            <div className="cld-flag-info" style={{ flex: 1 }}>
                <p className="cld-flag-name">{flag.patientName}</p>
                <p className="cld-flag-issue">{flag.issue}</p>
                <span className="cld-flag-time" style={{ marginTop: '0.2rem', display: 'block' }}>{flag.flaggedAt}</span>
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
                        <button className="cld-btn-review">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                            Review
                        </button>
                        <button className="cld-btn-action" onClick={() => setResolved(true)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Resolve
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SafetyFlagsPage() {
    const [filter, setFilter] = useState('All');

    const filtered = filter === 'All'
        ? mockSafetyFlags
        : mockSafetyFlags.filter(f => f.priority === filter.toLowerCase());

    const grouped = {
        high:   filtered.filter(f => f.priority === 'high'),
        medium: filtered.filter(f => f.priority === 'medium'),
        low:    filtered.filter(f => f.priority === 'low'),
    };

    const counts = {
        high:   mockSafetyFlags.filter(f => f.priority === 'high').length,
        medium: mockSafetyFlags.filter(f => f.priority === 'medium').length,
        low:    mockSafetyFlags.filter(f => f.priority === 'low').length,
    };

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Safety Flags</h2>
                <p className="cld-page-subtitle">
                    {counts.high} high · {counts.medium} medium · {counts.low} low — review and resolve patient alerts.
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
                        {f !== 'All' && (
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {grouped.high.length > 0 && (
                    <div className="client-card">
                        <div className="cld-flag-group-label high" style={{ marginBottom: '1rem' }}>
                            <span className="cld-flag-dot high"/>
                            High Priority
                            <span style={{ marginLeft: '0.25rem', fontWeight: 700 }}>({grouped.high.length})</span>
                        </div>
                        <div className="cld-flag-list">
                            {grouped.high.map(flag => <FlagCard key={flag.id} flag={flag} />)}
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
                            {grouped.medium.map(flag => <FlagCard key={flag.id} flag={flag} />)}
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
                            {grouped.low.map(flag => <FlagCard key={flag.id} flag={flag} />)}
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
                            <p className="cld-empty-text">No {filter.toLowerCase()} priority flags.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
