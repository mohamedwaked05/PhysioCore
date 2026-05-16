import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
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

/* ── SVG Weekly Bar Chart ─────────────────────────────────────── */
function WeeklyChart({ days }) {
    if (!days || days.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                Complete your first session to see progress
            </div>
        );
    }
    const BAR_W = 28;
    const BAR_GAP = 10;
    const H = 80;
    const PADY = 20;
    const PADX = 8;
    const totalW = days.length * (BAR_W + BAR_GAP) - BAR_GAP + PADX * 2;

    // CSS variables in SVG style props — adapts to dark/light automatically
    const barFill = (status) => {
        if (status === 'complete') return '#16a34a';
        if (status === 'partial')  return '#f59e0b';
        return null; // use CSS var via style
    };
    const barStyleForEmpty = (status) => {
        if (status === 'rest')     return { fill: 'var(--border)' };
        return { fill: 'var(--primary-light, #7b8fe8)', opacity: 0.25 };
    };

    return (
        <svg viewBox={`0 0 ${totalW} ${H + PADY + 24}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
            {days.map((d, i) => {
                const x    = PADX + i * (BAR_W + BAR_GAP);
                const pct  = d.completion ?? 0;
                const barH = Math.max((pct / 100) * H, pct > 0 ? 3 : 0);
                const y    = PADY + H - barH;
                const solidFill = barFill(d.status);
                return (
                    <g key={d.id ?? i}>
                        {/* Background track — uses CSS var so it's visible in both modes */}
                        <rect x={x} y={PADY} width={BAR_W} height={H}
                              style={{ fill: 'var(--border-light, rgba(128,128,128,0.15))' }} rx={4} />
                        {/* Value bar */}
                        {barH > 0 && (
                            solidFill
                                ? <rect x={x} y={y} width={BAR_W} height={barH} fill={solidFill} rx={4} />
                                : <rect x={x} y={y} width={BAR_W} height={barH}
                                        style={barStyleForEmpty(d.status)} rx={4} />
                        )}
                        <text x={x + BAR_W / 2} y={H + PADY + 16} textAnchor="middle" fontSize="10"
                              style={{ fill: 'var(--text-secondary)' }}>
                            {d.short}
                        </text>
                        {pct > 0 && (
                            <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize="9"
                                  style={{ fill: 'var(--text-muted)' }}>
                                {pct}%
                            </text>
                        )}
                    </g>
                );
            })}
            <line x1={PADX} y1={PADY} x2={PADX} y2={PADY + H}
                  style={{ stroke: 'var(--border)' }} strokeWidth="1" />
        </svg>
    );
}

/* ── SVG Pain Line Chart ──────────────────────────────────────── */
function PainLineChart({ trend }) {
    if (!trend || trend.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                Log your pain levels to see your trend
            </div>
        );
    }

    const VW   = 300;
    const H    = 90;
    const PADX = 28;
    const PADY = 14;
    const n    = trend.length;
    const stepX = n > 1 ? (VW - PADX * 2) / (n - 1) : 0;
    const yFor  = (lvl) => PADY + (1 - Math.min(lvl, 10) / 10) * H;

    const pts = trend.map((d, i) => ({
        x:     PADX + i * stepX,
        y:     yFor(d.level),
        level: d.level,
        label: d.week,
    }));

    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const dotColor = (lvl) => lvl >= 7 ? '#ef4444' : lvl >= 5 ? '#f59e0b' : '#16a34a';

    return (
        <svg viewBox={`0 0 ${VW} ${H + PADY * 2 + 20}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
            {[2, 4, 6, 8, 10].map(v => {
                const y = yFor(v);
                return (
                    <g key={v}>
                        {/* Grid lines via CSS var — visible in both themes */}
                        <line x1={PADX} y1={y} x2={VW - PADX / 2} y2={y}
                              style={{ stroke: 'var(--border)' }} strokeWidth="0.5" />
                        <text x={PADX - 4} y={y + 3} textAnchor="end" fontSize="9"
                              style={{ fill: 'var(--text-muted)' }}>{v}</text>
                    </g>
                );
            })}
            {/* Line — var(--primary) adapts to dark (#7b8fe8) / light (#3E4772) */}
            <path d={pathD} fill="none" style={{ stroke: 'var(--primary)' }}
                  strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    {/* Dot ring uses var(--surface) so it contrasts in both themes */}
                    <circle cx={p.x} cy={p.y} r={4} fill={dotColor(p.level)}
                            style={{ stroke: 'var(--surface)' }} strokeWidth="2" />
                    <text x={p.x} y={H + PADY * 2 + 14} textAnchor="middle" fontSize="9"
                          style={{ fill: 'var(--text-muted)' }}>
                        {p.label}
                    </text>
                </g>
            ))}
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

    // AI insight derived values
    const adherence     = aiInsight?.adherence_score ?? 0;
    const painPoints    = painTrend.map(p => p.level);
    const painDirection = painPoints.length >= 2
        ? (painPoints[painPoints.length - 1] < painPoints[0] ? 'down' : painPoints[painPoints.length - 1] > painPoints[0] ? 'up' : 'stable')
        : (aiInsight?.pain_trend === 'improving' ? 'down' : aiInsight?.pain_trend === 'worsening' ? 'up' : 'stable');
    const recoveryStatus = aiInsight?.recovery_status ?? '';

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
                        <div className="cd-insight-charts-row">

                            {/* Card 1 — Adherence donut */}
                            <div className="cd-insight-card">
                                <div className="cd-insight-card-title">Adherence</div>
                                <svg viewBox="0 0 100 100" width="100" height="100" style={{ margin: '0.5rem auto', display: 'block' }}>
                                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="10"/>
                                    <circle cx="50" cy="50" r="38" fill="none"
                                        stroke={adherence >= 80 ? '#22c55e' : adherence >= 50 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="10"
                                        strokeDasharray={`${(adherence / 100) * 238.76} 238.76`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 50 50)"
                                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                    <text x="50" y="56" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)">{adherence}%</text>
                                </svg>
                                <div className="cd-insight-card-sub">{adherence >= 80 ? 'Great' : adherence >= 50 ? 'Moderate' : 'Low'}</div>
                            </div>

                            {/* Card 2 — Pain Trend full chart */}
                            <div className="cd-insight-card">
                                <div className="cd-insight-card-title">Pain Trend</div>
                                <svg viewBox="0 0 200 110" width="100%" height="110" style={{ margin: '0.5rem 0', display: 'block' }}>
                                    {[0, 2.5, 5, 7.5, 10].map((val, i) => {
                                        const y = 15 + (1 - val / 10) * 75;
                                        return (
                                            <g key={i}>
                                                <line x1="28" y1={y} x2="195" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"/>
                                                <text x="24" y={y + 3} textAnchor="end" fontSize="7" fill="var(--text-muted)">{val}</text>
                                            </g>
                                        );
                                    })}
                                    <line x1="28" y1="10" x2="28" y2="90" stroke="var(--border)" strokeWidth="1"/>
                                    <line x1="28" y1="90" x2="195" y2="90" stroke="var(--border)" strokeWidth="1"/>
                                    {painPoints.length >= 2 && painPoints.map((v, i) => (
                                        <text key={i} x={28 + (i / (painPoints.length - 1)) * 167} y="100" textAnchor="middle" fontSize="7" fill="var(--text-muted)">W{i + 1}</text>
                                    ))}
                                    {painPoints.length >= 2 && (
                                        <polygon
                                            points={[
                                                ...painPoints.map((v, i) => `${28 + (i / (painPoints.length - 1)) * 167},${15 + (1 - v / 10) * 75}`),
                                                `${28 + ((painPoints.length - 1) / (painPoints.length - 1)) * 167},90`,
                                                '28,90',
                                            ].join(' ')}
                                            fill={painDirection === 'down' ? 'rgba(34,197,94,0.08)' : painDirection === 'up' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'}
                                        />
                                    )}
                                    {painPoints.length >= 2 && (
                                        <polyline
                                            points={painPoints.map((v, i) => `${28 + (i / (painPoints.length - 1)) * 167},${15 + (1 - v / 10) * 75}`).join(' ')}
                                            fill="none"
                                            stroke={painDirection === 'down' ? '#22c55e' : painDirection === 'up' ? '#ef4444' : '#f59e0b'}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                    {painPoints.length >= 2 && painPoints.map((v, i) => (
                                        <circle key={i}
                                            cx={28 + (i / (painPoints.length - 1)) * 167}
                                            cy={15 + (1 - v / 10) * 75}
                                            r="3.5"
                                            fill={painDirection === 'down' ? '#22c55e' : painDirection === 'up' ? '#ef4444' : '#f59e0b'}
                                            stroke="var(--surface)"
                                            strokeWidth="1.5"
                                        />
                                    ))}
                                    {painPoints.length >= 2 && painPoints.map((v, i) => (
                                        <text key={i}
                                            x={28 + (i / (painPoints.length - 1)) * 167}
                                            y={15 + (1 - v / 10) * 75 - 6}
                                            textAnchor="middle"
                                            fontSize="7"
                                            fontWeight="600"
                                            fill={painDirection === 'down' ? '#22c55e' : painDirection === 'up' ? '#ef4444' : '#f59e0b'}
                                        >{v}</text>
                                    ))}
                                </svg>
                                <div className="cd-insight-card-sub" style={{ color: painDirection === 'down' ? '#22c55e' : painDirection === 'up' ? '#ef4444' : '#f59e0b' }}>
                                    {painDirection === 'down' ? '↓ Improving' : painDirection === 'up' ? '↑ Worsening' : '→ Stable'}
                                </div>
                            </div>

                            {/* Card 3 — Recovery Status vertical bar */}
                            <div className="cd-insight-card">
                                <div className="cd-insight-card-title">Recovery</div>
                                <svg viewBox="0 0 70 100" width="70" height="100" style={{ margin: '0.5rem auto', display: 'block' }}>
                                    <rect x="25" y="8" width="20" height="78" rx="8" fill="var(--border)"/>
                                    <rect
                                        x="25"
                                        y={8 + 78 * (1 - (recoveryStatus === 'good' ? 1 : recoveryStatus === 'poor' ? 0.25 : 0.6))}
                                        width="20"
                                        height={78 * (recoveryStatus === 'good' ? 1 : recoveryStatus === 'poor' ? 0.25 : 0.6)}
                                        rx="8"
                                        fill={recoveryStatus === 'good' ? '#22c55e' : recoveryStatus === 'poor' ? '#ef4444' : '#f59e0b'}
                                    />
                                    <text x="35" y="52" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">
                                        {recoveryStatus === 'good' ? '100%' : recoveryStatus === 'poor' ? '25%' : '60%'}
                                    </text>
                                </svg>
                                <div className="cd-insight-card-sub" style={{ color: recoveryStatus === 'good' ? '#22c55e' : recoveryStatus === 'poor' ? '#ef4444' : '#f59e0b' }}>
                                    {recoveryStatus ? recoveryStatus.charAt(0).toUpperCase() + recoveryStatus.slice(1) : '—'}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* ── Weekly Progress Chart + Pain Trend Chart ─── */}
            <div className="cd-two-col cd-section">
                {/* Weekly bar chart */}
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Weekly Progress</span>
                        {weekLabel && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{weekLabel}</span>}
                    </div>
                    {loading ? (
                        <Skeleton height="100px" radius="8px" />
                    ) : (
                        <>
                            <WeeklyChart days={data?.weekly_days ?? []} />
                            {(data?.weekly_days?.length > 0) && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <ProgressBar value={data?.adherence_rate ?? 0} label="Week adherence" color="primary" size="sm" />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Pain line chart */}
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Pain Trend</span>
                        {firstPain && lastPain && (
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: firstPain > lastPain ? '#16a34a' : '#ef4444' }}>
                                {firstPain > lastPain ? '↓' : '↑'} {Math.abs(firstPain - lastPain).toFixed(1)} pts
                            </span>
                        )}
                    </div>
                    {loading ? (
                        <Skeleton height="120px" radius="8px" />
                    ) : (
                        <PainLineChart trend={painTrend} />
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

        </div>
    );
}
