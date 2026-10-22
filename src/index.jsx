import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./style.scss";

import Fretboard from "./fretboard";

createRoot(document.querySelector('#root')).render(
    <StrictMode>
        <div className="container">
            <Fretboard />
        </div>
    </StrictMode>
);
