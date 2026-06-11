import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './RemoveNthNodeVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def removeNthFromEnd(self, head, n):' },
    { line: 3, text: '        dummy = ListNode(0, head)' },
    { line: 4, text: '        fast = slow = dummy' },
    { line: 5, text: '        for _ in range(n + 1):' },
    { line: 6, text: '            fast = fast.next' },
    { line: 7, text: '        while fast:' },
    { line: 8, text: '            fast = fast.next' },
    { line: 9, text: '            slow = slow.next' },
    { line: 10, text: '        slow.next = slow.next.next' },
    { line: 11, text: '        return dummy.next' },
]

function parseInput(input) {
    const [arrStr, nStr] = input.split(';').map((s) => s.trim())
    const arr = JSON.parse(arrStr)
    if (!Array.isArray(arr)) throw new Error('First part must be array')
    const n = parseInt(nStr, 10)
    if (Number.isNaN(n) || n < 1) throw new Error('n must be ≥ 1')
    arr.forEach((v) => { if (Number.isNaN(Number(v))) throw new Error('Array values must be numbers') })
    return { arr: arr.map(Number), n }
}

function generateSteps(arr, n) {
    // nodes: dummy(idx=-1) + arr nodes(idx 0..len-1)
    // We'll track fastIdx and slowIdx as indices into the augmented list (-1 = dummy)
    const steps = []
    const len = arr.length
    const nodeCount = len + 1 // includes dummy

    // Advance fast by n+1
    let fastIdx = -1
    let slowIdx = -1
    steps.push({ phase: 'init', activeLine: 4, fastIdx, slowIdx, removedIdx: -1, message: 'Create dummy node. Set fast = slow = dummy.' })

    for (let i = 0; i < n + 1; i++) {
        fastIdx++
        steps.push({
            phase: 'advance', activeLine: 6, fastIdx, slowIdx, removedIdx: -1,
            message: `Advance fast (step ${i + 1}/${n + 1}): fast → node[${fastIdx >= len ? 'null' : fastIdx}]`,
        })
    }

    // fast has gone off the end if n == len, let's handle it
    // Co-move until fast is null (fastIdx >= len)
    while (fastIdx < len) {
        fastIdx++
        slowIdx++
        steps.push({
            phase: 'comove', activeLine: 8, fastIdx, slowIdx, removedIdx: -1,
            message: `Co-move: fast → ${fastIdx >= len ? 'null' : `node[${fastIdx}]`}, slow → node[${slowIdx}]`,
        })
    }

    // slow.next is the node to remove (slowIdx + 1)
    const removedIdx = slowIdx + 1
    steps.push({
        phase: 'remove', activeLine: 10, fastIdx, slowIdx, removedIdx,
        message: `slow.next = slow.next.next — remove node[${removedIdx}] (value ${arr[removedIdx]})`,
    })

    const resultArr = arr.filter((_, i) => i !== removedIdx)
    steps.push({
        phase: 'done', activeLine: 11, fastIdx, slowIdx, removedIdx, resultArr,
        message: `Done. Removed ${arr[removedIdx]}. Result: [${resultArr.join(', ')}]`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', input: '[1,2,3,4,5]; 2' },
    { label: 'Remove Head', input: '[1,2,3]; 3' },
    { label: 'Remove Tail', input: '[1,2,3]; 1' },
    { label: 'Single', input: '[1]; 1' },
]

export default function RemoveNthNodeVisualizer() {
    const [inputVal, setInputVal] = useState('[1,2,3,4,5]; 2')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, n, inputError } = useMemo(() => {
        try {
            const { arr, n } = parseInput(inputVal)
            return { arr, n, inputError: '' }
        } catch (e) {
            return { arr: [1, 2, 3, 4, 5], n: 2, inputError: e.message || 'Invalid input' }
        }
    }, [inputVal])

    const steps = useMemo(() => generateSteps(arr, n), [arr, n])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setInputVal(ex.input)
        handleReset()
    }, [handleReset])

    const displayArr = step?.phase === 'done' ? (step.resultArr ?? arr) : arr
    const isRemoved = (i) => step?.phase === 'done' && i === step.removedIdx

    return (
        <div className="rnn-shell">
            <div className="rnn-top">
                <section className="rnn-panel main">
                    <header className="rnn-head">
                        <span>Two-Pointer (Dummy Head)</span>
                        {inputError && <span className="rnn-error">{inputError}</span>}
                    </header>
                    <div className="rnn-body">
                        <div className="rnn-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="rnn-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="rnn-input-row">
                            <input className="rnn-input" value={inputVal} onChange={(e) => { setInputVal(e.target.value); handleReset() }} placeholder="[1,2,3,4,5]; 2" />
                            <span className="rnn-hint">format: [array]; n</span>
                        </div>

                        {/* Linked list visual */}
                        <div className="rnn-list">
                            {/* Dummy node */}
                            <div className={`rnn-node dummy ${step?.fastIdx === -1 ? 'fast' : ''} ${step?.slowIdx === -1 ? 'slow' : ''}`}>
                                <span className="rnn-val">D</span>
                                {step?.fastIdx === -1 && <span className="rnn-ptr fast-ptr">F</span>}
                                {step?.slowIdx === -1 && <span className="rnn-ptr slow-ptr">S</span>}
                            </div>
                            <div className="rnn-arrow">→</div>

                            {arr.map((val, i) => {
                                const isFast = step?.fastIdx === i
                                const isSlow = step?.slowIdx === i
                                const isRemovedNode = step?.removedIdx === i
                                const isDoneRemoved = step?.phase === 'done' && i === step.removedIdx
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                        <motion.div
                                            className={`rnn-node ${isFast && isSlow ? 'both' : isFast ? 'fast' : isSlow ? 'slow' : ''} ${isRemovedNode && step?.phase === 'remove' ? 'removed' : ''}`}
                                            animate={isDoneRemoved ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <span className="rnn-val">{val}</span>
                                            {isFast && <span className="rnn-ptr fast-ptr">F</span>}
                                            {isSlow && !isFast && <span className="rnn-ptr slow-ptr">S</span>}
                                        </motion.div>
                                        {i < arr.length - 1 && <div className="rnn-arrow">→</div>}
                                    </div>
                                )
                            })}
                            {step?.fastIdx >= arr.length && (
                                <><div className="rnn-arrow">→</div><div className="rnn-node null-node"><span className="rnn-val">∅</span><span className="rnn-ptr fast-ptr">F</span></div></>
                            )}
                        </div>
                    </div>
                </section>

                <section className="rnn-panel side">
                    <header className="rnn-head"><span>Pointers</span></header>
                    <div className="rnn-body">
                        <div className="rnn-metrics">
                            <div className="rnn-metric">
                                <span className="rnn-label">n</span>
                                <strong className="rnn-n">{n}</strong>
                            </div>
                            <div className="rnn-metric">
                                <span className="rnn-label">fast</span>
                                <strong className="rnn-fast">{step?.fastIdx >= arr.length ? 'null' : step?.fastIdx === -1 ? 'dummy' : `node[${step?.fastIdx}]=${arr[step.fastIdx]}`}</strong>
                            </div>
                            <div className="rnn-metric">
                                <span className="rnn-label">slow</span>
                                <strong className="rnn-slow">{step?.slowIdx === -1 ? 'dummy' : `node[${step?.slowIdx}]=${arr[step?.slowIdx]}`}</strong>
                            </div>
                        </div>
                        <div className={`rnn-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? `Removed: ${arr[step.removedIdx]}` : step?.phase ?? '—'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`rnn-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
