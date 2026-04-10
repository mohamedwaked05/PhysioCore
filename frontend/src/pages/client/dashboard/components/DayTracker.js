export default function DayTracker({ days = [] }) {
    return (
        <div className="cd-day-tracker">
            {days.map(day => (
                <div key={day.id} className="cd-day-block">
                    <span className="cd-day-block-label">{day.short}</span>
                    <div className={`cd-day-block-bar cd-day-block-bar--${day.status}`} title={`${day.label}: ${day.status === 'rest' ? 'Rest day' : day.completion + '%'}`} />
                    <span className="cd-day-block-pct">
                        {day.status === 'rest'     && '—'}
                        {day.status === 'upcoming' && '·'}
                        {(day.status === 'complete' || day.status === 'partial') && `${day.completion}%`}
                    </span>
                </div>
            ))}
        </div>
    );
}
