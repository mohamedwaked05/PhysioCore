import { useParams, Link } from 'react-router-dom';
import { mockPatientFeedbackHistory, mockActivePatients } from '../data/mockData';

function PainDot({ level }) {
    const color = level <= 3 ? '#22c55e' : level <= 6 ? '#f59e0b' : '#ef4444';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            background: level <= 3 ? '#f0fdf4' : level <= 6 ? '#fffbeb' : '#fef2f2',
            color,
            fontSize: '0.72rem', fontWeight: 600,
            padding: '0.15rem 0.6rem', borderRadius: 999,
        }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            Pain {level}/10
        </span>
    );
}

function EffortDot({ level }) {
    return (
        <span className="cld-badge cld-badge--effort">
            Effort {level}/10
        </span>
    );
}

export default function PatientFeedbackPage() {
    const { patientId } = useParams();
    const id = parseInt(patientId, 10);

    const history = mockPatientFeedbackHistory[id];
    const patientFallback = mockActivePatients.find(p => p.id === id);

    if (!history && !patientFallback) {
        return (
            <div className="cld-page">
                <Link to="/clinic/dashboard/patients" className="cld-back-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back to Patients
                </Link>
                <div className="client-card">
                    <div className="cld-empty">
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">Patient not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    const patient = history ?? {
        patientName: patientFallback.name,
        initials: patientFallback.initials,
        condition: patientFallback.condition,
        adherence: patientFallback.adherence,
        weeksActive: patientFallback.weeksActive,
        reports: [],
    };

    const avgPain = patient.reports.length
        ? (patient.reports.reduce((s, r) => s + r.painLevel, 0) / patient.reports.length).toFixed(1)
        : '—';

    const latestReport = patient.reports[0] ?? null;

    return (
        <div className="cld-page">
            {/* ── Back ─── */}
            <Link to="/clinic/dashboard/patients" className="cld-back-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Patients
            </Link>

            {/* ── Patient Header Card ─── */}
            <div className="client-card cld-patient-header-card">
                <div className="cld-patient-header-avatar">{patient.initials}</div>

                <div className="cld-patient-header-info">
                    <p className="cld-patient-header-name">{patient.patientName}</p>
                    <p className="cld-patient-header-meta">
                        {patient.condition} · Week {patient.weeksActive} of treatment
                    </p>
                </div>

                <div className="cld-patient-header-stats">
                    <div className="cld-patient-header-stat">
                        <p className="cld-patient-header-stat-value">{patient.adherence}%</p>
                        <p className="cld-patient-header-stat-label">Adherence</p>
                    </div>
                    <div className="cld-patient-header-stat">
                        <p className="cld-patient-header-stat-value">{avgPain}</p>
                        <p className="cld-patient-header-stat-label">Avg Pain</p>
                    </div>
                    <div className="cld-patient-header-stat">
                        <p className="cld-patient-header-stat-value">{patient.reports.length}</p>
                        <p className="cld-patient-header-stat-label">Reports</p>
                    </div>
                </div>
            </div>

            {/* ── Latest Report highlight ─── */}
            {latestReport && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '0.01em' }}>
                        Latest Report
                    </p>
                    <div className="client-card" style={{
                        borderLeft: '3px solid var(--primary)',
                        padding: '1.1rem 1.25rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{latestReport.date}</span>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <PainDot level={latestReport.painLevel} />
                                <EffortDot level={latestReport.effortLevel} />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.65rem' }}>
                            {latestReport.message}
                        </p>
                        <span className="cld-ex-progress">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {latestReport.exercisesCompleted}/{latestReport.exercisesTotal} exercises completed
                        </span>
                    </div>
                </div>
            )}

            {/* ── Report History Timeline ─── */}
            <p style={{ fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '0.01em' }}>
                Report History
            </p>

            {patient.reports.length === 0 ? (
                <div className="client-card">
                    <div className="cld-empty">
                        <div className="cld-empty-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                        </div>
                        <p className="cld-empty-text">No reports submitted yet.</p>
                    </div>
                </div>
            ) : (
                <div className="client-card">
                    <div className="cld-timeline">
                        {patient.reports.map((report, idx) => (
                            <div key={report.id} className="cld-timeline-item">
                                <div className="cld-timeline-left">
                                    <div className="cld-timeline-dot"/>
                                    {idx < patient.reports.length - 1 && <div className="cld-timeline-line"/>}
                                </div>

                                <div className="cld-timeline-content">
                                    <p className="cld-timeline-date">{report.date}</p>
                                    <p className="cld-timeline-msg">{report.message}</p>
                                    <div className="cld-timeline-stats">
                                        <PainDot level={report.painLevel} />
                                        <EffortDot level={report.effortLevel} />
                                        <span className="cld-ex-progress">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            {report.exercisesCompleted}/{report.exercisesTotal}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
