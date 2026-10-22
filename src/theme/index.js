import { useEffect, useState } from "react";

// "system" follows the OS setting; "light" and "dark" override it.
export const THEMES = ["system", "light", "dark"];
const STORAGE_KEY = "theme";

export const readStoredTheme = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return THEMES.includes(stored) ? stored : "system";
    } catch {
        // Storage can be blocked, e.g. in some private windows.
        return "system";
    }
};

// index.html sets data-theme before the first paint so the page doesn't flash;
// this keeps it in sync when the choice changes.
export const useTheme = () => {
    const [theme, setTheme] = useState(readStoredTheme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "system") {
            delete root.dataset.theme;
        } else {
            root.dataset.theme = theme;
        }
        try {
            if (theme === "system") {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, theme);
            }
        } catch {
            // Not remembered, but still applied for this visit.
        }
    }, [theme]);

    return [theme, setTheme];
};
