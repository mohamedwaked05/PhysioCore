import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessInjury } from '../api/public';
import '../styles/chatbot.css';

const WELCOME = {
    role: 'assistant',
    content: "Hi! I'm PhysioCore's sports injury AI. Describe what happened or send a photo — I'll give you a fast assessment.",
    time: new Date(),
};

/* Parse clinic block from AI response: returns { text, clinics } */
function parseResponse(raw) {
    const start = raw.indexOf('---CLINICS---');
    if (start === -1) return { text: raw, clinics: [] };

    const text    = raw.slice(0, start).trimEnd();
    const block   = raw.slice(start + 13); // after ---CLINICS---
    const end     = block.indexOf('---END---');
    const lines   = block.slice(0, end === -1 ? undefined : end).trim().split('\n');
    const clinics = lines.map(l => { try { return JSON.parse(l.trim()); } catch { return null; } }).filter(Boolean);
    return { text, clinics };
}

const IMAGE_PLACEHOLDER = 'Please analyze this injury photo.';

function fmt(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingDots() {
    return (
        <div className="cb-typing" aria-label="Typing">
            <span /><span /><span />
        </div>
    );
}

function ChatBubbleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

function CameraIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}

function EcgIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-6 4 12 2-6h10"
                stroke="white" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* Compress image via canvas to max 800px wide at 75% JPEG quality */
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const maxW   = 800;
                const scale  = Math.min(1, maxW / img.width);
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

