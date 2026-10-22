import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
    cleanup();
    // The board saves itself and writes its link to the address bar.
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
});
