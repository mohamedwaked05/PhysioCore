function CheckIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
}

export default function ExerciseItem({ exercise, completed = false, onToggle }) {
    const metaParts = [];
    if (exercise.sets)  metaParts.push(`${exercise.sets} sets`);
    if (exercise.reps)  metaParts.push(`× ${exercise.reps} reps`);
    if (exercise.duration) metaParts.push(exercise.duration);

    return (
        <div
            className={`cd-exercise-item${completed ? ' cd-exercise-item--done' : ''}`}
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? onToggle?.() : null}
            aria-pressed={completed}
        >
            <div className={`cd-exercise-checkbox${completed ? ' cd-exercise-checkbox--checked' : ''}`}>
                {completed && <CheckIcon />}
            </div>

            <div className="cd-exercise-body">
                <div className="cd-exercise-name">{exercise.name}</div>
                {metaParts.length > 0 && (
                    <div className="cd-exercise-meta">{metaParts.join(' · ')}</div>
                )}
                {exercise.tags?.length > 0 && (
                    <div className="cd-exercise-tags">
                        {exercise.tags.map(tag => (
                            <span key={tag} className="cd-exercise-tag">{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {exercise.difficulty && (
                <span className={`cd-exercise-difficulty cd-exercise-difficulty--${exercise.difficulty}`}>
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                </span>
            )}
        </div>
    );
}
