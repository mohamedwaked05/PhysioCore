import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getAccessRequests } from '../../api/client';
import ClientLayout from '../../components/ClientLayout';

function StatusBadge({ status }) {
    return <span className={`status-badge ${status}`}>{status}</span>;
}

export default function ClientDashboardPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);

    useEffect(() => {
        getProfile()
            .then(res => setProfile(res.data))
            .catch(() => {})
            .finally(() => setLoadingProfile(false));

        getAccessRequests()
            .then(res => setRequests(res.data))
            .catch(() => {})
            .finally(() => setLoadingRequests(false));
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    return (
        <ClientLayout>
            <div className="client-page-header">
                <h1 className="client-page-title">
                    Welcome back, {user?.first_name}
                </h1>
                <p className="client-page-subtitle">Here's a summary of your account.</p>
            </div>

            <div className="client-dashboard-grid">
                {/* Profile Summary */}
                <div className="client-card">
                    <div className="client-card-header">
                        <span className="client-card-title">Profile Summary</span>
                        <Link to="/client/profile" className="client-action-btn secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>
                            Edit
                        </Link>
                    </div>

                    {loadingProfile ? (
                        <div className="client-loading"><div className="client-spinner" /></div>
                    ) : (
                        <>
                            <div className="client-summary-row">
                                <span className="client-summary-label">Date of birth</span>
                                {profile?.date_of_birth
                                    ? <span className="client-summary-value">{formatDate(profile.date_of_birth)}</span>
                                    : <span className="client-summary-empty">Not set</span>}
                            </div>
                            <div className="client-summary-row">
                                <span className="client-summary-label">Gender</span>
                                {profile?.gender
                                    ? <span className="client-summary-value" style={{ textTransform: 'capitalize' }}>{profile.gender}</span>
                                    : <span className="client-summary-empty">Not set</span>}
                            </div>
                            <div className="client-summary-row">
                                <span className="client-summary-label">Phone</span>
                                {profile?.phone
                                    ? <span className="client-summary-value">{profile.phone}</span>
                                    : <span className="client-summary-empty">Not set</span>}
                            </div>
                            <div className="client-summary-row">
                                <span className="client-summary-label">Condition</span>
                                {profile?.condition_summary
                                    ? <span className="client-summary-value">{profile.condition_summary}</span>
                                    : <span className="client-summary-empty">Not set</span>}
                            </div>
                            <div className="client-summary-row">
                                <span className="client-summary-label">Emergency contact</span>
                                {profile?.emergency_contact
                                    ? <span className="client-summary-value">{profile.emergency_contact}</span>
                                    : <span className="client-summary-empty">Not set</span>}
                            </div>
                        </>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="client-card">
                    <div className="client-card-header">
                        <span className="client-card-title">Quick Actions</span>
                    </div>
                    <div className="client-actions-row">
                        <Link to="/client/clinics" className="client-action-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            Browse Clinics
                        </Link>
                        <Link to="/client/profile" className="client-action-btn secondary">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Update Profile
                        </Link>
                    </div>
                </div>

                {/* Access Requests */}
                <div className="client-card span-2">
                    <div className="client-card-header">
                        <span className="client-card-title">Access Requests</span>
                        <Link to="/client/clinics" className="client-action-btn secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>
                            New request
                        </Link>
                    </div>

                    {loadingRequests ? (
                        <div className="client-loading"><div className="client-spinner" /></div>
                    ) : requests.length === 0 ? (
                        <div className="client-empty">
                            No access requests yet. Browse clinics to get started.
                        </div>
                    ) : (
                        <div className="request-list">
                            {requests.map(req => (
                                <div key={req.id} className="request-item">
                                    <div className="request-item-info">
                                        <span className="request-item-clinic">
                                            {req.clinic?.name ?? 'Unknown Clinic'}
                                        </span>
                                        <span className="request-item-meta">
                                            {req.clinic?.specialty && `${req.clinic.specialty} · `}
                                            Submitted {formatDate(req.created_at)}
                                        </span>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}
