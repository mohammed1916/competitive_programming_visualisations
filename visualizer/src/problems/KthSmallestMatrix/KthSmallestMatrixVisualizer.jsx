import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './KthSmallestMatrixVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def kthSmallest(matrix: List[List[int]], k: int) -> int:' },
    { line: 2, text: '    n = len(matrix)' },
    { line: 3, text: '    lo = matrix[0][0]' },
    { line: 4, text: '    hi = matrix[n-1][n-1]' },
    { line: 5, text: '    def countLessEqual(mid):' },
    { line: 6, text: '        count = 0' },
    { line: 7, text: '        r, c = n - 1, 0' },
    { line: 8, text: '        while r >= 0 and c < n:' },
    { line: 9, text: '            if matrix[r][c] <= mid:' },
    { line: 10, text: '                count += r + 1' },
    { line: 11, text: '                c += 1' },
    { line: 12, text: '            else: r -= 1' },
    { line: 13, text: '        return count' },
    { line: 14, text: '    while lo < hi:' },
    { line: 15, text: '        mid = (lo + hi) // 2' },
    { line: 16, text: '        if countLessEqual(mid) < k:' },
    { line: 17, text: '            lo = mid + 1' },
    { line: 18, text: '        else: hi = mid' },
    { line: 19, text: '    return lo' },
]

function generateSteps(matrix, k) {
    const steps = []
    const n = matrix.length

    if (k < 1 || k > n * n) {
        steps.push({
            phase: 'error',
            activeLine: 1,
            message: `Invalid k: must be between 1 and ${n * n}.`,
        })
        return steps
    }

    let lo = matrix[0][0]
    let hi = matrix[n - 1][n - 1]

    steps.push({
        phase: 'init',
        activeLine: 3,
        lo,
        hi,
        k,
        message: `Initialize: lo=${lo} (top-left), hi=${hi} (bottom-right), k=${k}.`,
    })

    let iteration = 0

    while (lo < hi) {
        iteration++
        const mid = Math.floor((lo + hi) / 2)

        steps.push({
            phase: 'binary_search',
            activeLine: 15,
            lo,
            hi,
            mid,
            k,
            iteration,
            message: `Iteration ${iteration}: mid = (${lo} + ${hi}) / 2 = ${mid}.`,
        })

        // Count elements <= mid
        let count = 0
        const countedCells = []
        let r = n - 1
        let c = 0

        steps.push({
            phase: 'count_start',
            activeLine: 5,
            mid,
            message: `Count elements <= ${mid}. Start from bottom-left (${r}, ${c}).`,
        })

        while (r >= 0 && c < n) {
            const val = matrix[r][c]

            steps.push({
                phase: 'count_check',
                activeLine: 9,
                r,
                c,
                mid,
                val,
                countedCells,
                message: `Check (${r}, ${c}): value=${val} ${val <= mid ? '<=' : '>'} ${mid}`,
            })

            if (val <= mid) {
                count += r + 1
                countedCells.push(...Array.from({ length: r + 1 }, (_, i) => [i, c]))

                steps.push({
                    phase: 'count_add',
                    activeLine: 10,
                    r,
                    c,
                    mid,
                    val,
                    count,
                    countedCells,
                    message: `${val} <= ${mid}: add ${r + 1} to count. count=${count}. Move right.`,
                })

                c++
            } else {
                steps.push({
                    phase: 'count_skip',
                    activeLine: 12,
                    r,
                    c,
                    mid,
                    val,
                    message: `${val} > ${mid}: move up.`,
                })

                r--
            }
        }

        steps.push({
            phase: 'count_done',
            activeLine: 13,
            mid,
            count,
            k,
            message: `Count complete: ${count} elements <= ${mid}. Compare with k=${k}.`,
        })

        if (count < k) {
            steps.push({
                phase: 'adjust_lo',
                activeLine: 17,
                lo: mid + 1,
                hi,
                count,
                k,
                message: `${count} < ${k}: search in upper half. lo = ${mid + 1}.`,
            })

            lo = mid + 1
        } else {
            steps.push({
                phase: 'adjust_hi',
                activeLine: 18,
                lo,
                hi: mid,
                count,
                k,
                message: `${count} >= ${k}: kth smallest is <= ${mid}. hi = ${mid}.`,
            })

            hi = mid
        }
    }

    steps.push({
        phase: 'done',
        activeLine: 19,
        result: lo,
        k,
        message: `Binary search complete. Answer: ${lo} (kth=${k}).`,
    })

    return steps
}

