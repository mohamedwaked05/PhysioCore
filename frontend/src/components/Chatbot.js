import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessInjury } from '../api/public';
import '../styles/chatbot.css';

const WELCOME = {
    role: 'assistant',
    content: "Hi! I'm PhysioCore's injury assessment assistant. Describe your pain or injury and I'll help you understand what might be going on.",
    time: new Date(),
};

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

function EcgIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-6 4 12 2-6h10"
                stroke="white" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Chatbot() {
    const [open, setOpen]               = useState(false);
    const [messages, setMessages]       = useState([WELCOME]);
    const [input, setInput]             = useState('');
    const [loading, setLoading]         = useState(false);
    const [assessmentDone, setAssessmentDone] = useState(false);

    const listRef  = useRef(null);
    const inputRef = useRef(null);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    /* Auto-scroll to latest message */
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
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
            if (Math.abs(window.scrollY - savedY) > 4) {
                window.scrollTo(0, savedY);
            }
            if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        }, 100);
    };

    const autoResize = (el) => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 100) + 'px';
    };

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg    = { role: 'user', content: text, time: new Date() };
        const nextMsgs   = [...messages, userMsg];

        setMessages(nextMsgs);
        setInput('');
        setLoading(true);

        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            const apiPayload = nextMsgs.map(({ role, content }) => ({ role, content }));
            const { data }   = await assessInjury(apiPayload);

            const botMsg = { role: 'assistant', content: data.message, time: new Date() };
            setMessages(prev => [...prev, botMsg]);

            /* Detect end of assessment — system prompt closes with "PhysioCore." */
            if (
                nextMsgs.filter(m => m.role === 'user').length >= 4 &&
                data.message.toLowerCase().includes('physiocore')
            ) {
                setAssessmentDone(true);
            }
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                    time: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages]);

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

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
                        <div className="cb-header-avatar">
                            <EcgIcon />
                        </div>
                        <div>
                            <div className="cb-header-name">PhysioCore Assistant</div>
                            <div className="cb-header-sub">Injury Assessment</div>
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
                            <div className="cb-msg-bubble">{msg.content}</div>
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
                                Browse Clinics →
                            </button>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="cb-input-area">
                    <textarea
                        ref={inputRef}
                        className="cb-input"
                        value={input}
                        rows={1}
                        placeholder="Describe your symptoms…"
                        onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                        onKeyDown={handleKey}
                        onFocus={handleInputFocus}
                        aria-label="Message input"
                    />
                    <button
                        className="cb-send"
                        onClick={send}
                        disabled={!input.trim() || loading}
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </>
    );
}
