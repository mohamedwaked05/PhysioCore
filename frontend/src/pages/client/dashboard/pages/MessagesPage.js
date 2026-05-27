import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessRequests, getClinic } from '../../../../api/client';
import ChatBox from '../../../../components/chat/ChatBox';
import Skeleton from '../../../../components/ui/Skeleton';
import GenderAvatar from '../../../../components/ui/GenderAvatar';
import '../../../../styles/chat.css';

function ChatIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
}

export default function MessagesPage() {
    const navigate = useNavigate();
    const [clinics, setClinics]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState(null);
    const [dotsOpen, setDotsOpen]   = useState(false);
    const dotsRef                   = useRef(null);
    const [clinicDetail, setClinicDetail] = useState(null);

    // Full-screen chat on mobile: strip layout padding, hide page header,
    // hide bottom nav (back button in DashboardLayout replaces it).
    useEffect(() => {
        if (window.innerWidth > 768) return;
        const layout = document.querySelector('.cd-layout');
        const header = document.querySelector('.cd-header');
        if (layout) layout.style.setProperty('padding', '0', 'important');
        if (header) header.style.setProperty('display', 'none', 'important');
        document.body.classList.add('chat-fullscreen');
        return () => {
            if (layout) layout.style.removeProperty('padding');
            if (header) header.style.removeProperty('display');
            document.body.classList.remove('chat-fullscreen');
        };
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dotsRef.current && !dotsRef.current.contains(e.target)) setDotsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!selected?.id) return;
        setClinicDetail(null);
        getClinic(selected.id)
            .then(res => setClinicDetail(res.data))
            .catch(() => {});
    }, [selected?.id]);

    useEffect(() => {
        getAccessRequests()
            .then(res => {
                const approved = res.data
                    .filter(r => r.status === 'approved' && r.clinic?.user_id)
                    .map(r => r.clinic);
                setClinics(approved);
                if (approved.length > 0) setSelected(approved[0]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="cld-page">
                <div className="cld-page-header">
                    <Skeleton height="22px" width="160px" radius="6px" />
                    <Skeleton height="14px" width="260px" radius="6px" style={{ marginTop: '0.4rem' }} />
                </div>
                <Skeleton height="380px" radius="10px" />
            </div>
        );
    }

    if (clinics.length === 0) {
        return (
            <div className="cld-page">
                <div className="cld-page-header">
                    <h2 className="cld-page-title">Messages</h2>
                    <p className="cld-page-subtitle">Treatment conversations with your clinics.</p>
                </div>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '0.75rem', padding: '3rem',
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)', color: 'var(--text-muted)',
                    textAlign: 'center',
                }}>
                    <ChatIcon />
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        No active clinics
                    </p>
                    <p style={{ fontSize: '0.82rem', maxWidth: 300 }}>
                        Messages will appear here once a clinic approves your access request.
                    </p>
                </div>
            </div>
        );
    }

    const clinicName = (c) => c.commercial_name || c.legal_name;

    const isOnline = (() => {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        return day >= 1 && day <= 6 && hour >= 8 && hour < 20;
    })();

    return (
        <div className="cld-page messages-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Messages</h2>
                <p className="cld-page-subtitle">Treatment conversations with your clinics.</p>
            </div>

            <div className="messages-body" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Clinic list — only shown when multiple clinics */}
                {clinics.length > 1 && (
                    <div className="messages-sidebar" style={{
                        width: 200, flexShrink: 0,
                        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                    }}>
                        {clinics.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelected(c)}
                                style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    background: selected?.id === c.id ? 'var(--surface-dim)' : 'transparent',
                                    borderLeft: selected?.id === c.id ? '3px solid var(--primary)' : '3px solid transparent',
                                    border: 'none',
                                    cursor: 'pointer', transition: 'background var(--transition)',
                                }}
                            >
                                <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.15rem' }}>
                                    {clinicName(c)}
                                </p>
                                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                    {c.specialty_text ?? 'Physiotherapy'}
                                </p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Chat area */}
                <div className="messages-chat-wrapper" style={{
                    flex: 1,
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                }}>
                    {selected && (
                        <>
                            <div className="cd-chat-header">
                                <div className="cd-chat-header-av-wrap">
                                    {clinicDetail?.profile_photo_url && clinicDetail.profile_photo_url.trim() !== ''
                                        ? <img
                                            src={clinicDetail.profile_photo_url}
                                            alt={clinicName(selected)}
                                            className="cd-chat-header-av"
                                          />
                                        : <GenderAvatar gender={undefined} size={40} />
                                    }
                                    <span className={`cd-chat-online-dot ${isOnline ? 'cd-chat-online-dot--on' : 'cd-chat-online-dot--off'}`} />
                                </div>
                                <div className="cd-chat-header-meta">
                                    <div className="cd-chat-header-name">{clinicName(selected)}</div>
                                    <div className={`cd-chat-header-status ${isOnline ? 'cd-chat-header-status--on' : ''}`}>
                                        {isOnline ? '● Online' : '● Offline'}
                                    </div>
                                </div>
                                <div className="cd-chat-header-actions">
                                    <div className="cd-chat-dots-btn" onClick={() => setDotsOpen(v => !v)} ref={dotsRef}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
                                        </svg>
                                        {dotsOpen && (
                                            <div className="cd-chat-dots-menu">
                                                <div className="cd-chat-dots-item" onClick={() => navigate(`/clinics/${selected.id}`)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                                    View clinic profile
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <ChatBox
                                context="treatment"
                                referenceId={selected.id}
                                receiverId={selected.user_id}
                                fullscreen
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
