import { useEffect, useState } from 'react';
import { getProfile } from '../api/client';
import { getClinicProfile } from '../api/clinic';

// Module-level cache — survives component remounts within the same browser session.
// Reset automatically when the page reloads (e.g. after logout).
let _cachedUrl  = undefined; // undefined = not fetched yet, null = no photo set
let _cachedRole = null;

export function useProfilePhoto(role) {
    const [photoUrl, setPhotoUrl] = useState(() => {
        // 1. In-memory hit — instant, no flicker between page navigations
        if (_cachedRole === role && _cachedUrl !== undefined) {
            return _cachedUrl;
        }
        // 2. localStorage seed — instant on page refresh
        return localStorage.getItem('pc-photo') || null;
    });

    useEffect(() => {
        if (!role) return;

        // Already fetched this session — skip the API call entirely
        if (_cachedRole === role && _cachedUrl !== undefined) {
            setPhotoUrl(_cachedUrl);
            return;
        }

        const request = role === 'client' ? getProfile() : getClinicProfile();
        request
            .then(res => {
                const url = res.data.profile_photo_url ?? null;
                _cachedUrl  = url;
                _cachedRole = role;
                if (url) localStorage.setItem('pc-photo', url);
                else     localStorage.removeItem('pc-photo');
                setPhotoUrl(url);
            })
            .catch(() => {});
    }, [role]);

    return photoUrl;
}

// Call after a successful profile photo update so the next render picks up the new URL.
export function invalidateProfilePhoto() {
    _cachedUrl  = undefined;
    _cachedRole = null;
    localStorage.removeItem('pc-photo');
}
