import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getMessages, sendMessage, markDelivered, markSeen, uploadChatImage } from '../../api/messages';
import { getEcho } from '../../services/echo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Spinner from '../Spinner';
import '../../styles/chat.css';

const POLL_INTERVAL = 30000;

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Status tick ──────────────────────────────────────────── */
function MessageTick({ msg }) {
    if (msg.seen_at)      return <span className="chat-tick chat-tick--seen"      aria-label="Seen">✓✓</span>;
    if (msg.delivered_at) return <span className="chat-tick chat-tick--delivered" aria-label="Delivered">✓✓</span>;
    return                       <span className="chat-tick chat-tick--sent"      aria-label="Sent">✓</span>;
}

/* ── Lightbox ─────────────────────────────────────────────── */
function Lightbox({ src, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = src;
        a.download = 'image.jpg';
        a.click();
    };

    return createPortal(
        <div className="chat-lightbox" onClick={onClose}>
            <button className="chat-lightbox-close" onClick={onClose} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <button className="chat-lightbox-download" onClick={e => { e.stopPropagation(); handleDownload(); }} aria-label="Download">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
            </button>
            <img
                src={src}
                alt="Full size"
                className="chat-lightbox-img"
                onClick={e => e.stopPropagation()}
            />
        </div>,
        document.body
    );
}

/* ── ChatImage ────────────────────────────────────────────── */
function ChatImage({ src, isSent }) {
    const [loaded, setLoaded] = useState(false);
    const [lightbox, setLightbox] = useState(false);
    return (
        <>
            <div
                className={`chat-bubble-img-wrap${loaded ? ' loaded' : ''}`}
                style={{ textAlign: isSent ? 'right' : 'left' }}
            >
                {!loaded && <div className="chat-img-skeleton" />}
                <img
                    src={src}
                    alt="Attachment"
                    className="chat-bubble-img"
                    onLoad={() => setLoaded(true)}
                    onClick={() => setLightbox(true)}
                    style={{ display: loaded ? 'block' : 'none' }}
                />
            </div>
            {lightbox && <Lightbox src={src} onClose={() => setLightbox(false)} />}
        </>
    );
}

