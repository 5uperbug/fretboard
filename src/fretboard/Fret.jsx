import React from "react";

const Fret = ({ offset, stringName }) => {
    return (
        <div className={`fret ${offset === 0 ? 'fretzero' : ''}`}>
            <div className="layer-0">
                {offset === 0 ? stringName : offset}
            </div>
        </div>
    );
};

export default Fret;