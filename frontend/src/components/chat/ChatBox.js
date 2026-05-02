import { useEffect, useRef, useState, useCallback } from 'react';
import { getMessages, sendMessage, markDelivered, markSeen } from '../../api/messages';
import { getEcho } from '../../services/echo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Spinner from '../Spinner';
import '../../styles/chat.css';

// Fallback poll — WebSocket handles new messages in real-time via NotificationCreated;
// this is a safety net for missed events only.
const POLL_INTERVAL = 30000;

function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Status tick for sent messages ───────────────────────── */
function MessageTick({ msg }) {
    if (msg.seen_at)      return <span className="chat-tick chat-tick--seen"      aria-label="Seen">✓✓</span>;
    if (msg.delivered_at) return <span className="chat-tick chat-tick--delivered" aria-label="Delivered">✓✓</span>;
    return                       <span className="chat-tick chat-tick--sent"      aria-label="Sent">✓</span>;
}

/* ── MessageList ──────────────────────────────────────────── */
function MessageList({ messages, currentUserId, loading, newCount, listRef }) {
    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length, listRef]);

    if (loading) {
        return (
            <div className="chat-loading">
                <Spinner />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="chat-empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>No messages yet. Start the conversation.</span>
            </div>
        );
    }

    return (
        <div className="chat-messages" ref={listRef}>
            {newCount > 0 && (
                <div className="chat-new-indicator">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    {newCount} new message{newCount > 1 ? 's' : ''}
                </div>
            )}
            {messages.map((msg) => {
                const isSent = msg.sender_id === currentUserId;
                return (
                    <div
                        key={msg.id}
                        className={`chat-bubble-row chat-bubble-row--${isSent ? 'sent' : 'received'}`}
                    >
                        <div className="chat-bubble-wrap">
                            {!isSent && (
                                <div className="chat-bubble-sender">
                                    {msg.sender?.first_name} {msg.sender?.last_name}
                                </div>
                            )}
                            <div className={`chat-bubble chat-bubble--${isSent ? 'sent' : 'received'}`}>
                                {msg.content}
                            </div>
                            <div className="chat-bubble-meta">
                                {formatTime(msg.created_at)}
                                {isSent && <MessageTick msg={msg} />}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── MessageInput ─────────────────────────────────────────── */
function MessageInput({ onSend, sending, listRef }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);

    const handleSend = () => {
        if (!text.trim() || sending) return;
        onSend(text.trim());
        setText('');
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const onResize = () => {
            if (listRef?.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        };
        vv.addEventListener('resize', onResize);
        return () => vv.removeEventListener('resize', onResize);
    }, [listRef]);

    return (
        <div className="chat-input-area">
            <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoCorrect="on"
                spellCheck={true}
            />
            <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!text.trim() || sending}
                aria-label="Send"
            >
                {sending ? (
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                )}
            </button>
        </div>
    );
}

/* ── ChatBox (main export) ────────────────────────────────── */
/**
 * Props:
 *   context     — 'inquiry' | 'treatment' | 'feedback'
 *   referenceId — clinic_id or access_request_id
 *   receiverId  — user_id of the other party (for sending messages)
 *   withUserId  — user_id of the other party (for filtering fetch)
 *   onGuestAction — called when guest tries to interact (optional)
 */
export default function ChatBox({ context, referenceId, receiverId, withUserId, onGuestAction }) {
    const { user }     = useAuth();
    const { addToast } = useToast();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [sending, setSending]   = useState(false);
    const [newCount, setNewCount] = useState(0);
    const prevCountRef            = useRef(0);
    const listRef                 = useRef(null);
    const boxRef                  = useRef(null);

    // The other party's user id (used for markSeen sender filter)
    const otherUserId = withUserId || receiverId;

    /* ── visualViewport: shrink chat to fit above keyboard on iOS ─ */
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv || window.innerWidth > 768) return;
        const update = () => {
            if (boxRef.current) {
                boxRef.current.style.height = `${vv.height - 64}px`;
            }
            if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        };
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        update();
        return () => {
            vv.removeEventListener('resize', update);
            vv.removeEventListener('scroll', update);
            if (boxRef.current) boxRef.current.style.height = '';
        };
    }, []);

    /* ── Optimistic status patch helpers ─────────────────── */
    const applySeen = useCallback((messageIds, seenAt) => {
        const idSet = new Set(messageIds);
        setMessages(prev => prev.map(m =>
            idSet.has(m.id) && !m.seen_at
                ? { ...m, delivered_at: m.delivered_at ?? seenAt, seen_at: seenAt }
                : m
        ));
    }, []);

    /* ── After fetch: side-effects for delivery/seen ─────── */
    const processFetch = useCallback(async (fetched) => {
        if (!user) return;

        // Mark received messages as delivered (batch, no downgrade — backend handles it)
        const undelivered = fetched
            .filter(m => m.sender_id !== user.id && !m.delivered_at)
            .map(m => m.id);
        if (undelivered.length > 0) {
            try { await markDelivered(undelivered); } catch {}
        }

        // Mark received messages as seen (user opened the chat)
        const unseen = fetched.filter(m => m.sender_id !== user.id && !m.seen_at);
        if (unseen.length > 0) {
            try {
                await markSeen({ sender_id: otherUserId, context, reference_id: referenceId });
            } catch {}
        }
    }, [user, otherUserId, context, referenceId]);

    /* ── Fetch messages ───────────────────────────────────── */
    const fetchMessages = useCallback(async (silent = false) => {
        if (!user) return;
        try {
            const params = { context, reference_id: referenceId };
            if (withUserId) params.with_user_id = withUserId;
            const res = await getMessages(params);
            const fetched = res.data;
            if (silent && fetched.length > prevCountRef.current) {
                setNewCount(fetched.length - prevCountRef.current);
                setTimeout(() => setNewCount(0), 4000);
            }
            prevCountRef.current = fetched.length;
            setMessages(fetched);
            if (!silent) setNewCount(0);
            await processFetch(fetched);
        } catch {
            // silent failure on poll
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user, context, referenceId, withUserId, processFetch]);

    // Initial load
    useEffect(() => {
        if (!user) { setLoading(false); return; }
        fetchMessages(false);
    }, [fetchMessages, user]);

    // Polling — skipped when WebSocket is connected (safety net only)
    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => {
            const echo  = getEcho(localStorage.getItem('token'));
            const state = echo?.connector?.pusher?.connection?.state;
            if (state !== 'connected') fetchMessages(true);
        }, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchMessages, user]);

    /* ── WebSocket: new messages + delivery/seen acks ────── */
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const echo = getEcho(token);
        const ch   = echo.private(`user.${user.id}`);

        // Instant new-message delivery via NotificationCreated.
        // The backend embeds the full message object in notification.data.message,
        // so we can append it directly to state with no HTTP round-trip.
        // Falls back to fetchMessages(true) only for legacy events without the payload.
        ch.listen('.NotificationCreated', ({ notification }) => {
            if (notification?.type !== 'message') return;
            const d = notification.data ?? {};
            if (String(d.context) !== String(context) || String(d.reference_id) !== String(referenceId)) return;

            if (d.message?.id) {
                // Direct append — no refetch needed
                setMessages(prev =>
                    prev.some(m => m.id === d.message.id) ? prev : [...prev, d.message]
                );
                prevCountRef.current += 1;
                setNewCount(c => c + 1);
                setTimeout(() => setNewCount(0), 4000);
                // Fire delivery + seen side-effects in the background (same as processFetch)
                processFetch([d.message]);
            } else {
                // Fallback: event predates the message payload addition
                fetchMessages(true);
            }
        });

        // Delivery / seen ACKs for outgoing messages
        ch.listen('.MessageDelivered', ({ message_ids, delivered_at }) => {
            const idSet = new Set(message_ids);
            setMessages(prev => prev.map(m =>
                idSet.has(m.id) && !m.delivered_at ? { ...m, delivered_at } : m
            ));
        });

        ch.listen('.MessageSeen', ({ message_ids, seen_at }) => {
            applySeen(message_ids, seen_at);
        });

        return () => {
            try { ch.stopListening('.NotificationCreated'); } catch {}
            try { ch.stopListening('.MessageDelivered'); } catch {}
            try { ch.stopListening('.MessageSeen'); } catch {}
        };
    }, [user?.id, context, referenceId, fetchMessages, applySeen, processFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Send ─────────────────────────────────────────────── */
    const handleSend = async (content) => {
        if (!user) { onGuestAction?.(); return; }
        setSending(true);
        try {
            const res = await sendMessage({ receiver_id: receiverId, context, reference_id: referenceId, content });
            setMessages((prev) => [...prev, res.data]);
            prevCountRef.current += 1;
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Failed to send message. Please try again.', 'error');
        } finally {
            setSending(false);
        }
    };

    // Guest gate
    if (!user) {
        return (
            <div className="chat-box">
                <div className="chat-guest-gate">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <strong style={{ color: 'var(--text)', fontFamily: 'Syne', fontSize: '0.9rem' }}>
                        Sign in to chat
                    </strong>
                    <p>Create an account or log in to send a message to this clinic.</p>
                    <Button variant="primary" size="sm" onClick={() => onGuestAction?.()}>
                        Sign in
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-box" ref={boxRef}>
            <MessageList
                messages={messages}
                currentUserId={user.id}
                loading={loading}
                newCount={newCount}
                listRef={listRef}
            />
            <MessageInput onSend={handleSend} sending={sending} listRef={listRef} />
        </div>
    );
}
