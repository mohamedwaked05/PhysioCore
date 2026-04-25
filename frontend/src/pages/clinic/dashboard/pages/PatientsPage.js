import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClinicProfile, getClinicAccessRequests } from '../../../../api/clinic';
import { getPatientRehabPlan } from '../../../../api/rehabPlans';
import CreatePlanModal from '../components/CreatePlanModal';
import ChatBox from '../../../../components/chat/ChatBox';
import Skeleton from '../../../../components/ui/Skeleton';
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

function toPatient(r) {
    const u = r.client_profile?.user ?? {};
    return {
        id:              r.id,
        clientProfileId: r.client_profile_id,
        userId:          u.id,
        name:            `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Unknown',
        initials:        initials(u.first_name, u.last_name),
        condition:       r.client_profile?.condition_summary ?? '—',
        payment:         r.payment_preference ?? '—',
        since:           sinceDate(r.updated_at ?? r.created_at),
    };
}

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

export default function PatientsPage() {
    const [patients, setPatients]       = useState([]);
    const [clinicId, setClinicId]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [planPatient, setPlanPatient] = useState(null);
    const [existingPlan, setExistingPlan] = useState(null);
    const [planLoadingId, setPlanLoadingId] = useState(null);
    const [chatPatient, setChatPatient] = useState(null);

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

    /* Build locked days set from plan's progress_by_day */
    const lockedDays = new Set(
        Object.entries(existingPlan?.progress_by_day ?? {})
            .filter(([, v]) => v.completed)
            .map(([day]) => day)
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
                    lockedDays={lockedDays}
                    onClose={() => { setPlanPatient(null); setExistingPlan(null); }}
                    onSave={() => {}}
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
