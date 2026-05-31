import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getClinicThreads } from '../../../../api/messages';
import ChatBox from '../../../../components/chat/ChatBox';
import PatientProfilePopup from '../components/PatientProfilePopup';
import Skeleton from '../../../../components/ui/Skeleton';
import GenderAvatar from '../../../../components/ui/GenderAvatar';
import '../../../../styles/chat.css';

function BackArrowIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
        </svg>
    );
}

export default function InquiriesPage() {
    const [clinicId, setClinicId]         = useState(null);
    const [threads, setThreads]           = useState([]); // unique clients
    const [selected, setSelected]         = useState(null);
    const [loading, setLoading]           = useState(true);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [dotsOpen, setDotsOpen]         = useState(false);
    const [popupPatient, setPopupPatient] = useState(null);
    const dotsRef                         = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dotsRef.current && !dotsRef.current.contains(e.target)) setDotsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isOnline = true;

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await getClinicThreads();
                if (cancelled) return;
                const { threads: t, clinic_id } = res.data;
                setClinicId(clinic_id);
                setThreads(t);
                if (t.length > 0 && window.innerWidth > 768) setSelected(t[0]);
            } catch {
                // leave empty state
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const openThread = (client) => {
        setSelected(client);
        // Only use the portal overlay on mobile; on desktop the inline panel is always
        // visible, so setting mobileChatOpen=true would render chatContent twice (inline
        // + portal), giving two DOM nodes with ref={dotsRef} and breaking the dots menu.
        if (window.innerWidth <= 768) setMobileChatOpen(true);
    };

    const closeThread = () => {
        setMobileChatOpen(false);
    };

    if (loading) {
        return (
            <div className="cld-page">
                <div className="cld-page-header">
                    <Skeleton height="22px" width="140px" radius="6px" />
                    <Skeleton height="14px" width="280px" radius="6px" style={{ marginTop: '0.4rem' }} />
                </div>
                <Skeleton height="380px" radius="10px" />
            </div>
        );
    }

    if (threads.length === 0) {
        return (
            <div className="cld-page">
                <div className="cld-page-header">
                    <h2 className="cld-page-title">Inquiries</h2>
                    <p className="cld-page-subtitle">Messages from prospective clients.</p>
                </div>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '0.75rem', padding: '3rem',
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)', color: 'var(--text-muted)',
                    textAlign: 'center',
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        No inquiries yet
                    </p>
                    <p style={{ fontSize: '0.82rem', maxWidth: 300 }}>
                        Messages from prospective clients will appear here.
                    </p>
                </div>
            </div>
        );
    }

    // Shared chat panel content (used both in desktop inline and mobile portal)
    const chatContent = selected && clinicId ? (
        <>
            <div className="cld-inquiries-chat-header">
                <button
                    type="button"
                    className="cld-inquiries-back"
                    onClick={closeThread}
                    aria-label="Back to inquiries"
                >
                    <BackArrowIcon />
                </button>
                <div className="cld-inq-header-av-wrap">
                    {selected?.profile_photo_url?.trim()
                        ? <img src={selected.profile_photo_url} alt={`${selected.first_name} ${selected.last_name}`} className="cld-inq-header-av" />
                        : <GenderAvatar gender={selected?.gender} size={40} />
                    }
                    <span className={`cld-inq-online-dot ${isOnline ? 'cld-inq-online-dot--on' : 'cld-inq-online-dot--off'}`} />
                </div>
                <div className="cld-inq-header-meta">
                    <div className="cld-inq-header-name">{selected.first_name} {selected.last_name}</div>
                    <div className={`cld-inq-header-status${isOnline ? ' cld-inq-header-status--on' : ''}`}>
                        {isOnline ? '● Online' : '● Offline'}
                    </div>
                </div>
                <div className="cld-inq-dots-btn" ref={dotsRef} onClick={() => setDotsOpen(v => !v)}>
                    <i className="ti ti-dots-vertical" aria-hidden="true" />
                    {dotsOpen && (
                        <div className="cld-inq-dots-menu">
                            <div className="cld-inq-dots-item" onClick={(e) => {
                                    e.stopPropagation();
                                    setDotsOpen(false);
                                    if (selected?.client_profile_id) {
                                        setPopupPatient({
                                            id: selected.client_profile_id,
                                            name: `${selected.first_name ?? ''} ${selected.last_name ?? ''}`.trim(),
                                            profile_photo_url: selected.profile_photo_url ?? null,
                                            cover_photo_url: selected.cover_photo_url ?? null,
                                            gender: selected.gender ?? null,
                                        });
                                    }
                                }}>
                                <i className="ti ti-user" aria-hidden="true" />
                                View patient profile
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ChatBox
                context="inquiry"
                referenceId={clinicId}
                receiverId={selected.id}
                withUserId={selected.id}
            />
        </>
    ) : (
        <div className="cld-inquiries-empty-chat">
            <p>Select a conversation to view messages.</p>
        </div>
    );

    return (
        <>
            <div className="cld-page cld-inquiries">
                <div className="cld-page-header">
                    <h2 className="cld-page-title">Inquiries</h2>
                    <p className="cld-page-subtitle">
                        {threads.length} conversation{threads.length !== 1 ? 's' : ''} from prospective clients.
                    </p>
                </div>

                <div className="cld-inquiries-grid">
                    {/* Client list — always visible on desktop; hidden on mobile when chat open */}
                    <div className="cld-inquiries-list">
                        {threads.map(client => (
                            <button
                                key={client.id}
                                onClick={() => openThread(client)}
                                className={`cld-inquiries-list-item${selected?.id === client.id ? ' active' : ''}`}
                            >
                                <div className="cld-inquiries-avatar" style={{ padding: 0, overflow: 'hidden' }}>
                                    <GenderAvatar gender={client.gender} size={36} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p className="cld-inquiries-name">
                                        {client.first_name} {client.last_name}
                                    </p>
                                    <p className="cld-inquiries-preview">
                                        {client.lastMessage}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Desktop chat panel (inline, not portalled) */}
                    <div className="cld-inquiries-chat">
                        {chatContent}
                    </div>
                </div>
            </div>

            {/* Mobile fullscreen chat — portalled to body to escape the animated
                .cld-page container whose transform:translateY(0) fill-mode would
                otherwise create a containing block and break position:fixed. */}
            {mobileChatOpen && selected && clinicId && createPortal(
                <div className="cld-inquiries-mobile-overlay">
                    {chatContent}
                </div>,
                document.body
            )}

            {popupPatient && (
                <PatientProfilePopup
                    patient={popupPatient}
                    onClose={() => setPopupPatient(null)}
                />
            )}
        </>
    );
}
