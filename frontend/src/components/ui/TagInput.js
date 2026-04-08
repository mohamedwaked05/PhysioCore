import { useRef, useState } from 'react';

export default function TagInput({ tags, onChange, disabled, placeholder, error }) {
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    const addTag = (raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        // Allow comma-separated batch add
        const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        const newTags = [...tags];
        parts.forEach(p => {
            if (!newTags.includes(p)) newTags.push(p);
        });
        onChange(newTags);
        setInput('');
    };

    const removeTag = (index) => {
        const newTags = tags.filter((_, i) => i !== index);
        onChange(newTags);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div>
            <div
                className={`ui-tag-input-wrap${error ? ' error' : ''}${disabled ? ' disabled' : ''}`}
                onClick={() => !disabled && inputRef.current?.focus()}
            >
                {tags.map((tag, i) => (
                    <span key={i} className="ui-tag">
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                className="ui-tag-remove"
                                onMouseDown={(e) => { e.preventDefault(); removeTag(i); }}
                                aria-label={`Remove ${tag}`}
                            >
                                ×
                            </button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        ref={inputRef}
                        className="ui-tag-add-input"
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => { if (input.trim()) addTag(input); }}
                        placeholder={tags.length === 0 ? (placeholder ?? 'Add item and press Enter') : ''}
                    />
                )}
                {disabled && tags.length === 0 && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '2px 4px' }}>—</span>
                )}
            </div>
            {!disabled && (
                <p className="ui-tag-hint">Press Enter or comma to add. Backspace to remove last.</p>
            )}
        </div>
    );
}