function KthSmallestMatrixVisualizer() {
    const [matrixStr, setMatrixStr] = useState('[[1,5,9],[10,11,13],[12,13,15]]')
    const [k, setK] = useState(8)
    const [error, setError] = useState('')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    let matrix = []
    try {
        matrix = JSON.parse(matrixStr)
        if (!Array.isArray(matrix) || matrix.some(row => !Array.isArray(row))) {
            throw new Error('Invalid format')
        }
        setError('')
    } catch {
        setError('Invalid matrix format')
    }

    const steps = useMemo(() => {
        if (matrix.length === 0 || error) return []
        return generateSteps(matrix, k)
    }, [matrix, k, error])

    const { currentStep, isPlaying, setIsPlaying, setCurrentStep } =
        usePlaybackState(steps.length)
    const { lineConnections } = useCodeVisualConnectivity(
        currentStep < steps.length ? steps[currentStep]?.activeLine : -1
    )

    const currentStepData = currentStep < steps.length ? steps[currentStep] : null

    const handleExampleLoad = (example) => {
        if (example === 'example1') {
            setMatrixStr('[[1,5,9],[10,11,13],[12,13,15]]')
            setK(8)
        } else if (example === 'example2') {
            setMatrixStr('[[1,2],[1,1]]')
            setK(1)
        } else if (example === 'example3') {
            setMatrixStr('[[1,3,5],[6,7,8],[9,10,11]]')
            setK(5)
        }
        setCurrentStep(0)
    }

    const renderMatrix = () => {
        if (matrix.length === 0) return null

        const n = matrix.length
        const cellSize = 60
        const gap = 8

        return (
            <svg
                viewBox={`0 0 ${n * cellSize + (n - 1) * gap} ${n * cellSize + (n - 1) * gap}`}
                className="ksm-matrix-viz"
                preserveAspectRatio="xMidYMid meet"
            >
                <AnimatePresence>
                    {matrix.map((row, r) =>
                        row.map((val, c) => {
                            const x = c * (cellSize + gap)
                            const y = r * (cellSize + gap)
                            const isHighlighted =
                                currentStepData?.r === r && currentStepData?.c === c
                            const isCountedCell =
                                currentStepData?.countedCells?.some(([cr, cc]) => cr === r && cc === c)
                            const isResult =
                                currentStepData?.phase === 'done' && val === currentStepData?.result

                            return (
                                <motion.g
                                    key={`cell-${r}-${c}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.25, delay: (r + c) * 0.05 }}
                                >
                                    <rect
                                        x={x}
                                        y={y}
                                        width={cellSize}
                                        height={cellSize}
                                        rx="6"
                                        fill={
                                            isResult
                                                ? '#22c55e'
                                                : isCountedCell
                                                    ? '#8b5cf6'
                                                    : isHighlighted
                                                        ? '#f5c2e7'
                                                        : '#313244'
                                        }
                                        stroke={
                                            isResult
                                                ? '#22c55e'
                                                : isHighlighted
                                                    ? '#f5c2e7'
                                                    : '#45475a'
                                        }
                                        strokeWidth={isHighlighted || isCountedCell || isResult ? 2 : 1}
                                    />
                                    <text
                                        x={x + cellSize / 2}
                                        y={y + cellSize / 2}
                                        textAnchor="middle"
                                        dy="0.3em"
                                        fontSize="14"
                                        fontWeight="700"
                                        fill={isCountedCell || isResult ? '#1e1e2e' : '#cdd6f4'}
                                    >
                                        {val}
                                    </text>
                                </motion.g>
                            )
                        })
                    )}
                </AnimatePresence>
            </svg>
        )
    }

    return (
        <div className="ksm-shell">
            <div className="ksm-panel">
                <div className="ksm-head">
                    <span>Binary Search on Value Range</span>
                </div>
                <div className="ksm-body">
                    <div className="ksm-inputs-row">
                        <div className="ksm-input-group">
                            <label className="ksm-label">Matrix (JSON):</label>
                            <textarea
                                value={matrixStr}
                                onChange={(e) => setMatrixStr(e.target.value)}
                                className="ksm-textarea"
                                rows="3"
                            />
                            {error && <div className="ksm-error">{error}</div>}
                        </div>

                        <div className="ksm-input-group">
                            <label className="ksm-label">K Value:</label>
                            <input
                                type="number"
                                value={k}
                                onChange={(e) => setK(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                max={matrix.length * matrix.length}
                                className="ksm-input"
                            />
                            {matrix.length > 0 && (
                                <div className="ksm-k-info">
                                    Valid range: 1-{matrix.length * matrix.length}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ksm-examples">
                        <span className="ksm-example-label">Examples:</span>
                        <button
                            onClick={() => handleExampleLoad('example1')}
                            className="ksm-example-btn"
                        >
                            Ex 1 (3x3, k=8)
                        </button>
                        <button
                            onClick={() => handleExampleLoad('example2')}
                            className="ksm-example-btn"
                        >
                            Ex 2 (2x2, k=1)
                        </button>
                        <button
                            onClick={() => handleExampleLoad('example3')}
                            className="ksm-example-btn"
                        >
                            Ex 3 (3x3, k=5)
                        </button>
                    </div>

                    {currentStepData && (
                        <div className="ksm-status">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="ksm-message"
                            >
                                {currentStepData.message}
                            </motion.div>
                            {currentStepData.phase !== 'error' && currentStepData.phase !== 'init' && (
                                <div className="ksm-state-box">
                                    <div className="ksm-state-row">
                                        <span>lo: {currentStepData.lo}</span>
                                        <span>mid: {currentStepData.mid}</span>
                                        <span>hi: {currentStepData.hi}</span>
                                    </div>
                                    {currentStepData.count !== undefined && (
                                        <div className="ksm-state-row">
                                            <span>count: {currentStepData.count}</span>
                                            <span>k: {currentStepData.k}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {renderMatrix()}
                </div>
            </div>

            <CodeTracePanel code={SOLUTION_CODE} lineConnections={lineConnections} onActiveLineDomChange={setActiveLineDom} />

            <PlaybackControls
                currentStep={currentStep}
                totalSteps={steps.length}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onStepForward={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
                onStepBackward={() => setCurrentStep(Math.max(currentStep - 1, 0))}
                onReset={() => setCurrentStep(0)}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />

            {showPatternOverlay && currentStepData && <PatternOverlay step={currentStepData} activeLineDom={activeLineDom} />}
        </div>
    )
}

export default KthSmallestMatrixVisualizer
