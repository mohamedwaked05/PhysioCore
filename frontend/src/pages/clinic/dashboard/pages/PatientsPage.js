import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockActivePatients } from '../data/mockData';

function AdherenceLevel(pct) {
    if (pct >= 85) return 'high';
    if (pct >= 65) return 'medium';
    return 'low';
}

function CreatePlanModal({ patient, onClose }) {
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }} onClick={onClose}>
                <div
                    style={{
                        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                        padding: '2rem', maxWidth: 380, width: '100%', textAlign: 'center',
                        border: '0.5px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem', color: '#15803d',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.4rem' }}>Plan Created</p>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        A new treatment plan has been created for {patient.name}.
                    </p>
                    <button className="cld-btn-review" style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={onClose}>
            <div
                style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    padding: '1.75rem', maxWidth: 420, width: '100%',
                    border: '0.5px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.15rem' }}>Create Treatment Plan</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>For {patient.name} · {patient.condition}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Plan Name</label>
                        <input
                            className="ui-input"
                            placeholder={`Rehabilitation Plan — ${patient.condition}`}
                            defaultValue={`Rehabilitation Plan — ${patient.condition}`}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Duration</label>
                        <select className="ui-select">
                            <option>4 weeks</option>
                            <option>6 weeks</option>
                            <option>8 weeks</option>
                            <option>12 weeks</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Notes</label>
                        <textarea className="ui-textarea" rows={3} placeholder="Add treatment notes or goals..." style={{ resize: 'vertical' }}/>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="cld-btn-action" style={{ flex: 1, justifyContent: 'center', padding: '0.6rem' }} onClick={onClose}>Cancel</button>
                    <button className="cld-btn-approve" style={{ flex: 2, justifyContent: 'center', padding: '0.6rem' }} onClick={() => setSubmitted(true)}>
                        Create Plan
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PatientsPage() {
    const [search, setSearch] = useState('');
    const [planPatient, setPlanPatient] = useState(null);

    const filtered = mockActivePatients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.condition.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Active Patients</h2>
                <p className="cld-page-subtitle">{mockActivePatients.length} patients under active treatment.</p>
            </div>

            {/* Search */}
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
                        <p className="cld-empty-text">No patients match your search.</p>
                    </div>
                ) : (
                    <div>
                        {filtered.map((p, idx) => {
                            const level = AdherenceLevel(p.adherence);
                            const painKey = p.painStatus.toLowerCase();
                            return (
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
                                        <div className="cld-adherence-row">
                                            <div className="cld-adherence-bar">
                                                <div className={`cld-adherence-fill ${level}`} style={{ width: `${p.adherence}%` }}/>
                                            </div>
                                            <span className="cld-adherence-pct">{p.adherence}% adherence</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
                                        <span className={`cld-pain-badge ${painKey}`}>{p.painStatus}</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Week {p.weeksActive}
                                        </span>
                                    </div>

                                    <div className="cld-patient-actions">
                                        <button
                                            className="cld-btn-action"
                                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                            onClick={() => setPlanPatient(p)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                                <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                                            </svg>
                                            Create Plan
                                        </button>
                                        <Link
                                            to={`${p.id}/feedback`}
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
                            );
                        })}
                    </div>
                )}
            </div>

            {planPatient && (
                <CreatePlanModal patient={planPatient} onClose={() => setPlanPatient(null)} />
            )}
        </div>
    );
}
