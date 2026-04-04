export default function Card({ children, flush = false, style, className = '' }) {
    return (
        <div
            className={`ui-card${flush ? ' ui-card--flush' : ''} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}
