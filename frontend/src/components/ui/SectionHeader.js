export default function SectionHeader({ title, action }) {
    return (
        <div className="ui-section-header">
            <span className="ui-section-title">{title}</span>
            {action}
        </div>
    );
}
