import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './SwimInRisingWaterVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def swimInWater(self, grid) -> int:' },
  { line: 3, text: '        n = len(grid)' },
  { line: 4, text: '        left, right = 0, n * n - 1' },
  { line: 5, text: '        ' },
  { line: 6, text: '        def canReach(t):' },
  { line: 7, text: '            visited = set([(0, 0)])' },
  { line: 8, text: '            queue = [(0, 0)]' },
  { line: 9, text: '            ' },
  { line: 10, text: '            while queue:' },
  { line: 11, text: '                r, c = queue.pop(0)' },
  { line: 12, text: '                if r == n - 1 and c == n - 1:' },
  { line: 13, text: '                    return True' },
  { line: 14, text: '                ' },
  { line: 15, text: '                for dr, dc in [(0,1),(1,0),(0,-1),(-1,0)]:' },
  { line: 16, text: '                    nr, nc = r + dr, c + dc' },
  { line: 17, text: '                    if 0 <= nr < n and 0 <= nc < n:' },
  { line: 18, text: '                        if (nr,nc) not in visited and grid[nr][nc] <= t:' },
  { line: 19, text: '                            visited.add((nr,nc))' },
  { line: 20, text: '                            queue.append((nr,nc))' },
  { line: 21, text: '            return False' },
  { line: 22, text: '        ' },
  { line: 23, text: '        while left < right:' },
  { line: 24, text: '            mid = left + (right - left) // 2' },
  { line: 25, text: '            if canReach(mid):' },
  { line: 26, text: '                right = mid' },
  { line: 27, text: '            else:' },
  { line: 28, text: '                left = mid + 1' },
  { line: 29, text: '        ' },
  { line: 30, text: '        return left' },
]

function generateSteps(grid) {
  const steps = []

  if (!grid || grid.length === 0) {
    steps.push({
      phase: 'done',
      lo: 0,
      hi: 0,
      mid: null,
      reachable: false,
      reachableCells: new Set(),
      activeLine: 3,
      message: 'Empty grid.',
    })
    return steps
  }

  const n = grid.length
  const maxVal = n * n - 1

  steps.push({
    phase: 'init',
    lo: 0,
    hi: maxVal,
    mid: null,
    reachable: false,
    reachableCells: new Set(),
    activeLine: 3,
    message: `Grid: ${n}x${n}. Binary search range: [0, ${maxVal}]`,
  })

  function bfsReachable(t) {
    const visited = new Set()
    const queue = [[0, 0]]
    visited.add('0,0')
    const reachable = new Set()
    reachable.add('0,0')

    while (queue.length > 0) {
      const [r, c] = queue.shift()

      if (r === n - 1 && c === n - 1) {
        return { found: true, visited: reachable }
      }

      const dirs = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ]
      for (const [dr, dc] of dirs) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
          const key = `${nr},${nc}`
          if (!visited.has(key) && grid[nr][nc] <= t) {
            visited.add(key)
            queue.push([nr, nc])
            reachable.add(key)
          }
        }
      }
    }

    return { found: false, visited: reachable }
  }

  let lo = 0
  let hi = maxVal

  while (lo < hi) {
    const mid = Math.floor(lo + (hi - lo) / 2)

    steps.push({
      phase: 'binary_search',
      lo,
      hi,
      mid,
      reachable: null,
      reachableCells: new Set(),
      activeLine: 24,
      message: `Binary search: lo=${lo}, hi=${hi}, mid=${mid}`,
    })

    const { found, visited } = bfsReachable(mid)

    steps.push({
      phase: 'bfs_check',
      lo,
      hi,
      mid,
      reachable: found,
      reachableCells: new Set(visited),
      activeLine: found ? 25 : 18,
      message: `BFS with t=${mid}: ${found ? 'REACHABLE' : 'NOT REACHABLE'}. Visited ${visited.size} cells.`,
    })

    if (found) {
      steps.push({
        phase: 'binary_search_narrow',
        lo,
        hi: mid,
        mid,
        reachable: true,
        reachableCells: new Set(visited),
        activeLine: 26,
        message: `Destination reachable with t=${mid}. Try smaller: hi = ${mid}`,
      })
      hi = mid
    } else {
      steps.push({
        phase: 'binary_search_narrow',
        lo: mid + 1,
        hi,
        mid,
        reachable: false,
        reachableCells: new Set(visited),
        activeLine: 28,
        message: `Destination NOT reachable with t=${mid}. Need larger: lo = ${mid + 1}`,
      })
      lo = mid + 1
    }
  }

  steps.push({
    phase: 'done',
    lo,
    hi,
    mid: lo,
    reachable: true,
    reachableCells: new Set(),
    activeLine: 30,
    message: `Minimum time: ${lo}`,
  })

  return steps
}

