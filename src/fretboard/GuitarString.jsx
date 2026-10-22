import Fret from "./Fret";
import { BORDER, STRING_SPACING } from "./geometry";

const GuitarString = ({
    name,
    index,
    noOfFrets,
    isSelected,
    isFocusable,
    onToggleFret,
    showNoteNames,
    showNoteLabels,
}) => {
    const renderFrets = () => {
        const frets = [];

        for (let i = 0; i <= noOfFrets; i++) {
            frets.push(
                <Fret
                    offset={i}
                    key={i}
                    stringIndex={index}
                    stringName={name}
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
