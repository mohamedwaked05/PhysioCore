import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LogoutButton() {
    const { logout } = useAuth();
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="logout-confirm">
                <span className="logout-confirm-label">Sign out?</span>
                <button className="logout-confirm-yes" onClick={logout}>Confirm</button>
                <button className="logout-confirm-cancel" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
        );
    }

    return (
        <button className="client-logout-btn" onClick={() => setConfirming(true)}>
            Sign out
        </button>
    );
}
