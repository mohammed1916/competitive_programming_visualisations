import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './NumberOfIslandsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def numIslands(self, grid: List[List[str]]) -> int:' },
  { line: 3, text: '        if not grid: return 0' },
  { line: 4, text: '        ' },
  { line: 5, text: '        rows, cols = len(grid), len(grid[0])' },
  { line: 6, text: '        visited = set()' },
  { line: 7, text: '        islands = 0' },
  { line: 8, text: '        ' },
  { line: 9, text: '        def bfs(r, c):' },
  { line: 10, text: '            q = [(r, c)]' },
  { line: 11, text: '            visited.add((r, c))' },
  { line: 12, text: '            ' },
  { line: 13, text: '            while q:' },
  { line: 14, text: '                row, col = q.pop(0)' },
  { line: 15, text: '                directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]' },
  { line: 16, text: '                ' },
  { line: 17, text: '                for dr, dc in directions:' },
  { line: 18, text: '                    nr, nc = row + dr, col + dc' },
  { line: 19, text: '                    if (0 <= nr < rows and 0 <= nc < cols and' },
  { line: 20, text: '                        grid[nr][nc] == "1" and' },
  { line: 21, text: '                        (nr, nc) not in visited):' },
  { line: 22, text: '                        q.append((nr, nc))' },
  { line: 23, text: '                        visited.add((nr, nc))' },
  { line: 24, text: '                        ' },
  { line: 25, text: '        for r in range(rows):' },
  { line: 26, text: '            for c in range(cols):' },
  { line: 27, text: '                if grid[r][c] == "1" and (r, c) not in visited:' },
  { line: 28, text: '                    bfs(r, c)' },
  { line: 29, text: '                    islands += 1' },
  { line: 30, text: '                    ' },
  { line: 31, text: '        return islands' },
]

function generateSteps(grid) {
  const steps = []

  if (!grid || grid.length === 0 || grid[0].length === 0) {
    steps.push({
      phase: 'done', visited: [], islands: 0, queue: [],
      activeLine: 3, message: 'Empty grid, return 0.'
    })
    return steps
  }

  const rows = grid.length
  const cols = grid[0].length
  const visited = new Set()
  let islands = 0
  const islandMap = {} // map "r,c" to island ID for coloring

  steps.push({
    phase: 'init', visited: Array.from(visited), islands, queue: [], islandMap: { ...islandMap },
    activeLine: 7, message: `Initialize grid of size \${rows}x\${cols}, empty visited set, islands = 0.`
  })

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      steps.push({
        phase: 'scan', visited: Array.from(visited), islands, queue: [], islandMap: { ...islandMap },
        currScan: [r, c],
        activeLine: 27, message: `Scanning grid[\${r}][\${c}] ('\${grid[r][c]}'). Is it an unvisited land ('1')?`
      })

      if (grid[r][c] === '1' && !visited.has(`\${r},\${c}`)) {
        steps.push({
          phase: 'found_new', visited: Array.from(visited), islands, queue: [], islandMap: { ...islandMap },
          currScan: [r, c],
          activeLine: 28, message: `Found unvisited land at (\${r}, \${c})! Call bfs(\${r}, \${c}).`
        })

        // BFS
        const queue = [[r, c]]
        visited.add(`\${r},\${c}`)
        islandMap[`\${r},\${c}`] = islands // assign to current island ID

        steps.push({
          phase: 'bfs_init', visited: Array.from(visited), islands, queue: [...queue], islandMap: { ...islandMap },
          currScan: [r, c], currBfs: [r, c],
          activeLine: 11, message: `Initialize queue with [(\${r}, \${c})] and mark as visited.`
        })

        while (queue.length > 0) {
          const [row, col] = queue.shift()

          steps.push({
            phase: 'bfs_pop', visited: Array.from(visited), islands, queue: [...queue], islandMap: { ...islandMap },
            currScan: [r, c], currBfs: [row, col],
            activeLine: 14, message: `Pop (\${row}, \${col}) from queue. Check its neighbors.`
          })

          const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          for (const [dr, dc] of directions) {
            const nr = row + dr
            const nc = col + dc

            steps.push({
              phase: 'bfs_check_neighbor', visited: Array.from(visited), islands, queue: [...queue], islandMap: { ...islandMap },
              currScan: [r, c], currBfs: [row, col], currNeighbor: [nr, nc],
              activeLine: 19, message: `Check neighbor (\${nr}, \${nc}).`
            })

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1' && !visited.has(`\${nr},\${nc}`)) {
              queue.push([nr, nc])
              visited.add(`\${nr},\${nc}`)
              islandMap[`\${nr},\${nc}`] = islands

              steps.push({
                phase: 'bfs_add_neighbor', visited: Array.from(visited), islands, queue: [...queue], islandMap: { ...islandMap },
                currScan: [r, c], currBfs: [row, col], currNeighbor: [nr, nc],
                activeLine: 23, message: `Neighbor (\${nr}, \${nc}) is unvisited land! Add to queue and mark visited.`
              })
            }
          }
        }

        islands++
        steps.push({
          phase: 'inc_islands', visited: Array.from(visited), islands, queue: [], islandMap: { ...islandMap },
          currScan: [r, c],
          activeLine: 29, message: `BFS completed. Increment islands count to \${islands}.`
        })
      }
    }
  }

  steps.push({
    phase: 'done', visited: Array.from(visited), islands, queue: [], islandMap: { ...islandMap },
    activeLine: 31, message: `Scan complete. Total islands found: \${islands}.`
  })

  return steps
}

