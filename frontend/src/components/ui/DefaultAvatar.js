export default function DefaultAvatar({ gender = 'male', size = 40, className = '' }) {
    const isFemale = gender === 'female';
    const bg       = isFemale ? '#7c3aed' : '#3b5bdb';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            className={className}
            style={{ display: 'block', flexShrink: 0 }}
        >
            <circle cx="20" cy="20" r="20" fill={bg} />
            {/* Head */}
            <circle cx="20" cy="15" r="7" fill="rgba(255,255,255,0.9)" />
            {/* Shoulders — slightly wider for male */}
            {isFemale ? (
                <path d="M8 38 Q8 28 20 28 Q32 28 32 38" fill="rgba(255,255,255,0.9)" />
            ) : (
                <path d="M6 38 Q6 27 20 27 Q34 27 34 38" fill="rgba(255,255,255,0.9)" />
            )}
        </svg>
    );
}
