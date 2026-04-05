export default function Skeleton({ width, height, radius, circle, style, className = '' }) {
    return (
        <div
            className={`ui-skeleton ${className}`}
            style={{
                width:        width  ?? '100%',
                height:       height ?? '1rem',
                borderRadius: circle ? '50%' : (radius ?? '6px'),
                flexShrink:   0,
                ...style,
            }}
        />
    );
}
