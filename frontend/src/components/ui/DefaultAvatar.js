export default function DefaultAvatar({ gender = 'male', size = 40, className = '' }) {
    const isFemale = gender === 'female' || gender === 'Female' || gender === 'FEMALE';
    const bg       = isFemale ? '#ec4899' : '#3b82f6';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            className={className}
            style={{ display: 'block', flexShrink: 0 }}
        >
            <circle cx="24" cy="24" r="24" fill={bg} />
            <circle cx="24" cy="18" r="8" fill="rgba(255,255,255,0.9)" />
            {isFemale ? (
                <>
                    <path d="M11 42 Q11 30 24 30 Q37 30 37 42" fill="rgba(255,255,255,0.9)"/>
                    <path d="M15 30 Q12 34 11 38" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M33 30 Q36 34 37 38" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"/>
                </>
            ) : (
                <ellipse cx="24" cy="38" rx="13" ry="10" fill="rgba(255,255,255,0.9)"/>
            )}
        </svg>
    );
}
