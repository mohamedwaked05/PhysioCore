import { useEffect, useState } from 'react';
import { getClinics, createAccessRequest, getAccessRequests } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import '../../styles/ui.css';
import '../../styles/client.css';

export default function ClinicListingPage() {
    const [clinics, setClinics]         = useState([]);
    const [activeRequests, setActiveRequests] = useState(new Set());
    const [loading, setLoading]         = useState(true);
    const [requesting, setRequesting]   = useState(null);
    const [feedback, setFeedback]       = useState({ id: null, type: '', message: '' });

    useEffect(() => {
        Promise.all([getClinics(), getAccessRequests()])
            .then(([clinicsRes, requestsRes]) => {
                setClinics(clinicsRes.data);
                const active = new Set(
                    requestsRes.data
                        .filter(r => r.status === 'pending' || r.status === 'approved')
                        .map(r => r.clinic_id)
                );
                setActiveRequests(active);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleRequest = async (clinicId) => {
        setRequesting(clinicId);
        setFeedback({ id: null, type: '', message: '' });

        try {
            await createAccessRequest({ clinic_id: clinicId });
            setActiveRequests(prev => new Set([...prev, clinicId]));
            setFeedback({ id: clinicId, type: 'success', message: 'Access request sent successfully.' });
        } catch (err) {
            const message = err.response?.data?.message ?? 'Failed to send request.';
            setFeedback({ id: clinicId, type: 'error', message });
        } finally {
            setRequesting(null);
        }
    };

    if (loading) {
        return (
            <ClientLayout>
                <div className="client-loading"><div className="client-spinner" /></div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div className="client-page-header">
                <h1 className="client-page-title">Browse Clinics</h1>
                <p className="client-page-subtitle">
                    {clinics.length} verified {clinics.length === 1 ? 'clinic' : 'clinics'} available on the platform.
                </p>
            </div>

            {clinics.length === 0 ? (
                <div className="client-card">
                    <div className="client-empty">No verified clinics are available at this time.</div>
                </div>
            ) : (
                <div className="clinic-grid">
                    {clinics.map(clinic => {
                        const hasActive   = activeRequests.has(clinic.id);
                        const isRequesting = requesting === clinic.id;
                        const name        = clinic.commercial_name || clinic.legal_name;

                        return (
                            <div key={clinic.id} className="clinic-card">
                                {/* Card header with photo */}
                                <div className="clinic-card-header">
                                    <Avatar
                                        src={clinic.profile_photo_url}
                                        name={name}
                                        size="md"
                                    />
                                    <div className="clinic-card-header-info">
                                        <span className="clinic-card-name">{name}</span>
                                        {clinic.specialty_text && (
                                            <span className="clinic-card-specialty">{clinic.specialty_text}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="clinic-card-desc">
                                    {clinic.description ?? 'No description provided.'}
                                </p>

                                {/* Meta info */}
                                <div className="clinic-card-meta">
                                    {clinic.address && (
                                        <span className="clinic-card-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            {clinic.address}
                                        </span>
                                    )}
                                    {clinic.working_hours && (
                                        <span className="clinic-card-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <circle cx="12" cy="12" r="10"/>
                                                <polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            {clinic.working_hours}
                                        </span>
                                    )}
                                </div>

                                {/* Services tags */}
                                {clinic.services && (
                                    <div className="clinic-card-tags">
                                        {clinic.services.split(',').slice(0, 3).map((s, i) => (
                                            <span key={i} className="clinic-card-tag">{s.trim()}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="clinic-card-footer">
                                    {feedback.id === clinic.id && (
                                        <div
                                            className={feedback.type === 'success' ? 'client-success-banner' : 'client-error-banner'}
                                            style={{ marginBottom: '0.75rem' }}
                                        >
                                            {feedback.message}
                                        </div>
                                    )}

                                    <Button
                                        variant={hasActive ? 'secondary' : 'primary'}
                                        size="sm"
                                        onClick={() => handleRequest(clinic.id)}
                                        disabled={hasActive}
                                        loading={isRequesting}
                                        style={{ width: '100%' }}
                                    >
                                        {hasActive ? 'Request Sent' : 'Request Access'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </ClientLayout>
    );
}
