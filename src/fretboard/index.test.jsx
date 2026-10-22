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
        screen.getByLabelText("Last fret").focus();
        await user.tab();
        expect(getFret(0, 0)).toHaveFocus();

        await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
        expect(getFret(1, 2)).toHaveFocus();
        expect(getFret(1, 2)).toHaveAttribute("tabindex", "0");
        expect(getFret(0, 0)).toHaveAttribute("tabindex", "-1");

        await user.keyboard(" ");
        expect(markedNotes(container)).toEqual(["C#"]);

        await user.keyboard("{End}");
        expect(getFret(1, 12)).toHaveFocus();
        await user.keyboard("{ArrowRight}{ArrowUp}{ArrowUp}");
        expect(getFret(0, 12)).toHaveFocus();
    });

    it("keeps marks when the last fret shrinks and grows again", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const input = screen.getByLabelText("Last fret");

        expect(input).toHaveValue(12);

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
        expect(fretCount()).toBe(12);
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

        // 3, 5, 7, 9 and the double dot at 12.
        expect(container.querySelectorAll(".inlays circle")).toHaveLength(6);
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

        await user.click(screen.getByRole("button", { name: "All notes" }));

        expect(screen.getByRole("button", { name: "All notes" })).toHaveAttribute("aria-pressed", "true");
        expect(labels().slice(0, 3)).toEqual(["F", "F#", "G"]);
    });

    it("toggles a display setting from the keyboard", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const toggle = screen.getByRole("button", { name: "Names on marks" });

        await user.click(getFret(0, 3));
        toggle.focus();
        await user.keyboard(" ");

        expect(toggle).toHaveAttribute("aria-pressed", "false");
        expect(markedNotes(container)).toEqual([""]);
    });

    describe("instruments and tunings", () => {
        const stringNames = (container) =>
            [...container.querySelectorAll(".string-name")].map((el) => el.textContent);

        // The pickers live in a panel that opens from the tuning summary.
        const renderOpen = async () => {
            const user = userEvent.setup();
            const result = render(<Fretboard />);
            await user.click(screen.getByRole("button", { expanded: false }));
            return { user, ...result };
        };

        it("opens the pickers from a summary of the tuning and closes them again", async () => {
            const user = userEvent.setup();
            render(<Fretboard />);
            const summary = screen.getByRole("button", { expanded: false });

            expect(summary).toHaveTextContent("Guitar, 6 strings · StandardE A D G B E");
            expect(screen.queryByRole("group", { name: "Instrument and tuning" })).not.toBeInTheDocument();

            await user.click(summary);
            expect(summary).toHaveAttribute("aria-expanded", "true");
            expect(screen.getByRole("group", { name: "Instrument and tuning" })).toBeVisible();

            await user.selectOptions(screen.getByLabelText("Tuning"), "Drop D");
            expect(summary).toHaveTextContent("Guitar, 6 strings · Drop DD A D G B E");

            await user.click(screen.getByRole("button", { name: "Done" }));
            expect(summary).toHaveAttribute("aria-expanded", "false");
            expect(summary).toHaveFocus();
        });

        it.each([
            ["bass-4", ["G", "D", "A", "E"], 6],
            ["bass-5", ["G", "D", "A", "E", "B"], 6],
            ["guitar-7", ["E", "B", "G", "D", "A", "E", "B"], 6],
            ["guitar-8", ["E", "B", "G", "D", "A", "E", "B", "F#"], 6],
        ])("draws %s in standard tuning", async (id, names, dots) => {
            const { user, container } = await renderOpen();

            await user.selectOptions(screen.getByLabelText("Instrument"), id);

            expect(stringNames(container)).toEqual(names);
            expect(container.querySelectorAll(".string")).toHaveLength(names.length);
            expect(container.querySelectorAll(".inlays circle")).toHaveLength(dots);
            expect(screen.getByLabelText("Tuning")).toHaveDisplayValue("Standard");
            const svg = container.querySelector("svg.fretboard");
            expect(Number(svg.getAttribute("height"))).toBe(2 + names.length * 35 + 35);
        });

        it("keeps inlays between strings and centred on the neck", async () => {
            const { user, container } = await renderOpen();
            const dotLines = () => [...container.querySelectorAll(".inlays circle")]
                .map((el) => (Number(el.getAttribute("cy")) - 1) / 35);

            await user.selectOptions(screen.getByLabelText("Instrument"), "bass-4");
            // Single dots on line 2, the double at 12 on lines 1 and 3.
            expect(new Set(dotLines())).toEqual(new Set([1, 2, 3]));

            await user.selectOptions(screen.getByLabelText("Instrument"), "guitar-7");
            expect(new Set(dotLines())).toEqual(new Set([2, 3, 5]));
            expect(dotLines().every(Number.isInteger)).toBe(true);
        });

        it("switches to a preset tuning and back", async () => {
            const { user, container } = await renderOpen();

            await user.selectOptions(screen.getByLabelText("Tuning"), "Drop D");
            expect(stringNames(container)).toEqual(["E", "B", "G", "D", "A", "D"]);
            expect(screen.getByRole("button", { name: "String 6, fret 2, E" })).toBeInTheDocument();

            await user.selectOptions(screen.getByLabelText("Tuning"), "Standard");
            expect(stringNames(container)).toEqual(["E", "B", "G", "D", "A", "E"]);
        });

        it("retunes single strings into a custom tuning, kept per instrument", async () => {
            const { user, container } = await renderOpen();

            await user.selectOptions(screen.getByLabelText("String 1 tuning"), "D");
            await user.selectOptions(screen.getByLabelText("String 6 tuning"), "C");
            expect(stringNames(container)).toEqual(["D", "B", "G", "D", "A", "C"]);
            expect(screen.getByLabelText("Tuning")).toHaveDisplayValue("Custom");

            await user.selectOptions(screen.getByLabelText("Instrument"), "bass-4");
            expect(stringNames(container)).toEqual(["G", "D", "A", "E"]);

            await user.selectOptions(screen.getByLabelText("Instrument"), "guitar-6");
            expect(stringNames(container)).toEqual(["D", "B", "G", "D", "A", "C"]);
        });

        it("keeps marks on the same strings, hiding ones the instrument doesn't have", async () => {
            const { user, container } = await renderOpen();
            const instrument = screen.getByLabelText("Instrument");

            await user.click(getFret(0, 3));
            await user.click(getFret(5, 3));
            expect(markedNotes(container)).toEqual(["G", "G"]);

            await user.selectOptions(instrument, "guitar-7");
            expect(markedNotes(container)).toEqual(["G", "G"]);
            await user.click(getFret(6, 3));

            await user.selectOptions(instrument, "bass-4");
            expect(markedNotes(container)).toEqual(["A#"]);

            await user.selectOptions(instrument, "guitar-7");
            expect(markedNotes(container)).toEqual(["G", "G", "D"]);
        });

        it("moves the keyboard focus onto every string of a bigger board", async () => {
            const { user } = await renderOpen();

            await user.selectOptions(screen.getByLabelText("Instrument"), "guitar-8");
            getFret(0, 0).focus();
            await user.keyboard("{ArrowDown>9/}");
            expect(getFret(7, 0)).toHaveFocus();

            await user.selectOptions(screen.getByLabelText("Instrument"), "bass-4");
            expect(getFret(3, 0)).toHaveAttribute("tabindex", "0");
        });
    });
});