const EXAMPLES = [
  {
    label: 'Standard',
    gridStr: '[\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]'
  },
  {
    label: 'Multiple',
    gridStr: '[\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]'
  },
  {
    label: 'Checkerboard',
    gridStr: '[\n  ["1","0","1"],\n  ["0","1","0"],\n  ["1","0","1"]\n]'
  },
]

const ISLAND_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#84cc16', // lime
]

export default function NumberOfIslandsVisualizer() {
  const [gridInput, setGridInput] = useState(EXAMPLES[1].gridStr)

  const { grid, inputError } = useMemo(() => {
    try {
      const g = JSON.parse(gridInput)
      if (!Array.isArray(g) || !Array.isArray(g[0])) throw new Error('Grid must be a 2D array of strings')
      return { grid: g, inputError: '' }
    } catch (e) {
      return { grid: [["1"]], inputError: e.message || 'Invalid JSON format' }
    }
  }, [gridInput])

  const steps = useMemo(() => generateSteps(grid), [grid])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setGridInput(ex.gridStr)
    handleReset()
  }, [handleReset])

  const rows = grid.length
  const cols = grid[0]?.length || 0

  return (
    <div className="noi-shell">
      <div className="noi-top">
        <div className="noi-panel" style={{ flex: 1.5 }}>
          <div className="noi-panel-head">
            Grid View
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="noi-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="noi-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <textarea
              className="noi-input-textarea"
              value={gridInput}
              onChange={(e) => { setGridInput(e.target.value); handleReset() }}
              rows={5}
              spellCheck={false}
            />

            <div className="noi-grid-container">
              <div
                className="noi-grid"
                style={{
                  gridTemplateColumns: `repeat(\${cols}, minmax(30px, 1fr))`,
                  maxWidth: `\${cols * 50}px`
                }}
              >
                {grid.map((row, r) => (
                  row.map((cell, c) => {
                    const isWater = cell === "0"
                    const isVisited = step?.visited?.includes(`\${r},\${c}`)
                    const isScan = step?.currScan?.[0] === r && step?.currScan?.[1] === c
                    const isBfs = step?.currBfs?.[0] === r && step?.currBfs?.[1] === c
                    const isNeighbor = step?.currNeighbor?.[0] === r && step?.currNeighbor?.[1] === c

                    const islandId = step?.islandMap?.[`\${r},\${c}`]
                    const islandColor = islandId !== undefined ? ISLAND_COLORS[islandId % ISLAND_COLORS.length] : undefined

                    let cellClass = "noi-cell "
                    if (isWater) cellClass += "water "
                    else cellClass += "land "

                    if (isVisited) cellClass += "visited "
                    if (isScan && !isBfs) cellClass += "scan "
                    if (isBfs) cellClass += "bfs "
                    if (isNeighbor) cellClass += "neighbor "

                    return (
                      <div
                        key={`\${r}-\${c}`}
                        className={cellClass}
                        style={{
                          ...(isVisited && !isWater && islandColor ? { backgroundColor: islandColor, borderColor: islandColor } : {})
                        }}
                      >
                        {cell}
                        {isScan && !isBfs && <div className="noi-cell-indicator scan" />}
                        {isBfs && <div className="noi-cell-indicator bfs" />}
                        {isNeighbor && <div className="noi-cell-indicator neighbor" />}
                      </div>
                    )
                  })
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="noi-panel" style={{ flex: 1 }}>
          <div className="noi-panel-head">State & Queue</div>
          <div className="noi-panel-body">

            <div className="noi-stats-container">
              <div className="noi-stat-box">
                <span className="noi-stat-label">Islands Found</span>
                <span className="noi-stat-val">{step?.islands ?? 0}</span>
              </div>
            </div>

            <div className="noi-section">
              <span className="noi-section-title">BFS Queue</span>
              <div className="noi-queue-box">
                <AnimatePresence mode="popLayout">
                  {step?.queue?.map((item, idx) => (
                    <motion.div
                      key={`q-\${item[0]}-\${item[1]}-\${idx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.5, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      className="noi-queue-item"
                    >
                      ({item[0]}, {item[1]})
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!step || !step.queue || step.queue.length === 0) && (
                  <span style={{ color: '#475569', fontStyle: 'italic', fontSize: 13, padding: '4px 0' }}>Queue is empty</span>
                )}
              </div>
            </div>

            <div className="noi-section" style={{ flex: 1 }}>
              <span className="noi-section-title">Legend</span>
              <div className="noi-legend">
                <div className="noi-legend-item">
                  <div className="noi-legend-box land" /> Unvisited Land ("1")
                </div>
                <div className="noi-legend-item">
                  <div className="noi-legend-box water" /> Water ("0")
                </div>
                <div className="noi-legend-item">
                  <div className="noi-legend-box scan" /> Scanning pointer
                </div>
                <div className="noi-legend-item">
                  <div className="noi-legend-box bfs" /> Current BFS Node
                </div>
                <div className="noi-legend-item">
                  <div className="noi-legend-box neighbor" /> Neighbor being checked
                </div>
                <div className="noi-legend-item" style={{ marginTop: 8 }}>
                  <div className="noi-legend-row">
                    {ISLAND_COLORS.slice(0, 4).map((c, i) => (
                      <div key={i} className="noi-legend-color" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12 }}>Colored by Island ID</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="noi-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={`noi-status \${step?.phase === 'found_new' ? 'found' : step?.phase === 'done' ? 'success' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="noi-dock">
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
