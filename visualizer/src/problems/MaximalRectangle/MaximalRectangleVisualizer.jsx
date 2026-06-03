import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import './MaximalRectangleVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def maximalRectangle(self, matrix):' },
  { line: 3, text: '        if not matrix: return 0' },
  { line: 4, text: '        m, n = len(matrix), len(matrix[0])' },
  { line: 5, text: '        heights = [0] * n' },
  { line: 6, text: '        max_area = 0' },
  { line: 7, text: '        ' },
  { line: 8, text: '        for row in matrix:' },
  { line: 9, text: '            for i in range(n):' },
  { line: 10, text: '                if row[i] == "1":' },
  { line: 11, text: '                    heights[i] += 1' },
  { line: 12, text: '                else:' },
  { line: 13, text: '                    heights[i] = 0' },
  { line: 14, text: '            ' },
  { line: 15, text: '            max_area = max(max_area, largestRectangleArea(heights))' },
]

function generateSteps(matrix) {
  const steps = []

  if (!matrix || matrix.length === 0) {
    steps.push({
      phase: 'done',
      currentRow: -1,
      heights: [],
      maxArea: 0,
      activeLine: 3,
      message: 'Empty matrix.',
    })
    return steps
  }

  const m = matrix.length
  const n = matrix[0].length

  steps.push({
    phase: 'init',
    currentRow: -1,
    heights: new Array(n).fill(0),
    maxArea: 0,
    activeLine: 5,
    message: `Matrix ${m}x${n}. Initialize heights=[0]*${n}`,
  })

  let heights = new Array(n).fill(0)
  let maxArea = 0

  for (let row = 0; row < m; row++) {
    steps.push({
      phase: 'row_start',
      currentRow: row,
      heights: [...heights],
      maxArea,
      activeLine: 8,
      message: `Process row ${row}: [${matrix[row].map(x => x).join(',')}]`,
    })

    for (let i = 0; i < n; i++) {
      if (matrix[row][i] === '1' || matrix[row][i] === 1) {
        heights[i] += 1
      } else {
        heights[i] = 0
      }

      steps.push({
        phase: 'height_update',
        currentRow: row,
        heights: [...heights],
        maxArea,
        activeLine: matrix[row][i] === '1' || matrix[row][i] === 1 ? 11 : 13,
        message: `Col ${i}: matrix[${row}][${i}]=${matrix[row][i]}, heights[${i}]=${heights[i]}`,
      })
    }

    const stack = []
    let currentMaxArea = 0

    for (let i = 0; i < n; i++) {
      while (stack.length > 0 && heights[stack[stack.length - 1]] > heights[i]) {
        const popIdx = stack.pop()
        const h = heights[popIdx]
        const width = i - (stack.length > 0 ? stack[stack.length - 1] + 1 : 0)
        const area = h * width

        steps.push({
          phase: 'area_calc',
          currentRow: row,
          heights: [...heights],
          maxArea,
          currentArea: area,
          activeLine: 15,
          message: `Pop[${popIdx}]: h=${h}, width=${width}, area=${area}`,
        })

        currentMaxArea = Math.max(currentMaxArea, area)
      }

      stack.push(i)
    }

    while (stack.length > 0) {
      const popIdx = stack.pop()
      const h = heights[popIdx]
      const width = n - (stack.length > 0 ? stack[stack.length - 1] + 1 : 0)
      const area = h * width

      steps.push({
        phase: 'area_final',
        currentRow: row,
        heights: [...heights],
        maxArea,
        currentArea: area,
        activeLine: 15,
        message: `Final pop[${popIdx}]: h=${h}, width=${width}, area=${area}`,
      })

      currentMaxArea = Math.max(currentMaxArea, area)
    }

    maxArea = Math.max(maxArea, currentMaxArea)

    steps.push({
      phase: 'row_end',
      currentRow: row,
      heights: [...heights],
      maxArea,
      activeLine: 15,
      message: `Row ${row} complete. Max area so far: ${maxArea}`,
    })
  }

  steps.push({
    phase: 'done',
    currentRow: m,
    heights: [...heights],
    maxArea,
    activeLine: 15,
    message: `Complete. Maximum rectangle: ${maxArea}`,
  })

  return steps
}

