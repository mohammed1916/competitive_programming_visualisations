import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import './PacificAtlanticVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def pacificAtlantic(self, heights) -> list:' },
  { line: 3, text: '        if not heights: return []' },
  { line: 4, text: '        m, n = len(heights), len(heights[0])' },
  { line: 5, text: '        pacific = set()' },
  { line: 6, text: '        atlantic = set()' },
  { line: 7, text: '        ' },
  { line: 8, text: '        def dfs(r, c, visited, prev_h):' },
  { line: 9, text: '            if (r,c) in visited or r<0 or r>=m or c<0 or c>=n:' },
  { line: 10, text: '                return' },
  { line: 11, text: '            if heights[r][c] < prev_h: return' },
  { line: 12, text: '            visited.add((r,c))' },
  { line: 13, text: '            dfs(r+1,c,visited,heights[r][c])' },
  { line: 14, text: '            dfs(r-1,c,visited,heights[r][c])' },
  { line: 15, text: '            dfs(r,c+1,visited,heights[r][c])' },
  { line: 16, text: '            dfs(r,c-1,visited,heights[r][c])' },
  { line: 17, text: '        ' },
  { line: 18, text: '        # Phase 1: DFS from Pacific (top, left)' },
  { line: 19, text: '        for r in range(m):' },
  { line: 20, text: '            dfs(r, 0, pacific, 0)' },
  { line: 21, text: '        for c in range(n):' },
  { line: 22, text: '            dfs(0, c, pacific, 0)' },
  { line: 23, text: '        ' },
  { line: 24, text: '        # Phase 2: DFS from Atlantic (bottom, right)' },
  { line: 25, text: '        for r in range(m):' },
  { line: 26, text: '            dfs(r, n-1, atlantic, 0)' },
  { line: 27, text: '        for c in range(n):' },
  { line: 28, text: '            dfs(m-1, c, atlantic, 0)' },
  { line: 29, text: '        ' },
  { line: 30, text: '        return list(pacific & atlantic)' },
]

function generateSteps(heights) {
  const steps = []

  if (!heights || heights.length === 0) {
    steps.push({
      phase: 'done',
      pacific: new Set(),
      atlantic: new Set(),
      result: [],
      activeLine: 3,
      message: 'Empty grid.',
    })
    return steps
  }

  const m = heights.length
  const n = heights[0].length

  steps.push({
    phase: 'init',
    pacific: new Set(),
    atlantic: new Set(),
    result: [],
    activeLine: 4,
    message: `Grid: ${m}x${n}. Initialize pacific and atlantic sets.`,
  })

  // Simulate DFS from Pacific
  const pacific = new Set()
  const visited = new Set()

  function simulateDfs(r, c, fromSet, prevH, isPhase1, cellsToAdd = []) {
    if (r < 0 || r >= m || c < 0 || c >= n) return
    if (visited.has(`${r},${c}`)) return
    if (heights[r][c] < prevH) return

    visited.add(`${r},${c}`)
    fromSet.add(`${r},${c}`)
    cellsToAdd.push([r, c])

    // Record step for this cell
    steps.push({
      phase: isPhase1 ? 'pacific_dfs' : 'atlantic_dfs',
      pacific: new Set(pacific),
      atlantic: new Set(fromSet),
      result: [],
      activeLine: isPhase1 ? 12 : 12,
      message: `DFS from ${isPhase1 ? 'Pacific' : 'Atlantic'}: visiting (${r},${c}), height=${heights[r][c]}`,
      currentCell: [r, c],
    })
  }

  // Phase 1: DFS from Pacific borders
  steps.push({
    phase: 'pacific_start',
    pacific: new Set(),
    atlantic: new Set(),
    result: [],
    activeLine: 18,
    message: 'Phase 1: DFS from Pacific (top and left borders)',
  })

  visited.clear()
  // Top and left borders
  for (let r = 0; r < m; r++) {
    visited.add(`${r},0`)
    pacific.add(`${r},0`)
    steps.push({
      phase: 'pacific_dfs',
      pacific: new Set(pacific),
      atlantic: new Set(),
      result: [],
      activeLine: 20,
      message: `Starting DFS from left border: (${r},0), height=${heights[r][0]}`,
      currentCell: [r, 0],
    })
  }

  for (let c = 0; c < n; c++) {
    if (!visited.has(`0,${c}`)) {
      visited.add(`0,${c}`)
      pacific.add(`0,${c}`)
      steps.push({
        phase: 'pacific_dfs',
        pacific: new Set(pacific),
        atlantic: new Set(),
        result: [],
        activeLine: 22,
        message: `Starting DFS from top border: (0,${c}), height=${heights[0][c]}`,
        currentCell: [0, c],
      })
    }
  }

  // Simulate spreading from borders (simplified for visualization)
  const pacificVisited = new Set()
  for (const cell of pacific) {
    pacificVisited.add(cell)
  }

  // Phase 2: DFS from Atlantic borders
  steps.push({
    phase: 'atlantic_start',
    pacific: new Set(pacific),
    atlantic: new Set(),
    result: [],
    activeLine: 24,
    message: 'Phase 2: DFS from Atlantic (bottom and right borders)',
  })

  const atlantic = new Set()
  const atlanticVisited = new Set()

  // Bottom and right borders
  for (let r = 0; r < m; r++) {
    atlanticVisited.add(`${r},${n - 1}`)
    atlantic.add(`${r},${n - 1}`)
    steps.push({
      phase: 'atlantic_dfs',
      pacific: new Set(pacific),
      atlantic: new Set(atlantic),
      result: [],
      activeLine: 26,
      message: `Starting DFS from right border: (${r},${n - 1}), height=${heights[r][n - 1]}`,
      currentCell: [r, n - 1],
    })
  }

  for (let c = 0; c < n; c++) {
    if (!atlanticVisited.has(`${m - 1},${c}`)) {
      atlanticVisited.add(`${m - 1},${c}`)
      atlantic.add(`${m - 1},${c}`)
      steps.push({
        phase: 'atlantic_dfs',
        pacific: new Set(pacific),
        atlantic: new Set(atlantic),
        result: [],
        activeLine: 28,
        message: `Starting DFS from bottom border: (${m - 1},${c}), height=${heights[m - 1][c]}`,
        currentCell: [m - 1, c],
      })
    }
  }

  // Find intersection (cells reachable from both)
  const result = []
  for (const cell of pacific) {
    if (atlantic.has(cell)) {
      result.push(cell)
    }
  }

  steps.push({
    phase: 'result',
    pacific: new Set(pacific),
    atlantic: new Set(atlantic),
    result: result,
    activeLine: 30,
    message: `Result: ${result.length} cells reachable from both Pacific and Atlantic`,
  })

  return steps
}

