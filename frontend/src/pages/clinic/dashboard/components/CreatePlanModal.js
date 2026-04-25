import { useState } from 'react';
import { createRehabPlan, updateRehabPlan } from '../../../../api/rehabPlans';
import { INJURY_TYPES, getPresetWeekPlan } from '../data/predefinedExercises';
import { useToast } from '../../../../context/ToastContext';

const WEEK_DAYS = [
    { key: 'monday',    short: 'Mon' },
    { key: 'tuesday',   short: 'Tue' },
    { key: 'wednesday', short: 'Wed' },
    { key: 'thursday',  short: 'Thu' },
    { key: 'friday',    short: 'Fri' },
    { key: 'saturday',  short: 'Sat' },
    { key: 'sunday',    short: 'Sun' },
];

const EMPTY_EX = () => ({
    _key:                 Date.now() + Math.random(),
    name:                 '',
    sets:                 3,
    reps:                 15,
    notes:                '',
    alternative_exercise: '',
});

const EMPTY_WEEK = () =>
    Object.fromEntries(WEEK_DAYS.map(d => [d.key, []]));

const labelStyle = {
    display: 'block',
    fontSize: '0.73rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.3rem',
};

const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
};

const modalBase = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.75rem',
    width: '100%',
    border: '0.5px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
};

/* ── Date helpers ────────────────────────────────────────────── */
function localDateStr(d) {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return localDateStr(d);
}

