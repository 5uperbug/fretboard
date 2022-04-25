import React, { useState } from "react";
import { getFretName } from "../utils";

const Fret = ({ offset, stringName, properties }) => {
    const [selected, setSelected] = useState(false);
    const { showNoteNames, showNoteLabels } = properties;

    const handleClick = () => {
        setSelected(!selected);
    };

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
            className={`fret ${offset === 0 ? 'fretzero' : ''}`}
        >
            {renderLayer()}
        </div>
    );
};

export default Fret;