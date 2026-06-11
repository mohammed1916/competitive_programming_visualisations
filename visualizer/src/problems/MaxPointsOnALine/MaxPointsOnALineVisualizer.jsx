import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./MaxPointsOnALineVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def maxPoints(points):" },
    { line: 2, text: "    res = 1" },
    { line: 3, text: "    for i, (x1,y1) in enumerate(points):" },
    { line: 4, text: "        slopes = defaultdict(int)" },
    { line: 5, text: "        for j in range(i+1, len(points)):" },
    { line: 6, text: "            x2,y2 = points[j]" },
    { line: 7, text: "            dx, dy = x2-x1, y2-y1" },
    { line: 8, text: "            g = gcd(abs(dx), abs(dy))" },
    { line: 9, text: "            slope = (dy//g, dx//g)  # normalized" },
    { line: 10, text: "            slopes[slope] += 1" },
    { line: 11, text: "            res = max(res, slopes[slope]+1)" },
    { line: 12, text: "    return res" },
];

const EXAMPLES = [
    {
        label: "Ex 1",
        points: [[1, 1], [2, 2], [3, 3]],
    },
    {
        label: "Ex 2",
        points: [[1, 1], [3, 2], [5, 3], [4, 1], [2, 3], [1, 4]],
    },
    {
        label: "Ex 3",
        points: [[0, 0], [1, 1], [1, -1]],
    },
];

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function normalizeSlope(dx, dy) {
    if (dx === 0 && dy === 0) return "same";
    if (dx === 0) return "inf";
    if (dy === 0) return "0";
    const g = gcd(Math.abs(dx), Math.abs(dy));
    const ndx = dx / g, ndy = dy / g;
    // ensure sign is canonical (dx positive)
    if (ndx < 0) return `${-ndy}/${-ndx}`;
    return `${ndy}/${ndx}`;
}

function generateSteps(points) {
    const steps = [];
    let res = 1;

    steps.push({ activeLine: 2, i: -1, j: -1, slopes: {}, res, bestLine: null, message: "Initialize result = 1" });

    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const slopes = {};
        for (let j = i + 1; j < points.length; j++) {
            const [x2, y2] = points[j];
            const dx = x2 - x1, dy = y2 - y1;
            const slope = normalizeSlope(dx, dy);
            slopes[slope] = (slopes[slope] || 0) + 1;
            const cnt = slopes[slope] + 1;
            const improved = cnt > res;
            if (improved) res = cnt;
            steps.push({
                activeLine: improved ? 11 : 10,
                i, j, slopes: { ...slopes }, res, bestLine: null,
                origin: i, partner: j, slope,
                message: `Origin pt${i} (${x1},${y1}) → pt${j} (${x2},${y2}), slope=${slope}, count=${cnt}${improved ? ` → res=${res}` : ""}`,
            });
        }
        steps.push({ activeLine: 3, i, j: -1, slopes: { ...slopes }, res, bestLine: null, origin: i, partner: -1, slope: null, message: `Done with origin pt${i}, best from here = ${Math.max(...Object.values(slopes), 0) + 1}` });
    }

    steps.push({ activeLine: 12, i: -1, j: -1, slopes: {}, res, done: true, message: `Max points on a line = ${res}` });
    return steps;
}

const W = 260, H = 220, PAD = 28;

function toSvg(points, W, H, PAD) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    return points.map(([x, y]) => [
        PAD + ((x - minX) / rangeX) * (W - 2 * PAD),
        H - PAD - ((y - minY) / rangeY) * (H - 2 * PAD),
    ]);
}

export default function MaxPointsOnALineVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.points), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const svgPts = useMemo(() => toSvg(ex.points, W, H, PAD), [ex]);
    const origin = step?.origin ?? -1;
    const partner = step?.partner ?? -1;
    const res = step?.res ?? 1;
    const slopes = step?.slopes ?? {};

    // Find all points on same slope line from origin
    const slopePts = (step?.slope && origin >= 0)
        ? ex.points.reduce((acc, _, idx) => {
            if (idx === origin) return acc;
            const [x1, y1] = ex.points[origin];
            const [x2, y2] = ex.points[idx];
            const s = normalizeSlope(x2 - x1, y2 - y1);
            if (s === step.slope) acc.push(idx);
            return acc;
        }, [])
        : [];

    return (
        <div className="mpl-shell">
            <div className="mpl-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`mpl-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="mpl-row">
                <div className="mpl-panel mpl-chart-wrap">
                    <div className="mpl-panel-label">Point plot</div>
                    <svg width={W} height={H} className="mpl-svg">
                        {/* line through origin + partner */}
                        {origin >= 0 && partner >= 0 && (() => {
                            const [ox, oy] = svgPts[origin];
                            const [px, py] = svgPts[partner];
                            const dx = px - ox, dy = py - oy;
                            const t = Math.max(W, H) * 3;
                            return <line x1={ox - dx * t} y1={oy - dy * t} x2={ox + dx * t} y2={oy + dy * t} className="mpl-line" clipPath={`url(#mpl-clip)`} />;
                        })()}
                        <defs><clipPath id="mpl-clip"><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
                        {svgPts.map(([cx, cy], idx) => {
                            const isOrigin = idx === origin;
                            const isPartner = idx === partner;
                            const onLine = slopePts.includes(idx);
                            return (
                                <motion.circle key={idx} cx={cx} cy={cy}
                                    r={isOrigin ? 9 : (isPartner || onLine) ? 7 : 5}
                                    className={`mpl-dot ${isOrigin ? "origin" : isPartner ? "partner" : onLine ? "on-line" : ""}`}
                                    animate={{ r: isOrigin ? 9 : (isPartner || onLine) ? 7 : 5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                />
                            );
                        })}
                        {svgPts.map(([cx, cy], idx) => (
                            <text key={`l${idx}`} x={cx + 9} y={cy - 5} className="mpl-label">{idx}</text>
                        ))}
                    </svg>
                </div>

                <div className="mpl-panel mpl-slopes-wrap">
                    <div className="mpl-panel-label">Slope counts (origin=pt{origin >= 0 ? origin : "?"})</div>
                    <div className="mpl-slopes">
                        {Object.entries(slopes).map(([s, cnt]) => (
                            <div key={s} className={`mpl-slope-row ${s === step?.slope ? "active" : ""}`}>
                                <span className="mpl-slope-key">slope={s}</span>
                                <span className="mpl-slope-cnt">{cnt + 1}</span>
                            </div>
                        ))}
                        {Object.keys(slopes).length === 0 && <span className="mpl-empty">—</span>}
                    </div>
                </div>
            </div>

            <div className="mpl-trackers">
                <div className="mpl-tracker">
                    <span className="mpl-tracker-label">Origin</span>
                    <span className="mpl-tracker-val">{origin >= 0 ? `pt${origin} (${ex.points[origin]?.join(",")})` : "—"}</span>
                </div>
                <div className="mpl-tracker">
                    <span className="mpl-tracker-label">Partner</span>
                    <span className="mpl-tracker-val">{partner >= 0 ? `pt${partner}` : "—"}</span>
                </div>
                <div className="mpl-tracker">
                    <span className="mpl-tracker-label">Result</span>
                    <span className="mpl-tracker-val mpl-res">{res}</span>
                </div>
            </div>

            {step?.done && <div className="mpl-result">✓ Max points on a line = {res}</div>}
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="mpl-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />
        </div>
    );
}
