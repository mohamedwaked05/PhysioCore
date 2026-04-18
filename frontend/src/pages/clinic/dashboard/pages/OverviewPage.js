import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardCounts, getDashboardAnalytics, getDashboardAiSummary } from '../../../../api/clinic';
import Skeleton from '../../../../components/ui/Skeleton';

// ── Inline SVG Charts ─────────────────────────────────────────
function LineChart({ data, color, height = 64 }) {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const W = 200;
    const H = height;
    const PAD = 6;

    const pts = values.map((v, i) => ({
        x: PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2),
        y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
    }));

    const pathD = pts.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
    const gradId = `grad-${color.replace(/[^a-z]/gi, '')}`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: `${H}px`, display: 'block' }}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.18"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${gradId})`}/>
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color}/>
            ))}
        </svg>
    );
}

function BarChart({ data, color, height = 64 }) {
    const values = data.map(d => d.value);
    const max = Math.max(...values) || 1;
    const W = 200;
    const H = height;
    const PAD = 4;
    const barW = (W - PAD * 2) / data.length;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: `${H}px`, display: 'block' }}>
            {data.map((d, i) => {
                const barH = (d.value / max) * (H - PAD * 2);
                const x = PAD + i * barW + barW * 0.15;
                const w = barW * 0.7;
                return (
                    <rect
                        key={i}
                        x={x}
                        y={H - barH - PAD}
                        width={w}
                        height={Math.max(barH, 0)}
                        rx="3"
                        fill={color}
                        opacity={d.value === max ? '1' : '0.55'}
                    />
                );
            })}
        </svg>
    );
}

