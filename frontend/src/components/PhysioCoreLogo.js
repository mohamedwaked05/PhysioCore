export default function PhysioCoreLogo({ textColor }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: '#0891b2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0,
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            </div>
            <span style={{
                fontSize: 15, fontWeight: 600,
                fontFamily: "'Syne', sans-serif",
                color: textColor || 'inherit',
            }}>PhysioCore</span>
        </div>
    );
}
