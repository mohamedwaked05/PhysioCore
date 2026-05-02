import { useEffect, useState } from 'react';
import { getAccessRequests } from '../../../../api/client';
import ChatBox from '../../../../components/chat/ChatBox';
import Skeleton from '../../../../components/ui/Skeleton';
import '../../../../styles/chat.css';

function ChatIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
    );
}

export default function MessagesPage() {
    const [clinics, setClinics]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [selected, setSelected]   = useState(null);

    // Full-screen chat on mobile: directly strip cd-layout padding and hide
    // the Recovery Dashboard header — these are siblings/ancestors so CSS
    // on .messages-page alone cannot reach them.
    useEffect(() => {
        if (window.innerWidth > 768) return;
        const layout = document.querySelector('.cd-layout');
        const header = document.querySelector('.cd-header');
        if (layout) layout.style.setProperty('padding', '0', 'important');
        if (header) header.style.setProperty('display', 'none', 'important');
        return () => {
            if (layout) layout.style.removeProperty('padding');
            if (header) header.style.removeProperty('display');
        };
    }, []);

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
                    border: '0.5px solid var(--border)', color: 'var(--text-muted)',
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
                        border: '0.5px solid var(--border)', overflow: 'hidden',
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
                                    border: 'none', borderBottom: '0.5px solid var(--border-light)',
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
                    border: '0.5px solid var(--border)', overflow: 'hidden',
                }}>
                    {selected && (
                        <>
                            <div className="messages-chat-header" style={{
                                padding: '0.85rem 1.1rem',
                                borderBottom: '0.5px solid var(--border)',
                            }}>
                                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                                    {clinicName(selected)}
                                </p>
                                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                    {selected.specialty_text ?? 'Physiotherapy'} · Treatment
                                </p>
                            </div>
                            <ChatBox
                                context="treatment"
                                referenceId={selected.id}
                                receiverId={selected.user_id}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
