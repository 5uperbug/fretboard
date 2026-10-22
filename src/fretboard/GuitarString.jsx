import Fret from "./Fret";

const GuitarString = ({ name, noOfFrets, isSelected, onToggleFret, showNoteNames, showNoteLabels }) => {
    const renderFrets = () => {
        const frets = [];

        for (let i = 0; i <= noOfFrets; i++) {
            frets.push(
                <Fret
                    offset={i}
                    key={i}
                    stringName={name}
                    selected={isSelected(i)}
                    onToggle={() => onToggleFret(i)}
                    showNoteNames={showNoteNames}
                    showNoteLabels={showNoteLabels}
                />
            );
        }
        return frets;
    };

    return (
        <div className="string">
            {renderFrets()}
        </div>
    );
}

export default GuitarString;
