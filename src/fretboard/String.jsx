import React from "react";

import Fret from "./Fret";

const String = ({ name, index, noOfFrets }) => {
    const renderFrets = () => {
        const frets = [];

        for (let i = 0; i <= noOfFrets; i++) {
            frets.push(<Fret offset={i} key={i} stringName={name} />);
        }
        return frets;
    };

    return (
        <>
            <div className="string">
                {renderFrets()}
            </div>
        </>
    );
}

export default String;