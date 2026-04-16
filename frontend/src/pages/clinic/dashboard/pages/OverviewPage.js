import {
    mockClinicStats,
    mockAdherenceTrend,
    mockPainTrend,
    mockActivityData,
} from '../data/mockData';
import { Link } from 'react-router-dom';

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
        x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
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
                        height={barH}
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
                        <p className="cld-stat-value">{mockClinicStats.activePatients}</p>
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
                        <p className="cld-stat-value">{mockClinicStats.pendingRequests}</p>
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
                        <p className="cld-stat-value">{mockClinicStats.safetyFlags}</p>
                        <p className="cld-stat-label">Safety Flags</p>
                    </div>
                    <span className="cld-stat-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                </Link>
            </div>

            {/* ── Charts ─── */}
            <div className="cld-charts-grid">
                <div className="cld-chart-card">
                    <div className="cld-chart-header">
                        <div>
                            <p className="cld-chart-title">Adherence Trend</p>
                            <p className="cld-chart-subtitle">Avg across all patients</p>
                        </div>
                        <div>
                            <p className="cld-chart-value">88<span className="cld-chart-value-unit">%</span></p>
                            <p className="cld-chart-trend up">↑ +5% vs last week</p>
                        </div>
                    </div>
                    <div className="cld-chart-svg-wrap">
                        <LineChart data={mockAdherenceTrend} color="#3E4772" />
                    </div>
                    <div className="cld-chart-labels">
                        {mockAdherenceTrend.map(d => <span key={d.label}>{d.label}</span>)}
                    </div>
                </div>

                <div className="cld-chart-card">
                    <div className="cld-chart-header">
                        <div>
                            <p className="cld-chart-title">Avg Pain Level</p>
                            <p className="cld-chart-subtitle">Lower is better</p>
                        </div>
                        <div>
                            <p className="cld-chart-value">3.5<span className="cld-chart-value-unit">/10</span></p>
                            <p className="cld-chart-trend up">↓ −2.1 vs W1</p>
                        </div>
                    </div>
                    <div className="cld-chart-svg-wrap">
                        <LineChart data={mockPainTrend} color="#dc2626" />
                    </div>
                    <div className="cld-chart-labels">
                        {mockPainTrend.map(d => <span key={d.label}>{d.label}</span>)}
                    </div>
                </div>

                <div className="cld-chart-card">
                    <div className="cld-chart-header">
                        <div>
                            <p className="cld-chart-title">Patient Activity</p>
                            <p className="cld-chart-subtitle">Sessions this week</p>
                        </div>
                        <div>
                            <p className="cld-chart-value">28<span className="cld-chart-value-unit"> sessions</span></p>
                            <p className="cld-chart-trend up">↑ +4 vs last week</p>
                        </div>
                    </div>
                    <div className="cld-chart-svg-wrap">
                        <BarChart data={mockActivityData} color="#3E4772" />
                    </div>
                    <div className="cld-chart-labels">
                        {mockActivityData.map(d => <span key={d.label}>{d.label}</span>)}
                    </div>
                </div>
            </div>

        </div>
    );
}
