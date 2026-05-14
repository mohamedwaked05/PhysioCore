import { useState, useEffect, useRef } from 'react';
import WorkoutSummary from '../components/WorkoutSummary';
import ProgressBar from '../components/ProgressBar';
import ExerciseItem from '../components/ExerciseItem';
import WorkoutTimer from '../components/WorkoutTimer';
import WorkoutRating from '../components/WorkoutRating';
import Skeleton from '../../../../components/ui/Skeleton';
import { getAccessRequests, submitSessionFeedback, escalateSafety } from '../../../../api/client';
import { getMyRehabPlan, markDayComplete, resetDayProgress } from '../../../../api/rehabPlans';
import { useToast } from '../../../../context/ToastContext';
import { getEcho } from '../../../../services/echo';

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const TODAY_DAY = DAY_NAMES[new Date().getDay()];

function mapExercise(ex) {
    return {
        id:         ex.id,
        name:       ex.name,
        sets:       ex.sets,
        reps:       ex.reps,
        duration:   null,
        tags:       [],
        difficulty: null,
        substitute: ex.alternative_exercise || null,
        restTime:   2,
        videoUrl:   ex.video_url || null,
    };
}

export default function TodayPage() {
    const { addToast } = useToast();

    // Plan / clinic state
    const [clinics,      setClinics]      = useState([]);
    const [clinicId,     setClinicId]     = useState('');
    const [plan,         setPlan]         = useState(null);
    const [exercises,    setExercises]    = useState([]);
    const [todayDone,    setTodayDone]    = useState(false);
    const [doneAt,       setDoneAt]       = useState(null);
    const [planLoading,  setPlanLoading]  = useState(true);

    // Session state (local — tracks current in-progress session)
    const [completed,       setCompleted]       = useState(new Set());
    const [resetKey,        setResetKey]        = useState(0);
    const [timerElapsed,    setTimerElapsed]    = useState(0);
    const [timerRunning,    setTimerRunning]    = useState(false);
    const [sessionEnded,    setSessionEnded]    = useState(false);
    const [rating,          setRating]          = useState(0);
    const [feedback,        setFeedback]        = useState('');
    const [painLevel,       setPainLevel]       = useState(0);
    const [effortLevel,     setEffortLevel]     = useState(0);
    const [submitting,      setSubmitting]      = useState(false);
    const [submitted,       setSubmitted]       = useState(false);

    // AI safety state
    const [safetyResult,    setSafetyResult]    = useState(null);  // {safety_flag, flag_reason, severity}
    const [escalating,      setEscalating]      = useState(false);
    const criticalSentRef = useRef(false); // prevents duplicate critical escalations per session
    const isInitialLoad   = useRef(true);  // prevents [clinicId] effect from double-firing on mount
    const submitGuardRef  = useRef(false); // synchronous guard — prevents duplicate rapid-tap submissions

    const completedCount = completed.size;
    const totalCount     = exercises.length;
    const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const allDone        = totalCount > 0 && completedCount === totalCount;
    const showRating     = (allDone || sessionEnded) && !todayDone;
    const canSubmit      = !submitted && !submitting && !!clinicId && painLevel > 0 && effortLevel > 0;

    // 1. Fetch clinics + immediately load plan — avoids React re-render between the two calls
    useEffect(() => {
        getAccessRequests()
            .then(res => {
                const approved = res.data
                    .filter(r => r.status === 'approved' && r.clinic)
                    .map(r => r.clinic);
                setClinics(approved);
                if (!approved.length) {
                    setPlanLoading(false);
                    isInitialLoad.current = false;
                    return;
                }
                const firstId = String(approved[0].id);
                setClinicId(firstId);
                getMyRehabPlan(firstId)
                    .then(res => {
                        const p = res.data;
                        if (p && p.exercises_by_day) {
                            setPlan(p);
                            setExercises((p.exercises_by_day[TODAY_DAY] ?? []).map(mapExercise));
                            const prog = p.progress?.[TODAY_DAY];
                            setTodayDone(prog?.completed ?? false);
                            setDoneAt(prog?.completed_at ?? null);
                        } else {
                            setPlan(null);
                            setExercises([]);
                            setTodayDone(false);
                            setDoneAt(null);
                        }
                    })
                    .catch(() => { setPlan(null); setExercises([]); })
                    .finally(() => {
                        setPlanLoading(false);
                        isInitialLoad.current = false;
                    });
            })
            .catch(() => {
                setPlanLoading(false);
                isInitialLoad.current = false;
            });
    }, []);

    // 2. Reload plan when user manually changes clinic selector
    useEffect(() => {
        if (isInitialLoad.current) return;
        if (!clinicId) return;
        setPlanLoading(true);
        setCompleted(new Set());
        setResetKey(k => k + 1);
        setSubmitted(false);
        getMyRehabPlan(clinicId)
            .then(res => {
                const p = res.data;
                if (p && p.exercises_by_day) {
                    setPlan(p);
                    setExercises((p.exercises_by_day[TODAY_DAY] ?? []).map(mapExercise));
                    const prog = p.progress?.[TODAY_DAY];
                    setTodayDone(prog?.completed ?? false);
                    setDoneAt(prog?.completed_at ?? null);
                } else {
                    setPlan(null);
                    setExercises([]);
                    setTodayDone(false);
                    setDoneAt(null);
                }
            })
            .catch(() => { setPlan(null); setExercises([]); })
            .finally(() => setPlanLoading(false));
    }, [clinicId]);

    // 3. Real-time plan updates — re-fetch when clinic edits the plan
    useEffect(() => {
        if (!plan?.client_profile_id) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const echo = getEcho(token);
        const ch   = echo.private(`rehab-plan.${plan.client_profile_id}`);
        ch.listen('.RehabPlanUpdated', ({ plan: updated }) => {
            if (updated?.deleted) {
                // Clinic deleted this plan — clear the view immediately
                setPlan(null);
                setExercises([]);
                setTodayDone(false);
                setDoneAt(null);
                return;
            }
            if (!updated?.exercises_by_day) return;
            setPlan(updated);
            setExercises((updated.exercises_by_day[TODAY_DAY] ?? []).map(mapExercise));
            const prog = updated.progress?.[TODAY_DAY];
            setTodayDone(prog?.completed ?? false);
            setDoneAt(prog?.completed_at ?? null);
        });
        return () => {
            try { echo.leave(`rehab-plan.${plan.client_profile_id}`); } catch {}
        };
    }, [plan?.client_profile_id]); // eslint-disable-line

    // Timer tick
    useEffect(() => {
        if (!timerRunning) return;
        const id = setInterval(() => setTimerElapsed(p => p + 1), 1000);
        return () => clearInterval(id);
    }, [timerRunning]);

    useEffect(() => {
        if (allDone && timerRunning) setTimerRunning(false);
    }, [allDone]); // eslint-disable-line

    // Real-time CRITICAL escalation — fires once when pain crosses ≥9
    useEffect(() => {
        if (painLevel >= 9 && !criticalSentRef.current && clinicId) {
            criticalSentRef.current = true;
            setEscalating(true);
            escalateSafety({
                clinic_id:    parseInt(clinicId),
                pain_level:   painLevel,
                effort_level: effortLevel || 0,
            })
                .then(res => setSafetyResult(res.data))
                .catch(() => addToast('Could not notify clinic. If pain is severe, contact them directly.', 'error'))
                .finally(() => setEscalating(false));
        }
    }, [painLevel, clinicId]); // eslint-disable-line

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
        setPainLevel(0);
        setEffortLevel(0);
        setSubmitted(false);
        setSafetyResult(null);
        criticalSentRef.current = false;
    };

    const complete = (id, exercisePain = 0, exerciseEffort = 0) => {
        setCompleted(prev => new Set([...prev, id]));

        if (exercisePain >= 9 && !criticalSentRef.current && clinicId) {
            criticalSentRef.current = true;
            setEscalating(true);
            escalateSafety({
                clinic_id:    parseInt(clinicId),
                pain_level:   exercisePain,
                effort_level: exerciseEffort,
            })
                .then(res => setSafetyResult(res.data))
                .catch(() => addToast('Could not notify clinic. If pain is severe, contact them directly.', 'error'))
                .finally(() => setEscalating(false));
        }
    };

    // Redo today — reset server-side progress, re-enable interactive mode
    const handleRedo = async () => {
        if (!plan) return;
        try {
            await resetDayProgress(plan.id, TODAY_DAY);
            setTodayDone(false);
            setDoneAt(null);
            handleReset();
        } catch {
            addToast('Failed to reset today\'s progress.', 'error');
        }
    };

    // Submit feedback then mark day complete — sequential so a failed
    // feedback submission never leaves the day marked complete with no data.
    const handleSubmit = async () => {
        if (submitGuardRef.current) return; // block rapid double-taps before re-render
        if (!clinicId) { addToast('Please select a clinic.', 'warning'); return; }
        if (!painLevel) { addToast('Please rate your pain level before submitting.', 'warning'); return; }
        if (!effortLevel) { addToast('Please rate your effort level before submitting.', 'warning'); return; }

        submitGuardRef.current = true;
        setSubmitting(true);
        try {
            const feedbackRes = await submitSessionFeedback({
                clinic_id:           parseInt(clinicId),
                rating:              rating || null,
                pain_level:          painLevel || null,
                effort_level:        effortLevel || null,
                feedback_text:       feedback.trim() || null,
                exercises_completed: completedCount,
                exercises_total:     totalCount,
                exercise_ids:        [...completed],
            });

            // Only mark day complete after feedback is saved successfully
            if (plan) await markDayComplete(plan.id, TODAY_DAY);

            if (feedbackRes?.data?.ai?.safety_flag) {
                setSafetyResult(feedbackRes.data.ai);
            }
            setSubmitted(true);
            setTodayDone(true);
            setDoneAt(new Date().toISOString());
            addToast('Feedback submitted. Great work!', 'success');
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Failed to submit. Please try again.', 'error');
        } finally {
            submitGuardRef.current = false;
            setSubmitting(false);
        }
    };

    const injuryLabel = plan?.injury_type
        ? plan.injury_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : '—';

    const clinicSelector = clinics.length > 1 && (
        <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Viewing plan from:
            </label>
            <select className="ui-select" value={clinicId} onChange={e => setClinicId(e.target.value)}>
                {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.commercial_name || c.legal_name}</option>
                ))}
            </select>
        </div>
    );

    // ── Already completed today ────────────────────────────────
    if (!planLoading && todayDone) {
        const fmtTime = doneAt ? new Date(doneAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
        return (
            <div className="cd-page">
                {clinicSelector}
                <div className="cd-section">
                    <div className="ui-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#16a34a' }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                            Today's Workout Complete
                        </p>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            {injuryLabel} · {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                        </p>
                        {fmtTime && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Completed at {fmtTime}
                            </p>
                        )}
                        <button className="cld-btn-action"
                            style={{ fontSize: '0.82rem', padding: '0.45rem 1.1rem', margin: '0 auto' }}
                            onClick={handleRedo}>
                            Redo Today's Workout
                        </button>
                    </div>
                </div>

                {/* Show today's exercises as read-only reference */}
                {exercises.length > 0 && (
                    <div className="cd-section">
                        <div className="ui-card">
                            <div className="cd-card-header">
                                <span className="cd-card-title">Today's Exercises</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exercises.length} total</span>
                            </div>
                            <div className="cd-exercise-list">
                                {exercises.map(ex => (
                                    <ExerciseItem key={ex.id} exercise={ex} completed={true} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Normal interactive view ────────────────────────────────
    return (
        <div className="cd-page">
            {clinicSelector}

            <div className="cd-section cd-today-top">
                <WorkoutSummary
                    totalExercises={totalCount}
                    estimatedTime={totalCount > 0 ? `~${totalCount * 3} min` : '—'}
                    difficulty={injuryLabel}
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

            <div className="cd-today-header cd-section">
                <div className="cd-today-progress-block">
                    <div className="cd-today-count">
                        <span>{completedCount}</span> of {totalCount} exercises completed
                    </div>
                    <div style={{ marginTop: '0.65rem' }}>
                        <ProgressBar value={progressPct} label="Session progress"
                            color={allDone ? 'success' : 'primary'} size="md" />
                    </div>
                </div>
                {allDone && (
                    <div className="cd-today-done-badge">
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🎉</span>
                        <span className="cd-today-done-text">Workout done!</span>
                    </div>
                )}
            </div>

            <div className="cd-section">
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Today's Exercises</span>
                        {completedCount > 0 && (
                            <button className="cd-card-reset-btn" onClick={handleReset}>Reset all</button>
                        )}
                    </div>

                    {planLoading ? (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[1,2,3].map(i => <Skeleton key={i} height="56px" radius="8px" />)}
                        </div>
                    ) : exercises.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {clinics.length === 0
                                ? 'You need an approved clinic to view your rehab plan.'
                                : plan
                                    ? 'No exercises scheduled for today — enjoy your rest day.'
                                    : 'Your clinic has not assigned a rehab plan yet.'}
                        </div>
                    ) : (
                        <div className="cd-exercise-list">
                            {exercises.map(ex => (
                                <ExerciseItem
                                    key={`${ex.id}-${resetKey}`}
                                    exercise={ex}
                                    completed={completed.has(ex.id)}
                                    onComplete={(pain, effort) => complete(ex.id, pain, effort)}
                                    onSessionStart={handleAutoStart}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── AI Safety Banners ─── */}
            {showRating && painLevel >= 8 && !safetyResult?.safety_flag && (
                <div className="cd-section">
                    <div style={{ padding: '0.85rem 1.1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>⚠️</span>
                        <div>
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e', margin: 0 }}>High Pain Detected</p>
                            <p style={{ fontSize: '0.78rem', color: '#78350f', marginTop: '0.15rem' }}>Pain level {painLevel}/10 — your clinic has been notified if this persists.</p>
                        </div>
                    </div>
                </div>
            )}
            {showRating && safetyResult?.safety_flag && (
                <div className="cd-section">
                    <div style={{ padding: '0.85rem 1.1rem', background: safetyResult.severity === 'critical' ? '#fef2f2' : '#fffbeb', border: `1px solid ${safetyResult.severity === 'critical' ? '#fca5a5' : '#fcd34d'}`, borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>{safetyResult.severity === 'critical' ? '🚨' : '⚠️'}</span>
                        <div>
                            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: safetyResult.severity === 'critical' ? '#991b1b' : '#92400e', margin: 0 }}>
                                {safetyResult.severity === 'critical' ? 'Critical Pain Alert' : 'Safety Alert'}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: safetyResult.severity === 'critical' ? '#7f1d1d' : '#78350f', marginTop: '0.15rem' }}>
                                {safetyResult.flag_reason} — your clinic has been notified.
                            </p>
                            {escalating && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Notifying clinic…</p>}
                        </div>
                    </div>
                </div>
            )}

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
                                <span className="cd-rating-done-text">Feedback submitted — great work!</span>
                            </div>
                        ) : (
                            <>
                                <WorkoutRating value={rating} onChange={setRating} />

                                {/* Pain & Effort sliders */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 1.25rem 0' }}>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                            Pain Level <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({painLevel || '—'}/10)</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="10" value={painLevel}
                                            onChange={e => setPainLevel(Number(e.target.value))}
                                            style={{ width: '100%', accentColor: '#ef4444' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            <span>No pain</span><span>Severe</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                            Effort Level <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({effortLevel || '—'}/10)</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="10" value={effortLevel}
                                            onChange={e => setEffortLevel(Number(e.target.value))}
                                            style={{ width: '100%', accentColor: '#3E4772' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            <span>Easy</span><span>Max effort</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="cd-feedback" style={{ marginTop: '1rem' }}>
                                    <div className="cd-feedback-title">Session Notes</div>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        placeholder="How did this session feel? Note any pain, difficulty, or progress..."
                                        maxLength={600}
                                    />
                                    <div className="cd-feedback-footer">
                                        {clinics.length > 1 && (
                                            <select className="ui-select"
                                                style={{ fontSize: '0.82rem', padding: '0.4rem 0.65rem' }}
                                                value={clinicId}
                                                onChange={e => setClinicId(e.target.value)}>
                                                <option value="">Select clinic…</option>
                                                {clinics.map(c => (
                                                    <option key={c.id} value={c.id}>{c.commercial_name || c.legal_name}</option>
                                                ))}
                                            </select>
                                        )}
                                        {clinics.length === 0 && (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                You need an approved clinic to submit feedback.
                                            </span>
                                        )}
                                        <button className="ui-btn ui-btn--primary ui-btn--sm"
                                            disabled={!canSubmit} onClick={handleSubmit}>
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
