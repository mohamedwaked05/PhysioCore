import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../../context/AuthContext';
import { getClinicProfile } from '../../../../api/clinic';
import { getMessages } from '../../../../api/messages';
import ChatBox from '../../../../components/chat/ChatBox';
import Skeleton from '../../../../components/ui/Skeleton';
import '../../../../styles/chat.css';

function getInitials(first, last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

function BackArrowIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
        </svg>
    );
}

export default function InquiriesPage() {
    const { user }                        = useAuth();
    const [clinic, setClinic]             = useState(null);
    const [threads, setThreads]           = useState([]); // unique clients
    const [selected, setSelected]         = useState(null);
    const [loading, setLoading]           = useState(true);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);

    const buildThreads = useCallback((messages, clinicUserId) => {
        const map = new Map();
        messages.forEach(msg => {
            const other = msg.sender_id === clinicUserId ? msg.receiver : msg.sender;
            if (!other) return;
            if (!map.has(other.id)) {
                map.set(other.id, { ...other, lastMessage: msg.content });
            } else {
                map.get(other.id).lastMessage = msg.content;
            }
        });
        return Array.from(map.values());
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const profileRes = await getClinicProfile();
                const c = profileRes.data;
                if (cancelled) return;
                setClinic(c);

                const msgRes = await getMessages({ context: 'inquiry', reference_id: c.id });
                if (cancelled) return;
                const unique = buildThreads(msgRes.data, user.id);
                setThreads(unique);
                // Don't auto-select on mount — on mobile the user picks a thread first
                if (unique.length > 0 && window.innerWidth > 768) {
                    setSelected(unique[0]);
                }
            } catch {
                // leave empty state
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [user, buildThreads]);

    const openThread = (client) => {
        setSelected(client);
        setMobileChatOpen(true);
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
    const chatContent = selected && clinic ? (
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
                <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {selected.first_name} {selected.last_name}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Inquiry · Pre-treatment
                    </p>
                </div>
            </div>
            <ChatBox
                context="inquiry"
                referenceId={clinic.id}
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
                                <div className="cld-inquiries-avatar">
                                    {getInitials(client.first_name, client.last_name)}
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
            {mobileChatOpen && selected && clinic && createPortal(
                <div className="cld-inquiries-mobile-overlay">
                    {chatContent}
                </div>,
                document.body
            )}
        </>
    );
}
