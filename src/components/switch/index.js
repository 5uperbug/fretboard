import React from "react";

import "./_index.scss";

const Switch = ({ name, checked, onChange, disabled }) => {
    return (
        <div className="switch switch-small" onClick={e => onChange(!checked)}>
            <input
                type="checkbox"
                className="switch-checkbox"
                name={name}
                id={name}
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                disabled={disabled}
            />
            <label className="switch-label" htmlFor={name}>
                <span className="switch-inner" />
                <span className="switch-switch" />
            </label>
        </div>
    );
}

export default Switch;