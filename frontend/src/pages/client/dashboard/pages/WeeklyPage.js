import { useState } from 'react';
import ExerciseItem from '../components/ExerciseItem';
import WorkoutSummary from '../components/WorkoutSummary';
import { mockWeeklySchedule } from '../data/mockData';

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function StatusDot({ status }) {
    return <span className={`cd-day-list-dot cd-day-list-dot--${status}`} />;
}

function MoonIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
    );
}

function PlayIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
    );
}

export default function WeeklyPage() {
    const [selectedDay, setSelectedDay] = useState('thu'); // Today (Apr 10)

    const dayData = mockWeeklySchedule[selectedDay];

    const statusLabel = {
        complete:  'Done',
        partial:   'Partial',
        rest:      'Rest',
        upcoming:  'Upcoming',
    };

    return (
        <div className="cd-page">
            <div className="cd-weekly-layout">
                {/* ── Left Sidebar ─── */}
                <div className="cd-day-list">
                    {DAY_ORDER.map(key => {
                        const day = mockWeeklySchedule[key];
                        const isActive = selectedDay === key;
                        return (
                            <div
                                key={key}
                                className={`cd-day-list-item${isActive ? ' cd-day-list-item--active' : ''}`}
                                onClick={() => setSelectedDay(key)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedDay(key)}
                                aria-selected={isActive}
                            >
                                <StatusDot status={day.status} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="cd-day-list-name">{day.label}</div>
                                    <div className="cd-day-list-date">{day.date}</div>
                                </div>
                                {day.isRest
                                    ? <span className="cd-day-list-rest-label">Rest</span>
                                    : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {statusLabel[day.status]}
                                      </span>
                                }
                            </div>
                        );
                    })}
                </div>

                {/* ── Right Detail Panel ─── */}
                <div className="cd-weekly-detail">
                    <div className="cd-weekly-detail-header">
                        <div>
                            <div className="cd-weekly-detail-day">{dayData.label}</div>
                            <div className="cd-weekly-detail-date">{dayData.date}</div>
                        </div>
                        {!dayData.isRest && (
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: '0.28rem 0.75rem',
                                    borderRadius: 'var(--radius-pill)',
                                    background: dayData.status === 'complete' ? 'rgba(22,163,74,0.09)' :
                                                dayData.status === 'partial'  ? 'rgba(217,119,6,0.09)'  :
                                                'rgba(62,71,114,0.08)',
                                    color: dayData.status === 'complete' ? '#16a34a' :
                                           dayData.status === 'partial'  ? '#d97706'  :
                                           'var(--primary)',
                                    border: '0.5px solid currentColor',
                                }}
                            >
                                {statusLabel[dayData.status]}
                            </span>
                        )}
                    </div>

                    {dayData.isRest ? (
                        <div className="cd-weekly-rest-block">
                            <div className="cd-weekly-rest-icon"><MoonIcon /></div>
                            <div className="cd-weekly-rest-title">Rest Day</div>
                            <div className="cd-weekly-rest-sub">Recovery is part of the process. Take it easy today.</div>
                        </div>
                    ) : (
                        <>
                            <WorkoutSummary
                                totalExercises={dayData.exercises.length}
                                estimatedTime={dayData.estimatedTime}
                                difficulty={dayData.difficulty}
                            />

                            <div className="cd-card-header" style={{ marginBottom: '0.25rem' }}>
                                <span className="cd-card-title">Exercises</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {dayData.exercises.length} total
                                </span>
                            </div>
                            <div className="cd-exercise-list">
                                {dayData.exercises.map(ex => (
                                    <ExerciseItem key={ex.id} exercise={ex} />
                                ))}
                            </div>

                            <div style={{ marginTop: '1.5rem', borderTop: '0.5px solid var(--border-light)', paddingTop: '1.25rem' }}>
                                <button
                                    className="ui-btn ui-btn--primary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={() => {}}
                                    disabled={dayData.status === 'complete'}
                                >
                                    <PlayIcon />
                                    {dayData.status === 'complete' ? 'Workout Complete' : 'Start Workout'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
