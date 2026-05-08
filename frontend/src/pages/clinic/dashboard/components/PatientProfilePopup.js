import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../../../components/ui/Avatar';

function StatItem({ label, value, color }) {
    return (
        <div className="ppp-stat">
            <div className="ppp-stat-value" style={color ? { color } : undefined}>{value ?? '—'}</div>
            <div className="ppp-stat-label">{label}</div>
        </div>
    );
}

export default function PatientProfilePopup({ patient, onClose, onMessage }) {
    const navigate  = useNavigate();
    const overlayRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const painColor = (v) => {
        if (v == null) return undefined;
        if (v >= 7) return '#ef4444';
        if (v >= 5) return '#f59e0b';
        return '#16a34a';
    };

    const sinceLabel = patient.approved_since
        ? new Date(patient.approved_since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    return createPortal(
        <div
            ref={overlayRef}
            className="ppp-overlay"
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className="ppp-card" role="dialog" aria-modal="true" aria-label={`${patient.name} profile`}>

                {/* Close button */}
                <button className="ppp-close" onClick={onClose} aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                {/* Banner */}
                <div
                    className="ppp-banner"
                    style={patient.cover_photo_url
                        ? { backgroundImage: `url(${patient.cover_photo_url})` }
                        : undefined
                    }
                />

                {/* Avatar overlapping banner */}
                <div className="ppp-avatar-anchor">
                    <Avatar
                        name={patient.name}
                        src={patient.profile_photo_url}
                        size="lg"
                    />
                </div>

                {/* Body */}
                <div className="ppp-body">
                    <div className="ppp-name">{patient.name}</div>
                    {patient.condition && (
                        <div className="ppp-condition">{patient.condition}</div>
                    )}
                    {patient.plan && (
                        <div className="ppp-plan">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.6 }}>
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                            {patient.plan}
                        </div>
                    )}
                    {sinceLabel && (
                        <div className="ppp-since">Patient since {sinceLabel}</div>
                    )}

                    {/* Stats */}
                    <div className="ppp-stats">
                        <StatItem label="Sessions" value={patient.sessions_completed} />
                        <div className="ppp-stat-divider" />
                        <StatItem
                            label="Avg Pain"
                            value={patient.avg_pain != null ? `${patient.avg_pain}/10` : null}
                            color={painColor(patient.avg_pain)}
                        />
                        <div className="ppp-stat-divider" />
                        <StatItem
                            label="Active Flags"
                            value={patient.active_flags}
                            color={patient.active_flags > 0 ? '#ef4444' : undefined}
                        />
                    </div>

                    {/* Actions */}
                    <div className="ppp-actions">
                        <button
                            className="ppp-btn ppp-btn--message"
                            onClick={() => { onMessage?.(patient); onClose(); }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                            Message
                        </button>
                        <button
                            className="ppp-btn ppp-btn--view"
                            onClick={() => { navigate(`/clinic/dashboard/patients/${patient.id}/feedback`); onClose(); }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
