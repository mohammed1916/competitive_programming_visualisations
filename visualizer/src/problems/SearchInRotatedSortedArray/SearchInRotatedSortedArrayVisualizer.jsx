import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './SearchInRotatedSortedArrayVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def search(self, nums: List[int], target: int) -> int:' },
    { line: 3, text: '        lo, hi = 0, len(nums) - 1' },
    { line: 4, text: '' },
    { line: 5, text: '        while lo <= hi:' },
    { line: 6, text: '            mid = (lo + hi) // 2' },
    { line: 7, text: '            if nums[mid] == target:' },
    { line: 8, text: '                return mid' },
    { line: 9, text: '' },
    { line: 10, text: '            # Left half is sorted' },
    { line: 11, text: '            if nums[lo] <= nums[mid]:' },
    { line: 12, text: '                if nums[lo] <= target < nums[mid]:' },
    { line: 13, text: '                    hi = mid - 1' },
    { line: 14, text: '                else:' },
    { line: 15, text: '                    lo = mid + 1' },
    { line: 16, text: '            # Right half is sorted' },
    { line: 17, text: '            else:' },
    { line: 18, text: '                if nums[mid] < target <= nums[hi]:' },
    { line: 19, text: '                    lo = mid + 1' },
    { line: 20, text: '                else:' },
    { line: 21, text: '                    hi = mid - 1' },
    { line: 22, text: '' },
    { line: 23, text: '        return -1' },
]

