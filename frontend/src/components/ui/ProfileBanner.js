import { useRef } from 'react';

function CameraIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </svg>
    );
}

/**
 * LinkedIn-style profile banner.
 * Props:
 *   coverUrl      - current cover photo URL (or null)
 *   avatarSlot    - ReactNode rendered as the overlapping avatar
 *   editable      - show the camera edit button
 *   onCoverChange - (File) => void  called when user picks a new cover file
 */
export default function ProfileBanner({ coverUrl, avatarSlot, editable = false, onCoverChange }) {
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onCoverChange?.(file);
        e.target.value = '';
    };

    return (
        <div className="pb-banner-wrap">
            {/* Cover area */}
            <div
                className="pb-banner"
                style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
            />

            {/* Avatar overlapping the bottom-left of the banner */}
            <div className="pb-avatar-anchor">
                {avatarSlot}
            </div>

            {/* Camera edit button — bottom-right of banner */}
            {editable && (
                <>
                    <button
                        type="button"
                        className="pb-edit-btn"
                        onClick={() => fileRef.current?.click()}
                        title="Change cover photo"
                        aria-label="Change cover photo"
                    >
                        <CameraIcon />
                        <span>Edit cover</span>
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        style={{ display: 'none' }}
                        onChange={handleFile}
                    />
                </>
            )}
        </div>
    );
}
