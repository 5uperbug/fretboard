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
    fretX,
} from "./geometry";

import Switch from "../components/switch";
import ThemeToggle from "../components/theme-toggle";
import { useTheme } from "../theme";
import './_index.scss';

const fretKey = (stringIndex, fret) => `${stringIndex}:${fret}`;

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
    const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
    const fretboardSvg = useRef();
    const fretboardContainer = useRef();
    const [theme, setTheme] = useTheme();

    const width = 2 * BORDER + NUT_WIDTH + lastFret * FRET_WIDTH;
    const boardHeight = 2 * BORDER + strings.length * STRING_SPACING;
    const height = boardHeight + FRET_NUMBERS_HEIGHT;
    const scrollEdges = useScrollEdges(fretboardContainer, width);

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

    const renderStrings = () => {
        return strings.map((string, idx) => (
            <GuitarString
                key={idx}
                name={string}
                index={idx}
                noOfFrets={lastFret}
                isSelected={(fret) => selectedFrets.has(fretKey(idx, fret))}
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
                    height={strings.length * STRING_SPACING}
                    fill="#323232"
                    fillOpacity={0.5}
                />
            );
        }
        return wires;
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
                    fill="#818181"
                >
                    {i}
                </text>
            );
        }
        return numbers;
    };

    const handleCopyToClipboard = () => {
        // Hand ClipboardItem the pending PNG instead of waiting for it first:
        // Safari only allows a clipboard write that starts straight from the click.
        navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': renderPng(fretboardSvg.current) })
        ]).then(() => {
            // show a toast
        });
    };

    const handleDownload = () => {
        renderPng(fretboardSvg.current).then((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'fretboard.png';
            link.click();
            // Give the browser a moment to start the download before freeing the blob.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    }

    const handleClear = () => {
        if (window.confirm('Do you want to clear this fretboard?')) {
            setSelectedFrets(new Set());
        }
    }

    const handleShowNoteNamesChange = (checked) => {
        setShowNoteNames(checked);
    }

    const handleShowNoteLabelsChange = (checked) => {
        setShowNoteLabels(checked);
    }

    return (
        <div className="block">
            <div className="control-panel">
                <button className="button" onClick={handleCopyToClipboard}>
                    Copy to Clipboard
                </button>
                <button className="button" onClick={handleDownload}>
                    Download
                </button>
                <Switch label="Show note names" checked={showNoteNames} onChange={handleShowNoteNamesChange} />
                <Switch label="Show note labels" checked={showNoteLabels} onChange={handleShowNoteLabelsChange} />
                <button className="button" onClick={handleClear}>
                    Clear Fretboard
                </button>
                <div className="slider-group">
                    <label htmlFor="last-fret">Last fret&nbsp;</label>
                    <input
                        id="last-fret"
                        type="range"
                        value={lastFret}
                        step={1}
                        min={5}
                        max={24}
                        onChange={e => setLastFret(Number(e.target.value))}
                    />
                </div>
                <ThemeToggle theme={theme} onChange={setTheme} />
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
                >
                    <defs>
                        <clipPath id="fretboard-outline">
                            <rect x={0.5} y={0.5} width={width - 1} height={boardHeight - 1} rx={5} />
                        </clipPath>
                    </defs>
                    {/* Gives exported images the page's white background. */}
                    <rect className="board-bg" width={width} height={height} fill="#fff" />
                    <g clipPath="url(#fretboard-outline)">
                        {renderStrings()}
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
                </svg>
            </div>
        </div>
    );
}

export default Fretboard;