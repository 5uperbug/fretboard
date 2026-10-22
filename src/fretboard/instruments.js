import { NOTE_NAMES } from "../utils";

// Tunings are written low string to high, the way they are usually named
// ("EADGBE"). The board draws them the other way up, highest string on top.
const tuning = (notes) => notes.split(" ");

export const INSTRUMENTS = [
    {
        id: "guitar-6",
        name: "Guitar, 6 strings",
        tunings: [
            { name: "Standard", notes: tuning("E A D G B E") },
            { name: "Drop D", notes: tuning("D A D G B E") },
            { name: "Half step down", notes: tuning("D# G# C# F# A# D#") },
            { name: "DADGAD", notes: tuning("D A D G A D") },
            { name: "Open G", notes: tuning("D G D G B D") },
            { name: "Open D", notes: tuning("D A D F# A D") },
        ],
    },
    {
        id: "guitar-7",
        name: "Guitar, 7 strings",
        tunings: [
            { name: "Standard", notes: tuning("B E A D G B E") },
            { name: "Drop A", notes: tuning("A E A D G B E") },
        ],
    },
    {
        id: "guitar-8",
        name: "Guitar, 8 strings",
        tunings: [
            { name: "Standard", notes: tuning("F# B E A D G B E") },
            { name: "Drop E", notes: tuning("E B E A D G B E") },
        ],
    },
    {
        id: "bass-4",
        name: "Bass, 4 strings",
        tunings: [
            { name: "Standard", notes: tuning("E A D G") },
            { name: "Drop D", notes: tuning("D A D G") },
        ],
    },
    {
        id: "bass-5",
        name: "Bass, 5 strings",
        tunings: [
            { name: "Standard", notes: tuning("B E A D G") },
            { name: "High C", notes: tuning("E A D G C") },
        ],
    },
];

export const DEFAULT_INSTRUMENT = INSTRUMENTS[0].id;

export const getInstrument = (id) => INSTRUMENTS.find((instrument) => instrument.id === id) ?? INSTRUMENTS[0];

export const standardTuning = (id) => getInstrument(id).tunings[0].notes;

// The preset a tuning matches, if any, so the picker can say "Custom" otherwise.
export const findTuning = (id, notes) =>
    getInstrument(id).tunings.find((preset) => preset.notes.join(" ") === notes.join(" "));

// Notes in the order the tuning picker lists them, starting from C.
export const TUNING_NOTES = [...NOTE_NAMES.slice(3), ...NOTE_NAMES.slice(0, 3)];
