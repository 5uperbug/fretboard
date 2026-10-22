import { NOTE_NAMES } from "../utils";
import { DEFAULT_INSTRUMENT, INSTRUMENTS, getInstrument, standardTuning } from "./instruments";

// Everything a sketch needs to be drawn again: on reload (saved in the
// browser) and from a shared link (kept in the address bar's #hash).

export const MIN_FRET = 1;
export const MAX_FRET = 24;
// The fewest frets the board shows after the nut.
export const MIN_FRETS = 5;

const STORAGE_KEY = "fretsketch:sketch";

export const DEFAULT_SKETCH = {
    instrumentId: DEFAULT_INSTRUMENT,
    tunings: {},
    marks: [],
    firstFret: 1,
    lastFret: 12,
    showNoteNames: true,
    showNoteLabels: false,
};

const isFretInRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

const isValidTuning = (instrumentId, notes) =>
    Array.isArray(notes)
    && notes.length === standardTuning(instrumentId).length
    && notes.every((note) => NOTE_NAMES.includes(note));

const isValidMark = (mark) => /^\d+:\d+$/.test(mark);

// Fills in anything missing or out of range from the defaults, so a damaged
// link or an old save still opens.
const normalize = (sketch) => {
    const result = { ...DEFAULT_SKETCH };
    if (INSTRUMENTS.some((instrument) => instrument.id === sketch.instrumentId)) {
        result.instrumentId = sketch.instrumentId;
    }
    if (sketch.tunings && typeof sketch.tunings === "object") {
        result.tunings = Object.fromEntries(
            Object.entries(sketch.tunings).filter(([id, notes]) =>
                INSTRUMENTS.some((instrument) => instrument.id === id) && isValidTuning(id, notes)),
        );
    }
    if (Array.isArray(sketch.marks)) {
        result.marks = [...new Set(sketch.marks.filter(isValidMark))];
    }
    if (isFretInRange(sketch.firstFret, MIN_FRET, MAX_FRET - MIN_FRETS + 1)) {
        result.firstFret = sketch.firstFret;
    }
    if (isFretInRange(sketch.lastFret, result.firstFret + MIN_FRETS - 1, MAX_FRET)) {
        result.lastFret = sketch.lastFret;
    } else {
        result.lastFret = Math.max(result.lastFret, result.firstFret + MIN_FRETS - 1);
    }
    if (typeof sketch.showNoteNames === "boolean") {
        result.showNoteNames = sketch.showNoteNames;
    }
    if (typeof sketch.showNoteLabels === "boolean") {
        result.showNoteLabels = sketch.showNoteLabels;
    }
    return result;
};

// "#" isn't allowed in a URL fragment, so sharps are written "Cs" in links.
const encodeNotes = (notes) => notes.join("").replaceAll("#", "s");

const decodeNotes = (text) => {
    const notes = text.match(/[A-G]s?/g) ?? [];
    return notes.join("") === text ? notes.map((note) => note.replace("s", "#")) : null;
};

// A link looks like #i=guitar-6&t=DADGBE&f=5-9&m=0.5,1.7&n=0&a=1 and only
// carries what differs from a fresh board.
export const toHash = (sketch) => {
    const parts = [`i=${sketch.instrumentId}`];
    const tuning = sketch.tunings[sketch.instrumentId];
    if (tuning && tuning.join() !== standardTuning(sketch.instrumentId).join()) {
        parts.push(`t=${encodeNotes(tuning)}`);
    }
    parts.push(`f=${sketch.firstFret}-${sketch.lastFret}`);
    if (sketch.marks.length > 0) {
        parts.push(`m=${sketch.marks.map((mark) => mark.replace(":", ".")).join(",")}`);
    }
    if (!sketch.showNoteNames) {
        parts.push("n=0");
    }
    if (sketch.showNoteLabels) {
        parts.push("a=1");
    }
    return `#${parts.join("&")}`;
};

// The sketch in a link, or null when the hash isn't one.
export const fromHash = (hash) => {
    const text = hash.replace(/^#/, "");
    if (!text) {
        return null;
    }
    const params = Object.fromEntries(
        text.split("&").map((part) => {
            const at = part.indexOf("=");
            return at === -1 ? [part, ""] : [part.slice(0, at), decodeURIComponent(part.slice(at + 1))];
        }),
    );
    if (!params.i) {
        return null;
    }
    const instrumentId = getInstrument(params.i).id;
    const tuning = params.t ? decodeNotes(params.t) : null;
    const [firstFret, lastFret] = (params.f ?? "").split("-").map(Number);
    return normalize({
        instrumentId,
        tunings: tuning ? { [instrumentId]: tuning } : {},
        marks: params.m ? params.m.split(",").map((mark) => mark.replace(".", ":")) : [],
        firstFret,
        lastFret,
        showNoteNames: params.n !== "0",
        showNoteLabels: params.a === "1",
    });
};

export const loadSaved = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return saved && typeof saved === "object" ? normalize(saved) : null;
    } catch {
        return null;
    }
};

export const save = (sketch) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sketch));
    } catch {
        // Private browsing or full storage: the sketch just won't survive a reload.
    }
};

// Whether two sketches draw the same board.
export const isSameSketch = (a, b) => {
    const drawn = (sketch) => JSON.stringify([
        sketch.instrumentId,
        sketch.tunings[sketch.instrumentId] ?? standardTuning(sketch.instrumentId),
        [...sketch.marks].sort(),
        sketch.firstFret,
        sketch.lastFret,
        sketch.showNoteNames,
        sketch.showNoteLabels,
    ]);
    return drawn(a) === drawn(b);
};
