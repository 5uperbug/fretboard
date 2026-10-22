import { describe, expect, it } from "vitest";

import { getFretName } from "./index";

describe("getFretName", () => {
    it("returns the open string's name at fret 0", () => {
        expect(getFretName("E")).toBe("E");
        expect(getFretName("G", 0)).toBe("G");
    });

    it("counts semitones up from the open string", () => {
        expect(getFretName("E", 3)).toBe("G");
        expect(getFretName("A", 2)).toBe("B");
        expect(getFretName("B", 1)).toBe("C");
    });

    it("wraps around after an octave", () => {
        expect(getFretName("E", 12)).toBe("E");
        expect(getFretName("D", 24)).toBe("D");
        expect(getFretName("G#", 1)).toBe("A");
    });
});
