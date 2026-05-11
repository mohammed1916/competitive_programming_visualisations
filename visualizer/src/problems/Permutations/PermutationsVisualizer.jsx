import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './PermutationsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def permute(nums):' },
    { line: 2, text: '    res = []' },
    { line: 3, text: '    def backtrack(path, used):' },
    { line: 4, text: '        if len(path) == len(nums):' },
    { line: 5, text: '            res.append(path[:])' },
    { line: 6, text: '            return' },
    { line: 7, text: '        for i in range(len(nums)):' },
    { line: 8, text: '            if used[i]: continue' },
    { line: 9, text: '            used[i] = True' },
    { line: 10, text: '            path.append(nums[i])' },
    { line: 11, text: '            backtrack(path, used)' },
    { line: 12, text: '            path.pop()' },
    { line: 13, text: '            used[i] = False' },
    { line: 14, text: '    backtrack([], [False]*len(nums))' },
    { line: 15, text: '    return res' },
]

function generateSteps(nums) {
    const steps = []
    const res = []
    const used = new Array(nums.length).fill(false)

    function backtrack(path) {
        if (path.length === nums.length) {
            res.push([...path])
            steps.push({
                phase: 'record', activeLine: 5,
                path: [...path], used: [...used], res: res.map((r) => [...r]),
                message: `Complete permutation: [${path.join(', ')}]`,
            })
            return
        }

        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue

            used[i] = true
            path.push(nums[i])
            steps.push({
                phase: 'choose', activeLine: 10,
                path: [...path], used: [...used], res: res.map((r) => [...r]),
                message: `Choose nums[${i}]=${nums[i]}, path=[${path.join(', ')}]`,
            })

            backtrack(path)

            path.pop()
            used[i] = false
            steps.push({
                phase: 'unchoose', activeLine: 13,
                path: [...path], used: [...used], res: res.map((r) => [...r]),
                message: `Unchoose nums[${i}]=${nums[i]}, path=[${path.join(', ')}]`,
            })
        }
    }

    steps.push({
        phase: 'init', activeLine: 14,
        path: [], used: [...used], res: [],
        message: 'Start permutation backtracking',
    })
    backtrack([])
    steps.push({
        phase: 'done', activeLine: 15,
        path: [], used: [...used], res: res.map((r) => [...r]),
        message: `Done. ${res.length} permutations found.`,
    })
    return steps
}

const EXAMPLES = [
    { label: '[1,2,3]', nums: [1, 2, 3] },
    { label: '[0,1]', nums: [0, 1] },
    { label: '[1,2,3,4]', nums: [1, 2, 3, 4] },
]

export default function PermutationsVisualizer() {
    const [numsInput, setNumsInput] = useState('[1,2,3]')

    const { nums, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(numsInput)
            if (!Array.isArray(parsed)) throw new Error('Must be array')
            return { nums: parsed.map(Number).slice(0, 5), inputError: '' }
        } catch (e) {
            return { nums: [1, 2, 3], inputError: e.message }
        }
    }, [numsInput])

    const steps = useMemo(() => generateSteps(nums), [nums])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => { setNumsInput(JSON.stringify(ex.nums)); handleReset() }, [handleReset])

    return (
        <div className="perm-shell">
            <div className="perm-top">
                <section className="perm-panel main">
                    <header className="perm-head">
                        <span>Backtracking with used[] array</span>
                        {inputError && <span className="perm-error">{inputError}</span>}
                    </header>
                    <div className="perm-body">
                        <div className="perm-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="perm-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="perm-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />

                        <div className="perm-section-label">Current path</div>
                        <div className="perm-path-row">
                            <span className="perm-bracket">[</span>
                            <AnimatePresence mode="popLayout">
                                {(step?.path ?? []).map((v, i) => (
                                    <motion.div key={`${i}-${v}`} className="perm-path-cell"
                                        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
                                        {v}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <span className="perm-bracket">]</span>
                        </div>

                        <div className="perm-section-label">Used flags</div>
                        <div className="perm-nums-row">
                            {nums.map((v, i) => (
                                <div key={i} className={`perm-num-cell ${step?.used?.[i] ? 'used' : ''}`}>
                                    <span className="perm-num-val">{v}</span>
                                    <span className="perm-num-flag">{step?.used?.[i] ? '✓' : '○'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="perm-panel side">
                    <header className="perm-head"><span>Results ({step?.res?.length ?? 0})</span></header>
                    <div className="perm-body">
                        <div className="perm-res-list">
                            <AnimatePresence mode="popLayout">
                                {(step?.res ?? []).map((perm, i) => (
                                    <motion.div key={i} className={`perm-res-item ${i === (step?.res?.length ?? 0) - 1 && step?.phase === 'record' ? 'latest' : ''}`}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}>
                                        [{perm.join(', ')}]
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="perm-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