function MaximalRectangleVisualizer() {
  const defaultMatrix = [
    ['1', '0', '1'],
    ['1', '0', '1'],
    ['1', '1', '1'],
  ]

  const [matrix, setMatrix] = useState(defaultMatrix)
  const [inputValue, setInputValue] = useState(JSON.stringify(defaultMatrix))

  const steps = useMemo(() => generateSteps(matrix), [matrix])
  const { activeStepIndex, isPlaying, togglePlayback, reset, setActiveStepIndex } =
    usePlaybackState(steps)

  const { highlightLines } = useCodeVisualConnectivity(activeStepIndex, steps)

  const activeStep = steps[activeStepIndex]

  const handleRun = useCallback(() => {
    try {
      const parsed = JSON.parse(inputValue)
      setMatrix(parsed)
      reset()
    } catch (e) {
      alert('Invalid JSON input')
    }
  }, [inputValue, reset])

  const handleReset = useCallback(() => {
    setMatrix(defaultMatrix)
    setInputValue(JSON.stringify(defaultMatrix))
    reset()
  }, [reset])

  const m = matrix.length
  const n = matrix[0]?.length || 0
  const cellSize = Math.min(300 / n, 200 / m, 50)

  const getCellColor = (r, c) => {
    if (activeStep?.currentRow === r) {
      return matrix[r][c] === '1' || matrix[r][c] === 1
        ? '#a6e3a1'
        : '#f5c6de'
    }
    return matrix[r][c] === '1' || matrix[r][c] === 1
      ? '#45475a'
      : '#313244'
  }

  return (
    <div className="mr-shell">
      <div className="mr-top">
        <div className="mr-panel mr-code-panel">
          <CodeTracePanel
            lines={SOLUTION_CODE}
            highlightLines={highlightLines}
            title="Solution Code"
          />
        </div>

        <div className="mr-panel mr-visualization">
          <div className="mr-panel-head">Matrix Visualization</div>
          <div className="mr-panel-body">
            <div
              className="mr-grid"
              style={{
                gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
                gap: '4px',
              }}
            >
              <AnimatePresence mode="popLayout">
                {matrix.map((row, r) =>
                  row.map((val, c) => (
                    <motion.div
                      key={`${r}-${c}`}
                      className="mr-cell"
                      style={{
                        backgroundColor: getCellColor(r, c),
                        width: cellSize,
                        height: cellSize,
                      }}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mr-cell-value">{val}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mr-panel mr-histogram">
          <div className="mr-panel-head">Heights Histogram</div>
          <div className="mr-panel-body">
            <div className="mr-histogram-container">
              {activeStep?.heights?.map((h, i) => (
                <motion.div
                  key={i}
                  className="mr-histogram-bar"
                  animate={{
                    height: `${(h / Math.max(...(activeStep?.heights || [1]))) * 100}%`,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    backgroundColor:
                      activeStep?.currentHistIdx === i ? '#f38ba8' : '#a6e3a1',
                  }}
                  title={`heights[${i}] = ${h}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mr-middle">
        <div className="mr-panel mr-state">
          <div className="mr-panel-head">State</div>
          <div className="mr-panel-body">
            <div className="mr-state-item">
              <div className="mr-state-label">Phase:</div>
              <div className="mr-state-value">{activeStep?.phase}</div>
            </div>
            <div className="mr-state-item">
              <div className="mr-state-label">Current Row:</div>
              <div className="mr-state-value">{activeStep?.currentRow}</div>
            </div>
            <div className="mr-state-item">
              <div className="mr-state-label">Max Area:</div>
              <div className="mr-state-value">{activeStep?.maxArea}</div>
            </div>
            {activeStep?.currentArea !== undefined && (
              <div className="mr-state-item">
                <div className="mr-state-label">Current Area:</div>
                <div className="mr-state-value">{activeStep?.currentArea}</div>
              </div>
            )}
          </div>
        </div>

        <div className="mr-panel mr-message">
          <div className="mr-panel-head">Trace</div>
          <div className="mr-panel-body">
            <div className="mr-message-text">{activeStep?.message}</div>
          </div>
        </div>

        <div className="mr-panel mr-controls">
          <div className="mr-panel-head">Input</div>
          <div className="mr-panel-body">
            <textarea
              className="mr-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={3}
            />
            <button className="mr-button" onClick={handleRun}>
              Run
            </button>
            <button className="mr-button mr-button-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mr-bottom">
        <PlaybackControls
          activeStep={activeStepIndex}
          totalSteps={steps.length}
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
          onStepChange={setActiveStepIndex}
        />
      </div>
    </div>
  )
}

export default MaximalRectangleVisualizer
