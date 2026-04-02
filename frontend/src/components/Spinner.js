export default function Spinner() {
    return (
        <span style={styles.spinner} />
    );
}

const styles = {
    spinner: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        marginRight: '8px',
        verticalAlign: 'middle',
    },
};

// Inject keyframes once
const styleTag = document.createElement('style');
styleTag.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleTag);
