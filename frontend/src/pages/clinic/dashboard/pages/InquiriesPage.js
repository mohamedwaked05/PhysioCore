import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getClinicProfile } from '../../../../api/clinic';
import { getMessages } from '../../../../api/messages';
import ChatBox from '../../../../components/chat/ChatBox';
import Skeleton from '../../../../components/ui/Skeleton';
import '../../../../styles/chat.css';

function getInitials(first, last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

export default function InquiriesPage() {
    const { user }                        = useAuth();
    const [clinic, setClinic]             = useState(null);
    const [threads, setThreads]           = useState([]); // unique clients
    const [selected, setSelected]         = useState(null);
    const [loading, setLoading]           = useState(true);

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
                if (unique.length > 0) setSelected(unique[0]);
            } catch {
                // leave empty state
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [user, buildThreads]);

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
                    border: '0.5px solid var(--border)', color: 'var(--text-muted)',
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

    return (
        <div className="cld-page">
            <div className="cld-page-header">
                <h2 className="cld-page-title">Inquiries</h2>
                <p className="cld-page-subtitle">
                    {threads.length} conversation{threads.length !== 1 ? 's' : ''} from prospective clients.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Client list */}
                <div style={{
                    width: 220, flexShrink: 0,
                    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                    border: '0.5px solid var(--border)', overflow: 'hidden',
                }}>
                    {threads.map(client => (
                        <button
                            key={client.id}
                            onClick={() => setSelected(client)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.65rem',
                                width: '100%', textAlign: 'left',
                                padding: '0.75rem 1rem',
                                background: selected?.id === client.id ? 'var(--surface-dim)' : 'transparent',
                                borderLeft: selected?.id === client.id ? '3px solid var(--primary)' : '3px solid transparent',
                                border: 'none', borderBottom: '0.5px solid var(--border-light)',
                                cursor: 'pointer', transition: 'background var(--transition)',
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--primary)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                            }}>
                                {getInitials(client.first_name, client.last_name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.1rem' }}>
                                    {client.first_name} {client.last_name}
                                </p>
                                <p style={{
                                    fontSize: '0.73rem', color: 'var(--text-muted)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {client.lastMessage}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Chat area */}
                <div style={{
                    flex: 1, background: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)',
                    overflow: 'hidden',
                }}>
                    {selected && clinic && (
                        <>
                            <div style={{ padding: '0.85rem 1.1rem', borderBottom: '0.5px solid var(--border)' }}>
                                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                                    {selected.first_name} {selected.last_name}
                                </p>
                                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                    Inquiry · Pre-treatment
                                </p>
                            </div>
                            <ChatBox
                                context="inquiry"
                                referenceId={clinic.id}
                                receiverId={selected.id}
                                withUserId={selected.id}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
