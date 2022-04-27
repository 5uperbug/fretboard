import React, { useState } from "react";
import { getFretName } from "../utils";

const Fret = ({ offset, stringName, properties }) => {
    const [selected, setSelected] = useState(false);
    const { showNoteNames, showNoteLabels } = properties;
    let clickTimeout

    const handleClick = () => {
        setSelected(!selected);
    };

    const handleDoubleClick = () => {
        console.log('double click');
    }

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
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            className={`fret ${offset === 0 ? 'fretzero' : ''}`}
        >
            {renderLayer()}
        </div>
    );
};

export default Fret;