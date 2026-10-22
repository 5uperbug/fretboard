import { THEMES } from "../../theme";
import "./_index.scss";

const LABELS = { system: "Auto", light: "Light", dark: "Dark" };

// A row of radio buttons styled as one segmented control.
const ThemeToggle = ({ theme, onChange }) => (
    <fieldset className="theme-toggle">
        <legend>Theme</legend>
        {THEMES.map((value) => (
            <label key={value}>
                <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={theme === value}
                    onChange={() => onChange(value)}
                />
                <span>{LABELS[value]}</span>
            </label>
        ))}
    </fieldset>
);

export default ThemeToggle;
