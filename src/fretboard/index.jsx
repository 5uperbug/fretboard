import { useRef, useState } from "react";
import GuitarString from "./GuitarString";
import html2canvas from 'html2canvas';

import Switch from "../components/switch";
import './_index.scss';

const fretKey = (stringIndex, fret) => `${stringIndex}:${fret}`;

const Fretboard = () => {
    const [showNoteNames, setShowNoteNames] = useState(true);
    const [showNoteLabels, setShowNoteLabels] = useState(false);
    // Marked frets as "string:fret" keys. Kept here rather than in each Fret so
    // marks survive the fret range shrinking and can be cleared in one update.
    const [selectedFrets, setSelectedFrets] = useState(() => new Set());
    const [lastFret, setLastFret] = useState(15);
    const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
    const fretboardContainer = useRef();

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
                noOfFrets={lastFret}
                isSelected={(fret) => selectedFrets.has(fretKey(idx, fret))}
                onToggleFret={(fret) => toggleFret(fretKey(idx, fret))}
                showNoteNames={showNoteNames}
                showNoteLabels={showNoteLabels}
            />
        ));
    };

    const renderFretNumbers = () => {
        const frets = [];

        for (let i = 0; i <= lastFret; i++) {
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

    const handleCopyToClipboard = () => {
        html2canvas(fretboardContainer.current).then((canvas) => {
            canvas.toBlob((blob) => {
                navigator.clipboard.write([
                    new window.ClipboardItem(
                        Object.defineProperty({}, blob.type, {
                            value: blob,
                            enumerable: true
                        })
                    )
                ]).then(() => {
                    // show a toast
                });
            });
        });
    };

    const saveAs = (uri, filename) => {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            link.href = uri;
            link.download = filename;
            //Firefox requires the link to be in the body
            document.body.appendChild(link);
            //simulate click
            link.click();
            //remove the link when done
            document.body.removeChild(link);
        } else {
            window.open(uri);
        }
    }

    const handleDownload = () => {
        html2canvas(fretboardContainer.current).then((canvas) => {
            saveAs(canvas.toDataURL(), 'fretboard.png');
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
            </div>
            <div className="fretboard-container" ref={fretboardContainer}>
                <div className="fretboard">
                    {renderStrings()}
                </div>
                <div className="fret-numbers">
                    {renderFretNumbers()}
                </div>
            </div>
        </div>
    );
}

export default Fretboard;