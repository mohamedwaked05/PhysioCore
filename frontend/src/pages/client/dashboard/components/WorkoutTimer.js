function PlayIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
    );
}

function PauseIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
        </svg>
    );
}

function StopIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
        </svg>
    );
}

function ResetIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.6"/>
        </svg>
    );
}

function FlagIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
    );
}

/**
 * Fully controlled — all state lives in TodayPage.
 * Props:
 *   elapsed      — seconds elapsed (number)
 *   running      — whether the timer is ticking (bool)
 *   ended        — session has been explicitly ended (bool)
 *   onToggle     — start / pause
 *   onReset      — reset to 0
 *   onEndSession — end session button
 */
export default function WorkoutTimer({ elapsed, running, ended, onToggle, onReset, onEndSession }) {
    const mins    = Math.floor(elapsed / 60);
    const secs    = elapsed % 60;
    const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
        <div className={`cd-wt${ended ? ' cd-wt--ended' : ''}`}>
            <div className="cd-wt-label">Session Timer</div>
            <div className="cd-wt-display">{display}</div>

            {ended ? (
                <div className="cd-wt-controls">
                    <span className="cd-wt-ended-label">
                        <FlagIcon />
                        Session ended
                    </span>
                    <button
                        type="button"
                        className="cd-wt-btn cd-wt-btn--reset"
                        onClick={onReset}
                        aria-label="Reset timer"
                    >
                        <ResetIcon />
                    </button>
                </div>
            ) : (
                <div className="cd-wt-controls">
                    <button
                        type="button"
                        className={`cd-wt-btn${running ? ' cd-wt-btn--pause' : ' cd-wt-btn--start'}`}
                        onClick={onToggle}
                    >
                        {running ? <PauseIcon /> : <PlayIcon />}
                        {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
                    </button>

                    {elapsed > 0 && (
                        <>
                            <button
                                type="button"
                                className="cd-wt-btn cd-wt-btn--end"
                                onClick={onEndSession}
                            >
                                <StopIcon />
                                End Session
                            </button>
                            <button
                                type="button"
                                className="cd-wt-btn cd-wt-btn--reset"
                                onClick={onReset}
                                aria-label="Reset timer"
                            >
                                <ResetIcon />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