function SwimInRisingWaterVisualizer() {
  const defaultGrid = [
    [0, 2],
    [1, 3],
  ]

  const [grid, setGrid] = useState(defaultGrid)
  const [inputValue, setInputValue] = useState(JSON.stringify(defaultGrid))

  const steps = useMemo(() => generateSteps(grid), [grid])
  const { activeStepIndex, isPlaying, togglePlayback, reset, setActiveStepIndex } =
    usePlaybackState(steps)

  const { highlightLines } = useCodeVisualConnectivity(activeStepIndex, steps)

  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

  const activeStep = steps[activeStepIndex]

  const handleRun = useCallback(() => {
    try {
      const parsed = JSON.parse(inputValue)
      setGrid(parsed)
      reset()
    } catch (e) {
      alert('Invalid JSON input')
    }
  }, [inputValue, reset])

  const handleReset = useCallback(() => {
    setGrid(defaultGrid)
    setInputValue(JSON.stringify(defaultGrid))
    reset()
  }, [reset])

  const n = grid.length
  const cellSize = Math.min(320 / n, 240 / n, 60)

  const getCellColor = (r, c) => {
    const cellKey = `${r},${c}`
    const isReachable = activeStep?.reachableCells?.has(cellKey)
    const val = grid[r][c]
    const mid = activeStep?.mid

    // Color based on elevation relative to mid
    if (mid !== null && mid !== undefined) {
      if (val <= mid) {
        return isReachable ? '#94e2d5' : '#313244' // Cyan if reachable, dark if not
      } else {
        return '#f5a97f' // Orange for cells above threshold
      }
    }

    return '#313244'
  }

  return (
    <div className="srw-shell">
      <div className="srw-top">
        <div className="srw-panel srw-code-panel">
          <CodeTracePanel
            lines={SOLUTION_CODE}
            highlightLines={highlightLines}
            title="Solution Code"
            onActiveLineDomChange={setActiveLineDom}
          />
        </div>

        <div className="srw-panel srw-visualization">
          <div className="srw-panel-head">Grid Visualization (t = {activeStep?.mid ?? '?'})</div>
          <div className="srw-panel-body">
            <div
              className="srw-grid"
              style={{
                gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
                gap: '4px',
              }}
            >
              <AnimatePresence mode="popLayout">
                {grid.map((row, r) =>
                  row.map((val, c) => (
                    <motion.div
                      key={`${r}-${c}`}
                      className="srw-cell"
                      style={{
                        backgroundColor: getCellColor(r, c),
                        width: cellSize,
                        height: cellSize,
                      }}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="srw-cell-value">{val}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="srw-middle">
        <div className="srw-panel srw-binary-search">
          <div className="srw-panel-head">Binary Search</div>
          <div className="srw-panel-body">
            <div className="srw-bs-item">
              <div className="srw-bs-label">Left (lo):</div>
              <div className="srw-bs-value">{activeStep?.lo ?? 0}</div>
            </div>
            <div className="srw-bs-item">
              <div className="srw-bs-label">Right (hi):</div>
              <div className="srw-bs-value">{activeStep?.hi ?? 0}</div>
            </div>
            <div className="srw-bs-item">
              <div className="srw-bs-label">Mid:</div>
              <div className="srw-bs-value">{activeStep?.mid ?? '?'}</div>
            </div>
            <div className="srw-bs-item">
              <div className="srw-bs-label">Reachable:</div>
              <div
                className="srw-bs-value"
                style={{
                  color: activeStep?.reachable ? '#94e2d5' : '#f38ba8',
                }}
              >
                {activeStep?.reachable === null
                  ? '?'
                  : activeStep?.reachable
                    ? 'YES'
                    : 'NO'}
              </div>
            </div>
          </div>
        </div>

        <div className="srw-panel srw-state">
          <div className="srw-panel-head">State</div>
          <div className="srw-panel-body">
            <div className="srw-state-item">
              <div className="srw-state-label">Phase:</div>
              <div className="srw-state-value">{activeStep?.phase}</div>
            </div>
            <div className="srw-state-item">
              <div className="srw-state-label">Reachable cells:</div>
              <div className="srw-state-value">{activeStep?.reachableCells?.size || 0}</div>
            </div>
          </div>
        </div>

        <div className="srw-panel srw-message">
          <div className="srw-panel-head">Trace</div>
          <div className="srw-panel-body">
            <div className="srw-message-text">{activeStep?.message}</div>
          </div>
        </div>

        <div className="srw-panel srw-controls">
          <div className="srw-panel-head">Input</div>
          <div className="srw-panel-body">
            <textarea
              className="srw-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={3}
            />
            <button className="srw-button" onClick={handleRun}>
              Run
            </button>
            <button className="srw-button srw-button-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="srw-bottom">
        <PlaybackControls
          activeStep={activeStepIndex}
          totalSteps={steps.length}
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
          onStepChange={setActiveStepIndex}
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
        />
      </div>

      {showPatternOverlay && activeStep && <PatternOverlay step={activeStep} activeLineDom={activeLineDom} />}
    </div>
  )
}

export default SwimInRisingWaterVisualizer
