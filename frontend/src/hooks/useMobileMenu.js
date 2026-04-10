import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export default function useMobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const open  = useCallback(() => setIsOpen(true),  []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(o => !o), []);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on route change (link click navigates, then this fires)
    useEffect(() => {
        close();
    }, [location.pathname, close]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, close]);

    return { isOpen, open, close, toggle };
}
