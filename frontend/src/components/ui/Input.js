export function Field({ children, className = '' }) {
    return <div className={`ui-field ${className}`}>{children}</div>;
}

export function Label({ children, hint }) {
    return (
        <label className="ui-label">
            {children}
            {hint && <span className="ui-label-hint">({hint})</span>}
        </label>
    );
}

export function Input({ error, ...props }) {
    return (
        <input
            className={`ui-input${error ? ' ui-input--error' : ''}`}
            {...props}
        />
    );
}

export function Textarea({ error, ...props }) {
    return (
        <textarea
            className={`ui-textarea${error ? ' ui-textarea--error' : ''}`}
            {...props}
        />
    );
}

export function FieldError({ message }) {
    if (!message) return null;
    return <span className="ui-field-error">{message}</span>;
}
