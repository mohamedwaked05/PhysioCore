import { useRef } from 'react';

const SIZES = { sm: 'ui-avatar--sm', md: 'ui-avatar--md', lg: 'ui-avatar--lg', xl: 'ui-avatar--xl' };

export default function Avatar({ src, name = '', size = 'md', editable = false, onFileChange }) {
    const inputRef = useRef();

    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        onFileChange?.(file);
    };

    return (
        <div className={`ui-avatar ${SIZES[size] ?? SIZES.md}`}>
            {src
                ? <img src={src} alt={name} />
                : <span>{initials || '?'}</span>
            }
            {editable && (
                <>
                    <div
                        className="ui-avatar-upload"
                        onClick={() => inputRef.current.click()}
                        title="Change photo"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFile}
                        style={{ display: 'none' }}
                    />
                </>
            )}
        </div>
    );
}
