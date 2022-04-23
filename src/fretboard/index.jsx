import React, { useRef, useState } from "react";
import String from "./String";
import html2canvas from 'html2canvas';

import Switch from "../components/switch";
import './_index.scss';

const Fretboard = () => {
    const [showNoteNames, setShowNoteNames] = useState(false);
    const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
    const noOfFrets = 15;
    const fretboardContainer = useRef();

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

    const handleShowNoteNamesChange = (checked) => {
        debugger
        setShowNoteNames(checked);
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


                <div className="d-inline-block">
                    <Switch checked={showNoteNames} onChange={handleShowNoteNamesChange} />
                </div>

            </div>
            <div ref={fretboardContainer}>
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