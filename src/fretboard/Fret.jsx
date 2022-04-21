import React, { useState } from "react";
import { getFretName } from "../utils";

const Fret = ({ offset, stringName }) => {
    const [selected, setSelected] = useState(true);

    const handleClick = () => {
        setSelected(!selected);
    };

    const renderLayer = () => {
        return (
            <div className={`layer-${selected ? '0' : '1'}`}>
                {getFretName(stringName, offset)}
            </div>
        );
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