function generateSteps(nums, target) {
    const steps = []
    let lo = 0
    let hi = nums.length - 1

    steps.push({
        phase: 'init', activeLine: 3,
        lo, hi, mid: -1, result: null,
        message: `Initialize lo=${lo}, hi=${hi}. Target=${target}.`,
    })

    while (lo <= hi) {
        steps.push({
            phase: 'check_loop', activeLine: 5,
            lo, hi, mid: -1, result: null,
            message: `lo=${lo} ≤ hi=${hi}. Enter loop.`,
        })

        const mid = Math.floor((lo + hi) / 2)

        steps.push({
            phase: 'calc_mid', activeLine: 6,
            lo, hi, mid, result: null,
            message: `mid = (${lo} + ${hi}) // 2 = ${mid}. nums[mid] = ${nums[mid]}.`,
        })

        if (nums[mid] === target) {
            steps.push({
                phase: 'found', activeLine: 8,
                lo, hi, mid, result: mid,
                message: `nums[${mid}] = ${nums[mid]} == target ${target}. Found at index ${mid}!`,
            })
            return steps
        }

        const leftSorted = nums[lo] <= nums[mid]

        steps.push({
            phase: leftSorted ? 'left_sorted' : 'right_sorted', activeLine: 11,
            lo, hi, mid, result: null,
            message: leftSorted
                ? `nums[lo]=${nums[lo]} ≤ nums[mid]=${nums[mid]}: left half [${lo}..${mid}] is sorted.`
                : `nums[lo]=${nums[lo]} > nums[mid]=${nums[mid]}: right half [${mid}..${hi}] is sorted.`,
        })

        if (leftSorted) {
            if (nums[lo] <= target && target < nums[mid]) {
                steps.push({
                    phase: 'move_hi', activeLine: 13,
                    lo, hi: mid - 1, mid, result: null,
                    message: `${nums[lo]} ≤ target(${target}) < ${nums[mid]}: target is in left half. hi = mid-1 = ${mid - 1}.`,
                })
                hi = mid - 1
            } else {
                steps.push({
                    phase: 'move_lo', activeLine: 15,
                    lo: mid + 1, hi, mid, result: null,
                    message: `Target(${target}) not in left half. lo = mid+1 = ${mid + 1}.`,
                })
                lo = mid + 1
            }
        } else {
            if (nums[mid] < target && target <= nums[hi]) {
                steps.push({
                    phase: 'move_lo', activeLine: 19,
                    lo: mid + 1, hi, mid, result: null,
                    message: `${nums[mid]} < target(${target}) ≤ ${nums[hi]}: target is in right half. lo = mid+1 = ${mid + 1}.`,
                })
                lo = mid + 1
            } else {
                steps.push({
                    phase: 'move_hi', activeLine: 21,
                    lo, hi: mid - 1, mid, result: null,
                    message: `Target(${target}) not in right half. hi = mid-1 = ${mid - 1}.`,
                })
                hi = mid - 1
            }
        }
    }

    steps.push({
        phase: 'not_found', activeLine: 23,
        lo, hi, mid: -1, result: -1,
        message: `lo(${lo}) > hi(${hi}). Target ${target} not found. Return -1.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Find 0', nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
    { label: 'Not found', nums: [4, 5, 6, 7, 0, 1, 2], target: 3 },
    { label: 'Find 3', nums: [1, 3], target: 3 },
    { label: 'No rotate', nums: [1, 2, 3, 4, 5, 6], target: 4 },
    { label: 'Single', nums: [1], target: 1 },
]

export default function SearchInRotatedSortedArrayVisualizer() {
    const [numsInput, setNumsInput] = useState('[4,5,6,7,0,1,2]')
    const [targetInput, setTargetInput] = useState('0')

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, target, inputError } = useMemo(() => {
        try {
            const n = JSON.parse(numsInput)
            const t = parseInt(targetInput, 10)
            if (!Array.isArray(n) || n.length === 0) throw new Error('nums must be a non-empty array')
            if (n.length > 14) throw new Error('Max 14 elements for clarity')
            if (isNaN(t)) throw new Error('target must be a number')
            return { nums: n, target: t, inputError: '' }
        } catch (e) {
            return { nums: [4, 5, 6, 7, 0, 1, 2], target: 0, inputError: e.message }
        }
    }, [numsInput, targetInput])

    const steps = useMemo(() => generateSteps(nums, target), [nums, target])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        setTargetInput(String(ex.target))
        handleReset()
    }, [handleReset])

    const lo = step?.lo ?? 0
    const hi = step?.hi ?? nums.length - 1
    const mid = step?.mid ?? -1
    const result = step?.result

    // Which half is highlighted
    const leftSorted = step?.phase === 'left_sorted' || (step?.phase === 'move_hi' && mid >= 0 && nums[lo] <= nums[mid])
    const rightSorted = step?.phase === 'right_sorted' || (step?.phase === 'move_lo' && mid >= 0 && nums[lo] > nums[mid])

    return (
        <div className="sirsa-shell">
            <section className="sirsa-panel">
                <header className="sirsa-head">
                    <span>Search in Rotated Sorted Array · Binary Search</span>
                    {inputError && <span className="sirsa-error">{inputError}</span>}
                </header>
                <div className="sirsa-body">
                    <div className="sirsa-top-row">
                        <div className="sirsa-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="sirsa-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                        <div className="sirsa-inputs">
                            <div className="sirsa-input-group">
                                <label className="sirsa-label">nums</label>
                                <input
                                    className="sirsa-input"
                                    value={numsInput}
                                    onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                                />
                            </div>
                            <div className="sirsa-input-group">
                                <label className="sirsa-label">target</label>
                                <input
                                    className="sirsa-input narrow"
                                    value={targetInput}
                                    onChange={(e) => { setTargetInput(e.target.value); handleReset() }}
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Array */}
                    <div className="sirsa-array-wrap">
                        {nums.map((val, idx) => {
                            const isLo = idx === lo
                            const isHi = idx === hi
                            const isMid = idx === mid
                            const inLeft = mid >= 0 && idx >= lo && idx <= mid
                            const inRight = mid >= 0 && idx >= mid && idx <= hi
                            const active = mid >= 0 && idx >= lo && idx <= hi
                            const isFound = result !== null && result !== undefined && result >= 0 && idx === result
                            const isElim = result !== null && result !== undefined && !active && !isFound

                            return (
                                <div key={idx} className="sirsa-col">
                                    <motion.div
                                        className={[
                                            'sirsa-cell',
                                            isMid ? 'mid' : '',
                                            isFound ? 'found' : '',
                                            result === -1 ? 'eliminated' : '',
                                            !isMid && inLeft && leftSorted ? 'sorted-left' : '',
                                            !isMid && inRight && rightSorted ? 'sorted-right' : '',
                                            !active && !isFound ? 'dim' : '',
                                        ].filter(Boolean).join(' ')}
                                        animate={{ y: isMid ? -10 : isFound ? -10 : 0, scale: isMid || isFound ? 1.12 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                    >
                                        {val}
                                    </motion.div>
                                    <span className="sirsa-idx">{idx}</span>
                                    <div className="sirsa-ptrs">
                                        {isLo && <span className="sirsa-ptr lo-ptr">lo</span>}
                                        {isMid && <span className="sirsa-ptr mid-ptr">mid</span>}
                                        {isHi && <span className="sirsa-ptr hi-ptr">hi</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Sorted half indicator */}
                    {(leftSorted || rightSorted) && mid >= 0 && (
                        <div className={`sirsa-half-badge${leftSorted ? ' left' : ' right'}`}>
                            {leftSorted ? `← Left half [${lo}..${mid}] is sorted` : `Right half [${mid}..${hi}] is sorted →`}
                        </div>
                    )}

                    {/* Result */}
                    <AnimatePresence>
                        {result !== null && result !== undefined && (
                            <motion.div
                                className={`sirsa-result${result >= 0 ? ' found' : ' not-found'}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {result >= 0 ? `Found at index ${result} ✓` : 'Not found — return -1'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`sirsa-status${result !== null && result !== undefined ? (result >= 0 ? ' ok' : ' fail') : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
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
