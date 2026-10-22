export const NOTE_NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];


export const getFretName = (stringName, offset = 0) => {
    if (offset === 0) {
        return stringName;
    }

    const idx = NOTE_NAMES.indexOf(stringName);
    return NOTE_NAMES[(idx + offset) % 12];
}
