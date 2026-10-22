import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted rather than from Google Fonts, so image export can embed the same files.
import "@fontsource/ubuntu-mono/400.css";
import "@fontsource/ubuntu-mono/700.css";
import "./style.scss";

import App from "./App";

createRoot(document.querySelector('#root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