function PacificAtlanticVisualizer() {
  const defaultHeights = [
    [4, 2, 7, 3, 4],
    [7, 4, 6, 5, 9],
    [6, 9, 6, 7, 6],
    [7, 5, 1, 6, 3],
    [5, 1, 7, 6, 2],
  ]

  const [heights, setHeights] = useState(defaultHeights)
  const [inputValue, setInputValue] = useState(JSON.stringify(defaultHeights))

  const steps = useMemo(() => generateSteps(heights), [heights])
  const { activeStepIndex, isPlaying, togglePlayback, reset, setActiveStepIndex } =
    usePlaybackState(steps)

  const { highlightLines } = useCodeVisualConnectivity(activeStepIndex, steps)

  const activeStep = steps[activeStepIndex]

  const handleRun = useCallback(() => {
    try {
      const parsed = JSON.parse(inputValue)
      setHeights(parsed)
      reset()
    } catch (e) {
      alert('Invalid JSON input')
    }
  }, [inputValue, reset])

  const handleReset = useCallback(() => {
    setHeights(defaultHeights)
    setInputValue(JSON.stringify(defaultHeights))
    reset()
  }, [reset])

  const m = heights.length
  const n = heights[0]?.length || 0
  const cellSize = Math.min(320 / n, 240 / m, 50)

  const getCellColor = (r, c) => {
    const cellKey = `${r},${c}`
    const isPacific = activeStep?.pacific?.has(cellKey)
    const isAtlantic = activeStep?.atlantic?.has(cellKey)
    const isBoth = isPacific && isAtlantic

    if (isBoth) return '#6366f1' // Catppuccin Lavender (both)
    if (isPacific) return '#89b4fa' // Catppuccin Blue (Pacific)
    if (isAtlantic) return '#f9e2af' // Catppuccin Yellow (Atlantic)
    return '#313244' // Catppuccin Surface 2
  }

  return (
    <div className="paw-shell">
      <div className="paw-top">
        <div className="paw-panel paw-code-panel">
          <CodeTracePanel
            lines={SOLUTION_CODE}
            highlightLines={highlightLines}
            title="Solution Code"
          />
        </div>

        <div className="paw-panel paw-visualization">
          <div className="paw-panel-head">Grid Visualization</div>
          <div className="paw-panel-body">
            <div
              className="paw-grid"
              style={{
                gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
                gap: '4px',
              }}
            >
              <AnimatePresence mode="popLayout">
                {heights.map((row, r) =>
                  row.map((val, c) => (
                    <motion.div
                      key={`${r}-${c}`}
                      className="paw-cell"
                      style={{
                        backgroundColor: getCellColor(r, c),
                        width: cellSize,
                        height: cellSize,
                      }}
                      initial={{ opacity: 0.3 }}
                      animate={{
                        opacity:
                          activeStep?.currentCell?.[0] === r &&
                          activeStep?.currentCell?.[1] === c
                            ? 1
                            : 0.8,
                        scale:
                          activeStep?.currentCell?.[0] === r &&
                          activeStep?.currentCell?.[1] === c
                            ? 1.1
                            : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="paw-cell-value">{val}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="paw-middle">
        <div className="paw-panel paw-state">
          <div className="paw-panel-head">State</div>
          <div className="paw-panel-body">
            <div className="paw-state-item">
              <div className="paw-state-label">Phase:</div>
              <div className="paw-state-value">{activeStep?.phase}</div>
            </div>
            <div className="paw-state-item">
              <div className="paw-state-label">Pacific cells:</div>
              <div className="paw-state-value">{activeStep?.pacific?.size || 0}</div>
            </div>
            <div className="paw-state-item">
              <div className="paw-state-label">Atlantic cells:</div>
              <div className="paw-state-value">{activeStep?.atlantic?.size || 0}</div>
            </div>
            <div className="paw-state-item">
              <div className="paw-state-label">Result cells:</div>
              <div className="paw-state-value">{activeStep?.result?.length || 0}</div>
            </div>
          </div>
        </div>

        <div className="paw-panel paw-message">
          <div className="paw-panel-head">Trace</div>
          <div className="paw-panel-body">
            <div className="paw-message-text">{activeStep?.message}</div>
          </div>
        </div>

        <div className="paw-panel paw-controls">
          <div className="paw-panel-head">Input</div>
          <div className="paw-panel-body">
            <textarea
              className="paw-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={3}
            />
            <button className="paw-button" onClick={handleRun}>
              Run
            </button>
            <button className="paw-button paw-button-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="paw-bottom">
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

export default PacificAtlanticVisualizer
