import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './NumberOfIslandsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution(object):' },
  { line: 2,  text: '    def numIslands(self, grid):' },
  { line: 3,  text: '        if not grid: return 0' },
  { line: 4,  text: '        islands = 0' },
  { line: 5,  text: '        rows, cols = len(grid), len(grid[0])' },
  { line: 6,  text: '        visited = set()' },
  { line: 7,  text: '        def bfs(r, c):' },
  { line: 8,  text: '            queue = deque([(r, c)])' },
  { line: 9,  text: '            visited.add((r, c))' },
  { line: 10, text: '            while queue:' },
  { line: 11, text: '                row, col = queue.popleft()' },
  { line: 12, text: '                for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:' },
  { line: 13, text: '                    nr, nc = row+dr, col+dc' },
  { line: 14, text: '                    if (0<=nr<rows and 0<=nc<cols' },
  { line: 15, text: '                        and grid[nr][nc]=="1"' },
  { line: 16, text: '                        and (nr,nc) not in visited):' },
  { line: 17, text: '                        queue.append((nr, nc))' },
  { line: 18, text: '                        visited.add((nr, nc))' },
  { line: 19, text: '        for r in range(rows):' },
  { line: 20, text: '            for c in range(cols):' },
  { line: 21, text: '                if grid[r][c]=="1" and (r,c) not in visited:' },
  { line: 22, text: '                    bfs(r, c)' },
  { line: 23, text: '                    islands += 1' },
  { line: 24, text: '        return islands' },
]

function generateSteps(grid) {
  const steps = []
  const rows = grid.length, cols = grid[0].length
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
  // islandId per cell: -1 = water, 0+ = island number
  const islandId = Array.from({ length: rows }, () => Array(cols).fill(-1))
  let islandCount = 0

  // snapshot helper
  const snap = () => visited.map((r) => [...r])
  const snapId = () => islandId.map((r) => [...r])

  steps.push({
    phase: 'init', islands: 0, current: null,
    visited: snap(), islandId: snapId(),
    activeLine: 4, message: 'Initialize islands = 0, visited = set()',
  })

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1' && !visited[r][c]) {
        // BFS
        const queue = [[r, c]]
        visited[r][c] = true
        islandId[r][c] = islandCount

        steps.push({
          phase: 'bfs-start', islands: islandCount, current: [r, c],
          visited: snap(), islandId: snapId(),
          activeLine: 22, message: `Start BFS from (${r},${c})  →  new island #${islandCount + 1}`,
        })

        let head = 0
        while (head < queue.length) {
          const [row, col] = queue[head++]

          steps.push({
            phase: 'bfs-dequeue', islands: islandCount, current: [row, col],
            visited: snap(), islandId: snapId(),
            activeLine: 11, message: `Dequeue (${row},${col}), explore neighbours`,
          })

          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = row + dr, nc = col + dc
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              grid[nr][nc] === '1' && !visited[nr][nc]) {
              visited[nr][nc] = true
              islandId[nr][nc] = islandCount
              queue.push([nr, nc])
              steps.push({
                phase: 'bfs-enqueue', islands: islandCount, current: [nr, nc],
                visited: snap(), islandId: snapId(),
                activeLine: 17, message: `Enqueue (${nr},${nc}) — part of island #${islandCount + 1}`,
              })
            }
          }
        }

        islandCount++
        steps.push({
          phase: 'island-done', islands: islandCount, current: [r, c],
          visited: snap(), islandId: snapId(),
          activeLine: 23, message: `Island #${islandCount} fully explored. Total islands: ${islandCount}`,
        })
      }
    }
  }

  steps.push({
    phase: 'done', islands: islandCount, current: null,
    visited: snap(), islandId: snapId(),
    activeLine: 24, message: `Return ${islandCount}`,
  })
  return steps
}

function parseGrid(input) {
  try {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error()
    return parsed.map((row) =>
      Array.isArray(row) ? row.map(String) : String(row).split('')
    )
  } catch {
    return null
  }
}

const EXAMPLES = [
  {
    label: '2 islands',
    grid: [
      ['1', '1', '1', '1', '0'],
      ['1', '1', '0', '1', '0'],
      ['1', '1', '0', '0', '0'],
      ['0', '0', '0', '0', '0'],
    ],
  },
  {
    label: '3 islands',
    grid: [
      ['1', '1', '0', '0', '0'],
      ['1', '1', '0', '0', '0'],
      ['0', '0', '1', '0', '0'],
      ['0', '0', '0', '1', '1'],
    ],
  },
  {
    label: 'No island',
    grid: [['0', '0'], ['0', '0']],
  },
]

const ISLAND_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#f43f5e', '#eab308']

