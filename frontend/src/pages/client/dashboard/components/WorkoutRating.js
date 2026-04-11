import { useState } from 'react';

const LABELS = ['', 'Too easy', 'Easy', 'Just right', 'Hard', 'Too hard'];

function StarIcon({ filled }) {
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
    );
}

export default function WorkoutRating() {
    const [hover,     setHover]     = useState(0);
    const [rating,    setRating]    = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const active = hover || rating;

    if (submitted) {
        return (
            <div className="cd-rating cd-rating--done">
                <span className="cd-rating-check">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </span>
                <span className="cd-rating-done-text">
                    Workout rated {rating}/5 — great work!
                </span>
            </div>
        );
    }

    return (
        <div className="cd-rating">
            <div className="cd-rating-label">How was today's workout?</div>
            <div className="cd-rating-stars">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        className={`cd-rating-star${n <= active ? ' cd-rating-star--active' : ''}`}
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`Rate ${n} out of 5`}
                    >
                        <StarIcon filled={n <= active} />
                    </button>
                ))}
            </div>
            {active > 0 && (
                <p className="cd-rating-hint">{LABELS[active]}</p>
            )}
            {rating > 0 && (
                <button
                    type="button"
                    className="ui-btn ui-btn--primary ui-btn--sm"
                    onClick={() => setSubmitted(true)}
                >
                    Save Rating
                </button>
            )}
        </div>
    );
}
