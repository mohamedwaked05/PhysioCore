function DumbellIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M6.5 6.5v11M17.5 6.5v11"/>
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
    );
}

function ZapIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
    );
}

export default function WorkoutSummary({ totalExercises, estimatedTime, difficulty }) {
    return (
        <div className="cd-workout-summary">
            <div className="cd-workout-stat">
                <span className="cd-workout-stat-icon"><DumbellIcon /></span>
                <div className="cd-workout-stat-body">
                    <div className="cd-workout-stat-value">{totalExercises} exercises</div>
                    <div className="cd-workout-stat-label">Today's plan</div>
                </div>
            </div>
            <div className="cd-workout-stat">
                <span className="cd-workout-stat-icon"><ClockIcon /></span>
                <div className="cd-workout-stat-body">
                    <div className="cd-workout-stat-value">{estimatedTime}</div>
                    <div className="cd-workout-stat-label">Est. duration</div>
                </div>
            </div>
            <div className="cd-workout-stat">
                <span className="cd-workout-stat-icon"><ZapIcon /></span>
                <div className="cd-workout-stat-body">
                    <div className="cd-workout-stat-value">{difficulty}</div>
                    <div className="cd-workout-stat-label">Difficulty</div>
                </div>
            </div>
        </div>
    );
}