export default function NumberOfIslandsVisualizer() {
  const [gridInput, setGridInput] = useState(
    JSON.stringify(EXAMPLES[0].grid)
  )
  const { grid, inputError } = useMemo(() => {
    const g = parseGrid(gridInput)
    if (!g) return { grid: EXAMPLES[0].grid, inputError: 'Invalid grid JSON' }
    return { grid: g, inputError: '' }
  }, [gridInput])

  const steps = useMemo(() => generateSteps(grid), [grid])

  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setGridInput(JSON.stringify(ex.grid))
    handleReset()
  }, [handleReset])

  function cellState(r, c) {
    if (!step) return grid[r][c] === '0' ? 'water' : 'land'
    const id = step.islandId[r][c]
    const isCurrent = step.current && step.current[0] === r && step.current[1] === c
    if (grid[r][c] === '0') return 'water'
    if (isCurrent) return 'current'
    if (id >= 0) return `island-${id % ISLAND_COLORS.length}`
    if (step.visited[r][c]) return 'visited'
    return 'land'
  }

  return (
    <div className="ni-shell">
      <div className="ni-top">
        {/* Grid panel */}
        <div className="ni-panel">
          <div className="ni-panel-head">
            Grid
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="ni-badge" style={{ background: '#1e293b', color: '#93c5fd' }}>BFS Grid</span>
          </div>
          <div className="ni-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => applyExample(ex)} style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                  background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                }}>
                  {ex.label}
                </button>
              ))}
            </div>
            <textarea
              value={gridInput}
              rows={3}
              onChange={(e) => { setGridInput(e.target.value); handleReset() }}
              style={{
                width: '100%', padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 12,
                marginBottom: 14, boxSizing: 'border-box', resize: 'vertical',
              }}
            />

            {/* grid cells */}
            <div className="ni-grid">
              {grid.map((row, r) => (
                <div key={r} className="ni-grid-row">
                  {row.map((cell, c) => {
                    const st = cellState(r, c)
                    const idNum = step?.islandId?.[r]?.[c] ?? -1
                    const color = st === 'current' ? '#fff'
                      : idNum >= 0 ? ISLAND_COLORS[idNum % ISLAND_COLORS.length]
                      : st === 'visited' ? '#64748b'
                      : st === 'land' ? '#475569'
                      : '#0f172a'
                    const bg = st === 'current' ? '#f97316'
                      : idNum >= 0 ? `${ISLAND_COLORS[idNum % ISLAND_COLORS.length]}33`
                      : st === 'water' ? '#0f172a'
                      : '#1e293b'
                    const border = st === 'current' ? '#f97316'
                      : idNum >= 0 ? ISLAND_COLORS[idNum % ISLAND_COLORS.length]
                      : '#334155'
                    return (
                      <motion.div
                        key={c}
                        className="ni-cell"
                        style={{ background: bg, border: `2px solid ${border}`, color }}
                        animate={{ scale: st === 'current' ? 1.15 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                      >
                        {cell}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* legend */}
            <div className="ni-legend">
              <span className="ni-leg-item" style={{ background: '#0f172a', border: '1px solid #334155' }}>0 = Water</span>
              <span className="ni-leg-item" style={{ background: '#1e293b', border: '1px solid #475569' }}>1 = Unvisited</span>
              {ISLAND_COLORS.slice(0, step ? step.islands : 0).map((c, i) => (
                <span key={i} className="ni-leg-item" style={{ background: `${c}33`, border: `1px solid ${c}`, color: c }}>
                  Island #{i + 1}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Vars panel */}
        <div className="ni-panel">
          <div className="ni-panel-head">Variables</div>
          <div className="ni-panel-body">
            <div className="ni-vars">
              <div className="ni-var-row"><span className="ni-var-name">islands</span><span className="ni-var-val highlight">{step?.islands ?? '–'}</span></div>
              <div className="ni-var-row"><span className="ni-var-name">current</span><span className="ni-var-val">{step?.current ? `(${step.current[0]},${step.current[1]})` : '–'}</span></div>
              <div className="ni-var-row"><span className="ni-var-name">grid size</span><span className="ni-var-val">{grid.length}×{grid[0].length}</span></div>
              <div className="ni-var-row"><span className="ni-var-name">phase</span><span className="ni-var-val">{step?.phase ?? '–'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="ni-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={`ni-status${step?.phase === 'done' ? ' done' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="ni-dock">
        <PlaybackControls isPlaying={isPlaying} isDone={isDone} speed={speed}
          onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
          onReset={handleReset} prevDisabled={stepIndex < 0} nextDisabled={isDone}
          resetDisabled={stepIndex < 0} onSpeedChange={(e) => setSpeed(Number(e.target.value))} />
      </div>
    </div>
  )
}
