// Sizes in px, matching the earlier HTML layout so the board looks the same.
export const BORDER = 1;
export const NUT_WIDTH = 38;
export const FRET_WIRE_WIDTH = 3;
// A fret's width includes the fret wire on its left edge.
export const FRET_WIDTH = 73;
export const STRING_SPACING = 35;
export const FRET_NUMBERS_HEIGHT = 35;

// Positions count from `firstFret`, the first fret drawn after the nut, so the
// board can show a window such as frets 5 to 9.
export const fretX = (fret, firstFret = 1) =>
    fret === 0 ? BORDER : BORDER + NUT_WIDTH + (fret - firstFret) * FRET_WIDTH;

export const fretWidth = (fret) => (fret === 0 ? NUT_WIDTH : FRET_WIDTH);

// Middle of the nut, or of the space between a fret's wire and the next one.
export const fretCenterX = (fret, firstFret = 1) =>
    fret === 0
        ? BORDER + NUT_WIDTH / 2
        : fretX(fret, firstFret) + FRET_WIRE_WIDTH + (FRET_WIDTH - FRET_WIRE_WIDTH) / 2;