export default function Chatbot({ embedded = false }) {
    const [open, setOpen]               = useState(false);
    const [messages, setMessages]       = useState([WELCOME]);
    const [input, setInput]             = useState('');
    const [loading, setLoading]         = useState(false);
    const [assessmentDone, setAssessmentDone] = useState(false);
    const [selectedImage, setSelectedImage]   = useState(null);

    const listRef        = useRef(null);
    const inputRef       = useRef(null);
    const panelRef       = useRef(null);
    const cameraInputRef = useRef(null);
    const navigate       = useNavigate();

    /* Open chatbot from external event (landing page card) */
    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('openChatbot', handler);
        return () => window.removeEventListener('openChatbot', handler);
    }, []);

    /* Auto-scroll to latest message */
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, loading]);

    /* iOS keyboard: shrink panel to visible viewport height */
    useEffect(() => {
        if (!open) return;
        const vv = window.visualViewport;
        if (!vv) return;
        const adjust = () => {
            if (panelRef.current && window.innerWidth <= 768) {
                panelRef.current.style.height = vv.height + 'px';
                panelRef.current.style.top    = vv.offsetTop + 'px';
            }
        };
        adjust();
        vv.addEventListener('resize', adjust);
        vv.addEventListener('scroll', adjust);
        return () => {
            vv.removeEventListener('resize', adjust);
            vv.removeEventListener('scroll', adjust);
        };
    }, [open]);

    const handleOpen = () => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 150);
    };

    const handleClose = () => {
        setOpen(false);
        if (panelRef.current) {
            panelRef.current.style.height = '';
            panelRef.current.style.top    = '';
        }
    };

    const handleInputFocus = () => {
        const savedY = window.scrollY;
        setTimeout(() => {
            if (Math.abs(window.scrollY - savedY) > 4) window.scrollTo(0, savedY);
            if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 100);
    };

    const autoResize = (el) => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 100) + 'px';
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const compressed = await compressImage(file);
        setSelectedImage(compressed);
    };

    const send = useCallback(async () => {
        const text = input.trim();
        if ((!text && !selectedImage) || loading) return;

        const userMsg = {
            role:    'user',
            content: text || IMAGE_PLACEHOLDER,
            time:    new Date(),
            ...(selectedImage ? { image: selectedImage } : {}),
        };

        const nextMsgs = [...messages, userMsg];
        setMessages(nextMsgs);
        setInput('');
        setSelectedImage(null);
        setLoading(true);
        if (inputRef.current) inputRef.current.style.height = 'auto';

        try {
            const apiPayload = nextMsgs.map(({ role, content, image }) => ({
                role,
                content,
                ...(image ? { image } : {}),
            }));
            const { data } = await assessInjury(apiPayload);

            const { text, clinics } = parseResponse(data.message);
            const botMsg = {
                role: 'assistant',
                content: text,
                clinics: clinics.length > 0 ? clinics : undefined,
                time: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);

            if (clinics.length > 0 || text.toLowerCase().includes('physiocore')) {
                setAssessmentDone(true);
            }
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    role:    'assistant',
                    content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                    time:    new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, selectedImage, loading, messages]);

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const canSend = (!!input.trim() || !!selectedImage) && !loading;

    /* ── Embedded inline mode (landing page) ───────────────── */
    if (embedded) {
        return (
            <div className="cb-embedded">
                <div className="cb-messages" ref={listRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`cb-msg cb-msg--${msg.role === 'user' ? 'user' : 'bot'}`}>
                            <div className="cb-msg-bubble">
                                {msg.image && <img src={msg.image} alt="Injury" className="cb-msg-image" />}
                                {msg.content && msg.content !== IMAGE_PLACEHOLDER && <span>{msg.content}</span>}
                            </div>
                            {msg.clinics?.length > 0 && (
                                <div className="cb-clinics-wrap">
                                    <p className="cb-clinics-label">Clinics that treat this</p>
                                    {msg.clinics.map((c, j) => (
                                        <div key={j} className="cb-clinic-card"
                                            onClick={() => navigate(`/clinics/${c.id}`)}
                                            role="button" tabIndex={0}
                                            onKeyDown={e => e.key === 'Enter' && navigate(`/clinics/${c.id}`)}>
                                            <div className="cb-clinic-name">{c.name}</div>
                                            {c.address   && <div className="cb-clinic-address">📍 {c.address}</div>}
                                            {c.specialty && <div className="cb-clinic-specialty">{c.specialty}</div>}
                                            <div className="cb-clinic-cta">View Clinic →</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="cb-msg-time">{fmt(msg.time)}</div>
                        </div>
                    ))}
                    {loading && (
                        <div className="cb-msg cb-msg--bot">
                            <div className="cb-msg-bubble"><TypingDots /></div>
                        </div>
                    )}
                    {assessmentDone && !loading && (
                        <div className="cb-browse-wrap">
                            <button className="cb-browse-btn" onClick={() => navigate('/clinics')}>
                                Browse All Clinics →
                            </button>
                        </div>
                    )}
                </div>

                <div className={`cb-input-area${selectedImage ? ' cb-input-area--preview' : ''}`}>
                    {selectedImage && (
                        <div className="cb-img-preview-row">
                            <div className="cb-img-preview-thumb">
                                <img src={selectedImage} alt="Preview" />
                                <button className="cb-img-preview-remove" onClick={() => setSelectedImage(null)} aria-label="Remove image">
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="cb-input-row">
                        <button className="cb-camera" onClick={() => cameraInputRef.current?.click()}
                            aria-label="Attach photo" title="Attach injury photo" type="button">
                            <CameraIcon />
                        </button>
                        <input ref={cameraInputRef} type="file" accept="image/*"
                            style={{ display: 'none' }} onChange={handleImageSelect} />
                        <textarea ref={inputRef} className="cb-input" value={input} rows={1}
                            placeholder={selectedImage ? 'Add a description…' : 'Describe your symptoms…'}
                            onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                            onKeyDown={handleKey} onFocus={handleInputFocus} aria-label="Message input" />
                        <button className="cb-send" onClick={send} disabled={!canSend} aria-label="Send message">
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Floating toggle */}
            <button
                className={`cb-toggle${open ? ' cb-toggle--hidden' : ''}`}
                onClick={handleOpen}
                aria-label="Open injury assessment chat"
            >
                <span className="cb-toggle-icon"><ChatBubbleIcon /></span>
                Assess Injury
            </button>

            {/* Chat panel */}
            <div
                ref={panelRef}
                className={`cb-panel${open ? ' cb-panel--open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Injury assessment assistant"
            >
                {/* Header */}
                <div className="cb-header">
                    <button className="cb-back-btn" onClick={handleClose} aria-label="Close chat">
                        <BackIcon />
                    </button>
                    <div className="cb-header-info">
                        <div className="cb-header-avatar"><EcgIcon /></div>
                        <div>
                            <div className="cb-header-name">PhysioCore Assistant</div>
                            <div className="cb-header-sub">Injury Assessment · Vision enabled</div>
                        </div>
                    </div>
                    <button className="cb-close-btn" onClick={handleClose} aria-label="Close chat">
                        <CloseIcon />
                    </button>
                </div>

                {/* Messages */}
                <div className="cb-messages" ref={listRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`cb-msg cb-msg--${msg.role === 'user' ? 'user' : 'bot'}`}>
                            <div className="cb-msg-bubble">
                                {msg.image && (
                                    <img src={msg.image} alt="Injury" className="cb-msg-image" />
                                )}
                                {msg.content && msg.content !== IMAGE_PLACEHOLDER && (
                                    <span>{msg.content}</span>
                                )}
                            </div>

                            {/* Clinic recommendation cards */}
                            {msg.clinics?.length > 0 && (
                                <div className="cb-clinics-wrap">
                                    <p className="cb-clinics-label">Clinics that treat this</p>
                                    {msg.clinics.map((c, j) => (
                                        <div
                                            key={j}
                                            className="cb-clinic-card"
                                            onClick={() => { handleClose(); navigate(`/clinics/${c.id}`); }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => e.key === 'Enter' && navigate(`/clinics/${c.id}`)}
                                        >
                                            <div className="cb-clinic-name">{c.name}</div>
                                            {c.address && <div className="cb-clinic-address">📍 {c.address}</div>}
                                            {c.specialty && <div className="cb-clinic-specialty">{c.specialty}</div>}
                                            <div className="cb-clinic-cta">View Clinic →</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="cb-msg-time">{fmt(msg.time)}</div>
                        </div>
                    ))}

                    {loading && (
                        <div className="cb-msg cb-msg--bot">
                            <div className="cb-msg-bubble"><TypingDots /></div>
                        </div>
                    )}

                    {assessmentDone && !loading && (
                        <div className="cb-browse-wrap">
                            <button
                                className="cb-browse-btn"
                                onClick={() => { handleClose(); navigate('/clinics'); }}
                            >
                                Browse All Clinics →
                            </button>
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className={`cb-input-area${selectedImage ? ' cb-input-area--preview' : ''}`}>
                    {/* Image preview */}
                    {selectedImage && (
                        <div className="cb-img-preview-row">
                            <div className="cb-img-preview-thumb">
                                <img src={selectedImage} alt="Preview" />
                                <button
                                    className="cb-img-preview-remove"
                                    onClick={() => setSelectedImage(null)}
                                    aria-label="Remove image"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="cb-input-row">
                        {/* Camera button */}
                        <button
                            className="cb-camera"
                            onClick={() => cameraInputRef.current?.click()}
                            aria-label="Attach photo"
                            title="Attach injury photo"
                            type="button"
                        >
                            <CameraIcon />
                        </button>

                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageSelect}
                        />

                        <textarea
                            ref={inputRef}
                            className="cb-input"
                            value={input}
                            rows={1}
                            placeholder={selectedImage ? 'Add a description…' : 'Describe your symptoms…'}
                            onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                            onKeyDown={handleKey}
                            onFocus={handleInputFocus}
                            aria-label="Message input"
                        />

                        <button
                            className="cb-send"
                            onClick={send}
                            disabled={!canSend}
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
