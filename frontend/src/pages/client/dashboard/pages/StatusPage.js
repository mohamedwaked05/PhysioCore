import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
import DayTracker from '../components/DayTracker';
import MilestoneItem from '../components/MilestoneItem';
import { mockMetrics, mockWeeklyDays, mockPainTrend, mockMilestones } from '../data/mockData';

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
    const painPct = (level, max) => Math.round((level / max) * 100);

    return (
        <div className="cd-page">
            {/* ── Metric Cards ─── */}
            <div className="cd-section">
                <div className="cd-metrics-grid">
                    <MetricCard
                        icon={<HeartIcon />}
                        label="Adherence Rate"
                        value={`${mockMetrics.adherenceRate}%`}
                        trend="+5% this week"
                        trendDirection="up"
                        color="primary"
                    />
                    <MetricCard
                        icon={<ActivityIcon />}
                        label="Pain Level"
                        value={`${mockMetrics.painLevel} / 10`}
                        trend="−4 pts since start"
                        trendDirection="up"
                        color="warning"
                    />
                    <MetricCard
                        icon={<TrendUpIcon />}
                        label="Recovery Progress"
                        value={`${mockMetrics.recoveryProgress}%`}
                        trend="On track"
                        trendDirection="neutral"
                        color="success"
                    />
                </div>
            </div>

            {/* ── Weekly Progress Tracker + Pain Trend ─── */}
            <div className="cd-two-col cd-section">
                {/* Day tracker */}
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Weekly Progress</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Apr 7 – 13</span>
                    </div>
                    <DayTracker days={mockWeeklyDays} />
                    <div style={{ marginTop: '1.1rem' }}>
                        <ProgressBar value={mockMetrics.adherenceRate} label="Week adherence" color="primary" size="sm" />
                    </div>
                </div>

                {/* Pain trend */}
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Pain Trend</span>
                    </div>
                    <div className="cd-pain-trend">
                        {mockPainTrend.map(row => (
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
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Overall improvement</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#16a34a' }}>−57% pain reduction</div>
                    </div>
                </div>
            </div>

            {/* ── Milestones ─── */}
            <div className="cd-section">
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Milestones</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{mockMilestones.filter(m => m.achieved).length} / {mockMilestones.length} achieved</span>
                    </div>
                    <div className="cd-milestones">
                        {mockMilestones.map(m => (
                            <MilestoneItem key={m.id} milestone={m} />
                        ))}
                    </div>
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
                            <div className="cd-quick-card-sub">6 exercises · 29 min</div>
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
