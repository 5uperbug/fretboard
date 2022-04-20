import React, { useState } from "react";

const Fret = ({ offset, stringName }) => {
    const [selected, setSelected] = useState(true);

    const handleClick = () => {
        setSelected(!selected);
    };

    const renderLayer = () => {
        if (selected) {
            return (
                <div className="layer-0">
                    {offset === 0 ? stringName : offset}
                </div>
            );
        } else {
            return (
                <div className="layer-1">
                    {offset === 0 ? stringName : offset}
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