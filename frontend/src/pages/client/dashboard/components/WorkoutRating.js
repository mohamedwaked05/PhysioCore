const LABELS = ['', 'Too easy', 'Easy', 'Just right', 'Hard', 'Too hard'];

function StarIcon({ filled }) {
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
    );
}

// Controlled component — parent owns `value` and `onChange`
export default function WorkoutRating({ value = 0, onChange }) {
    return (
        <div className="cd-rating">
            <div className="cd-rating-label">How was today's workout?</div>
            <div className="cd-rating-stars">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        className={`cd-rating-star${n <= value ? ' cd-rating-star--active' : ''}`}
                        onClick={() => onChange(n)}
                        aria-label={`Rate ${n} out of 5`}
                    >
                        <StarIcon filled={n <= value} />
                    </button>
                ))}
            </div>
            {value > 0 && (
                <p className="cd-rating-hint">{LABELS[value]}</p>
            )}
        </div>
    );
}
