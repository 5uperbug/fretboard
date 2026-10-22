import { describe, expect, it } from "vitest";

import { DEFAULT_SKETCH, fromHash, isSameSketch, toHash } from "./sketch";

describe("sketch links", () => {
    it("round-trips a sketch through a link", () => {
        const sketch = {
            ...DEFAULT_SKETCH,
            instrumentId: "guitar-6",
            tunings: { "guitar-6": ["D#", "G#", "C#", "F#", "A#", "D#"] },
            marks: ["0:5", "3:7"],
            firstFret: 5,
            lastFret: 9,
            showNoteNames: false,
            showNoteLabels: true,
        };

        const hash = toHash(sketch);
        expect(hash).toBe("#i=guitar-6&t=DsGsCsFsAsDs&f=5-9&m=0.5,3.7&n=0&a=1");
        expect(fromHash(hash)).toEqual(sketch);
    });

    it("leaves out what a fresh board already has", () => {
        expect(toHash(DEFAULT_SKETCH)).toBe("#i=guitar-6&f=1-12");
    });

    it("ignores hashes that aren't sketches", () => {
        expect(fromHash("")).toBeNull();
        expect(fromHash("#top")).toBeNull();
    });

    it("falls back to defaults for damaged parts of a link", () => {
        const sketch = fromHash("#i=banjo&t=XYZ&f=30-2&m=0.3,oops&n=maybe");

        expect(sketch).toEqual({ ...DEFAULT_SKETCH, marks: ["0:3"] });
    });

    it("keeps the window at least five frets wide", () => {
        expect(fromHash("#i=bass-4&f=20-22")).toMatchObject({ firstFret: 20, lastFret: 24 });
    });

    it("compares sketches by what they draw", () => {
        expect(isSameSketch(
            { ...DEFAULT_SKETCH, marks: ["1:2", "0:3"] },
            { ...DEFAULT_SKETCH, marks: ["0:3", "1:2"], tunings: { "bass-4": ["D", "A", "D", "G"] } },
        )).toBe(true);
        expect(isSameSketch(DEFAULT_SKETCH, { ...DEFAULT_SKETCH, lastFret: 15 })).toBe(false);
    });
});
