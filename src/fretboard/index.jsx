import React from "react";
import String from "./String";

import './_index.scss';

const Fretboard = () => {
    const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
    const noOfFrets = 15;

    const renderStrings = () => {
        return strings.map((string, idx) => (
            <String
                name={string}
                index={idx}
                key={idx}
                noOfFrets={noOfFrets}
            />
        ));
    };

    const renderFretNumbers = () => {
        const frets = [];

        for (let i = 0; i <= noOfFrets; i++) {
            frets.push(
                <div
                    key={i}
                    className={`fret ${i === 0 ? 'fretzero' : ''}`}
                >
                    {i === 0 ? '' : i}
                </div>
            );
        }
        return frets;
    };

    return (
        <div className="panel">
            <div className="fretboard">
                {renderStrings()}
            </div>
            <div className="fret-numbers">
                {renderFretNumbers()}
            </div>
        </div>
    );
}

export default Fretboard;