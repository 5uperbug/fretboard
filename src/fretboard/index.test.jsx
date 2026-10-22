import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Fretboard from ".";

// Frets are plain divs with no accessible role, so find them by class.
const getFret = (container, stringIndex, fret) =>
    container.querySelectorAll(".fretboard .string")[stringIndex].querySelectorAll(".fret")[fret];

const markedNotes = (container) =>
    [...container.querySelectorAll(".layer-1")].map((el) => el.textContent);

describe("Fretboard", () => {
    it("marks a fret on click and unmarks it on a second click", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);

        await user.click(getFret(container, 0, 3));
        expect(markedNotes(container)).toEqual(["G"]);

        await user.click(getFret(container, 0, 3));
        expect(markedNotes(container)).toEqual([]);
    });

    it("keeps marked frets when the fret range shrinks and grows again", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const slider = screen.getByLabelText("Last fret");

        await user.click(getFret(container, 0, 3));
        await user.click(getFret(container, 5, 12));
        expect(markedNotes(container)).toEqual(["G", "E"]);

        fireEvent.change(slider, { target: { value: "5" } });
        expect(markedNotes(container)).toEqual(["G"]);

        fireEvent.change(slider, { target: { value: "15" } });
        expect(markedNotes(container)).toEqual(["G", "E"]);
    });

    it("clears every marked fret once confirmed", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

        await user.click(getFret(container, 0, 3));
        await user.click(getFret(container, 4, 2));
        await user.click(screen.getByRole("button", { name: "Clear Fretboard" }));

        expect(confirm).toHaveBeenCalledOnce();
        expect(markedNotes(container)).toEqual([]);
    });

    it("toggles a switch by clicking its text", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const labels = () => [...container.querySelectorAll(".layer-0")].map((el) => el.textContent);

        expect(labels()).not.toContain("E");

        await user.click(screen.getByText("Show note labels"));

        expect(screen.getByLabelText("Show note labels")).toBeChecked();
        expect(labels()[0]).toBe("E");
    });

    it("toggles a switch from the keyboard", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        const checkbox = screen.getByLabelText("Show note names");

        await user.click(getFret(container, 0, 3));
        checkbox.focus();
        await user.keyboard(" ");

        expect(checkbox).not.toBeChecked();
        expect(markedNotes(container)).toEqual([""]);
    });

    it("keeps marked frets when clearing is cancelled", async () => {
        const user = userEvent.setup();
        const { container } = render(<Fretboard />);
        vi.spyOn(window, "confirm").mockReturnValue(false);

        await user.click(getFret(container, 4, 2));
        await user.click(screen.getByRole("button", { name: "Clear Fretboard" }));

        expect(markedNotes(container)).toEqual(["B"]);
    });
});
