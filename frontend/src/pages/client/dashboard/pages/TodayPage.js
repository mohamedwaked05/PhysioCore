import { useState } from 'react';
import WorkoutSummary from '../components/WorkoutSummary';
import ProgressBar from '../components/ProgressBar';
import ExerciseItem from '../components/ExerciseItem';
import { mockTodayExercises } from '../data/mockData';

export default function TodayPage() {
    const [completed, setCompleted] = useState(new Set());
    const [feedback, setFeedback] = useState('');

    const toggle = (id) => {
        setCompleted(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const completedCount = completed.size;
    const totalCount = mockTodayExercises.length;
    const progressPct = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="cd-page">
            {/* ── Workout Summary Header ─── */}
            <div className="cd-section">
                <WorkoutSummary
                    totalExercises={totalCount}
                    estimatedTime="29 min"
                    difficulty="Moderate"
                />
            </div>

            {/* ── Progress ─── */}
            <div className="cd-today-header cd-section">
                <div className="cd-today-progress-block">
                    <div className="cd-today-count">
                        <span>{completedCount}</span> of {totalCount} exercises completed
                    </div>
                    <div style={{ marginTop: '0.65rem' }}>
                        <ProgressBar
                            value={progressPct}
                            label="Session progress"
                            color={progressPct === 100 ? 'success' : 'primary'}
                            size="md"
                        />
                    </div>
                </div>

                {progressPct === 100 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(22, 163, 74, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        border: '0.5px solid rgba(22, 163, 74, 0.2)',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🎉</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a' }}>Workout done!</span>
                    </div>
                )}
            </div>

            {/* ── Exercise List ─── */}
            <div className="cd-section">
                <div className="ui-card">
                    <div className="cd-card-header">
                        <span className="cd-card-title">Today's Exercises</span>
                        {completedCount > 0 && (
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '0.2rem 0.5rem',
                                }}
                                onClick={() => setCompleted(new Set())}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <div className="cd-exercise-list">
                        {mockTodayExercises.map(ex => (
                            <ExerciseItem
                                key={ex.id}
                                exercise={ex}
                                completed={completed.has(ex.id)}
                                onToggle={() => toggle(ex.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Feedback Section ─── */}
            <div className="cd-section">
                <div className="cd-feedback">
                    <div className="cd-feedback-title">Session Feedback</div>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="How did this session feel? Note any pain, difficulty, or progress you'd like to share with your physiotherapist..."
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
