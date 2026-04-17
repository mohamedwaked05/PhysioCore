import { useEffect, useRef, useState, useCallback } from 'react';
import { getMessages, sendMessage } from '../../api/messages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Spinner from '../Spinner';
import '../../styles/chat.css';

const POLL_INTERVAL = 10000;

function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── MessageList ──────────────────────────────────────────── */
function MessageList({ messages, currentUserId, loading, newCount }) {
    const bottomRef     = useRef(null);
    const initialRef    = useRef(true);

    useEffect(() => {
        if (!bottomRef.current) return;
        // First load: jump instantly so the user lands at the bottom without animation.
        // Every subsequent message: smooth scroll.
        bottomRef.current.scrollIntoView({ behavior: initialRef.current ? 'instant' : 'smooth' });
        initialRef.current = false;
    }, [messages.length]);

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
        <div className="chat-messages">
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
                            <div className="chat-bubble-meta">{formatTime(msg.created_at)}</div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}

/* ── MessageInput ─────────────────────────────────────────── */
function MessageInput({ onSend, sending }) {
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

    return (
        <div className="chat-input-area">
            <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Type a message… (Enter to send)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
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
 *   receiverId  — user_id of the other party
 *   onGuestAction — called when guest tries to interact (optional)
 */
export default function ChatBox({ context, referenceId, receiverId, withUserId, onGuestAction }) {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [messages, setMessages]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const [newCount, setNewCount]   = useState(0);
    const prevCountRef              = useRef(0);

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
            if (!silent) setNewCount(0); // clear indicator on open
        } catch {
            // silent failure on poll
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user, context, referenceId, withUserId]);

    // Initial load
    useEffect(() => {
        if (!user) { setLoading(false); return; }
        fetchMessages(false);
    }, [fetchMessages, user]);

    // Polling
    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => fetchMessages(true), POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchMessages, user]);

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
        <div className="chat-box">
            <MessageList
                messages={messages}
                currentUserId={user.id}
                loading={loading}
                newCount={newCount}
            />
            <MessageInput onSend={handleSend} sending={sending} />
        </div>
    );
}
