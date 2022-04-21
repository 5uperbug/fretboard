const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'G#'];


export const getFretName = (stringName, offset = 0) => {
    if (offset === 0) {
        return stringName;
    }

    const idx = noteNames.indexOf(stringName);
    return noteNames[(idx + offset) % 11];
}