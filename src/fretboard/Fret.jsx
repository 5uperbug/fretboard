import { getFretName } from "../utils";
import { STRING_SPACING, fretCenterX, fretWidth, fretX } from "./geometry";

const noteTextProps = {
    textAnchor: "middle",
    dominantBaseline: "central",
    fontSize: 18,
    fontWeight: "bold",
};

const Fret = ({ offset, stringName, selected, onToggle, showNoteNames, showNoteLabels }) => {
    const x = fretX(offset);
    const cx = fretCenterX(offset);
    const cy = STRING_SPACING / 2;

    const renderLayer = () => {
        if (selected) {
            return (
                <g className="marker">
                    <circle cx={cx} cy={cy} r={13} fill="red" />
                    {showNoteNames && (
                        <text x={cx} y={cy} fill="#fff" {...noteTextProps}>
                            {getFretName(stringName, offset)}
                        </text>
                    )}
                </g>
            );
        } else if (showNoteLabels) {
            return (
                <text className="label" x={cx} y={cy} fill="#000" fillOpacity={0.1} {...noteTextProps}>
                    {getFretName(stringName, offset)}
                </text>
            );
        }
        return null;
    }

    return (
        <g
            onClick={onToggle}
            className={`fret ${offset === 0 ? 'fretzero' : ''}`}
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
