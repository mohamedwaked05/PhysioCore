import { useState, useEffect } from 'react';
import WorkoutSummary from '../components/WorkoutSummary';
import ProgressBar from '../components/ProgressBar';
import ExerciseItem from '../components/ExerciseItem';
import WorkoutTimer from '../components/WorkoutTimer';
import WorkoutRating from '../components/WorkoutRating';
import { mockTodayExercises } from '../data/mockData';

export default function TodayPage() {
    const [completed,     setCompleted]     = useState(new Set());
    const [resetKey,      setResetKey]      = useState(0);
    const [feedback,      setFeedback]      = useState('');

    // ── Timer state (owned here so exercises + allDone can control it) ──
    const [timerElapsed,  setTimerElapsed]  = useState(0);
    const [timerRunning,  setTimerRunning]  = useState(false);
    const [sessionEnded,  setSessionEnded]  = useState(false);

    const completedCount = completed.size;
    const totalCount     = mockTodayExercises.length;
    const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const allDone        = completedCount === totalCount;

    // Timer tick
    useEffect(() => {
        if (!timerRunning) return;
        const id = setInterval(() => setTimerElapsed(p => p + 1), 1000);
        return () => clearInterval(id);
    }, [timerRunning]);

    // Auto-stop when every exercise is finished
    useEffect(() => {
        if (allDone && timerRunning) setTimerRunning(false);
    }, [allDone]);

    // Auto-start on first Set Done if the user hasn't touched the timer yet
    const handleAutoStart = () => {
        if (!timerRunning && timerElapsed === 0 && !sessionEnded) {
            setTimerRunning(true);
        }
    };

    const handleEndSession = () => {
        setTimerRunning(false);
        setSessionEnded(true);
    };

    const handleTimerReset = () => {
        setTimerRunning(false);
        setTimerElapsed(0);
        setSessionEnded(false);
    };

    const handleReset = () => {
        setCompleted(new Set());
        setResetKey(k => k + 1);
        setTimerRunning(false);
        setTimerElapsed(0);
        setSessionEnded(false);
    };

    const complete = (id) => setCompleted(prev => new Set([...prev, id]));

    const showRating = allDone || sessionEnded;

    return (
        <div className="cd-page">

            {/* ── Workout Summary + Timer ─── */}
            <div className="cd-section cd-today-top">
                <WorkoutSummary
                    totalExercises={totalCount}
                    estimatedTime="29 min"
                    difficulty="Moderate"
                />
                <WorkoutTimer
                    elapsed={timerElapsed}
                    running={timerRunning}
                    ended={sessionEnded || allDone}
                    onToggle={() => setTimerRunning(p => !p)}
                    onReset={handleTimerReset}
                    onEndSession={handleEndSession}
                />
            </div>

            {/* ── Progress banner ─── */}
            <div className="cd-today-header cd-section">
                <div className="cd-today-progress-block">
                    <div className="cd-today-count">
                        <span>{completedCount}</span> of {totalCount} exercises completed
                    </div>
                    <div style={{ marginTop: '0.65rem' }}>
                        <ProgressBar
                            value={progressPct}
                            label="Session progress"
                            color={allDone ? 'success' : 'primary'}
                            size="md"
                        />
                    </div>
                </div>

                {allDone && (
                    <div className="cd-today-done-badge">
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🎉</span>
                        <span className="cd-today-done-text">Workout done!</span>
                    </div>
                )}
            </div>

            {/* ── Exercise list ─── */}
            <div className="cd-section">
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Today's Exercises</span>
                        {completedCount > 0 && (
                            <button className="cd-card-reset-btn" onClick={handleReset}>
                                Reset all
                            </button>
                        )}
                    </div>
                    <div className="cd-exercise-list">
                        {mockTodayExercises.map(ex => (
                            <ExerciseItem
                                key={`${ex.id}-${resetKey}`}
                                exercise={ex}
                                completed={completed.has(ex.id)}
                                onComplete={() => complete(ex.id)}
                                onSessionStart={handleAutoStart}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Rating (all done or session ended early) ─── */}
            {showRating && (
                <div className="cd-section">
                    <div className="ui-card">
                        <WorkoutRating />
                    </div>
                </div>
            )}

            {/* ── Session Feedback ─── */}
            <div className="cd-section">
                <div className="cd-feedback">
                    <div className="cd-feedback-title">Session Feedback</div>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="How did this session feel? Note any pain, difficulty, or progress..."
                        maxLength={600}
                    />
                    <div className="cd-feedback-footer">
                        <button
                            className="ui-btn ui-btn--primary ui-btn--sm"
                            disabled
                            title="Feedback submission will be available in the next sprint"
                        >
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
