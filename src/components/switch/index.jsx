import "./_index.scss";

// The whole switch, text included, is one <label> around a real checkbox, so
// clicking the text toggles it and it works from the keyboard.
const Switch = ({ label, name, checked, onChange, disabled }) => {
    return (
        <label className="switch-group">
            {label}&nbsp;
            <span className="switch switch-small">
                <input
                    type="checkbox"
                    className="switch-checkbox"
                    name={name}
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className="switch-label">
                    <span className="switch-inner" />
                    <span className="switch-switch" />
                </span>
            </span>
        </label>
    );
}

export default Switch;
