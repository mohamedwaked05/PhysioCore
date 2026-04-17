import { useState, useEffect } from 'react';
import ExerciseItem from '../components/ExerciseItem';
import WorkoutSummary from '../components/WorkoutSummary';
import Skeleton from '../../../../components/ui/Skeleton';
import { getAccessRequests } from '../../../../api/client';
import { getMyRehabPlan } from '../../../../api/rehabPlans';

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const TODAY_DAY = DAY_NAMES[new Date().getDay()];

const WEEK_DAYS = [
    { key: 'monday',    label: 'Monday',    short: 'M' },
    { key: 'tuesday',   label: 'Tuesday',   short: 'T' },
    { key: 'wednesday', label: 'Wednesday', short: 'W' },
    { key: 'thursday',  label: 'Thursday',  short: 'T' },
    { key: 'friday',    label: 'Friday',    short: 'F' },
    { key: 'saturday',  label: 'Saturday',  short: 'S' },
    { key: 'sunday',    label: 'Sunday',    short: 'S' },
];

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
    };
}

function dayStatus(exercises, progress) {
    if (exercises.length === 0) return 'rest';
    if (progress?.completed) return 'complete';
    return 'upcoming';
}

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

const statusLabel = { complete: 'Done', upcoming: 'Pending', rest: 'Rest' };

const statusBadgeStyle = (status) => ({
    fontSize: '0.75rem', fontWeight: 600,
    padding: '0.28rem 0.75rem',
    borderRadius: 'var(--radius-pill)',
    background: status === 'complete' ? 'rgba(22,163,74,0.09)' : 'rgba(62,71,114,0.08)',
    color:      status === 'complete' ? '#16a34a' : 'var(--primary)',
    border: '0.5px solid currentColor',
});

export default function WeeklyPage() {
    const [selectedDay,  setSelectedDay]  = useState(TODAY_DAY);
    const [plan,         setPlan]         = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [clinicId,     setClinicId]     = useState('');
    const [clinics,      setClinics]      = useState([]);

    // Fetch approved clinics → then load plan
    useEffect(() => {
        getAccessRequests()
            .then(res => {
                const approved = res.data
                    .filter(r => r.status === 'approved' && r.clinic)
                    .map(r => r.clinic);
                setClinics(approved);
                if (approved.length >= 1) setClinicId(String(approved[0].id));
                else setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!clinicId) return;
        setLoading(true);
        getMyRehabPlan(clinicId)
            .then(res => setPlan(res.data ?? null))
            .catch(() => setPlan(null))
            .finally(() => setLoading(false));
    }, [clinicId]);

    const exercisesByDay = plan?.exercises_by_day ?? {};
    const progress       = plan?.progress ?? {};

    const selectedExercises = (exercisesByDay[selectedDay] ?? []).map(mapExercise);
    const selectedProgress  = progress[selectedDay];
    const selectedStatus    = dayStatus(exercisesByDay[selectedDay] ?? [], selectedProgress);
    const selectedLabel     = WEEK_DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

    const injuryLabel = plan?.injury_type
        ? plan.injury_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : null;

    if (loading) {
        return (
            <div className="cd-page">
                <div className="cd-weekly-layout">
                    <div className="cd-day-list">
                        {WEEK_DAYS.map(d => <Skeleton key={d.key} height="52px" radius="8px" style={{ marginBottom: '0.35rem' }} />)}
                    </div>
                    <div className="cd-weekly-detail">
                        <Skeleton height="28px" width="140px" radius="6px" />
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[1,2,3].map(i => <Skeleton key={i} height="56px" radius="8px" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="cd-page">
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {clinics.length === 0
                        ? 'You need an approved clinic to view your weekly plan.'
                        : 'Your clinic has not assigned a rehab plan yet.'}
                </div>
            </div>
        );
    }

    return (
        <div className="cd-page">
            {/* Clinic selector */}
            {clinics.length > 1 && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <select className="ui-select" value={clinicId} onChange={e => setClinicId(e.target.value)}>
                        {clinics.map(c => (
                            <option key={c.id} value={c.id}>{c.commercial_name || c.legal_name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="cd-weekly-layout">
                {/* ── Left Sidebar ─── */}
                <div className="cd-day-list">
                    {WEEK_DAYS.map(d => {
                        const dayExs   = exercisesByDay[d.key] ?? [];
                        const dayProg  = progress[d.key];
                        const status   = dayStatus(dayExs, dayProg);
                        const isActive = selectedDay === d.key;
                        const isToday  = d.key === TODAY_DAY;
                        return (
                            <div
                                key={d.key}
                                className={`cd-day-list-item${isActive ? ' cd-day-list-item--active' : ''}`}
                                onClick={() => setSelectedDay(d.key)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedDay(d.key)}
                                aria-selected={isActive}
                            >
                                <StatusDot status={status} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="cd-day-list-name">
                                        {d.label}
                                        {isToday && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--primary)', verticalAlign: 'middle' }}>TODAY</span>}
                                    </div>
                                    <div className="cd-day-list-date">
                                        {dayExs.length > 0 ? `${dayExs.length} exercise${dayExs.length !== 1 ? 's' : ''}` : 'Rest'}
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: status === 'complete' ? '#16a34a' : 'var(--text-muted)', fontWeight: status === 'complete' ? 600 : 400 }}>
                                    {statusLabel[status]}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Right Detail Panel ─── */}
                <div className="cd-weekly-detail">
                    <div className="cd-weekly-detail-header">
                        <div>
                            <div className="cd-weekly-detail-day">
                                {selectedLabel}
                                {selectedDay === TODAY_DAY && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', verticalAlign: 'middle' }}>Today</span>
                                )}
                            </div>
                            {injuryLabel && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{injuryLabel}</div>
                            )}
                        </div>
                        {selectedStatus !== 'rest' && (
                            <span style={statusBadgeStyle(selectedStatus)}>
                                {statusLabel[selectedStatus]}
                            </span>
                        )}
                    </div>

                    {selectedStatus === 'rest' ? (
                        <div className="cd-weekly-rest-block">
                            <div className="cd-weekly-rest-icon"><MoonIcon /></div>
                            <div className="cd-weekly-rest-title">Rest Day</div>
                            <div className="cd-weekly-rest-sub">Recovery is part of the process. Take it easy today.</div>
                        </div>
                    ) : (
                        <>
                            <WorkoutSummary
                                totalExercises={selectedExercises.length}
                                estimatedTime={`~${selectedExercises.length * 3} min`}
                                difficulty={injuryLabel ?? '—'}
                            />

                            <div className="cd-card-header" style={{ marginBottom: '0.25rem' }}>
                                <span className="cd-card-title">Exercises</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {selectedExercises.length} total
                                </span>
                            </div>

                            <div className="cd-exercise-list">
                                {selectedExercises.map(ex => (
                                    <ExerciseItem
                                        key={ex.id}
                                        exercise={ex}
                                        completed={selectedProgress?.completed ?? false}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
