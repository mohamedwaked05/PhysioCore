import { useState, useRef, useEffect } from 'react';

/* ── Icons ──────────────────────────────────────────────────── */
function CheckIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
        </svg>
    );
}

function TimerIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </svg>
    );
}

function ShuffleIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
        </svg>
    );
}

/* ── Log buttons: 1–10 scale ────────────────────────────────── */
function LogButtons({ label, value, onChange, required = false, showError = false }) {
    return (
        <div className="cd-log-row">
            <span className={`cd-log-label${showError && value === 0 ? ' cd-log-label--error' : ''}`}>
                {label}
                {required && <span className="cd-log-required">*</span>}
            </span>
            <div className="cd-log-buttons">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                        key={n}
                        type="button"
                        className={`cd-log-btn cd-log-btn--${n <= 3 ? 'low' : n <= 6 ? 'mid' : 'high'}${value === n ? ' active' : ''}`}
                        onClick={() => onChange(value === n ? 0 : n)}
                        aria-label={`${label} ${n}`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            {value > 0 && (
                <span className="cd-log-value">{value}</span>
            )}
        </div>
    );
}

/* ── ExerciseItem ────────────────────────────────────────────── */
export default function ExerciseItem({ exercise, completed = false, onComplete, onSessionStart }) {
    const totalSets = exercise.sets ?? 1;

    const [expanded,     setExpanded]     = useState(false);
    const [doneCount,    setDoneCount]    = useState(0);
    const [isResting,    setIsResting]    = useState(false);
    const [restLeft,     setRestLeft]     = useState(0);
    const [restDuration, setRestDuration] = useState(exercise.restTime ?? 2);
    const [pain,         setPain]         = useState(0);
    const [effort,       setEffort]       = useState(0);
    const [useSub,       setUseSub]       = useState(false);
    const [awaitingLog,  setAwaitingLog]  = useState(false);
    const [logErrors,    setLogErrors]    = useState(false);

    const intervalRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => () => clearInterval(intervalRef.current), []);

    const displayName = useSub && exercise.substitute ? exercise.substitute : exercise.name;

    const startRest = () => {
        const total = restDuration * 60;
        setRestLeft(total);
        setIsResting(true);
        intervalRef.current = setInterval(() => {
            setRestLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    setIsResting(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const skipRest = () => {
        clearInterval(intervalRef.current);
        setIsResting(false);
        setRestLeft(0);
    };

    const handleSetDone = () => {
        // Auto-start the session timer on the very first Set Done across all exercises
        if (doneCount === 0) onSessionStart?.();

        const next = doneCount + 1;
        setDoneCount(next);
        if (next >= totalSets) {
            setAwaitingLog(true); // all sets done — require pain + effort before finishing
        } else {
            startRest();
        }
    };

    const handleFinish = () => {
        if (pain === 0 || effort === 0) {
            setLogErrors(true);
            return;
        }
        onComplete?.(pain, effort);
    };

    const currentSet = doneCount + 1;
    const restPct = restDuration > 0
        ? ((restDuration * 60 - restLeft) / (restDuration * 60)) * 100
        : 0;

    return (
        <div className={`cd-ex-item${completed ? ' cd-ex-item--done' : ''}${expanded ? ' cd-ex-item--open' : ''}`}>

            {/* ── Header ─── */}
            <div
                className="cd-ex-header"
                onClick={() => setExpanded(p => !p)}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(p => !p)}
            >
                <div className={`cd-exercise-checkbox${completed ? ' cd-exercise-checkbox--checked' : ''}`}>
                    {completed && <CheckIcon />}
                </div>

                <div className="cd-exercise-body">
                    <div className="cd-exercise-name">
                        {displayName}
                        {useSub && exercise.substitute && (
                            <span className="cd-ex-alt-badge">alt</span>
                        )}
                    </div>
                    <div className="cd-exercise-meta">
                        {[
                            totalSets > 1 ? `${totalSets} sets` : '1 set',
                            exercise.reps ? `× ${exercise.reps} reps` : null,
                            exercise.duration,
                        ].filter(Boolean).join(' · ')}
                    </div>
                    {exercise.tags?.length > 0 && (
                        <div className="cd-exercise-tags">
                            {exercise.tags.map(tag => (
                                <span key={tag} className="cd-exercise-tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cd-ex-header-right">
                    {exercise.difficulty && (
                        <span className={`cd-exercise-difficulty cd-exercise-difficulty--${exercise.difficulty}`}>
                            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                        </span>
                    )}
                    <span className={`cd-ex-chevron${expanded ? ' cd-ex-chevron--open' : ''}`}>
                        <ChevronIcon />
                    </span>
                </div>
            </div>

            {/* ── Expanded panel (logs only when done) ─── */}
            {expanded && completed && (
                <div className="cd-ex-panel cd-ex-panel--done">
                    <div className="cd-ex-logs">
                        <LogButtons label="Pain"   value={pain}   onChange={setPain}   />
                        <LogButtons label="Effort" value={effort} onChange={setEffort} />
                    </div>
                </div>
            )}

            {/* ── Expanded panel (full when active) ─── */}
            {expanded && !completed && (
                <div className="cd-ex-panel">

                    {/* Set tracker */}
                    <div className="cd-ex-set-row">
                        <div className="cd-ex-set-dots">
                            {Array.from({ length: totalSets }, (_, i) => (
                                <span
                                    key={i}
                                    className={`cd-ex-set-dot${i < doneCount ? ' cd-ex-set-dot--done' : i === doneCount ? ' cd-ex-set-dot--active' : ''}`}
                                />
                            ))}
                        </div>
                        <span className="cd-ex-set-label">
                            {doneCount < totalSets ? `Set ${currentSet} of ${totalSets}` : 'All sets done'}
                        </span>
                    </div>

                    {/* Rest timer */}
                    {isResting && (
                        <div className="cd-ex-rest">
                            <div className="cd-ex-rest-top">
                                <span className="cd-ex-rest-icon"><TimerIcon /></span>
                                <span className="cd-ex-rest-countdown">
                                    {String(Math.floor(restLeft / 60)).padStart(2, '0')}:{String(restLeft % 60).padStart(2, '0')}
                                </span>
                                <span className="cd-ex-rest-text">rest</span>
                                <button type="button" className="cd-ex-skip-btn" onClick={skipRest}>
                                    Skip
                                </button>
                            </div>
                            <div className="cd-ex-rest-bar">
                                <div className="cd-ex-rest-bar-fill" style={{ width: `${restPct}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Action buttons — hidden once awaiting log */}
                    {!awaitingLog && (
                        <div className="cd-ex-actions">
                            <button
                                type="button"
                                className="cd-ex-set-done-btn"
                                disabled={isResting}
                                onClick={handleSetDone}
                            >
                                <CheckIcon />
                                Set Done
                            </button>

                            {!isResting && (
                                <select
                                    className="cd-ex-rest-select"
                                    value={restDuration}
                                    onChange={e => setRestDuration(Number(e.target.value))}
                                    aria-label="Rest duration"
                                >
                                    {[1, 2, 3, 4, 5].map(m => (
                                        <option key={m} value={m}>{m} min rest</option>
                                    ))}
                                </select>
                            )}

                            {exercise.substitute && (
                                <button
                                    type="button"
                                    className={`cd-ex-sub-btn${useSub ? ' cd-ex-sub-btn--active' : ''}`}
                                    onClick={() => setUseSub(p => !p)}
                                    title={useSub ? `Original: ${exercise.name}` : `Substitute: ${exercise.substitute}`}
                                >
                                    <ShuffleIcon />
                                    {useSub ? 'Original' : 'Substitute'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pain / Effort logs */}
                    <div className={`cd-ex-logs${awaitingLog ? ' cd-ex-logs--required' : ''}`}>
                        {awaitingLog && (
                            <p className="cd-ex-log-notice">
                                Log your pain and effort to complete this exercise.
                            </p>
                        )}
                        <LogButtons
                            label="Pain"
                            value={pain}
                            onChange={v => { setPain(v); setLogErrors(false); }}
                            required={awaitingLog}
                            showError={logErrors && pain === 0}
                        />
                        <LogButtons
                            label="Effort"
                            value={effort}
                            onChange={v => { setEffort(v); setLogErrors(false); }}
                            required={awaitingLog}
                            showError={logErrors && effort === 0}
                        />
                        {awaitingLog && (
                            <button
                                type="button"
                                className="cd-ex-finish-btn"
                                onClick={handleFinish}
                            >
                                <CheckIcon />
                                Finish Exercise
                            </button>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
