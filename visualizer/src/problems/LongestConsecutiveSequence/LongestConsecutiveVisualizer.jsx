import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './LongestConsecutiveVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def longestConsecutive(self, nums: List[int]) -> int:' },
    { line: 3, text: '        num_set = set(nums)' },
    { line: 4, text: '        best = 0' },
    { line: 5, text: '' },
    { line: 6, text: '        for num in num_set:' },
    { line: 7, text: '            # Only start a sequence at its beginning' },
    { line: 8, text: '            if num - 1 not in num_set:' },
    { line: 9, text: '                length = 0' },
    { line: 10, text: '                curr = num' },
    { line: 11, text: '' },
    { line: 12, text: '                while curr in num_set:' },
    { line: 13, text: '                    length += 1' },
    { line: 14, text: '                    curr += 1' },
    { line: 15, text: '' },
    { line: 16, text: '                best = max(best, length)' },
    { line: 17, text: '' },
    { line: 18, text: '        return best' },
]

function generateSteps(nums) {
    const steps = []
    const numSet = new Set(nums)

    steps.push({
        phase: 'init', activeLine: 3,
        currentNum: null, curr: null, length: 0, best: 0,
        activeSequence: [],
        bestSequence: [],
        message: `Build set of ${numSet.size} unique values. best=0.`,
    })

    let best = 0
    let bestSeq = []

    for (const num of numSet) {
        steps.push({
            phase: 'pick', activeLine: 6,
            currentNum: num, curr: null, length: 0, best,
            activeSequence: [], bestSequence: [...bestSeq],
            message: `Check num=${num}.`,
        })

        const prevExists = numSet.has(num - 1)

        steps.push({
            phase: 'check_start', activeLine: 8,
            currentNum: num, curr: null, length: 0, best,
            activeSequence: [], bestSequence: [...bestSeq],
            prevExists,
            message: prevExists
                ? `${num - 1} IS in set → not start of sequence, skip.`
                : `${num - 1} NOT in set → ${num} is a sequence start!`,
        })

        if (!prevExists) {
            let length = 0
            let curr = num
            const seq = []

            steps.push({
                phase: 'seq_init', activeLine: 9,
                currentNum: num, curr, length, best,
                activeSequence: [...seq], bestSequence: [...bestSeq],
                message: `Start sequence from ${curr}. length=0.`,
            })

            while (numSet.has(curr)) {
                length++
                seq.push(curr)
                steps.push({
                    phase: 'seq_extend', activeLine: 13,
                    currentNum: num, curr, length, best,
                    activeSequence: [...seq], bestSequence: [...bestSeq],
                    message: `${curr} in set → length=${length}. Sequence: [${seq.join(', ')}].`,
                })
                curr++
            }

            const prevBest = best
            if (length > best) { best = length; bestSeq = [...seq] }

            steps.push({
                phase: 'update_best', activeLine: 16,
                currentNum: num, curr: curr - 1, length, best,
                activeSequence: [...seq], bestSequence: [...bestSeq],
                message: `Sequence ended. length=${length}. best = max(${prevBest}, ${length}) = ${best}.`,
            })
        }
    }

    steps.push({
        phase: 'done', activeLine: 18,
        currentNum: null, curr: null, length: 0, best,
        activeSequence: [], bestSequence: [...bestSeq],
        message: `Done. Longest consecutive sequence: ${best}.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', nums: [100, 4, 200, 1, 3, 2] },
    { label: 'Long run', nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] },
    { label: 'Negatives', nums: [-4, -1, -2, 0, 1, 2] },
    { label: 'Singles', nums: [5, 1, 9, 3] },
]

export default function LongestConsecutiveVisualizer() {
    const [input, setInput] = useState('[100,4,200,1,3,2]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(input)
            if (!Array.isArray(parsed) || !parsed.every(Number.isInteger))
                throw new Error('Must be JSON array of integers')
            if (parsed.length > 16) throw new Error('Max 16 elements for clarity')
            return { nums: parsed, inputError: '' }
        } catch (e) {
            return { nums: [100, 4, 200, 1, 3, 2], inputError: e.message }
        }
    }, [input])

    const steps = useMemo(() => generateSteps(nums), [nums])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    const numSet = useMemo(() => new Set(nums), [nums])
    const sortedUnique = useMemo(() => [...numSet].sort((a, b) => a - b), [numSet])

    const activeSequence = step?.activeSequence ?? []
    const bestSequence = step?.bestSequence ?? []
    const currentNum = step?.currentNum
    const best = step?.best ?? 0
    const prevExists = step?.prevExists ?? null

    return (
        <div className="lcs-shell">
            <section className="lcs-panel">
                <header className="lcs-head">
                    <span>Longest Consecutive Sequence · Hash Set</span>
                    {inputError && <span className="lcs-error">{inputError}</span>}
                </header>
                <div className="lcs-body">
                    <div className="lcs-top-row">
                        <div className="lcs-examples">
                            {EXAMPLES.map(ex => (
                                <button key={ex.label} className="lcs-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="lcs-input-group">
                            <label className="lcs-label">nums (JSON array)</label>
                            <input className="lcs-input" value={input}
                                onChange={e => { setInput(e.target.value); handleReset() }} />
                        </div>
                    </div>

                    {/* Sorted set grid */}
                    <div className="lcs-section-title">Sorted Unique Values (Hash Set)</div>
                    <div className="lcs-set-row">
                        {sortedUnique.map((val) => {
                            const isActive = activeSequence.includes(val)
                            const isBest = bestSequence.includes(val) && !isActive
                            const isCurrent = val === currentNum
                            const isStart = isCurrent && prevExists === false
                            const isSkip = isCurrent && prevExists === true
                            return (
                                <motion.div
                                    key={val}
                                    className={['lcs-cell',
                                        isActive ? 'active' : '',
                                        isBest ? 'best' : '',
                                        isStart ? 'start' : '',
                                        isSkip ? 'skip' : '',
                                        isCurrent && !isStart && !isSkip ? 'current' : '',
                                    ].filter(Boolean).join(' ')}
                                    animate={{ y: isActive ? -8 : 0, scale: isActive ? 1.1 : (isCurrent ? 1.05 : 1) }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                >
                                    {val}
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Active sequence */}
                    <AnimatePresence>
                        {activeSequence.length > 0 && (
                            <motion.div className="lcs-seq-box active"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <span className="lcs-seq-label">Current run</span>
                                <div className="lcs-seq-vals">
                                    {activeSequence.map((v, i) => (
                                        <span key={i} className="lcs-seq-val active-val">{v}</span>
                                    ))}
                                    <span className="lcs-seq-len">length = {activeSequence.length}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Best so far */}
                    {best > 0 && (
                        <div className="lcs-seq-box best">
                            <span className="lcs-seq-label">Best so far</span>
                            <div className="lcs-seq-vals">
                                {bestSequence.map((v, i) => (
                                    <span key={i} className="lcs-seq-val best-val">{v}</span>
                                ))}
                                <span className="lcs-seq-len best-len">length = {best}</span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`lcs-status${step?.phase === 'done' ? ' ok' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />

            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
