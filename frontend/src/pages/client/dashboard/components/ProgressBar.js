import { useEffect, useState } from 'react';

export default function ProgressBar({ value = 0, label, showLabel = true, color = 'primary', size = 'md' }) {
    const [width, setWidth] = useState(0);

    // Animate fill on mount
    useEffect(() => {
        const t = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), 80);
        return () => clearTimeout(t);
    }, [value]);

    return (
        <div className="cd-progress">
            {showLabel && (
                <div className="cd-progress-header">
                    {label && <span className="cd-progress-label">{label}</span>}
                    <span className="cd-progress-pct">{value}%</span>
                </div>
            )}
            <div className={`cd-progress-track cd-progress-track--${size}`}>
                <div
                    className={`cd-progress-fill cd-progress-fill--${color}`}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
}
