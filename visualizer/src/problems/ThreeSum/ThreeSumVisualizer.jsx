import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './ThreeSumVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def threeSum(self, nums: List[int]) -> List[List[int]]:' },
    { line: 3, text: '        nums.sort()' },
    { line: 4, text: '        result = []' },
    { line: 5, text: '        for i in range(len(nums) - 2):' },
    { line: 6, text: '            if i > 0 and nums[i] == nums[i - 1]:' },
    { line: 7, text: '                continue  # skip i-duplicates' },
    { line: 8, text: '            l, r = i + 1, len(nums) - 1' },
    { line: 9, text: '            while l < r:' },
    { line: 10, text: '                s = nums[i] + nums[l] + nums[r]' },
    { line: 11, text: '                if s == 0:' },
    { line: 12, text: '                    result.append([nums[i], nums[l], nums[r]])' },
    { line: 13, text: '                    l += 1' },
    { line: 14, text: '                    while l < r and nums[l] == nums[l-1]: l += 1' },
    { line: 15, text: '                elif s < 0:' },
    { line: 16, text: '                    l += 1' },
    { line: 17, text: '                else:' },
    { line: 18, text: '                    r -= 1' },
    { line: 19, text: '        return result' },
]

function generateSteps(nums) {
    const steps = []
    const n = nums.length

    if (n < 3) {
        steps.push({
            phase: 'done', activeLine: 19, sorted: [...nums],
            i: null, l: null, r: null, sum: null, result: [],
            message: 'Need at least 3 elements. Return [].',
        })
        return steps
    }

    const sorted = [...nums].sort((a, b) => a - b)
    const snapshot = () => result.map(t => [...t])

    steps.push({
        phase: 'sort', activeLine: 3, sorted: [...sorted],
        i: null, l: null, r: null, sum: null, result: [],
        message: `Sort array → [${sorted.join(', ')}]`,
    })

    const result = []

    for (let i = 0; i <= n - 3; i++) {
        if (i > 0 && sorted[i] === sorted[i - 1]) {
            steps.push({
                phase: 'skip_i', activeLine: 7, sorted: [...sorted],
                i, l: null, r: null, sum: null, result: snapshot(),
                message: `Skip duplicate at i=${i}: nums[${i}]=${sorted[i]} equals nums[${i - 1}]=${sorted[i - 1]}.`,
            })
            continue
        }

        let l = i + 1
        let r = n - 1

        steps.push({
            phase: 'fix_i', activeLine: 8, sorted: [...sorted],
            i, l, r, sum: null, result: snapshot(),
            message: `Fix i=${i} (nums[i]=${sorted[i]}). Set l=${l}, r=${r}.`,
        })

        while (l < r) {
            const s = sorted[i] + sorted[l] + sorted[r]

            steps.push({
                phase: 'calc', activeLine: 10, sorted: [...sorted],
                i, l, r, sum: s, result: snapshot(),
                message: `nums[${i}]=${sorted[i]} + nums[${l}]=${sorted[l]} + nums[${r}]=${sorted[r]} = ${s}.`,
            })

            if (s === 0) {
                result.push([sorted[i], sorted[l], sorted[r]])
                steps.push({
                    phase: 'found', activeLine: 12, sorted: [...sorted],
                    i, l, r, sum: s, result: snapshot(),
                    message: `Sum is 0! Triplet [${sorted[i]}, ${sorted[l]}, ${sorted[r]}] added. Total: ${result.length}.`,
                })
                l++
                while (l < r && sorted[l] === sorted[l - 1]) {
                    steps.push({
                        phase: 'skip_l', activeLine: 14, sorted: [...sorted],
                        i, l, r, sum: s, result: snapshot(),
                        message: `Skip l-duplicate: nums[${l}]=${sorted[l]} == nums[${l - 1}]=${sorted[l - 1]}. l → ${l + 1}.`,
                    })
                    l++
                }
            } else if (s < 0) {
                steps.push({
                    phase: 'move_l', activeLine: 16, sorted: [...sorted],
                    i, l, r, sum: s, result: snapshot(),
                    message: `Sum ${s} < 0. Need bigger value. Move l right: ${l} → ${l + 1}.`,
                })
                l++
            } else {
                steps.push({
                    phase: 'move_r', activeLine: 18, sorted: [...sorted],
                    i, l, r, sum: s, result: snapshot(),
                    message: `Sum ${s} > 0. Need smaller value. Move r left: ${r} → ${r - 1}.`,
                })
                r--
            }
        }
    }

    steps.push({
        phase: 'done', activeLine: 19, sorted: [...sorted],
        i: null, l: null, r: null, sum: null, result: snapshot(),
        message: `Done! Found ${result.length} unique triplet(s).`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', nums: [-1, 0, 1, 2, -1, -4] },
    { label: 'All Zeros', nums: [0, 0, 0, 0] },
    { label: 'No Match', nums: [1, 2, 3, 4] },
    { label: 'Duplicates', nums: [-2, 0, 0, 2, 2] },
]

export default function ThreeSumVisualizer() {
    const [numsInput, setNumsInput] = useState('[-1,0,1,2,-1,-4]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            const n = JSON.parse(numsInput)
            if (!Array.isArray(n)) throw new Error('nums must be an array')
            if (n.length > 12) throw new Error('Max 12 elements for clarity')
            return { nums: n, inputError: '' }
        } catch (e) {
            return { nums: [-1, 0, 1, 2, -1, -4], inputError: e.message || 'Invalid input' }
        }
    }, [numsInput])

    const steps = useMemo(() => generateSteps(nums), [nums])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    const sorted = step?.sorted ?? [...nums].sort((a, b) => a - b)

    return (
        <div className="ts3-shell">
            <div className="ts3-top">
                {/* ── Left: array + pointers ── */}
                <section className="ts3-panel main">
                    <header className="ts3-head">
                        <span>Sorted Array · Two Pointers</span>
                        {inputError && <span className="ts3-error">{inputError}</span>}
                    </header>
                    <div className="ts3-body">
                        <div className="ts3-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="ts3-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                        <div className="ts3-input-row">
                            <input
                                className="ts3-input"
                                value={numsInput}
                                onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                                placeholder="[-1,0,1,2,-1,-4]"
                            />
                        </div>

                        <div className="ts3-array">
                            {sorted.map((val, idx) => {
                                const isI = step?.i === idx
                                const isL = step?.l === idx
                                const isR = step?.r === idx
                                const isFound = step?.phase === 'found' && (isI || isL || isR)
                                const lifted = isI || isL || isR
                                return (
                                    <div key={idx} className="ts3-cell-wrap">
                                        <motion.div
                                            className={`ts3-cell${isI ? ' fix' : ''}${isL ? ' left' : ''}${isR ? ' right' : ''}${isFound ? ' found' : ''}`}
                                            animate={{ y: lifted ? -12 : 0, scale: lifted ? 1.15 : 1 }}
                                            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                        >
                                            {val}
                                        </motion.div>
                                        <span className="ts3-idx">{idx}</span>
                                        <div className="ts3-ptrs">
                                            {isI && <span className="ts3-ptr ts3-ptr-i">i</span>}
                                            {isL && <span className="ts3-ptr ts3-ptr-l">l</span>}
                                            {isR && <span className="ts3-ptr ts3-ptr-r">r</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {step?.sum != null && (
                            <div className="ts3-sum-box">
                                <span className="ts3-sum-label">nums[i] + nums[l] + nums[r] =</span>
                                <span className="ts3-sum-val mono">{step.sum}</span>
                                <span className={`ts3-sum-verdict${step.sum === 0 ? ' zero' : step.sum < 0 ? ' neg' : ' pos'}`}>
                                    {step.sum === 0 ? '= 0 ✓' : step.sum < 0 ? '< 0 → l →' : '> 0 → ← r'}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Right: results ── */}
                <section className="ts3-panel results">
                    <header className="ts3-head"><span>Triplets Found</span></header>
                    <div className="ts3-body">
                        <AnimatePresence>
                            {(step?.result ?? []).map((triplet) => (
                                <motion.div
                                    key={triplet.join(',')}
                                    className="ts3-triplet"
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <span className="mono">[{triplet.join(', ')}]</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {(!step?.result || step.result.length === 0) && (
                            <div className="ts3-empty">No triplets yet</div>
                        )}
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`ts3-status${step?.phase === 'found' ? ' ok' : step?.phase === 'done' ? ' done' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying}
                isDone={isDone}
                speed={speed}
                onPlayToggle={togglePlay}
                onPrev={stepBack}
                onNext={stepForward}
                onReset={handleReset}
                prevDisabled={stepIndex < 0}
                nextDisabled={isDone}
                resetDisabled={stepIndex < 0}
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
