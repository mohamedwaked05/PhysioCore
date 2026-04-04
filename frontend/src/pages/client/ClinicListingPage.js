import { useEffect, useState } from 'react';
import { getClinics, createAccessRequest, getAccessRequests } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';
import Spinner from '../../components/Spinner';

export default function ClinicListingPage() {
    const [clinics, setClinics] = useState([]);
    const [activeRequests, setActiveRequests] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(null);
    const [feedback, setFeedback] = useState({ id: null, type: '', message: '' });

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
                        const hasActive = activeRequests.has(clinic.id);
                        const isRequesting = requesting === clinic.id;

                        return (
                            <div key={clinic.id} className="clinic-card">
                                <span className="clinic-card-name">{clinic.name}</span>

                                {clinic.specialty && (
                                    <span className="clinic-card-specialty">{clinic.specialty}</span>
                                )}

                                <p className="clinic-card-desc">
                                    {clinic.description ?? 'No description provided.'}
                                </p>

                                {clinic.address && (
                                    <span className="clinic-card-address">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        {clinic.address}
                                    </span>
                                )}

                                <div className="clinic-card-footer">
                                    {feedback.id === clinic.id && (
                                        <div
                                            className={feedback.type === 'success' ? 'client-success-banner' : 'client-error-banner'}
                                            style={{ marginBottom: '0.75rem' }}
                                        >
                                            {feedback.message}
                                        </div>
                                    )}

                                    <button
                                        className={`clinic-request-btn${hasActive ? ' requested' : ''}`}
                                        onClick={() => handleRequest(clinic.id)}
                                        disabled={hasActive || isRequesting}
                                    >
                                        {isRequesting && <Spinner />}
                                        {hasActive ? 'Request Sent' : isRequesting ? 'Sending...' : 'Request Access'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </ClientLayout>
    );
}
