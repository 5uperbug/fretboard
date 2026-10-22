import { getFretName } from "../utils";
import { STRING_SPACING, fretCenterX, fretWidth, fretX } from "./geometry";

const noteTextProps = {
    textAnchor: "middle",
    dominantBaseline: "central",
    fontSize: 18,
    fontWeight: "bold",
};

const Fret = ({
    offset,
    stringIndex,
    stringName,
    selected,
    focusable,
    onToggle,
    showNoteNames,
    showNoteLabels,
}) => {
    const x = fretX(offset);
    const cx = fretCenterX(offset);
    const cy = STRING_SPACING / 2;
    const noteName = getFretName(stringName, offset);
    const position = offset === 0 ? "open" : `fret ${offset}`;

    const renderLayer = () => {
        if (selected) {
            return (
                <g className="marker">
                    <circle className="marker-dot" cx={cx} cy={cy} r={13} fill="#c62828" />
                    {showNoteNames && (
                        <text x={cx} y={cy} fill="#fff" {...noteTextProps}>
                            {noteName}
                        </text>
                    )}
                </g>
            );
        } else if (offset === 0) {
            // The nut always names its string.
            return (
                <text className="string-name" x={cx} y={cy} fill="#333" {...noteTextProps} fontSize={15}>
                    {noteName}
                </text>
            );
        } else if (showNoteLabels) {
            return (
                <text className="label" x={cx} y={cy} fill="#7a6f5c" {...noteTextProps}>
                    {noteName}
                </text>
            );
        }
        return null;
    }

    // Each fret is a toggle button. Only one fret is in the tab order at a
    // time; the arrow keys move between them (see Fretboard).
    return (
        <g
            onClick={onToggle}
            className={`fret ${offset === 0 ? 'fretzero' : ''}`}
            role="button"
            tabIndex={focusable ? 0 : -1}
            aria-pressed={selected}
            aria-label={`String ${stringIndex + 1}, ${position}, ${noteName}`}
            data-string={stringIndex}
            data-fret={offset}
        >
            <rect
                className="fret-bg"
                x={x}
                width={fretWidth(offset)}
                height={STRING_SPACING}
                fill={offset === 0 ? "#aaa" : "#fffaef"}
            />
            {offset !== 0 && (
                <line
                    className="string-line"
                    x1={x}
                    x2={x + fretWidth(offset)}
                    y1={cy}
                    y2={cy}
                    stroke="#d6b698"
                    strokeWidth={1.5}
                />
            )}
            {renderLayer()}
        </g>
    );
};

export default Fret;
