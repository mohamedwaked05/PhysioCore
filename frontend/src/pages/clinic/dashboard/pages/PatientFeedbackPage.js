import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../../api/axios';
import { getPatientAiInsights } from '../../../../api/clinic';
import Skeleton from '../../../../components/ui/Skeleton';

function PainDot({ level }) {
    if (!level) return null;
    const color = level <= 3 ? '#22c55e' : level <= 6 ? '#f59e0b' : '#ef4444';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            background: level <= 3 ? '#f0fdf4' : level <= 6 ? '#fffbeb' : '#fef2f2',
            color, fontSize: '0.72rem', fontWeight: 600,
            padding: '0.15rem 0.6rem', borderRadius: 999,
        }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            Pain {level}/10
        </span>
    );
}

function RatingDot({ rating }) {
    if (!rating) return null;
    const labels = ['', 'Too easy', 'Easy', 'Just right', 'Hard', 'Too hard'];
    return (
        <span className="cld-badge cld-badge--effort">
            {'★'.repeat(rating)} {labels[rating]}
        </span>
    );
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PatientFeedbackPage() {
    const { patientId } = useParams(); // this is client_profile_id

    const [data,      setData]      = useState(null);
    const [aiData,    setAiData]    = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [notFound,  setNotFound]  = useState(false);

    useEffect(() => {
        Promise.all([
            api.get(`/clinic/patients/${patientId}/feedback`),
            getPatientAiInsights(patientId).catch(() => ({ data: null })),
        ])
            .then(([feedRes, aiRes]) => {
                setData(feedRes.data);
                setAiData(aiRes.data);
            })
            .catch(err => {
                if (err.response?.status === 404) setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [patientId]);

    if (loading) {
        return (
            <div className="cld-page">
                <Link to="/clinic/dashboard/patients" className="cld-back-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back to Patients
                </Link>
                <Skeleton height="90px" radius="10px" style={{ marginBottom: '1rem' }} />
                <Skeleton height="200px" radius="10px" />
            </div>
        );
    }

    if (notFound || !data) {
        return (
            <div className="cld-page">
                <Link to="/clinic/dashboard/patients" className="cld-back-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back to Patients
                </Link>
                <div className="client-card">
                    <div className="cld-empty">
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">Patient not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    const { patient, feedbacks } = data;
    const u = patient.user ?? {};
    const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown';
    const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?';
    const condition = patient.condition_summary ?? '—';

    const avgRating = feedbacks.length
        ? (feedbacks.reduce((s, f) => s + (f.rating ?? 0), 0) / feedbacks.filter(f => f.rating).length || 0).toFixed(1)
        : '—';

    const latest = feedbacks[0] ?? null;

    return (
        <div className="cld-page">
            <Link to="/clinic/dashboard/patients" className="cld-back-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Patients
            </Link>

            {/* ── Patient Header ─── */}
            <div className="client-card cld-patient-header-card">
                <div className="cld-patient-header-avatar">{initials}</div>
                <div className="cld-patient-header-info">
                    <p className="cld-patient-header-name">{fullName}</p>
                    <p className="cld-patient-header-meta">{condition}</p>
                </div>
                <div className="cld-patient-header-stats">
                    <div className="cld-patient-header-stat">
                        <p className="cld-patient-header-stat-value">{feedbacks.length}</p>
                        <p className="cld-patient-header-stat-label">Reports</p>
                    </div>
                    <div className="cld-patient-header-stat">
                        <p className="cld-patient-header-stat-value">{avgRating}</p>
                        <p className="cld-patient-header-stat-label">Avg Rating</p>
                    </div>
                </div>
            </div>

            {/* ── AI Insights Card ─── */}
            {(aiData?.latest || (aiData?.safety_history?.length > 0)) && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '0.01em' }}>
                        AI Recovery Analysis
                    </p>
                    <div className="client-card" style={{ padding: '1.1rem 1.25rem' }}>
                        {aiData.latest && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem', marginBottom: aiData.safety_history?.length > 0 ? '1rem' : 0 }}>
                                <div style={{ textAlign: 'center', padding: '0.6rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.2rem', color: aiData.latest.adherence_score >= 70 ? '#16a34a' : aiData.latest.adherence_score >= 40 ? '#d97706' : '#dc2626' }}>
                                        {aiData.latest.adherence_score ?? '—'}%
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adherence</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.6rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', color: aiData.latest.pain_trend === 'improving' ? '#16a34a' : aiData.latest.pain_trend === 'worsening' ? '#dc2626' : '#d97706' }}>
                                        {aiData.latest.pain_trend === 'improving' ? '↓ Improving' : aiData.latest.pain_trend === 'worsening' ? '↑ Worsening' : '→ Stable'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pain Trend</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.6rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', color: aiData.latest.recovery_status === 'good' ? '#16a34a' : aiData.latest.recovery_status === 'poor' ? '#dc2626' : '#d97706' }}>
                                        {aiData.latest.recovery_status
                                            ? aiData.latest.recovery_status.charAt(0).toUpperCase() + aiData.latest.recovery_status.slice(1)
                                            : '—'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recovery</div>
                                </div>
                            </div>
                        )}
                        {aiData.safety_history?.length > 0 && (
                            <div style={{ borderTop: aiData.latest ? '0.5px solid var(--border-light)' : 'none', paddingTop: aiData.latest ? '0.75rem' : 0 }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.4rem' }}>
                                    ⚠️ {aiData.safety_history.length} Safety Alert{aiData.safety_history.length !== 1 ? 's' : ''} (last 10)
                                </p>
                                {aiData.safety_history.slice(0, 3).map((f, i) => (
                                    <p key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                                        <span style={{ color: f.severity === 'critical' ? '#dc2626' : '#d97706', fontWeight: 600 }}>
                                            {f.severity === 'critical' ? '🚨' : '⚠️'}
                                        </span>{' '}
                                        {f.flag_reason} · <span style={{ color: 'var(--text-muted)' }}>{new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Latest Report ─── */}
            {latest && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '0.01em' }}>
                        Latest Report
                    </p>
                    <div className="client-card" style={{ borderLeft: '3px solid var(--primary)', padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{formatDate(latest.session_date)}</span>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <PainDot level={latest.pain_level} />
                                <RatingDot rating={latest.rating} />
                            </div>
                        </div>
                        {latest.feedback_text && (
                            <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.65rem' }}>
                                {latest.feedback_text}
                            </p>
                        )}
                        <span className="cld-ex-progress">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {latest.exercises_completed}/{latest.exercises_total} exercises completed
                        </span>
                    </div>
                </div>
            )}

            {/* ── Report History ─── */}
            <p style={{ fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '0.01em' }}>
                Report History
            </p>

            {feedbacks.length === 0 ? (
                <div className="client-card">
                    <div className="cld-empty">
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">No feedback submitted yet.</p>
                    </div>
                </div>
            ) : (
                <div className="client-card">
                    <div className="cld-timeline">
                        {feedbacks.map((f, idx) => (
                            <div key={f.id} className="cld-timeline-item">
                                <div className="cld-timeline-left">
                                    <div className="cld-timeline-dot"/>
                                    {idx < feedbacks.length - 1 && <div className="cld-timeline-line"/>}
                                </div>
                                <div className="cld-timeline-content">
                                    <p className="cld-timeline-date">{formatDate(f.session_date)}</p>
                                    {f.feedback_text && (
                                        <p className="cld-timeline-msg">{f.feedback_text}</p>
                                    )}
                                    <div className="cld-timeline-stats">
                                        <PainDot level={f.pain_level} />
                                        <RatingDot rating={f.rating} />
                                        <span className="cld-ex-progress">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            {f.exercises_completed}/{f.exercises_total}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
