import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
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

// ── QR Code Modal ─────────────────────────────────────────────
function QrModal({ clinicId, onClose }) {
    const canvasRef  = useRef(null);
    const [copied, setCopied]   = useState(false);
    const [ready,  setReady]    = useState(false);
    const clinicUrl = `https://physiocore.health/clinics/${clinicId}`;

    useEffect(() => {
        if (!clinicId || !canvasRef.current) return;
        QRCode.toCanvas(canvasRef.current, clinicUrl, {
            width: 280,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' },
        }).then(() => setReady(true));
    }, [clinicId, clinicUrl]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const download = useCallback(() => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob(blob => {
            const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(blob),
                download: `physiocore-clinic-${clinicId}.png`,
            });
            a.click();
            URL.revokeObjectURL(a.href);
        }, 'image/png');
    }, [clinicId]);

    const copyLink = useCallback(() => {
        navigator.clipboard.writeText(clinicUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [clinicUrl]);

    return createPortal(
        <div className="qr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="qr-modal" role="dialog" aria-modal="true" aria-label="QR Code">
                {/* Header */}
                <div className="qr-modal-header">
                    <div>
                        <p className="qr-modal-title">Share your clinic</p>
                        <p className="qr-modal-sub">Patients scan this to visit your profile directly</p>
                    </div>
                    <button className="qr-close-btn" onClick={onClose} aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* QR canvas */}
                <div className="qr-canvas-wrap">
                    <canvas ref={canvasRef} className="qr-canvas" />
                    {!ready && <div className="qr-canvas-loading">Generating…</div>}
                </div>

                {/* URL display */}
                <div className="qr-url-row">
                    <span className="qr-url-text">{clinicUrl}</span>
                    <button className="qr-copy-btn" onClick={copyLink}>
                        {copied ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        )}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                {/* Actions */}
                <div className="qr-actions">
                    <button className="qr-download-btn" onClick={download} disabled={!ready}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download PNG
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Overview Page ─────────────────────────────────────────────
export default function OverviewPage() {
    const { clinicId }            = useOutletContext() ?? {};
    const [counts,    setCounts]    = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [qrOpen,    setQrOpen]    = useState(false);

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

    return (
        <div className="cld-page">

            {qrOpen && clinicId && (
                <QrModal clinicId={clinicId} onClose={() => setQrOpen(false)} />
            )}

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

                {/* QR Code card */}
                <button className="cld-stat-card cld-qr-card" onClick={() => setQrOpen(true)}>
                    <div className="cld-stat-icon-wrap" style={{ background: 'rgba(62,71,114,0.1)', color: 'var(--primary)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                            <path d="M14 14h.01M14 18h3M17 14v4M21 14h.01M21 18h.01"/>
                        </svg>
                    </div>
                    <div className="cld-stat-body">
                        <p className="cld-stat-value" style={{ fontSize: '1rem', fontWeight: 700 }}>My QR Code</p>
                        <p className="cld-stat-label">Share &amp; download</p>
                    </div>
                    <span className="cld-stat-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                </button>

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
