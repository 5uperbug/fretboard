import { useEffect, useRef, useState } from "react";
import GuitarString from "./GuitarString";
import { renderPng } from "./export";
import { INSTRUMENTS, TUNING_NOTES, findTuning, getInstrument, standardTuning } from "./instruments";
import {
    DEFAULT_SKETCH,
    MAX_FRET,
    MIN_FRET,
    MIN_FRETS,
    fromHash,
    isSameSketch,
    loadSaved,
    save,
    toHash,
} from "./sketch";
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

import './_index.scss';

const fretKey = (stringIndex, fret) => `${stringIndex}:${fret}`;

const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];
const STATUS_TIMEOUT = 4000;
const UNDO_TIMEOUT = 8000;

// Arrow keys move between frets; Home and End jump along the string. Left of
// the first fret in the window is the open string.
const KEY_MOVES = {
    ArrowLeft: (s, f, { firstFret }) => [s, f === firstFret ? 0 : f - 1],
    ArrowRight: (s, f, { firstFret }) => [s, f === 0 ? firstFret : f + 1],
    ArrowUp: (s, f) => [s - 1, f],
    ArrowDown: (s, f) => [s + 1, f],
    Home: (s) => [s, 0],
    End: (s, f, { lastFret }) => [s, lastFret],
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Inlays sit on the lines between strings (line 1 is between the top two
// strings), centred on the neck. With an odd number of strings the middle is a
// string, so the single dot goes on the line just above it.
const inlayLines = (stringCount) => {
    const middle = stringCount / 2;
    return {
        single: Math.floor(middle),
        double: [Math.floor(middle) - 1, Math.ceil(middle) + 1],
    };
};

const CUSTOM_TUNING = "custom";

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

// The sketch to start with: a shared link first, then what was there last time.
const initialSketch = () => {
    const saved = loadSaved();
    const linked = fromHash(window.location.hash);
    return {
        sketch: linked ?? saved ?? DEFAULT_SKETCH,
        // The saved sketch a link replaced, so opening a link can be undone.
        replaced: linked && saved && !isSameSketch(linked, saved) ? saved : null,
    };
};

// A fret number box. Numbers in range apply while typing; anything else is
// clamped, or undone if it isn't a number, when the box loses focus.
const FretInput = ({ id, label, value, min, max, onChange }) => {
    const [draft, setDraft] = useState(null);

    const handleChange = (e) => {
        const text = e.target.value;
        const number = Number(text);
        setDraft(text);
        if (text !== "" && Number.isInteger(number) && number >= min && number <= max) {
            onChange(number);
        }
    };

    const commit = () => {
        if (draft === null) {
            return;
        }
        const number = Math.round(Number(draft));
        if (draft !== "" && Number.isFinite(number)) {
            onChange(clamp(number, min, max));
        }
        setDraft(null);
    };

    return (
        <div className="number-group">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type="number"
                inputMode="numeric"
                value={draft ?? value}
                step={1}
                min={min}
                max={max}
                onChange={handleChange}
                onBlur={commit}
                onKeyDown={(e) => e.key === "Enter" && commit()}
            />
        </div>
    );
};

// A button that stays pressed while its setting is on.
const ToggleChip = ({ label, pressed, onChange }) => (
    <button className="chip" aria-pressed={pressed} onClick={() => onChange(!pressed)}>
        {pressed && (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
                <path d="M5 12l5 5 9-10" />
            </svg>
        )}
        {label}
    </button>
);

const Fretboard = () => {
    const [start] = useState(initialSketch);
    const [showNoteNames, setShowNoteNames] = useState(start.sketch.showNoteNames);
    const [showNoteLabels, setShowNoteLabels] = useState(start.sketch.showNoteLabels);
    // Marked frets as "string:fret" keys. Kept here rather than in each Fret so
    // marks survive the fret range shrinking and can be cleared in one update.
    const [selectedFrets, setSelectedFrets] = useState(() => new Set(start.sketch.marks));
    // The window of frets drawn after the nut.
    const [firstFret, setFirstFret] = useState(start.sketch.firstFret);
    const [lastFret, setLastFret] = useState(start.sketch.lastFret);
    const [instrumentId, setInstrumentId] = useState(start.sketch.instrumentId);
    // Each instrument's tuning, low string first, so a custom tuning is still
    // there after trying another instrument.
    const [tunings, setTunings] = useState(start.sketch.tunings);
    // Whether the instrument and tuning pickers are open under their summary.
    const [tuningOpen, setTuningOpen] = useState(false);
    // The fret that is in the tab order, and whether to draw a focus ring on it.
    const [activeCell, setActiveCell] = useState({ string: 0, fret: 0 });
    const [showFocusRing, setShowFocusRing] = useState(false);
    // A short message under the controls, optionally with an Undo action.
    // Opening a link replaces the sketch saved in this browser, so offer it back
    // (by name, as the handler isn't defined yet).
    const [status, setStatus] = useState(() => start.replaced && {
        message: "Opened a shared sketch",
        undo: "restore-saved",
    });
    const statusTimer = useRef();
    const fretboardSvg = useRef();
    const fretboardContainer = useRef();
    const tuningSummary = useRef();

    const tuning = tunings[instrumentId] ?? standardTuning(instrumentId);
    // Top to bottom as drawn: highest string first, like string numbers.
    const strings = [...tuning].reverse();
    const tuningPreset = findTuning(instrumentId, tuning);

    const sketch = {
        instrumentId,
        tunings,
        marks: [...selectedFrets],
        firstFret,
        lastFret,
        showNoteNames,
        showNoteLabels,
    };
    const hash = toHash(sketch);

    const width = 2 * BORDER + NUT_WIDTH + (lastFret - firstFret + 1) * FRET_WIDTH;
    const boardHeight = 2 * BORDER + strings.length * STRING_SPACING;
    const height = boardHeight + FRET_NUMBERS_HEIGHT;
    const scrollEdges = useScrollEdges(fretboardContainer, width);
    const activeFret = activeCell.fret === 0 ? 0 : clamp(activeCell.fret, firstFret, lastFret);
    const activeString = Math.min(activeCell.string, strings.length - 1);

    useEffect(() => () => clearTimeout(statusTimer.current), []);

    const showStatus = (message, { undo, error = false } = {}) => {
        clearTimeout(statusTimer.current);
        setStatus({ message, undo, error });
        statusTimer.current = setTimeout(() => setStatus(null), undo ? UNDO_TIMEOUT : STATUS_TIMEOUT);
    };

    const loadSketch = (next) => {
        setInstrumentId(next.instrumentId);
        setTunings((prev) => ({ ...prev, ...next.tunings }));
        setSelectedFrets(new Set(next.marks));
        setFirstFret(next.firstFret);
        setLastFret(next.lastFret);
        setShowNoteNames(next.showNoteNames);
        setShowNoteLabels(next.showNoteLabels);
    };

    // Keep the sketch for next time, and in the address bar so the page's
    // link always opens what is on screen. replaceState keeps Back working.
    // A fresh board keeps a plain address.
    const sketchJson = JSON.stringify(sketch);
    useEffect(() => {
        const current = JSON.parse(sketchJson);
        save(current);
        const target = isSameSketch(current, DEFAULT_SKETCH) ? "" : hash;
        if (window.location.hash !== target) {
            const { pathname, search } = window.location;
            window.history.replaceState(window.history.state, "", `${pathname}${search}${target}`);
        }
    }, [sketchJson, hash]);

    // A link pasted into this tab's address bar.
    useEffect(() => {
        const handleHashChange = () => {
            const linked = fromHash(window.location.hash);
            if (linked) {
                loadSketch(linked);
            }
        };
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    const restoreSaved = () => {
        loadSketch(start.replaced);
        showStatus("Your sketch is back");
    };

    // The offer to undo opening a link goes away like any other message.
    useEffect(() => {
        if (start.replaced) {
            statusTimer.current = setTimeout(() => setStatus(null), UNDO_TIMEOUT);
        }
    }, [start]);

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
            const [nextString, nextFret] = KEY_MOVES[e.key](string, offset, { firstFret, lastFret });
            focusFret(
                clamp(nextString, 0, strings.length - 1),
                nextFret === 0 ? 0 : clamp(nextFret, firstFret, lastFret),
            );
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
        return strings.map((string, idx) => (
            <GuitarString
                key={idx}
                name={string}
                index={idx}
                firstFret={firstFret}
                lastFret={lastFret}
                isSelected={(fret) => selectedFrets.has(fretKey(idx, fret))}
                isFocusable={(fret) => idx === activeString && fret === activeFret}
                onToggleFret={(fret) => toggleFret(fretKey(idx, fret))}
                showNoteNames={showNoteNames}
                showNoteLabels={showNoteLabels}
            />
        ));
    };

    const renderFretWires = () => {
        const wires = [];

        for (let i = firstFret; i <= lastFret; i++) {
            wires.push(
                <rect
                    key={i}
                    className="fret-wire"
                    x={fretX(i, firstFret)}
                    y={BORDER}
                    width={FRET_WIRE_WIDTH}
                    height={strings.length * STRING_SPACING}
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
                cx={fretCenterX(fret, firstFret)}
                cy={BORDER + betweenStrings * STRING_SPACING}
                r={4}
                fill="#dccaa6"
            />
        );
        const lines = inlayLines(strings.length);
        const shown = (fret) => fret >= firstFret && fret <= lastFret;
        return [
            ...SINGLE_INLAYS.filter(shown).map((fret) => dot(fret, lines.single)),
            ...DOUBLE_INLAYS.filter(shown).flatMap((fret) => lines.double.map((line) => dot(fret, line))),
        ];
    };

    const renderFretNumbers = () => {
        const numbers = [];

        for (let i = firstFret; i <= lastFret; i++) {
            numbers.push(
                <text
                    key={i}
                    x={fretCenterX(i, firstFret)}
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
            x={fretX(activeFret, firstFret) + 1.5}
            y={BORDER + activeString * STRING_SPACING + 1.5}
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

    const handleCopyLink = () => {
        const url = new URL(hash, window.location.href).href;
        if (!navigator.clipboard?.writeText) {
            showStatus("This browser can't copy. The link is in the address bar.", { error: true });
            return;
        }
        navigator.clipboard.writeText(url).then(
            () => showStatus("Link copied"),
            () => showStatus("Couldn't copy the link. It's in the address bar.", { error: true }),
        );
    };

    // The window always shows at least MIN_FRETS frets, so moving one end
    // pushes the other along when they would get too close.
    const handleFirstFretChange = (value) => {
        setFirstFret(value);
        setLastFret((last) => clamp(last, value + MIN_FRETS - 1, MAX_FRET));
    };

    const handleLastFretChange = (value) => {
        setLastFret(value);
        setFirstFret((first) => clamp(first, MIN_FRET, value - MIN_FRETS + 1));
    };

    // Marks belong to a string position counted from the top, so a 6-string
    // shape stays put on a 7- or 8-string, where the extra strings are added
    // underneath. Marks on strings the new instrument doesn't have are hidden,
    // not dropped, and come back on switching back, like frets past the last.
    const handleInstrumentChange = (e) => {
        setInstrumentId(e.target.value);
    };

    const setTuning = (notes) => {
        setTunings((prev) => ({ ...prev, [instrumentId]: notes }));
    };

    const handleTuningPresetChange = (e) => {
        const preset = getInstrument(instrumentId).tunings.find((t) => t.name === e.target.value);
        if (preset) {
            setTuning(preset.notes);
        }
    };

    // Strings in the tuning row are listed low to high; `lowIndex` counts from
    // the lowest string.
    const handleStringTuningChange = (lowIndex, note) => {
        setTuning(tuning.map((current, i) => (i === lowIndex ? note : current)));
    };

    const closeTuning = () => {
        setTuningOpen(false);
        tuningSummary.current.focus();
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
                <button
                    ref={tuningSummary}
                    className="button tuning-summary"
                    aria-expanded={tuningOpen}
                    aria-controls="tuning-editor"
                    onClick={() => setTuningOpen((open) => !open)}
                >
                    <span>{getInstrument(instrumentId).name} · {tuningPreset?.name ?? "Custom"}</span>
                    <span className="tuning-summary-notes">{tuning.join(" ")}</span>
                    <svg className="chevron" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
                <div
                    id="tuning-editor"
                    className="tuning-editor"
                    role="group"
                    aria-label="Instrument and tuning"
                    hidden={!tuningOpen}
                >
                    <div className="select-group">
                        <label htmlFor="instrument">Instrument</label>
                        <select id="instrument" value={instrumentId} onChange={handleInstrumentChange}>
                            {INSTRUMENTS.map((instrument) => (
                                <option key={instrument.id} value={instrument.id}>{instrument.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="select-group">
                        <label htmlFor="tuning">Tuning</label>
                        <select
                            id="tuning"
                            value={tuningPreset?.name ?? CUSTOM_TUNING}
                            onChange={handleTuningPresetChange}
                        >
                            {getInstrument(instrumentId).tunings.map((preset) => (
                                <option key={preset.name} value={preset.name}>{preset.name}</option>
                            ))}
                            {!tuningPreset && <option value={CUSTOM_TUNING}>Custom</option>}
                        </select>
                    </div>
                    <div className="select-group tuning-strings-group">
                        <span id="tuning-strings-label">Strings, low to high</span>
                        <div className="tuning-strings" role="group" aria-labelledby="tuning-strings-label">
                            {tuning.map((note, lowIndex) => {
                                const stringNumber = tuning.length - lowIndex;
                                return (
                                    <select
                                        key={`${instrumentId}:${lowIndex}`}
                                        aria-label={`String ${stringNumber} tuning`}
                                        value={note}
                                        onChange={(e) => handleStringTuningChange(lowIndex, e.target.value)}
                                    >
                                        {TUNING_NOTES.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                );
                            })}
                        </div>
                    </div>
                    <button className="button tuning-done" onClick={closeTuning}>
                        Done
                    </button>
                </div>
                <div className="display-controls" role="group" aria-label="Display">
                    <ToggleChip label="Names on marks" pressed={showNoteNames} onChange={setShowNoteNames} />
                    <ToggleChip label="All notes" pressed={showNoteLabels} onChange={setShowNoteLabels} />
                    <FretInput
                        id="first-fret"
                        label="First fret"
                        value={firstFret}
                        min={MIN_FRET}
                        max={MAX_FRET - MIN_FRETS + 1}
                        onChange={handleFirstFretChange}
                    />
                    <FretInput
                        id="last-fret"
                        label="Last fret"
                        value={lastFret}
                        min={MIN_FRET + MIN_FRETS - 1}
                        max={MAX_FRET}
                        onChange={handleLastFretChange}
                    />
                </div>
            </div>
            <div className={`status ${status?.error ? 'status-error' : ''}`} role="status">
                {status && (
                    <>
                        {status.message}
                        {status.undo && (
                            <button
                                className="button button-small"
                                onClick={status.undo === "restore-saved" ? restoreSaved : status.undo}
                            >
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
            <div className="board-actions" role="group" aria-label="Board actions">
                <button className="button button-danger" onClick={handleClear}>
                    Clear marks
                </button>
                <button className="button board-actions-export" onClick={handleCopyLink}>
                    Copy link
                </button>
                <button className="button" onClick={handleCopyToClipboard}>
                    Copy image
                </button>
                <button className="button" onClick={handleDownload}>
                    Download PNG
                </button>
            </div>
        </div>
    );
}

export default Fretboard;
