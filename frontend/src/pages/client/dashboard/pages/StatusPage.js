import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
import DayTracker from '../components/DayTracker';
import MilestoneItem from '../components/MilestoneItem';
import Skeleton from '../../../../components/ui/Skeleton';
import { getAccessRequests, getTrackingStatus, getLatestAiInsight } from '../../../../api/client';

/* ── Icons ───────────────────────────────────────────────────── */
function HeartIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
    );
}

function ActivityIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
    );
}

function TrendUpIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
        </svg>
    );
}

function TodayArrowIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
        </svg>
    );
}

function DumbellIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M6.5 6.5v11M17.5 6.5v11"/>
        </svg>
    );
}

export default function StatusPage() {
    const [clinicId,  setClinicId]  = useState('');
    const [clinics,   setClinics]   = useState([]);
    const [data,      setData]      = useState(null);
    const [aiInsight, setAiInsight] = useState(null);
    const [loading,   setLoading]   = useState(true);

    // Fetch approved clinics
    useEffect(() => {
        getAccessRequests()
            .then(res => {
                const approved = res.data
                    .filter(r => r.status === 'approved' && r.clinic)
                    .map(r => r.clinic);
                setClinics(approved);
                if (approved.length >= 1) setClinicId(String(approved[0].id));
                else setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Fetch tracking status + AI insight when clinic selected
    useEffect(() => {
        if (!clinicId) return;
        setLoading(true);
        Promise.all([
            getTrackingStatus(clinicId),
            getLatestAiInsight(clinicId).catch(() => ({ data: null })),
        ])
            .then(([trackRes, aiRes]) => {
                setData(trackRes.data);
                setAiInsight(aiRes.data);
            })
            .catch(() => { setData(null); setAiInsight(null); })
            .finally(() => setLoading(false));
    }, [clinicId]);

    const painPct = (level, max) => Math.round((level / max) * 100);

    // Derive week range label from weekly_days
    const weekLabel = data?.weekly_days?.length
        ? `${data.weekly_days[0].date} – ${data.weekly_days[6]?.date ?? ''}`
        : '';

    // Pain reduction trend label
    const painTrend = data?.pain_trend ?? [];
    const firstPain = painTrend[0]?.level;
    const lastPain  = painTrend[painTrend.length - 1]?.level;
    const painDiffLabel = (firstPain && lastPain)
        ? `${firstPain > lastPain ? '−' : '+'}${Math.abs(firstPain - lastPain).toFixed(1)} pts since W1`
        : null;

    return (
        <div className="cd-page">
            {/* Clinic selector */}
            {clinics.length > 1 && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Viewing plan from:
                    </label>
                    <select className="ui-select" value={clinicId} onChange={e => setClinicId(e.target.value)}>
                        {clinics.map(c => (
                            <option key={c.id} value={c.id}>{c.commercial_name || c.legal_name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* ── Metric Cards ─── */}
            <div className="cd-section">
                {loading ? (
                    <div className="cd-metrics-grid">
                        {[1,2,3].map(i => <Skeleton key={i} height="96px" radius="10px" />)}
                    </div>
                ) : (
                    <div className="cd-metrics-grid">
                        <MetricCard
                            icon={<HeartIcon />}
                            label="Adherence Rate"
                            value={data ? `${data.adherence_rate}%` : '—'}
                            trend={null}
                            trendDirection="neutral"
                            color="primary"
                        />
                        <MetricCard
                            icon={<ActivityIcon />}
                            label="Pain Level"
                            value={data?.avg_pain != null ? `${data.avg_pain} / 10` : '—'}
                            trend={painDiffLabel}
                            trendDirection={firstPain > lastPain ? 'up' : 'neutral'}
                            color="warning"
                        />
                        <MetricCard
                            icon={<TrendUpIcon />}
                            label="Sessions Done"
                            value={data ? String(data.milestones?.find(m => m.type === 'sessions')?.value ?? '—') : '—'}
                            trend={null}
                            trendDirection="neutral"
                            color="success"
                        />
                    </div>
                )}
            </div>

            {/* ── AI Recovery Insight ─── */}
            {!loading && aiInsight && (
                <div className="cd-section">
                    <div className="ui-card">
                        <div className="cd-card-header">
                            <span className="cd-card-title">AI Recovery Insight</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {new Date(aiInsight.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.25rem 0 0.5rem' }}>
                            {/* Adherence */}
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.4rem', color: aiInsight.adherence_score >= 70 ? '#16a34a' : aiInsight.adherence_score >= 40 ? '#d97706' : '#dc2626' }}>
                                    {aiInsight.adherence_score}%
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Adherence</div>
                            </div>
                            {/* Pain Trend */}
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: aiInsight.pain_trend === 'improving' ? '#16a34a' : aiInsight.pain_trend === 'worsening' ? '#dc2626' : '#d97706' }}>
                                    {aiInsight.pain_trend === 'improving' ? '↓ Improving' : aiInsight.pain_trend === 'worsening' ? '↑ Worsening' : '→ Stable'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Pain Trend</div>
                            </div>
                            {/* Recovery Status */}
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: aiInsight.recovery_status === 'good' ? '#16a34a' : aiInsight.recovery_status === 'poor' ? '#dc2626' : '#d97706' }}>
                                    {aiInsight.recovery_status ? aiInsight.recovery_status.charAt(0).toUpperCase() + aiInsight.recovery_status.slice(1) : '—'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Recovery</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Weekly Progress Tracker + Pain Trend ─── */}
            <div className="cd-two-col cd-section">
                {/* Day tracker */}
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Weekly Progress</span>
                        {weekLabel && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{weekLabel}</span>}
                    </div>
                    {loading ? (
                        <Skeleton height="60px" radius="8px" />
                    ) : (
                        <>
                            <DayTracker days={data?.weekly_days ?? []} />
                            <div style={{ marginTop: '1.1rem' }}>
                                <ProgressBar value={data?.adherence_rate ?? 0} label="Week adherence" color="primary" size="sm" />
                            </div>
                        </>
                    )}
                </div>

                {/* Pain trend */}
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Pain Trend</span>
                    </div>
                    {loading ? (
                        <Skeleton height="120px" radius="8px" />
                    ) : painTrend.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                            No pain data yet — submit session feedback to track progress.
                        </div>
                    ) : (
                        <>
                            <div className="cd-pain-trend">
                                {painTrend.map(row => (
                                    <div key={row.week} className="cd-pain-row">
                                        <span className="cd-pain-week">{row.week}</span>
                                        <ProgressBar
                                            value={painPct(row.level, row.maxLevel)}
                                            showLabel={false}
                                            color={row.level >= 7 ? 'danger' : row.level >= 5 ? 'warning' : 'success'}
                                            size="sm"
                                        />
                                        <span className="cd-pain-value">{row.level}</span>
                                    </div>
                                ))}
                            </div>
                            {firstPain && lastPain && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Overall change</div>
                                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: firstPain > lastPain ? '#16a34a' : '#ef4444' }}>
                                        {firstPain > lastPain ? '−' : '+'}{Math.abs(firstPain - lastPain).toFixed(1)} pain reduction
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Milestones ─── */}
            <div className="cd-section">
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Milestones</span>
                        {data?.milestones && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {data.milestones.filter(m => m.achieved).length} / {data.milestones.length} achieved
                            </span>
                        )}
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                            {[1,2,3].map(i => <Skeleton key={i} height="44px" radius="8px" />)}
                        </div>
                    ) : (
                        <div className="cd-milestones">
                            {(data?.milestones ?? []).map(m => (
                                <MilestoneItem key={m.id} milestone={m} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quick Actions ─── */}
            <div className="cd-section">
                <div className="cd-card-header" style={{ marginBottom: '0.75rem' }}>
                    <span className="cd-card-title">Quick Actions</span>
                </div>
                <div className="cd-quick-actions">
                    <Link to="/client/dashboard/today" className="cd-quick-card">
                        <div className="cd-quick-card-icon"><DumbellIcon /></div>
                        <div className="cd-quick-card-body">
                            <div className="cd-quick-card-title">Today's Workout</div>
                            <div className="cd-quick-card-sub">View today's exercises</div>
                        </div>
                        <span className="cd-quick-card-arrow"><TodayArrowIcon /></span>
                    </Link>
                    <Link to="/client/dashboard/weekly" className="cd-quick-card">
                        <div className="cd-quick-card-icon"><CalendarIcon /></div>
                        <div className="cd-quick-card-body">
                            <div className="cd-quick-card-title">Weekly Plan</div>
                            <div className="cd-quick-card-sub">View full schedule</div>
                        </div>
                        <span className="cd-quick-card-arrow"><TodayArrowIcon /></span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
