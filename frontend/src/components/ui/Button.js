import Spinner from '../Spinner';

export default function Button({
    children,
    variant = 'primary',
    size,
    loading = false,
    type = 'button',
    onClick,
    disabled,
    style,
    className = '',
    ...rest
}) {
    const cls = [
        'ui-btn',
        `ui-btn--${variant}`,
        size ? `ui-btn--${size}` : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={cls}
            onClick={onClick}
            disabled={disabled || loading}
            style={style}
            {...rest}
        >
            {loading && <Spinner />}
            {children}
        </button>
    );
}
