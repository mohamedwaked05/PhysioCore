import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('App error boundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', gap: '0.85rem',
                    fontFamily: 'Inter, sans-serif', color: '#374151',
                }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                        stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <circle cx="12" cy="16" r="0.6" fill="#ef4444"/>
                    </svg>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Something went wrong</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                        Please refresh the page to continue.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.45rem 1.2rem', borderRadius: '8px',
                            background: '#3E4772', color: 'white', border: 'none',
                            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                        }}
                    >
                        Refresh page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
