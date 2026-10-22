import Fret from "./Fret";
import { BORDER, STRING_SPACING } from "./geometry";

const GuitarString = ({
    name,
    index,
    firstFret,
    lastFret,
    isSelected,
    isFocusable,
    onToggleFret,
    showNoteNames,
    showNoteLabels,
}) => {
    const renderFrets = () => {
        const frets = [];

        // The open string, then the frets in the window.
        const offsets = [0];
        for (let i = firstFret; i <= lastFret; i++) {
            offsets.push(i);
        }
        for (const i of offsets) {
            frets.push(
                <Fret
                    offset={i}
                    key={i}
                    stringIndex={index}
                    stringName={name}
                    firstFret={firstFret}
                    selected={isSelected(i)}
                    focusable={isFocusable(i)}
                    onToggle={() => onToggleFret(i)}
                    showNoteNames={showNoteNames}
                    showNoteLabels={showNoteLabels}
                />
            );
        }
        return frets;
    };

    return (
        <g className="string" transform={`translate(0, ${BORDER + index * STRING_SPACING})`}>
            {renderFrets()}
        </g>
    );
}

export default GuitarString;
