import { useEffect, useState, useCallback } from 'react';
import { getClinicPlans, deleteRehabPlan } from '../../../../api/rehabPlans';
import CreatePlanModal from '../components/CreatePlanModal';
import Skeleton from '../../../../components/ui/Skeleton';
import { useToast } from '../../../../context/ToastContext';
import GenderAvatar from '../../../../components/ui/GenderAvatar';

const WEEK_DAYS = [
    { key: 'monday',    label: 'Monday',    short: 'Mon' },
    { key: 'tuesday',   label: 'Tuesday',   short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday',  label: 'Thursday',  short: 'Thu' },
    { key: 'friday',    label: 'Friday',    short: 'Fri' },
    { key: 'saturday',  label: 'Saturday',  short: 'Sat' },
    { key: 'sunday',    label: 'Sunday',    short: 'Sun' },
];

const INJURY_LABELS = {
    acl:                  'ACL Tear',
    lower_back:           'Lower Back',
    shoulder_impingement: 'Shoulder Impingement',
    hip_flexor:           'Hip Flexor',
    cervical_spine:       'Cervical Spine',
    ankle:                'Ankle',
    hamstring:            'Hamstring',
    knee_osteoarthritis:  'Knee OA',
};

function formatDateRange(start, end) {
    if (!start && !end) return null;
    const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `From ${fmt(start)}`;
    return `Until ${fmt(end)}`;
}

/* ── Single week plan card ─────────────────────────────────── */
function PlanWeekCard({ plan, onEdit, onDelete }) {
    const { addToast } = useToast();
    const [activeDay,     setActiveDay]     = useState(() => {
        const today = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
        const hasExercises = (plan.exercises_by_day?.[today] ?? []).length > 0;
        return hasExercises ? today : (WEEK_DAYS.find(d => (plan.exercises_by_day?.[d.key] ?? []).length > 0)?.key ?? 'monday');
    });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting,      setDeleting]      = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteRehabPlan(plan.id);
            onDelete(plan.id);
        } catch {
            addToast('Failed to delete plan.', 'error');
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const progress    = plan.progress_by_day ?? {};
    const exercises   = plan.exercises_by_day?.[activeDay] ?? [];
    const dayProgress = progress[activeDay] ?? { completed: false };
    const dateRange   = formatDateRange(plan.start_date, plan.end_date);
    const injuryLabel = INJURY_LABELS[plan.injury_type] ?? plan.injury_type?.replace(/_/g, ' ') ?? '—';

    const lockedDayCount = Object.values(progress).filter(p => p.completed).length;

    return (
        <div style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-sm)',
        }}>
            {/* Week header */}
            <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                    {/* Identity: "Week N · Apr 19 – Apr 25" */}
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                        Week {plan.week_number}
                        {dateRange && (
                            <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                · {dateRange}
                            </span>
                        )}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-dim)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)', border: '0.5px solid var(--border-light)' }}>
                        {injuryLabel}
                    </span>
                    {lockedDayCount > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            {lockedDayCount} day{lockedDayCount !== 1 ? 's' : ''} completed
                        </span>
                    )}
                </div>
                {confirmDelete ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Archive Week {plan.week_number}?</span>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, opacity: deleting ? 0.6 : 1 }}
                        >
                            {deleting ? '…' : 'Archive'}
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleting}
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: 'var(--surface-dim)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button
                            className="cld-btn-action"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                            onClick={() => onEdit(plan)}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '0.3rem' }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '0.5px solid rgba(220,38,38,0.25)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Day selector */}
            <div style={{ padding: '0.6rem 1rem 0', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {WEEK_DAYS.map(d => {
                    const exCount  = (plan.exercises_by_day?.[d.key] ?? []).length;
                    const isActive = activeDay === d.key;
                    const locked   = progress[d.key]?.completed;
                    return (
                        <button
                            key={d.key}
                            onClick={() => setActiveDay(d.key)}
                            style={{
                                padding: '0.22rem 0.55rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                border: isActive ? '1.5px solid var(--primary)' : '0.5px solid var(--border)',
                                background: isActive ? 'var(--primary)' : locked ? 'rgba(22,163,74,0.06)' : 'var(--surface-dim)',
                                color: isActive ? '#fff' : locked ? '#16a34a' : exCount > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                                transition: 'all var(--transition)',
                            }}
                        >
                            {d.short}
                            {locked ? ' ✓' : exCount > 0 ? ` (${exCount})` : ''}
                        </button>
                    );
                })}
            </div>

            {/* Exercise list for active day */}
            <div style={{ padding: '0.6rem 1rem 0.85rem' }}>
                {dayProgress.completed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Client completed this day
                    </div>
                )}
                {exercises.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0', fontStyle: 'italic' }}>Rest day — no exercises</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {exercises.map((ex, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-dim)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-light)' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: 16, textAlign: 'right' }}>{i + 1}.</span>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text)', flex: 1, fontWeight: 500 }}>{ex.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{ex.sets}×{ex.reps}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Client row (expandable) ───────────────────────────────── */
