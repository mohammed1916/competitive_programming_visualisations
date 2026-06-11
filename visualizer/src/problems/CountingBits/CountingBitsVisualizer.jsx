import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './CountingBitsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def countBits(self, n):' },
    { line: 3, text: '        dp = [0] * (n + 1)' },
    { line: 4, text: '        for i in range(1, n + 1):' },
    { line: 5, text: '            dp[i] = dp[i >> 1] + (i & 1)' },
    { line: 6, text: '        return dp' },
]

function generateSteps(n) {
    const steps = []
    const dp = new Array(n + 1).fill(0)
    steps.push({ phase: 'init', activeLine: 3, i: -1, dp: [...dp], message: 'Initialize dp array with all zeros.' })

    for (let i = 1; i <= n; i++) {
        dp[i] = dp[i >> 1] + (i & 1)
        steps.push({
            phase: 'fill', activeLine: 5, i,
            dp: [...dp],
            half: i >> 1,
            lsb: i & 1,
            binary: i.toString(2),
            message: `dp[${i}] = dp[${i >> 1}] + (${i} & 1) = ${dp[i >> 1]} + ${i & 1} = ${dp[i]}   (${i} in binary: ${i.toString(2)})`,
        })
    }

    steps.push({ phase: 'done', activeLine: 6, i: -1, dp: [...dp], message: `Done. dp = [${dp.join(', ')}]` })
    return steps
}

const EXAMPLES = [{ label: 'n=5', n: 5 }, { label: 'n=8', n: 8 }, { label: 'n=12', n: 12 }, { label: 'n=2', n: 2 }]

export default function CountingBitsVisualizer() {
    const [nInput, setNInput] = useState('5')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { n, inputError } = useMemo(() => {
        const v = parseInt(nInput, 10)
        if (Number.isNaN(v) || v < 0 || v > 20) return { n: 5, inputError: 'n must be 0–20' }
        return { n: v, inputError: '' }
    }, [nInput])

    const steps = useMemo(() => generateSteps(n), [n])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNInput(String(ex.n))
        handleReset()
    }, [handleReset])

    return (
        <div className="cb-shell">
            <div className="cb-top">
                <section className="cb-panel main">
                    <header className="cb-head">
                        <span>DP: dp[i] = dp[i/2] + (i&1)</span>
                        {inputError && <span className="cb-error">{inputError}</span>}
                    </header>
                    <div className="cb-body">
                        <div className="cb-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="cb-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="cb-input-row">
                            <label className="cb-label">n =</label>
                            <input className="cb-input" type="number" min="0" max="20" value={nInput} onChange={(e) => { setNInput(e.target.value); handleReset() }} />
                        </div>
                        <div className="cb-array">
                            {(step?.dp ?? []).map((val, i) => {
                                const isActive = step?.i === i
                                const isHalf = step?.half === i && step?.i !== -1
                                return (
                                    <motion.div
                                        key={i}
                                        className={`cb-cell ${isActive ? 'active' : ''} ${isHalf ? 'half' : ''} ${step?.phase === 'done' ? 'done' : ''}`}
                                        animate={isActive ? { y: -8, scale: 1.15 } : { y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <span className="cb-idx">{i}</span>
                                        <span className="cb-val">{val}</span>
                                        <span className="cb-bin">{i.toString(2)}</span>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="cb-panel side">
                    <header className="cb-head"><span>Current Step</span></header>
                    <div className="cb-body">
                        {step?.i > 0 && (
                            <div className="cb-breakdown">
                                <div className="cb-brow">
                                    <span className="cb-label">i</span>
                                    <span className="cb-bval">{step.i} ({step.binary}₂)</span>
                                </div>
                                <div className="cb-brow">
                                    <span className="cb-label">i {'>'}{'>'}  1</span>
                                    <span className="cb-bval">{step.half}</span>
                                </div>
                                <div className="cb-brow">
                                    <span className="cb-label">i & 1 (LSB)</span>
                                    <span className={`cb-bval ${step.lsb ? 'odd' : 'even'}`}>{step.lsb} ({step.lsb ? 'odd' : 'even'})</span>
                                </div>
                                <div className="cb-brow highlight">
                                    <span className="cb-label">dp[{step.i}]</span>
                                    <span className="cb-bval">{step.dp?.[step.i]}</span>
                                </div>
                            </div>
                        )}
                        <div className={`cb-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? `[${step.dp.join(', ')}]` : 'Building…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`cb-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
