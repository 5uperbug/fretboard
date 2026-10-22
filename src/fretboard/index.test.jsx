import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Fretboard from ".";

const getFret = (stringIndex, fret) =>
    document.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);

const markedNotes = (container) =>
    [...container.querySelectorAll(".marker")].map((el) => el.textContent);

describe("Fretboard", () => {
    it("marks a fret on click and unmarks it on a second click", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);

        await user.click(getFret(0, 3));
        expect(markedNotes(container)).toEqual(["G"]);
        expect(getFret(0, 3)).toHaveAttribute("aria-pressed", "true");

        await user.click(getFret(0, 3));
        expect(markedNotes(container)).toEqual([]);
    });

    it("names each fret for screen readers", () => {
        render(<Fretboard />);

        expect(screen.getByRole("button", { name: "String 1, open, E" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "String 2, fret 5, E" })).toBeInTheDocument();
    });

    it("moves between frets with the arrow keys and marks one with Space", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);

        // One tab stop for the whole board, straight after the controls.
        screen.getByRole("button", { name: "Clear marks" }).focus();
        await user.tab();
        expect(getFret(0, 0)).toHaveFocus();

        await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
        expect(getFret(1, 2)).toHaveFocus();
        expect(getFret(1, 2)).toHaveAttribute("tabindex", "0");
        expect(getFret(0, 0)).toHaveAttribute("tabindex", "-1");

        await user.keyboard(" ");
        expect(markedNotes(container)).toEqual(["C#"]);

        await user.keyboard("{End}");
        expect(getFret(1, 15)).toHaveFocus();
        await user.keyboard("{ArrowRight}{ArrowUp}{ArrowUp}");
        expect(getFret(0, 15)).toHaveFocus();
    });

    it("keeps marks when the last fret shrinks and grows again", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const input = screen.getByLabelText("Last fret");

        expect(input).toHaveValue(15);

        await user.click(getFret(0, 3));
        await user.click(getFret(5, 12));
        expect(markedNotes(container)).toEqual(["G", "E"]);

        await user.clear(input);
        await user.type(input, "5");
        expect(markedNotes(container)).toEqual(["G"]);

        await user.clear(input);
        await user.type(input, "15");
        expect(markedNotes(container)).toEqual(["G", "E"]);
    });

    it("clamps a typed last fret to the allowed range when it loses focus", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const input = screen.getByLabelText("Last fret");
        const fretCount = () => container.querySelectorAll(".fret-numbers text").length;

        await user.clear(input);
        await user.type(input, "40");
        expect(fretCount()).toBe(15);
        await user.tab();
        expect(input).toHaveValue(24);
        expect(fretCount()).toBe(24);

        await user.clear(input);
        await user.type(input, "2{Enter}");
        expect(input).toHaveValue(5);
        expect(fretCount()).toBe(5);

        await user.clear(input);
        await user.tab();
        expect(input).toHaveValue(5);
    });

    it("draws position dots up to the last fret", () => {
        const { container } = render(<Fretboard />);

        // 3, 5, 7, 9, 15 and the double dot at 12.
        expect(container.querySelectorAll(".inlays circle")).toHaveLength(7);
    });

    it("clears every mark and can undo it", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);

        await user.click(getFret(0, 3));
        await user.click(getFret(4, 2));
        await user.click(screen.getByRole("button", { name: "Clear marks" }));

        expect(markedNotes(container)).toEqual([]);
        expect(screen.getByRole("status")).toHaveTextContent("Fretboard cleared");

        await user.click(screen.getByRole("button", { name: "Undo" }));
        expect(markedNotes(container)).toEqual(["G", "B"]);
    });

    it("hides the status message after a while", async () => {
        vi.useFakeTimers();
        try {
            render(<Fretboard />);
            fireEvent.click(getFret(0, 3));
            fireEvent.click(screen.getByRole("button", { name: "Clear marks" }));
            expect(screen.getByRole("status")).toHaveTextContent("Fretboard cleared");

            act(() => vi.advanceTimersByTime(8000));
            expect(screen.getByRole("status")).toBeEmptyDOMElement();
        } finally {
            vi.useRealTimers();
        }
    });

    it("says so when the browser can't copy images", async () => {
        const user = userEvent.setup();
        render(<Fretboard />);
        vi.stubGlobal("ClipboardItem", undefined);

        await user.click(screen.getByRole("button", { name: "Copy image" }));

        expect(screen.getByRole("status")).toHaveTextContent("can't copy images");
        vi.unstubAllGlobals();
    });

    it("names the open string on the nut and shows all notes when asked", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const stringNames = [...container.querySelectorAll(".string-name")].map((el) => el.textContent);
        const labels = () => [...container.querySelectorAll(".label")].map((el) => el.textContent);

        expect(stringNames).toEqual(["E", "B", "G", "D", "A", "E"]);
        expect(labels()).toEqual([]);

        await user.click(screen.getByText("Show all notes"));

        expect(screen.getByLabelText("Show all notes")).toBeChecked();
        expect(labels().slice(0, 3)).toEqual(["F", "F#", "G"]);
    });

    it("toggles a switch from the keyboard", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const checkbox = screen.getByLabelText("Names on marks");

        await user.click(getFret(0, 3));
        checkbox.focus();
        await user.keyboard(" ");

        expect(checkbox).not.toBeChecked();
        expect(markedNotes(container)).toEqual([""]);
    });
});
