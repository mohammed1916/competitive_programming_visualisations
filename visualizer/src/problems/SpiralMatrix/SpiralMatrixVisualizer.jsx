import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './SpiralMatrixVisualizer.css'

const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution:' },
  { line: 2,  text: '    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:' },
  { line: 3,  text: '        if not matrix: return []' },
  { line: 4,  text: '        res = []' },
  { line: 5,  text: '        top, bottom = 0, len(matrix) - 1' },
  { line: 6,  text: '        left, right = 0, len(matrix[0]) - 1' },
  { line: 7,  text: '        while left <= right and top <= bottom:' },
  { line: 8,  text: '            for j in range(left, right + 1):' },
  { line: 9,  text: '                res.append(matrix[top][j])' },
  { line: 10, text: '            top += 1' },
  { line: 11, text: '            for i in range(top, bottom + 1):' },
  { line: 12, text: '                res.append(matrix[i][right])' },
  { line: 13, text: '            right -= 1' },
  { line: 14, text: '            if top <= bottom:' },
  { line: 15, text: '                for j in range(right, left - 1, -1):' },
  { line: 16, text: '                    res.append(matrix[bottom][j])' },
  { line: 17, text: '                bottom -= 1' },
  { line: 18, text: '            if left <= right:' },
  { line: 19, text: '                for i in range(bottom, top - 1, -1):' },
  { line: 20, text: '                    res.append(matrix[i][left])' },
  { line: 21, text: '                left += 1' },
  { line: 22, text: '        return res' },
]

function generateSteps(matrix) {
  const steps = []
  
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    steps.push({
      phase: 'done', top: null, bottom: null, left: null, right: null, 
      res: [], currI: null, currJ: null,
      activeLine: 3, message: 'Empty matrix. Return [].'
    })
    return steps
  }

  const res = []
  let top = 0
  let bottom = matrix.length - 1
  let left = 0
  let right = matrix[0].length - 1

  steps.push({
    phase: 'init', top, bottom, left, right, res: [...res], currI: null, currJ: null,
    activeLine: 6, message: `Initialize boundaries: top=${top}, bottom=${bottom}, left=${left}, right=${right}.`
  })

  while (left <= right && top <= bottom) {
    steps.push({
      phase: 'check_while', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 7, message: `Check condition: left <= right (${left} <= ${right}) and top <= bottom (${top} <= ${bottom}).`
    })

    // Traverse Right
    steps.push({
      phase: 'start_right', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 8, message: `Traverse from left to right along row ${top}.`
    })
    for (let j = left; j <= right; j++) {
      res.push(matrix[top][j])
      steps.push({
        phase: 'visit', top, bottom, left, right, res: [...res], currI: top, currJ: j,
        activeLine: 9, message: `Append matrix[${top}][${j}] (${matrix[top][j]}) to res.`
      })
    }
    top++
    steps.push({
      phase: 'update_top', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 10, message: `Increment top boundary to ${top}.`
    })

    // Traverse Down
    steps.push({
      phase: 'start_down', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 11, message: `Traverse from top to bottom along column ${right}.`
    })
    for (let i = top; i <= bottom; i++) {
      res.push(matrix[i][right])
      steps.push({
        phase: 'visit', top, bottom, left, right, res: [...res], currI: i, currJ: right,
        activeLine: 12, message: `Append matrix[${i}][${right}] (${matrix[i][right]}) to res.`
      })
    }
    right--
    steps.push({
      phase: 'update_right', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 13, message: `Decrement right boundary to ${right}.`
    })

    steps.push({
      phase: 'check_top_bottom', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 14, message: `Check if top <= bottom (${top} <= ${bottom}).`
    })
    if (top <= bottom) {
      // Traverse Left
      steps.push({
        phase: 'start_left', top, bottom, left, right, res: [...res], currI: null, currJ: null,
        activeLine: 15, message: `Traverse from right to left along row ${bottom}.`
      })
      for (let j = right; j >= left; j--) {
        res.push(matrix[bottom][j])
        steps.push({
          phase: 'visit', top, bottom, left, right, res: [...res], currI: bottom, currJ: j,
          activeLine: 16, message: `Append matrix[${bottom}][${j}] (${matrix[bottom][j]}) to res.`
        })
      }
      bottom--
      steps.push({
        phase: 'update_bottom', top, bottom, left, right, res: [...res], currI: null, currJ: null,
        activeLine: 17, message: `Decrement bottom boundary to ${bottom}.`
      })
    }

    steps.push({
      phase: 'check_left_right', top, bottom, left, right, res: [...res], currI: null, currJ: null,
      activeLine: 18, message: `Check if left <= right (${left} <= ${right}).`
    })
    if (left <= right) {
      // Traverse Up
      steps.push({
        phase: 'start_up', top, bottom, left, right, res: [...res], currI: null, currJ: null,
        activeLine: 19, message: `Traverse from bottom to top along column ${left}.`
      })
      for (let i = bottom; i >= top; i--) {
        res.push(matrix[i][left])
        steps.push({
          phase: 'visit', top, bottom, left, right, res: [...res], currI: i, currJ: left,
          activeLine: 20, message: `Append matrix[${i}][${left}] (${matrix[i][left]}) to res.`
        })
      }
      left++
      steps.push({
        phase: 'update_left', top, bottom, left, right, res: [...res], currI: null, currJ: null,
        activeLine: 21, message: `Increment left boundary to ${left}.`
      })
    }
  }

  steps.push({
    phase: 'done', top, bottom, left, right, res: [...res], currI: null, currJ: null,
    activeLine: 22, message: `Matrix traversal complete. Output array length is ${res.length}.`
  })

  return steps
}