/* ── MessageList ──────────────────────────────────────────── */
function MessageList({ messages, currentUserId, loading, newCount, listRef }) {
    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length, listRef]);

    if (loading) return <div className="chat-loading"><Spinner /></div>;

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
                    <div key={msg.id} className={`chat-bubble-row chat-bubble-row--${isSent ? 'sent' : 'received'}`}>
                        <div className="chat-bubble-wrap">
                            {!isSent && (
                                <div className="chat-bubble-sender">
                                    {msg.sender?.first_name} {msg.sender?.last_name}
                                </div>
                            )}
                            {msg.image_url && <ChatImage src={msg.image_url} isSent={isSent} />}
                            {msg.content && (
                                <div className={`chat-bubble chat-bubble--${isSent ? 'sent' : 'received'}`}>
                                    {msg.content}
                                </div>
                            )}
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
    const { addToast }   = useToast();
    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState(null); // { localUrl, uploading, uploadedUrl }
    const textareaRef  = useRef(null);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        const hasText  = text.trim().length > 0;
        const hasImage = imagePreview?.uploadedUrl;
        if ((!hasText && !hasImage) || sending || imagePreview?.uploading) return;
        onSend(text.trim(), hasImage ? imagePreview.uploadedUrl : null);
        setText('');
        setImagePreview(null);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFocus = () => {
        const startScrollY = window.scrollY;
        setTimeout(() => {
            if (listRef?.current) listRef.current.scrollTop = listRef.current.scrollHeight;
            if (Math.abs(window.scrollY - startScrollY) > 4) window.scrollTo(0, startScrollY);
        }, 100);
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const localUrl = URL.createObjectURL(file);
        setImagePreview({ localUrl, uploading: true, uploadedUrl: null });

        try {
            const res = await uploadChatImage(file);
            setImagePreview({ localUrl, uploading: false, uploadedUrl: res.data.url });
        } catch {
            addToast('Image upload failed. Please try again.', 'error');
            setImagePreview(null);
            URL.revokeObjectURL(localUrl);
        }
    };

    const removeImage = () => {
        if (imagePreview?.localUrl) URL.revokeObjectURL(imagePreview.localUrl);
        setImagePreview(null);
    };

    const canSend = (text.trim() || imagePreview?.uploadedUrl) && !sending && !imagePreview?.uploading;

    return (
        <div className="chat-input-area">
            {/* Image preview row */}
            {imagePreview && (
                <div className="chat-input-img-preview">
                    <div className="chat-input-img-thumb">
                        <img src={imagePreview.localUrl} alt="Preview" />
                        {imagePreview.uploading && (
                            <div className="chat-input-img-uploading">
                                <span className="chat-input-img-spinner" />
                            </div>
                        )}
                    </div>
                    {!imagePreview.uploading && (
                        <button
                            type="button"
                            className="chat-input-img-remove"
                            onClick={removeImage}
                            aria-label="Remove image"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Main input row */}
            <div className="chat-input-row">
                {/* Attachment / camera button */}
                <button
                    type="button"
                    className="chat-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image"
                    title="Attach image or take photo"
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                />

                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    autoComplete="off"
                    autoCorrect="on"
                    spellCheck={true}
                />

                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!canSend}
                    aria-label="Send"
                >
                    {sending ? (
                        <span className="chat-send-spinner" />
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ── ChatBox (main export) ────────────────────────────────── */
export default function ChatBox({ context, referenceId, receiverId, withUserId, onGuestAction, fullscreen = false }) {
    const { user }     = useAuth();
    const { addToast } = useToast();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [sending, setSending]   = useState(false);
    const [newCount, setNewCount] = useState(0);
    const prevCountRef            = useRef(0);
    const listRef                 = useRef(null);
    const boxRef                  = useRef(null);

    const otherUserId = withUserId || receiverId;

    /* ── visualViewport: keyboard-aware layout on mobile ─── */
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv || window.innerWidth > 768) return;
        const box = boxRef.current;

        const onResize = () => {
            if (fullscreen) {
                if (boxRef.current) boxRef.current.style.height = `${vv.height - 64}px`;
            } else {
                if (boxRef.current) {
                    const rect = boxRef.current.getBoundingClientRect();
                    const overflow = rect.bottom - vv.height;
                    if (overflow > 0) window.scrollBy({ top: overflow + 8, behavior: 'instant' });
                }
            }
            if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        };

        vv.addEventListener('resize', onResize);
        return () => { vv.removeEventListener('resize', onResize); if (box) box.style.height = ''; };
    }, [fullscreen]);

    const applySeen = useCallback((messageIds, seenAt) => {
        const idSet = new Set(messageIds);
        setMessages(prev => prev.map(m =>
            idSet.has(m.id) && !m.seen_at
                ? { ...m, delivered_at: m.delivered_at ?? seenAt, seen_at: seenAt }
                : m
        ));
    }, []);

    const processFetch = useCallback(async (fetched) => {
        if (!user) return;
        const undelivered = fetched.filter(m => m.sender_id !== user.id && !m.delivered_at).map(m => m.id);
        if (undelivered.length > 0) { try { await markDelivered(undelivered); } catch {} }
        const unseen = fetched.filter(m => m.sender_id !== user.id && !m.seen_at);
        if (unseen.length > 0) {
            try { await markSeen({ sender_id: otherUserId, context, reference_id: referenceId }); } catch {}
        }
    }, [user, otherUserId, context, referenceId]);

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
        } catch {} finally {
            if (!silent) setLoading(false);
        }
    }, [user, context, referenceId, withUserId, processFetch]);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        fetchMessages(false);
    }, [fetchMessages, user]);

    useEffect(() => {
        if (!user) return;
        const id = setInterval(() => {
            const echo  = getEcho(localStorage.getItem('token'));
            const state = echo?.connector?.pusher?.connection?.state;
            if (state !== 'connected') fetchMessages(true);
        }, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchMessages, user]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const echo = getEcho(token);
        const ch   = echo.private(`user.${user.id}`);

        ch.listen('.NotificationCreated', ({ notification }) => {
            if (notification?.type !== 'message') return;
            const d = notification.data ?? {};
            if (String(d.context) !== String(context) || String(d.reference_id) !== String(referenceId)) return;
            if (d.message?.id) {
                setMessages(prev => prev.some(m => m.id === d.message.id) ? prev : [...prev, d.message]);
                prevCountRef.current += 1;
                setNewCount(c => c + 1);
                setTimeout(() => setNewCount(0), 4000);
                processFetch([d.message]);
                // If the server signals there's an image but Reverb dropped it (payload
                // exceeded max_message_size), re-fetch to get the full message with image_url.
                if (d.has_image && !d.message.image_url) {
                    fetchMessages(true);
                }
            } else {
                fetchMessages(true);
            }
        });

        ch.listen('.MessageDelivered', ({ message_ids, delivered_at }) => {
            const idSet = new Set(message_ids);
            setMessages(prev => prev.map(m => idSet.has(m.id) && !m.delivered_at ? { ...m, delivered_at } : m));
        });

        ch.listen('.MessageSeen', ({ message_ids, seen_at }) => { applySeen(message_ids, seen_at); });

        return () => {
            try { ch.stopListening('.NotificationCreated'); } catch {}
            try { ch.stopListening('.MessageDelivered'); } catch {}
            try { ch.stopListening('.MessageSeen'); } catch {}
        };
    }, [user?.id, context, referenceId, fetchMessages, applySeen, processFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSend = async (content, imageUrl = null) => {
        if (!user) { onGuestAction?.(); return; }
        setSending(true);
        try {
            const res = await sendMessage({
                receiver_id:  receiverId,
                context,
                reference_id: referenceId,
                content:      content || '',
                image_url:    imageUrl || undefined,
            });
            setMessages(prev => [...prev, res.data]);
            prevCountRef.current += 1;
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Failed to send message.', 'error');
        } finally {
            setSending(false);
        }
    };

    if (!user) {
        return (
            <div className="chat-box">
                <div className="chat-guest-gate">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <strong style={{ color: 'var(--text)', fontFamily: 'Syne', fontSize: '0.9rem' }}>Sign in to chat</strong>
                    <p>Create an account or log in to send a message to this clinic.</p>
                    <Button variant="primary" size="sm" onClick={() => onGuestAction?.()}>Sign in</Button>
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
