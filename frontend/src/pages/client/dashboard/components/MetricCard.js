export default function MetricCard({ icon, label, value, trend, trendDirection = 'neutral', color = 'primary' }) {
    return (
        <div className="cd-metric-card">
            <div className={`cd-metric-icon cd-metric-icon--${color}`}>
                {icon}
            </div>
            <div className="cd-metric-body">
                <div className="cd-metric-label">{label}</div>
                <div className="cd-metric-value">{value}</div>
                {trend && (
                    <span className={`cd-metric-trend cd-metric-trend--${trendDirection}`}>
                        {trendDirection === 'up' && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"/>
                            </svg>
                        )}
                        {trendDirection === 'down' && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        )}
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
