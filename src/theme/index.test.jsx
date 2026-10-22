import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import Fretboard from "../fretboard";

afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe("Theme", () => {
    it("follows the system setting by default", () => {
        render(<Fretboard />);

        expect(screen.getByLabelText("Auto")).toBeChecked();
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it("remembers a chosen theme and forgets it when set back to Auto", async () => {
        const user = userEvent.setup();
        render(<Fretboard />);

        await user.click(screen.getByLabelText("Dark"));
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(localStorage.getItem("theme")).toBe("dark");

        await user.click(screen.getByLabelText("Auto"));
        expect(document.documentElement.dataset.theme).toBeUndefined();
        expect(localStorage.getItem("theme")).toBeNull();
    });

    it("starts with the saved theme", () => {
        localStorage.setItem("theme", "light");
        render(<Fretboard />);

        expect(screen.getByLabelText("Light")).toBeChecked();
        expect(document.documentElement.dataset.theme).toBe("light");
    });
});