function ClientPlanRow({ entry, onPlanSaved, onPlanDeleted }) {
    const [open,      setOpen]      = useState(false);
    const [editPlan,  setEditPlan]  = useState(null);
    const [addWeek,   setAddWeek]   = useState(false);

    const { client, plans } = entry;
    const nextWeekNum = plans.length > 0 ? Math.max(...plans.map(p => p.week_number)) + 1 : 1;

    const lockedDays = (plan) => new Set(
        Object.entries(plan?.progress_by_day ?? {})
            .filter(([, v]) => v.completed)
            .map(([day]) => day)
    );

    const patient = {
        clientProfileId: client.id,
        name:            client.name,
        condition:       client.condition_summary,
    };

    return (
        <>
            {/* Client row */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.9rem 1.25rem',
                    cursor: 'pointer',
                    transition: 'background var(--transition)',
                }}
                onClick={() => setOpen(o => !o)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
            >
                <GenderAvatar gender={client.gender} size={36} />
                <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.1rem' }}>{client.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.condition_summary} · {plans.length} week plan{plans.length !== 1 ? 's' : ''}</p>
                </div>
                <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
                    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </div>

            {/* Expanded plan grid */}
            {open && (
                <div style={{ padding: '0.85rem 1.25rem 1rem', background: 'var(--surface-dim)' }}>
                    {plans.length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>No plans yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
                            {plans.map(plan => (
                                <PlanWeekCard
                                    key={plan.id}
                                    plan={plan}
                                    onEdit={p => setEditPlan(p)}
                                    onDelete={planId => onPlanDeleted(entry.client_profile_id, planId)}
                                />
                            ))}
                        </div>
                    )}
                    <button
                        className="cld-btn-approve"
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                        onClick={e => { e.stopPropagation(); setAddWeek(true); }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '0.35rem' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Week {nextWeekNum}
                    </button>
                </div>
            )}

            {/* Edit modal */}
            {editPlan && (
                <CreatePlanModal
                    patient={patient}
                    existingPlan={editPlan}
                    lockedDays={lockedDays(editPlan)}
                    onClose={() => setEditPlan(null)}
                    onSave={() => { setEditPlan(null); onPlanSaved(); }}
                />
            )}

            {/* Add week modal */}
            {addWeek && (
                <CreatePlanModal
                    patient={patient}
                    existingPlan={null}
                    defaultWeekNum={nextWeekNum}
                    priorPlans={plans}
                    lockedDays={new Set()}
                    onClose={() => setAddWeek(false)}
                    onSave={() => { setAddWeek(false); onPlanSaved(); }}
                />
            )}
        </>
    );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function PlansPage() {
    const [entries,  setEntries]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');

    const load = useCallback(() => {
        setLoading(true);
        getClinicPlans()
            .then(res => setEntries(res.data ?? []))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // Optimistic plan removal — no full reload needed
    const handlePlanDeleted = useCallback((clientProfileId, planId) => {
        setEntries(prev => prev
            .map(entry => {
                if (entry.client_profile_id !== clientProfileId) return entry;
                return { ...entry, plans: entry.plans.filter(p => p.id !== planId) };
            })
            // Remove the client row if they have no plans left
            .filter(entry => entry.plans.length > 0)
        );
    }, []);

    const filtered = entries.filter(e =>
        e.client.name.toLowerCase().includes(search.toLowerCase()) ||
        e.client.condition_summary.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Rehab Plans</h2>
                <p className="cld-page-subtitle">
                    {entries.length} client{entries.length !== 1 ? 's' : ''} with active plans.
                </p>
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
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                        {[1, 2, 3].map(i => <Skeleton key={i} height="64px" radius="10px" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="cld-empty" style={{ padding: '2.5rem' }}>
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">
                            {entries.length === 0 ? 'No rehab plans yet. Create one from the Patients page.' : 'No patients match your search.'}
                        </p>
                    </div>
                ) : (
                    filtered.map(entry => (
                        <ClientPlanRow
                            key={entry.client_profile_id}
                            entry={entry}
                            onPlanSaved={load}
                            onPlanDeleted={handlePlanDeleted}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
