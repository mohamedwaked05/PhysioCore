import { useState, useEffect } from 'react';
import WorkoutSummary from '../components/WorkoutSummary';
import ProgressBar from '../components/ProgressBar';
import ExerciseItem from '../components/ExerciseItem';
import WorkoutTimer from '../components/WorkoutTimer';
import WorkoutRating from '../components/WorkoutRating';
import { mockTodayExercises } from '../data/mockData';
import { getAccessRequests, submitSessionFeedback } from '../../../../api/client';
import { useToast } from '../../../../context/ToastContext';

export default function TodayPage() {
    const { addToast } = useToast();

    const [completed,     setCompleted]     = useState(new Set());
    const [resetKey,      setResetKey]      = useState(0);
    const [rating,        setRating]        = useState(0);
    const [feedback,      setFeedback]      = useState('');

    // Timer state
    const [timerElapsed,  setTimerElapsed]  = useState(0);
    const [timerRunning,  setTimerRunning]  = useState(false);
    const [sessionEnded,  setSessionEnded]  = useState(false);

    // Feedback submission state
    const [clinics,       setClinics]       = useState([]);   // approved clinics
    const [clinicId,      setClinicId]      = useState('');
    const [submitting,    setSubmitting]    = useState(false);
    const [submitted,     setSubmitted]     = useState(false);

    const completedCount = completed.size;
    const totalCount     = mockTodayExercises.length;
    const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const allDone        = completedCount === totalCount;
    const showRating     = allDone || sessionEnded;

    // Fetch approved clinics so we know where to send feedback
    useEffect(() => {
        getAccessRequests()
            .then(res => {
                const approved = res.data
                    .filter(r => r.status === 'approved' && r.clinic)
                    .map(r => r.clinic);
                setClinics(approved);
                if (approved.length === 1) setClinicId(approved[0].id);
            })
            .catch(() => {});
    }, []);

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

    const handleAutoStart = () => {
        if (!timerRunning && timerElapsed === 0 && !sessionEnded) setTimerRunning(true);
    };

    const handleEndSession = () => { setTimerRunning(false); setSessionEnded(true); };
    const handleTimerReset = () => { setTimerRunning(false); setTimerElapsed(0); setSessionEnded(false); };

    const handleReset = () => {
        setCompleted(new Set());
        setResetKey(k => k + 1);
        setTimerRunning(false);
        setTimerElapsed(0);
        setSessionEnded(false);
        setRating(0);
        setFeedback('');
        setSubmitted(false);
    };

    const complete = (id) => setCompleted(prev => new Set([...prev, id]));

    const canSubmit = !submitted && !submitting && !!clinicId && (rating > 0 || feedback.trim().length > 0);

    const handleSubmit = async () => {
        if (!clinicId) { addToast('Please select a clinic.', 'warning'); return; }
        if (!rating && !feedback.trim()) { addToast('Please add a rating or feedback note.', 'warning'); return; }

        setSubmitting(true);
        try {
            await submitSessionFeedback({
                clinic_id:            parseInt(clinicId),
                rating:               rating || null,
                feedback_text:        feedback.trim() || null,
                exercises_completed:  completedCount,
                exercises_total:      totalCount,
            });
            setSubmitted(true);
            addToast('Feedback submitted successfully.', 'success');
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Failed to submit feedback. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

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
                            <button className="cd-card-reset-btn" onClick={handleReset}>Reset all</button>
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

            {/* ── Rating + Feedback (combined submission) ─── */}
            {showRating && (
                <div className="cd-section">
                    <div className="ui-card">
                        {submitted ? (
                            <div className="cd-rating cd-rating--done">
                                <span className="cd-rating-check">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </span>
                                <span className="cd-rating-done-text">
                                    Feedback submitted — great work!
                                </span>
                            </div>
                        ) : (
                            <>
                                <WorkoutRating value={rating} onChange={setRating} />

                                <div className="cd-feedback" style={{ marginTop: '1rem' }}>
                                    <div className="cd-feedback-title">Session Notes</div>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        placeholder="How did this session feel? Note any pain, difficulty, or progress..."
                                        maxLength={600}
                                    />
                                    <div className="cd-feedback-footer">
                                        {/* Clinic selector — only shown when patient of multiple clinics */}
                                        {clinics.length > 1 && (
                                            <select
                                                className="ui-select"
                                                style={{ fontSize: '0.82rem', padding: '0.4rem 0.65rem' }}
                                                value={clinicId}
                                                onChange={e => setClinicId(e.target.value)}
                                            >
                                                <option value="">Select clinic…</option>
                                                {clinics.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.commercial_name || c.legal_name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {clinics.length === 0 && (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                You need an approved clinic to submit feedback.
                                            </span>
                                        )}
                                        <button
                                            className="ui-btn ui-btn--primary ui-btn--sm"
                                            disabled={!canSubmit}
                                            onClick={handleSubmit}
                                        >
                                            {submitting ? 'Submitting…' : 'Submit Feedback'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
