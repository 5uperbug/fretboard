import React from "react";
import ReactDom from "react-dom";

import "./style.scss";

import Fretboard from "./fretboard";

const App = () => {
    return (
        <div className="container">
            <Fretboard />
        </div>
    );
};

ReactDom.render(<App />, document.querySelector('#root'));