function fmtDisplay(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Compute auto start/end dates for a new week plan.
 * - If no prior plans (or none with end_date): start today, end today + 6 days.
 * - Otherwise: start = latest plan's end_date + 1 day, end = start + 6 days.
 */
function computeAutoDateRange(priorPlans) {
    const today = localDateStr(new Date());
    if (!priorPlans || priorPlans.length === 0) {
        return { startDate: today, endDate: addDays(today, 6) };
    }
    const sorted = [...priorPlans].sort((a, b) => b.week_number - a.week_number);
    const latest = sorted.find(p => p.end_date);
    if (latest?.end_date) {
        const start = addDays(latest.end_date, 1);
        return { startDate: start, endDate: addDays(start, 6) };
    }
    return { startDate: today, endDate: addDays(today, 6) };
}

/* ── ExerciseRow ─────────────────────────────────────────────── */
function ExerciseRow({ ex, onChange, onRemove, locked }) {
    if (locked) {
        return (
            <div style={{ background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.75rem', border: '0.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>{ex.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.sets}×{ex.reps}</span>
            </div>
        );
    }
    return (
        <div style={{ background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '0.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Exercise Name *</label>
                    <input
                        className="ui-input"
                        style={{ fontSize: '0.83rem' }}
                        placeholder="e.g. Quad Sets"
                        value={ex.name}
                        onChange={e => onChange({ ...ex, name: e.target.value })}
                    />
                </div>
                <button type="button" onClick={onRemove}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', marginTop: '1.5rem', flexShrink: 0, display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.4rem' }}>
                <div>
                    <label style={labelStyle}>Sets *</label>
                    <input className="ui-input" style={{ fontSize: '0.82rem' }} type="number" min={1} max={20}
                        value={ex.sets} onChange={e => onChange({ ...ex, sets: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                    <label style={labelStyle}>Reps *</label>
                    <input className="ui-input" style={{ fontSize: '0.82rem' }} type="number" min={1} max={999}
                        value={ex.reps} onChange={e => onChange({ ...ex, reps: parseInt(e.target.value) || 1 })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Alternative</label>
                    <input className="ui-input" style={{ fontSize: '0.82rem' }} placeholder="Substitute if needed"
                        value={ex.alternative_exercise} onChange={e => onChange({ ...ex, alternative_exercise: e.target.value })} />
                </div>
            </div>
            <div>
                <label style={labelStyle}>Notes</label>
                <input className="ui-input" style={{ fontSize: '0.82rem' }} placeholder="Optional instructions"
                    value={ex.notes} onChange={e => onChange({ ...ex, notes: e.target.value })} />
            </div>
        </div>
    );
}

function buildWeekFromPlan(plan) {
    const week = EMPTY_WEEK();
    if (plan?.exercises_by_day) {
        WEEK_DAYS.forEach(d => {
            week[d.key] = (plan.exercises_by_day[d.key] ?? []).map(ex => ({
                _key:                 Date.now() + Math.random(),
                name:                 ex.name,
                sets:                 ex.sets,
                reps:                 ex.reps,
                notes:                ex.notes ?? '',
                alternative_exercise: ex.alternative_exercise ?? '',
            }));
        });
    }
    return week;
}

/* ─────────────────────────────────────────────────────────────────
   Props:
   - patient          { clientProfileId, name, condition }
   - existingPlan     plan object (edit mode) or null (create mode)
   - defaultWeekNum   number — pre-fill week_number for new plans
   - priorPlans       RehabPlan[] — existing plans for this client (used
                      to auto-calculate the next start date)
   - lockedDays       Set of day keys that are completed/locked
   - onClose          () => void
   - onSave           (result) => void   optional — called after save
──────────────────────────────────────────────────────────────────── */
export default function CreatePlanModal({ patient, existingPlan, defaultWeekNum, priorPlans = [], lockedDays = new Set(), onClose, onSave }) {
    const { addToast } = useToast();
    const isEdit       = !!existingPlan;

    // Auto-compute dates for new plans; preserve existing dates for edits
    const autoDates = !isEdit ? computeAutoDateRange(priorPlans) : null;

    const [injuryType,    setInjuryType]    = useState(existingPlan?.injury_type ?? '');
    const [weekNumber,    setWeekNumber]    = useState(existingPlan?.week_number ?? defaultWeekNum ?? 1);
    const [startDate,     setStartDate]     = useState(existingPlan?.start_date ?? autoDates?.startDate ?? '');
    const [endDate,       setEndDate]       = useState(existingPlan?.end_date   ?? autoDates?.endDate   ?? '');
    const [showDateEdit,  setShowDateEdit]  = useState(false);
    const [activeDay,     setActiveDay]     = useState('monday');
    const [byDay,         setByDay]         = useState(() => isEdit ? buildWeekFromPlan(existingPlan) : EMPTY_WEEK());
    const [submitting,    setSubmitting]    = useState(false);
    const [done,          setDone]          = useState(false);

    const isDayLocked = (dayKey) => lockedDays.has(dayKey);
    const dayExs      = byDay[activeDay] ?? [];
    const isLocked    = isDayLocked(activeDay);

    const updateEx = (key, updated) =>
        setByDay(prev => ({ ...prev, [activeDay]: prev[activeDay].map(e => e._key === key ? { ...updated, _key: key } : e) }));

    const removeEx = (key) =>
        setByDay(prev => ({ ...prev, [activeDay]: prev[activeDay].filter(e => e._key !== key) }));

    const addEx = () =>
        setByDay(prev => ({ ...prev, [activeDay]: [...prev[activeDay], EMPTY_EX()] }));

    /* Load a full structured week preset — exercises vary by weekNumber (phase-based) */
    const loadPreset = () => {
        if (!injuryType) return;
        const weekPlan = getPresetWeekPlan(injuryType, weekNumber);
        if (!weekPlan) return;
        const newByDay = {};
        WEEK_DAYS.forEach(d => {
            newByDay[d.key] = isDayLocked(d.key)
                ? byDay[d.key]               // preserve locked days
                : (weekPlan[d.key] ?? []);
        });
        setByDay(newByDay);
    };

    const copyFromDay = (sourceDay) => {
        if (!sourceDay || sourceDay === activeDay) return;
        const source = byDay[sourceDay];
        if (source.length === 0) { addToast('Source day has no exercises.', 'warning'); return; }
        setByDay(prev => ({
            ...prev,
            [activeDay]: source.map(e => ({ ...e, _key: Date.now() + Math.random() })),
        }));
    };

    const totalExCount = Object.values(byDay).reduce((acc, exs) => acc + exs.length, 0);

    const isValid = () => {
        if (!injuryType) return false;
        if (totalExCount === 0) return false;
        return Object.values(byDay).every(exs =>
            exs.every(e => e.name.trim() && e.sets >= 1 && e.reps >= 1)
        );
    };

    const handleSubmit = async () => {
        if (!isValid()) {
            addToast('Select an injury type and fill in all exercise fields.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            const exercises = Object.entries(byDay).flatMap(([day, exs]) =>
                exs.map(e => ({
                    day_of_week:          day,
                    name:                 e.name.trim(),
                    sets:                 e.sets,
                    reps:                 e.reps,
                    notes:                e.notes.trim() || null,
                    alternative_exercise: e.alternative_exercise.trim() || null,
                }))
            );
            const planMeta = {
                injury_type:  injuryType,
                week_number:  weekNumber,
                start_date:   startDate || null,
                end_date:     endDate   || null,
                exercises,
            };
            let result;
            if (isEdit) {
                result = await updateRehabPlan(existingPlan.id, planMeta);
            } else {
                result = await createRehabPlan({ client_profile_id: patient.clientProfileId, ...planMeta });
            }
            if (onSave) onSave(result.data);
            setDone(true);
        } catch (err) {
            const errs = err.response?.data?.errors;
            const msg = errs
                ? Object.values(errs).flat().join(' ')
                : (err.response?.data?.message ?? `Failed to ${isEdit ? 'save' : 'create'} plan.`);
            addToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div style={overlayStyle} onClick={onClose}>
                <div style={{ ...modalBase, maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#15803d' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.4rem' }}>
                        {isEdit ? 'Plan Saved' : `Week ${weekNumber} Created`}
                    </p>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        {isEdit
                            ? `Changes saved for ${patient.name}.`
                            : `${totalExCount} exercises across the week for ${patient.name}.`}
                    </p>
                    <button className="cld-btn-review" style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }} onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    const otherDaysWithExercises = WEEK_DAYS.filter(d => d.key !== activeDay && byDay[d.key].length > 0);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalBase, maxWidth: 680 }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.1rem' }}>
                            {isEdit ? `Edit Week ${existingPlan.week_number} Plan` : 'Create Weekly Rehab Plan'}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            For {patient.name} · {patient.condition} · {totalExCount} exercise{totalExCount !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Meta row: injury type + week number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>Injury Type *</label>
                        <select className="ui-select" value={injuryType} onChange={e => setInjuryType(e.target.value)}>
                            <option value="">Select injury type…</option>
                            {INJURY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div style={{ minWidth: 80 }}>
                        <label style={labelStyle}>Week #</label>
                        <input className="ui-input" style={{ fontSize: '0.83rem' }} type="number" min={1} max={52}
                            value={weekNumber} onChange={e => setWeekNumber(parseInt(e.target.value) || 1)} />
                    </div>
                </div>

                {/* Date row — auto-scheduled display with optional manual override */}
                <div style={{ marginBottom: '1rem', padding: '0.55rem 0.75rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {showDateEdit ? (
                        <>
                            <input className="ui-input" type="date" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', minWidth: 130 }}
                                value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>→</span>
                            <input className="ui-input" type="date" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', minWidth: 130 }}
                                value={endDate} onChange={e => setEndDate(e.target.value)} />
                            <button onClick={() => setShowDateEdit(false)}
                                style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Done
                            </button>
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {startDate && endDate
                                    ? <>{fmtDisplay(startDate)} <span style={{ color: 'var(--text-muted)' }}>→</span> {fmtDisplay(endDate)}</>
                                    : <span style={{ color: 'var(--text-muted)' }}>No dates set</span>
                                }
                            </span>
                            {!isEdit && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'rgba(62,71,114,0.08)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                                    Auto-scheduled
                                </span>
                            )}
                            <button onClick={() => setShowDateEdit(true)}
                                style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Edit dates
                            </button>
                        </>
                    )}
                </div>

                {/* Day tabs */}
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    {WEEK_DAYS.map(d => {
                        const count    = byDay[d.key].length;
                        const isActive = activeDay === d.key;
                        const locked   = isDayLocked(d.key);
                        return (
                            <button
                                key={d.key}
                                type="button"
                                onClick={() => setActiveDay(d.key)}
                                style={{
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.78rem',
                                    fontWeight: isActive ? 700 : 500,
                                    cursor: 'pointer',
                                    border: isActive ? '1.5px solid var(--primary)' : '0.5px solid var(--border)',
                                    background: isActive ? 'var(--primary)' : 'var(--surface-dim)',
                                    color: isActive ? '#fff' : 'var(--text-secondary)',
                                    transition: 'all var(--transition)',
                                    position: 'relative',
                                    opacity: locked ? 0.75 : 1,
                                }}
                            >
                                {d.short}
                                {locked && (
                                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#16a34a', borderRadius: '50%', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                    </span>
                                )}
                                {!locked && count > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -5, right: -5,
                                        background: isActive ? '#fff' : 'var(--primary)',
                                        color: isActive ? 'var(--primary)' : '#fff',
                                        borderRadius: '50%', width: 14, height: 14,
                                        fontSize: '0.6rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Day toolbar */}
                {!isLocked && (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <button type="button" className="cld-btn-action"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                            disabled={!injuryType} onClick={loadPreset}>
                            Load Full Week Preset
                        </button>
                        {otherDaysWithExercises.length > 0 && (
                            <select className="ui-select"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                defaultValue=""
                                onChange={e => { copyFromDay(e.target.value); e.target.value = ''; }}>
                                <option value="" disabled>Copy from…</option>
                                {otherDaysWithExercises.map(d => (
                                    <option key={d.key} value={d.key}>{d.short} ({byDay[d.key].length})</option>
                                ))}
                            </select>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            {dayExs.length} exercise{dayExs.length !== 1 ? 's' : ''} this day
                        </span>
                    </div>
                )}

                {isLocked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(22,163,74,0.07)', borderRadius: 'var(--radius-md)', border: '0.5px solid rgba(22,163,74,0.2)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                            This day is locked — client has completed it
                        </span>
                    </div>
                )}

                {/* Exercise list for active day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '30vh', overflowY: 'auto', paddingRight: '0.15rem', marginBottom: '0.75rem' }}>
                    {dayExs.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', border: '0.5px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                            {isLocked ? 'No exercises recorded for this day.' : 'Rest day · add exercises below or load a full preset'}
                        </div>
                    ) : (
                        dayExs.map(ex => (
                            <ExerciseRow key={ex._key} ex={ex} locked={isLocked}
                                onChange={updated => updateEx(ex._key, updated)}
                                onRemove={() => removeEx(ex._key)} />
                        ))
                    )}
                </div>

                {/* Add exercise */}
                {!isLocked && (
                    <button type="button" className="cld-btn-action"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.78rem', marginBottom: '1rem' }}
                        onClick={addEx}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '0.3rem' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Exercise to {WEEK_DAYS.find(d => d.key === activeDay)?.short}
                    </button>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="cld-btn-action" style={{ flex: 1, justifyContent: 'center', padding: '0.6rem' }} onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="cld-btn-approve"
                        style={{ flex: 2, justifyContent: 'center', padding: '0.6rem', opacity: (!isValid() || submitting) ? 0.6 : 1 }}
                        onClick={handleSubmit} disabled={!isValid() || submitting}>
                        {submitting
                            ? (isEdit ? 'Saving…' : 'Creating…')
                            : isEdit
                                ? `Save Week ${weekNumber} (${totalExCount} exercises)`
                                : `Create Week ${weekNumber} (${totalExCount} exercises)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
