import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClinicProfile, getClinicAccessRequests } from '../../../../api/clinic';
import { createRehabPlan, updateRehabPlan, getPatientRehabPlan } from '../../../../api/rehabPlans';
import { INJURY_TYPES, getPresetExercises } from '../data/predefinedExercises';
import ChatBox from '../../../../components/chat/ChatBox';
import Skeleton from '../../../../components/ui/Skeleton';
import { useToast } from '../../../../context/ToastContext';
import '../../../../styles/chat.css';

function initials(first, last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function sinceDate(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
}

/* ── Normalize approved access request → patient shape ─────── */
function toPatient(r) {
    const u = r.client_profile?.user ?? {};
    return {
        id:              r.id,                              // access request id (for keys)
        clientProfileId: r.client_profile_id,              // for feedback route
        userId:          u.id,                              // for chat
        name:            `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown',
        initials:        initials(u.first_name, u.last_name),
        condition:       r.client_profile?.condition_summary ?? '—',
        payment:         r.payment_preference ?? '—',
        since:           sinceDate(r.updated_at ?? r.created_at),
    };
}

/* ── Plan Modal helpers ──────────────────────────────────────── */

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

function ExerciseRow({ ex, onChange, onRemove, canRemove }) {
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
                {canRemove && (
                    <button type="button" onClick={onRemove}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', marginTop: '1.5rem', flexShrink: 0, display: 'flex' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                )}
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

/* ── Create / Edit Plan Modal (Weekly) ──────────────────────── */
function CreatePlanModal({ patient, onClose, existingPlan }) {
    const { addToast }             = useToast();
    const isEdit                   = !!existingPlan;
    const [injuryType, setInjuryType] = useState(existingPlan?.injury_type ?? '');
    const [activeDay, setActiveDay]   = useState('monday');
    const [byDay, setByDay]           = useState(() => isEdit ? buildWeekFromPlan(existingPlan) : EMPTY_WEEK());
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]             = useState(false);

    const dayExs = byDay[activeDay] ?? [];

    const updateEx = (key, updated) =>
        setByDay(prev => ({ ...prev, [activeDay]: prev[activeDay].map(e => e._key === key ? { ...updated, _key: key } : e) }));

    const removeEx = (key) =>
        setByDay(prev => ({ ...prev, [activeDay]: prev[activeDay].filter(e => e._key !== key) }));

    const addEx = () =>
        setByDay(prev => ({ ...prev, [activeDay]: [...prev[activeDay], EMPTY_EX()] }));

    const loadPreset = () => {
        if (!injuryType) return;
        const preset = getPresetExercises(injuryType);
        if (preset.length > 0) setByDay(prev => ({ ...prev, [activeDay]: preset }));
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
                    day_of_week:           day,
                    name:                  e.name.trim(),
                    sets:                  e.sets,
                    reps:                  e.reps,
                    notes:                 e.notes.trim() || null,
                    alternative_exercise:  e.alternative_exercise.trim() || null,
                }))
            );
            if (isEdit) {
                await updateRehabPlan(existingPlan.id, { injury_type: injuryType, exercises });
            } else {
                await createRehabPlan({ client_profile_id: patient.clientProfileId, injury_type: injuryType, exercises });
            }
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
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.4rem' }}>{isEdit ? 'Plan Saved' : 'Weekly Plan Created'}</p>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        {isEdit ? `Changes saved for ${patient.name}.` : `${totalExCount} exercises across the week for ${patient.name}.`}
                    </p>
                    <button className="cld-btn-review" style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }} onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    const otherDaysWithExercises = WEEK_DAYS.filter(d => d.key !== activeDay && byDay[d.key].length > 0);

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ ...modalBase, maxWidth: 660 }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.1rem' }}>{isEdit ? 'Edit Weekly Rehab Plan' : 'Create Weekly Rehab Plan'}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>For {patient.name} · {patient.condition} · {totalExCount} exercise{totalExCount !== 1 ? 's' : ''} total</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Injury type */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Injury Type *</label>
                    <select className="ui-select" value={injuryType} onChange={e => setInjuryType(e.target.value)}>
                        <option value="">Select injury type…</option>
                        {INJURY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {/* Day tabs */}
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    {WEEK_DAYS.map(d => {
                        const count = byDay[d.key].length;
                        const isActive = activeDay === d.key;
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
                                }}
                            >
                                {d.short}
                                {count > 0 && (
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
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="cld-btn-action"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                        disabled={!injuryType} onClick={loadPreset}>
                        Load Preset
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

                {/* Exercise list for active day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '32vh', overflowY: 'auto', paddingRight: '0.15rem', marginBottom: '0.75rem' }}>
                    {dayExs.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', border: '0.5px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                            Rest day or add exercises below
                        </div>
                    ) : (
                        dayExs.map(ex => (
                            <ExerciseRow key={ex._key} ex={ex}
                                onChange={updated => updateEx(ex._key, updated)}
                                onRemove={() => removeEx(ex._key)}
                                canRemove={true} />
                        ))
                    )}
                </div>

                {/* Add exercise */}
                <button type="button" className="cld-btn-action"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.78rem', marginBottom: '1rem' }}
                    onClick={addEx}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '0.3rem' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Exercise to {WEEK_DAYS.find(d => d.key === activeDay)?.short}
                </button>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="cld-btn-action" style={{ flex: 1, justifyContent: 'center', padding: '0.6rem' }} onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="cld-btn-approve"
                        style={{ flex: 2, justifyContent: 'center', padding: '0.6rem', opacity: (!isValid() || submitting) ? 0.6 : 1 }}
                        onClick={handleSubmit} disabled={!isValid() || submitting}>
                        {submitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? `Save Changes (${totalExCount} exercises)` : `Create Plan (${totalExCount} exercises)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Chat Modal ─────────────────────────────────────────────── */
function ChatModal({ patient, clinicId, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 460, border: '0.5px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)' }}>
                    <div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.1rem' }}>{patient.name}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{patient.condition}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <ChatBox
                    context="treatment"
                    referenceId={clinicId}
                    receiverId={patient.userId}
                    withUserId={patient.userId}
                />
            </div>
        </div>
    );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function PatientsPage() {
    const [patients, setPatients]     = useState([]);
    const [clinicId, setClinicId]     = useState(null);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [planPatient, setPlanPatient]   = useState(null);
    const [existingPlan, setExistingPlan] = useState(null);
    const [planLoadingId, setPlanLoadingId] = useState(null);
    const [chatPatient, setChatPatient]   = useState(null);

    useEffect(() => {
        Promise.all([getClinicProfile(), getClinicAccessRequests()])
            .then(([profileRes, requestsRes]) => {
                setClinicId(profileRes.data.id);
                const approved = requestsRes.data
                    .filter(r => r.status === 'approved')
                    .map(toPatient);
                setPatients(approved);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.condition.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="cld-page">
                <div className="cld-page-header">
                    <Skeleton height="22px" width="160px" radius="6px" />
                    <Skeleton height="14px" width="280px" radius="6px" style={{ marginTop: '0.4rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height="72px" radius="10px" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Active Patients</h2>
                <p className="cld-page-subtitle">{patients.length} patient{patients.length !== 1 ? 's' : ''} under active treatment.</p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', maxWidth: 320 }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    </span>
                    <input
                        className="ui-input"
                        style={{ paddingLeft: '2.25rem' }}
                        placeholder="Search patients..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="client-card" style={{ padding: 0, overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <div className="cld-empty" style={{ padding: '2.5rem' }}>
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">
                            {patients.length === 0 ? 'No approved patients yet.' : 'No patients match your search.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {filtered.map((p, idx) => (
                            <div
                                key={p.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem 1.35rem',
                                    borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--border-light)' : 'none',
                                    transition: 'background var(--transition)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-dim)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                            >
                                <div className="cld-patient-avatar">{p.initials}</div>

                                <div className="cld-patient-info" style={{ flex: 1 }}>
                                    <p className="cld-patient-name">{p.name}</p>
                                    <p className="cld-patient-condition">{p.condition}</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        {p.payment} · Approved {p.since}
                                    </p>
                                </div>

                                <div className="cld-patient-actions">
                                    <button
                                        className="cld-btn-action"
                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', opacity: planLoadingId === p.id ? 0.6 : 1 }}
                                        disabled={planLoadingId === p.id}
                                        onClick={async () => {
                                            setPlanLoadingId(p.id);
                                            try {
                                                const res = await getPatientRehabPlan(p.clientProfileId);
                                                setExistingPlan(res.data ?? null);
                                            } catch {
                                                setExistingPlan(null);
                                            } finally {
                                                setPlanLoadingId(null);
                                                setPlanPatient(p);
                                            }
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                                        </svg>
                                        {planLoadingId === p.id ? 'Loading…' : 'Plan'}
                                    </button>
                                    <button
                                        className="cld-btn-action"
                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                        onClick={() => setChatPatient(p)}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                        </svg>
                                        Message
                                    </button>
                                    <Link
                                        to={`${p.clientProfileId}/feedback`}
                                        className="cld-btn-review"
                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                        </svg>
                                        Feedback
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {planPatient && (
                <CreatePlanModal
                    patient={planPatient}
                    existingPlan={existingPlan}
                    onClose={() => { setPlanPatient(null); setExistingPlan(null); }}
                />
            )}

            {chatPatient && clinicId && (
                <ChatModal
                    patient={chatPatient}
                    clinicId={clinicId}
                    onClose={() => setChatPatient(null)}
                />
            )}
        </div>
    );
}
