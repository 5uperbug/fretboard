import { useEffect, useRef, useState } from "react";
import GuitarString from "./GuitarString";
import { renderPng } from "./export";
import {
    BORDER,
    FRET_NUMBERS_HEIGHT,
    FRET_WIDTH,
    FRET_WIRE_WIDTH,
    NUT_WIDTH,
    STRING_SPACING,
    fretCenterX,
    fretWidth,
    fretX,
} from "./geometry";

import Switch from "../components/switch";
import './_index.scss';

const fretKey = (stringIndex, fret) => `${stringIndex}:${fret}`;

const STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'];
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];
const STATUS_TIMEOUT = 4000;
const UNDO_TIMEOUT = 8000;
const MIN_LAST_FRET = 5;
const MAX_LAST_FRET = 24;

// Arrow keys move between frets; Home and End jump along the string.
const KEY_MOVES = {
    ArrowLeft: (s, f) => [s, f - 1],
    ArrowRight: (s, f) => [s, f + 1],
    ArrowUp: (s, f) => [s - 1, f],
    ArrowDown: (s, f) => [s + 1, f],
    Home: (s) => [s, 0],
    End: (s, f, lastFret) => [s, lastFret],
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isFocusVisible = (el) => {
    try {
        return el.matches(':focus-visible');
    } catch {
        return true;
    }
};

// Which sides of a horizontally scrolling element have more content hidden, so
// the edges can fade out as a hint that the board scrolls.
const useScrollEdges = (ref, contentWidth) => {
    const [edges, setEdges] = useState({ start: false, end: false });

    useEffect(() => {
        const el = ref.current;
        const update = () => setEdges({
            start: el.scrollLeft > 1,
            end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
        });
        update();
        el.addEventListener("scroll", update, { passive: true });
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
        observer?.observe(el);
        return () => {
            el.removeEventListener("scroll", update);
            observer?.disconnect();
        };
    }, [ref, contentWidth]);

    return edges;
};

const Fretboard = () => {
    const [showNoteNames, setShowNoteNames] = useState(true);
    const [showNoteLabels, setShowNoteLabels] = useState(false);
    // Marked frets as "string:fret" keys. Kept here rather than in each Fret so
    // marks survive the fret range shrinking and can be cleared in one update.
    const [selectedFrets, setSelectedFrets] = useState(() => new Set());
    const [lastFret, setLastFret] = useState(15);
    // What is typed in the Last fret box while it has focus. Numbers in range
    // apply straight away; anything else is clamped or undone on blur.
    const [lastFretDraft, setLastFretDraft] = useState(null);
    // The fret that is in the tab order, and whether to draw a focus ring on it.
    const [activeCell, setActiveCell] = useState({ string: 0, fret: 0 });
    const [showFocusRing, setShowFocusRing] = useState(false);
    // A short message under the controls, optionally with an Undo action.
    const [status, setStatus] = useState(null);
    const statusTimer = useRef();
    const fretboardSvg = useRef();
    const fretboardContainer = useRef();

    const width = 2 * BORDER + NUT_WIDTH + lastFret * FRET_WIDTH;
    const boardHeight = 2 * BORDER + STRINGS.length * STRING_SPACING;
    const height = boardHeight + FRET_NUMBERS_HEIGHT;
    const scrollEdges = useScrollEdges(fretboardContainer, width);
    const activeFret = Math.min(activeCell.fret, lastFret);

    useEffect(() => () => clearTimeout(statusTimer.current), []);

    const showStatus = (message, { undo, error = false } = {}) => {
        clearTimeout(statusTimer.current);
        setStatus({ message, undo, error });
        statusTimer.current = setTimeout(() => setStatus(null), undo ? UNDO_TIMEOUT : STATUS_TIMEOUT);
    };

    const toggleFret = (key) => {
        setSelectedFrets((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const focusFret = (string, fret) => {
        setActiveCell({ string, fret });
        fretboardSvg.current
            .querySelector(`.fret[data-string="${string}"][data-fret="${fret}"]`)
            ?.focus();
    };

    const handleBoardKeyDown = (e) => {
        const fret = e.target.closest?.('.fret');
        if (!fret) {
            return;
        }
        const string = Number(fret.dataset.string);
        const offset = Number(fret.dataset.fret);

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFret(fretKey(string, offset));
        } else if (KEY_MOVES[e.key]) {
            e.preventDefault();
            const [nextString, nextFret] = KEY_MOVES[e.key](string, offset, lastFret);
            focusFret(clamp(nextString, 0, STRINGS.length - 1), clamp(nextFret, 0, lastFret));
        }
    };

    const handleBoardFocus = (e) => {
        const fret = e.target.closest?.('.fret');
        if (fret) {
            setActiveCell({ string: Number(fret.dataset.string), fret: Number(fret.dataset.fret) });
            setShowFocusRing(isFocusVisible(fret));
        }
    };

    const handleBoardBlur = (e) => {
        if (!fretboardSvg.current.contains(e.relatedTarget)) {
            setShowFocusRing(false);
        }
    };

    const renderStrings = () => {
        return STRINGS.map((string, idx) => (
            <GuitarString
                key={idx}
                name={string}
                index={idx}
                noOfFrets={lastFret}
                isSelected={(fret) => selectedFrets.has(fretKey(idx, fret))}
                isFocusable={(fret) => idx === activeCell.string && fret === activeFret}
                onToggleFret={(fret) => toggleFret(fretKey(idx, fret))}
                showNoteNames={showNoteNames}
                showNoteLabels={showNoteLabels}
            />
        ));
    };

    const renderFretWires = () => {
        const wires = [];

        for (let i = 1; i <= lastFret; i++) {
            wires.push(
                <rect
                    key={i}
                    className="fret-wire"
                    x={fretX(i)}
                    y={BORDER}
                    width={FRET_WIRE_WIDTH}
                    height={STRINGS.length * STRING_SPACING}
                    fill="#323232"
                    fillOpacity={0.5}
                />
            );
        }
        return wires;
    };

    // Position dots in the middle of the neck, doubled at the octaves. They sit
    // on the lines between strings, clear of the markers.
    const renderInlays = () => {
        const dot = (fret, betweenStrings) => (
            <circle
                key={`${fret}:${betweenStrings}`}
                cx={fretCenterX(fret)}
                cy={BORDER + betweenStrings * STRING_SPACING}
                r={4}
                fill="#dccaa6"
            />
        );
        return [
            ...SINGLE_INLAYS.filter((fret) => fret <= lastFret).map((fret) => dot(fret, 3)),
            ...DOUBLE_INLAYS.filter((fret) => fret <= lastFret).flatMap((fret) => [dot(fret, 2), dot(fret, 4)]),
        ];
    };

    const renderFretNumbers = () => {
        const numbers = [];

        for (let i = 1; i <= lastFret; i++) {
            numbers.push(
                <text
                    key={i}
                    x={fretCenterX(i)}
                    y={boardHeight + FRET_NUMBERS_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={15}
                    fill="#6b6b6b"
                >
                    {i}
                </text>
            );
        }
        return numbers;
    };

    const renderFocusRing = () => (
        <rect
            className="focus-ring"
            x={fretX(activeFret) + 1.5}
            y={BORDER + activeCell.string * STRING_SPACING + 1.5}
            width={fretWidth(activeFret) - 3}
            height={STRING_SPACING - 3}
            rx={3}
            fill="none"
            stroke="#0072a3"
            strokeWidth={3}
            pointerEvents="none"
        />
    );

    const handleCopyToClipboard = () => {
        if (!navigator.clipboard?.write || !window.ClipboardItem) {
            showStatus("This browser can't copy images. Use Download instead.", { error: true });
            return;
        }
        // Hand ClipboardItem the pending PNG instead of waiting for it first:
        // Safari only allows a clipboard write that starts straight from the click.
        navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': renderPng(fretboardSvg.current) })
        ]).then(
            () => showStatus("Copied to clipboard"),
            () => showStatus("Couldn't copy the image. Try Download instead.", { error: true }),
        );
    };

    const handleDownload = () => {
        renderPng(fretboardSvg.current).then((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'fretsketch.png';
            link.click();
            // Give the browser a moment to start the download before freeing the blob.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, () => showStatus("Couldn't create the image.", { error: true }));
    }

    const handleLastFretChange = (e) => {
        const text = e.target.value;
        const value = Number(text);
        setLastFretDraft(text);
        if (text !== "" && Number.isInteger(value) && value >= MIN_LAST_FRET && value <= MAX_LAST_FRET) {
            setLastFret(value);
        }
    };

    const commitLastFret = () => {
        if (lastFretDraft === null) {
            return;
        }
        const value = Math.round(Number(lastFretDraft));
        if (lastFretDraft !== "" && Number.isFinite(value)) {
            setLastFret(clamp(value, MIN_LAST_FRET, MAX_LAST_FRET));
        }
        setLastFretDraft(null);
    };

    const handleClear = () => {
        const previous = selectedFrets;
        if (previous.size === 0) {
            return;
        }
        setSelectedFrets(new Set());
        showStatus("Fretboard cleared", {
            undo: () => {
                setSelectedFrets(previous);
                showStatus("Marks restored");
            },
        });
    }

    return (
        <div className="block">
            <div className="control-panel">
                <div className="control-group" role="group" aria-label="Export">
                    <button className="button" onClick={handleCopyToClipboard}>
                        Copy image
                    </button>
                    <button className="button" onClick={handleDownload}>
                        Download PNG
                    </button>
                </div>
                <div className="control-group" role="group" aria-label="Display">
                    <Switch label="Names on marks" checked={showNoteNames} onChange={setShowNoteNames} />
                    <Switch label="Show all notes" checked={showNoteLabels} onChange={setShowNoteLabels} />
                    <div className="number-group">
                        <label htmlFor="last-fret">Last fret</label>
                        <input
                            id="last-fret"
                            type="number"
                            inputMode="numeric"
                            value={lastFretDraft ?? lastFret}
                            step={1}
                            min={MIN_LAST_FRET}
                            max={MAX_LAST_FRET}
                            onChange={handleLastFretChange}
                            onBlur={commitLastFret}
                            onKeyDown={(e) => e.key === "Enter" && commitLastFret()}
                        />
                    </div>
                </div>
                <div className="control-group control-group-end">
                    <button className="button button-danger" onClick={handleClear}>
                        Clear marks
                    </button>
                </div>
            </div>
            <div className={`status ${status?.error ? 'status-error' : ''}`} role="status">
                {status && (
                    <>
                        {status.message}
                        {status.undo && (
                            <button className="button button-small" onClick={status.undo}>
                                Undo
                            </button>
                        )}
                    </>
                )}
            </div>
            <div
                ref={fretboardContainer}
                className={[
                    "fretboard-container",
                    scrollEdges.start && "more-start",
                    scrollEdges.end && "more-end",
                ].filter(Boolean).join(" ")}
            >
                <svg
                    ref={fretboardSvg}
                    className="fretboard"
                    xmlns="http://www.w3.org/2000/svg"
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ "--board-width": `${width}px` }}
                    fontFamily="'Ubuntu Mono', monospace"
                    role="group"
                    aria-label="Fretboard. Use the arrow keys to move between frets and Space to mark one."
                    onKeyDown={handleBoardKeyDown}
                    onFocus={handleBoardFocus}
                    onBlur={handleBoardBlur}
                >
                    <defs>
                        <clipPath id="fretboard-outline">
                            <rect x={0.5} y={0.5} width={width - 1} height={boardHeight - 1} rx={5} />
                        </clipPath>
                    </defs>
                    {/* Gives exported images the page's background. */}
                    <rect className="board-bg" width={width} height={height} fill="#fff" />
                    <g clipPath="url(#fretboard-outline)">
                        {renderStrings()}
                        <g className="inlays" pointerEvents="none">
                            {renderInlays()}
                        </g>
                        <g className="fret-wires">
                            {renderFretWires()}
                        </g>
                    </g>
                    <rect
                        x={0.5}
                        y={0.5}
                        width={width - 1}
                        height={boardHeight - 1}
                        rx={5}
                        className="board-outline"
                        fill="none"
                        stroke="#aeaeae"
                    />
                    <g className="fret-numbers">
                        {renderFretNumbers()}
                    </g>
                    {showFocusRing && renderFocusRing()}
                </svg>
            </div>
        </div>
    );
}

export default Fretboard;