const EXAMPLES = [
  { label: '3x3', matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
  { label: '3x4', matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] },
  { label: '4x3', matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] },
  { label: '1 Row', matrix: [[1, 2, 3, 4]] },
  { label: '1 Col', matrix: [[1], [2], [3], [4]] },
]

export default function SpiralMatrixVisualizer() {
  const [matrixInput, setMatrixInput] = useState('[[1,2,3],[4,5,6],[7,8,9]]')

  const { matrix, inputError } = useMemo(() => {
    try {
      const parsed = JSON.parse(matrixInput)
      if (!Array.isArray(parsed) || parsed.some(row => !Array.isArray(row))) {
        throw new Error('Must be a 2D array.')
      }
      return { matrix: parsed, inputError: '' }
    } catch (e) {
      return { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], inputError: 'Invalid format' }
    }
  }, [matrixInput])

  const steps = useMemo(() => generateSteps(matrix), [matrix])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setMatrixInput(JSON.stringify(ex.matrix))
    handleReset()
  }, [handleReset])

  const colsCount = matrix[0]?.length || 1

  return (
    <div className="spiral-matrix-shell">
      <div className="sm-top">
        <div className="sm-panel">
          <div className="sm-panel-head">
            Matrix View
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="sm-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="sm-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <input
              value={matrixInput}
              onChange={(e) => { setMatrixInput(e.target.value); handleReset() }}
              placeholder="[[1,2,3],[4,5,6],[7,8,9]]"
              className="sm-input"
            />
            
            <div className="sm-matrix-container">
                <div 
                  className="sm-grid"
                  style={{ gridTemplateColumns: `repeat(${colsCount}, 1fr)` }}
                >
                    {/* Render boundary overlays */}
                    {step && step.phase !== 'done' && (
                        <>
                            <div className="sm-boundary top-bound" style={{ top: `calc(${step.top} * 48px - 4px)` }} />
                            <div className="sm-boundary bottom-bound" style={{ top: `calc(${(step.bottom + 1)} * 48px - 4px)` }} />
                            <div className="sm-boundary left-bound" style={{ left: `calc(${step.left} * 48px - 4px)` }} />
                            <div className="sm-boundary right-bound" style={{ left: `calc(${(step.right + 1)} * 48px - 4px)` }} />
                        </>
                    )}

                    {matrix.map((row, i) => row.map((val, j) => {
                        const isVisited = step && step.res.includes(val)
                        const isCurrent = step && step.currI === i && step.currJ === j
                        const isOut = step && (i < step.top || i > step.bottom || j < step.left || j > step.right)
                        
                        return (
                            <motion.div 
                                key={`${i}-${j}`}
                                className={`sm-cell ${isVisited ? 'visited' : ''} ${isCurrent ? 'current' : ''} ${isOut ? 'out-bounds' : ''}`}
                                layout
                            >
                                {val}
                            </motion.div>
                        )
                    }))}
                </div>
            </div>
            
            <div className="sm-res-container">
                <span style={{ color: '#94a3b8', fontSize: 13, marginRight: 8, fontFamily: 'monospace' }}>res =</span>
                <div className="sm-res-array">
                    <AnimatePresence>
                        {step?.res.map((val, i) => (
                            <motion.div
                                key={i}
                                className="sm-res-item"
                                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                {val}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {(!step || step.res.length === 0) && <span style={{ color: '#475569', fontStyle: 'italic', padding: 4 }}>[ ]</span>}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="spiral-matrix-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

        <div className="sm-panel">
          <div className="sm-panel-head">Variables</div>
          <div className="sm-panel-body">
            <div className="sm-vars">
              <div className="sm-var-row">
                <span className="sm-var-name">top</span>
                <span className="sm-var-val" style={{ color: '#ef4444' }}>{step?.top ?? '–'}</span>
              </div>
              <div className="sm-var-row">
                <span className="sm-var-name">bottom</span>
                <span className="sm-var-val" style={{ color: '#f97316' }}>{step?.bottom ?? '–'}</span>
              </div>
              <div className="sm-var-row">
                <span className="sm-var-name">left</span>
                <span className="sm-var-val" style={{ color: '#3b82f6' }}>{step?.left ?? '–'}</span>
              </div>
              <div className="sm-var-row">
                <span className="sm-var-name">right</span>
                <span className="sm-var-val" style={{ color: '#8b5cf6' }}>{step?.right ?? '–'}</span>
              </div>
              <div className="sm-var-row">
                <span className="sm-var-name">matrix[i][j]</span>
                <span className="sm-var-val highlight">
                    {step && step.currI !== null && step.currJ !== null ? matrix[step.currI][step.currJ] : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`sm-status ${step?.phase === 'visit' ? 'visit' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="sm-dock">
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
        />
      </div>
    </div>
  )
}