// ── Overview Page ─────────────────────────────────────────────
export default function OverviewPage() {
    const [counts,    setCounts]    = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        Promise.all([
            getDashboardCounts(),
            getDashboardAnalytics(),
            getDashboardAiSummary().catch(() => ({ data: null })),
        ])
            .then(([countsRes, analyticsRes, aiRes]) => {
                setCounts(countsRes.data);
                setAnalytics(analyticsRes.data);
                setAiSummary(aiRes.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const adherenceTrend = analytics?.adherence_trend ?? [];
    const painTrend      = analytics?.pain_trend ?? [];
    const activityData   = analytics?.activity_data ?? [];
    const summary        = analytics?.summary ?? {};

    const currentAdherence = summary.current_adherence ?? 0;
    const adherenceDiff    = summary.adherence_diff ?? 0;
    const totalSessions    = summary.total_sessions_this_week ?? 0;
    const sessionsDiff     = summary.sessions_diff ?? 0;
    const avgPain          = summary.avg_pain;
    const painDiff         = summary.pain_diff;

    const formatDiff = (val, suffix = '') => {
        if (!val && val !== 0) return null;
        const sign = val >= 0 ? '↑ +' : '↓ ';
        return `${sign}${Math.abs(val)}${suffix}`;
    };

    return (
        <div className="cld-page">

            {/* ── Top Stat Cards ─── */}
            <div className="cld-stats-grid">
                <Link to="patients" className="cld-stat-card">
                    <div className="cld-stat-icon-wrap blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                    </div>
                    <div className="cld-stat-body">
                        <p className="cld-stat-value">{loading ? '—' : (counts?.patients_count ?? 0)}</p>
                        <p className="cld-stat-label">Active Patients</p>
                    </div>
                    <span className="cld-stat-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                </Link>

                <Link to="requests" className="cld-stat-card">
                    <div className="cld-stat-icon-wrap amber">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 .02h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                    </div>
                    <div className="cld-stat-body">
                        <p className="cld-stat-value">{loading ? '—' : (counts?.requests_count ?? 0)}</p>
                        <p className="cld-stat-label">Pending Requests</p>
                    </div>
                    <span className="cld-stat-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                </Link>

                <Link to="flags" className="cld-stat-card">
                    <div className="cld-stat-icon-wrap red">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div className="cld-stat-body">
                        <p className="cld-stat-value">{loading ? '—' : (aiSummary?.active_flags ?? counts?.safety_flags_count ?? 0)}</p>
                        <p className="cld-stat-label">Safety Flags {!loading && aiSummary?.critical_flags > 0 && <span style={{ color: '#dc2626', fontSize: '0.72rem' }}>({aiSummary.critical_flags} critical)</span>}</p>
                    </div>
                    <span className="cld-stat-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                </Link>
            </div>

            {/* ── Charts ─── */}
            {loading ? (
                <div className="cld-charts-grid">
                    {[1, 2, 3].map(i => <Skeleton key={i} height="160px" radius="10px" />)}
                </div>
            ) : (
                <div className="cld-charts-grid">
                    <div className="cld-chart-card">
                        <div className="cld-chart-header">
                            <div>
                                <p className="cld-chart-title">Adherence Trend</p>
                                <p className="cld-chart-subtitle">Avg across all patients</p>
                            </div>
                            <div>
                                <p className="cld-chart-value">{currentAdherence}<span className="cld-chart-value-unit">%</span></p>
                                {adherenceDiff !== 0 && (
                                    <p className={`cld-chart-trend ${adherenceDiff >= 0 ? 'up' : 'down'}`}>
                                        {adherenceDiff >= 0 ? '↑' : '↓'} {adherenceDiff >= 0 ? '+' : ''}{adherenceDiff}% vs last week
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="cld-chart-svg-wrap">
                            <LineChart data={adherenceTrend.length ? adherenceTrend : [{label:'',value:0}]} color="#3E4772" />
                        </div>
                        <div className="cld-chart-labels">
                            {adherenceTrend.map(d => <span key={d.label}>{d.label}</span>)}
                        </div>
                    </div>

                    <div className="cld-chart-card">
                        <div className="cld-chart-header">
                            <div>
                                <p className="cld-chart-title">Avg Pain Level</p>
                                <p className="cld-chart-subtitle">Lower is better</p>
                            </div>
                            <div>
                                <p className="cld-chart-value">{avgPain ?? '—'}<span className="cld-chart-value-unit">/10</span></p>
                                {painDiff != null && (
                                    <p className={`cld-chart-trend ${painDiff > 0 ? 'up' : 'down'}`}>
                                        {painDiff > 0 ? '↓' : '↑'} {painDiff > 0 ? '−' : '+'}{Math.abs(painDiff)} vs W1
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="cld-chart-svg-wrap">
                            <LineChart data={painTrend.length ? painTrend : [{label:'',value:0}]} color="#dc2626" />
                        </div>
                        <div className="cld-chart-labels">
                            {painTrend.map(d => <span key={d.label}>{d.label}</span>)}
                        </div>
                    </div>

                    <div className="cld-chart-card">
                        <div className="cld-chart-header">
                            <div>
                                <p className="cld-chart-title">Patient Activity</p>
                                <p className="cld-chart-subtitle">Sessions this week</p>
                            </div>
                            <div>
                                <p className="cld-chart-value">{totalSessions}<span className="cld-chart-value-unit"> sessions</span></p>
                                {sessionsDiff !== 0 && (
                                    <p className={`cld-chart-trend ${sessionsDiff >= 0 ? 'up' : 'down'}`}>
                                        {sessionsDiff >= 0 ? '↑' : '↓'} {sessionsDiff >= 0 ? '+' : ''}{sessionsDiff} vs last week
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="cld-chart-svg-wrap">
                            <BarChart data={activityData.length ? activityData : [{label:'',value:0}]} color="#3E4772" />
                        </div>
                        <div className="cld-chart-labels">
                            {activityData.map(d => <span key={d.label}>{d.label}</span>)}
                        </div>
                    </div>
                </div>
            )}

            {/* ── AI Clinic Summary ─── */}
            {!loading && aiSummary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                    {[
                        { label: 'Avg Adherence (AI)', value: aiSummary.avg_adherence != null ? `${aiSummary.avg_adherence}%` : '—', color: aiSummary.avg_adherence >= 70 ? '#16a34a' : aiSummary.avg_adherence >= 40 ? '#d97706' : '#dc2626' },
                        { label: 'Improving Pain', value: aiSummary.trend_counts?.improving ?? 0, color: '#16a34a' },
                        { label: 'Stable Pain',    value: aiSummary.trend_counts?.stable    ?? 0, color: '#d97706' },
                        { label: 'Worsening Pain', value: aiSummary.trend_counts?.worsening ?? 0, color: '#dc2626' },
                    ].map(item => (
                        <div key={item.label} style={{ padding: '0.9rem 1rem', background: 'var(--surface)', border: '0.5px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.25rem', color: item.color, margin: 0 }}>{item.value}</p>
                            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
