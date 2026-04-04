const VARIANTS = {
    pending:  'ui-badge--pending',
    approved: 'ui-badge--approved',
    rejected: 'ui-badge--rejected',
    verified: 'ui-badge--verified',
    info:     'ui-badge--info',
    neutral:  'ui-badge--neutral',
};

export default function StatusBadge({ status, label }) {
    const variant = VARIANTS[status] ?? VARIANTS.neutral;
    return (
        <span className={`ui-badge ${variant}`}>
            {label ?? status}
        </span>
    );
}
