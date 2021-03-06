import React, { useRef, useState } from "react";
import String from "./String";
import html2canvas from 'html2canvas';

import Switch from "../components/switch";
import './_index.scss';

const Fretboard = () => {
    const [showNoteNames, setShowNoteNames] = useState(true);
    const [showNoteLabels, setShowNoteLabels] = useState(false);
    const [stateBustingKey, setStateBustingKey] = useState(0);
    const [lastFret, setLastFret] = useState(15);
    const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
    const fretboardContainer = useRef();


    const getFretboardProps = () => {
        return {
            showNoteNames,
            showNoteLabels
        };
    }

    const renderStrings = () => {
        return strings.map((string, idx) => (
            <String
                key={`${idx}${stateBustingKey}`}
                name={string}
                index={idx}
                noOfFrets={lastFret}
                properties={getFretboardProps()}
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
            setStateBustingKey(stateBustingKey + 1);
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
                <div className="switch-group">
                    <label>Show note names&nbsp;</label>
                    <Switch checked={showNoteNames} onChange={handleShowNoteNamesChange} />
                </div>
                <div className="switch-group">
                    <label>Show note labels&nbsp;</label>
                    <Switch checked={showNoteLabels} onChange={handleShowNoteLabelsChange} />
                </div>
                <button className="button" onClick={handleClear}>
                    Clear Fretboard
                </button>
                <div className="slider-group">
                    <label>Last fret&nbsp;</label>
                    <input
                        type="range"
                        value={lastFret}
                        step={1}
                        min={5}
                        max={24}
                        onChange={e => setLastFret(e.target.value)}
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