import { getFretName } from "../utils";

const Fret = ({ offset, stringName, selected, onToggle, showNoteNames, showNoteLabels }) => {
    const renderLayer = () => {
        if (selected) {
            return (
                <div className="layer-1">
                    {showNoteNames ? getFretName(stringName, offset) : ''}
                </div>
            );
        } else {
            return (
                <div className="layer-0">
                    {showNoteLabels ? getFretName(stringName, offset) : ''}
                </div>
            );
        }
    }

    return (
        <div
            onClick={onToggle}
            className={`fret ${offset === 0 ? 'fretzero' : ''}`}
        >
            {renderLayer()}
        </div>
    );
};

export default Fret;
