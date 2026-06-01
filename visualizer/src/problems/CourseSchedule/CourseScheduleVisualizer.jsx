import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import VisualizerPlaybackSection from '../../components/VisualizerPlaybackSection'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { useApplyExample } from '../../hooks/useApplyExample'
import './CourseScheduleVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:' },
  { line: 3, text: '        adj = {i: [] for i in range(numCourses)}' },
  { line: 4, text: '        indegree = [0] * numCourses' },
  { line: 5, text: '        ' },
  { line: 6, text: '        for crs, pre in prerequisites:' },
  { line: 7, text: '            adj[pre].append(crs)' },
  { line: 8, text: '            indegree[crs] += 1' },
  { line: 9, text: '            ' },
  { line: 10, text: '        queue = [i for i in range(numCourses) if indegree[i] == 0]' },
  { line: 11, text: '        visited = 0' },
  { line: 12, text: '        ' },
  { line: 13, text: '        while queue:' },
  { line: 14, text: '            node = queue.pop(0)' },
  { line: 15, text: '            visited += 1' },
  { line: 16, text: '            for neighbor in adj[node]:' },
  { line: 17, text: '                indegree[neighbor] -= 1' },
  { line: 18, text: '                if indegree[neighbor] == 0:' },
  { line: 19, text: '                    queue.append(neighbor)' },
  { line: 20, text: '                    ' },
  { line: 21, text: '        return visited == numCourses' },
]

function generateSteps(numCourses, prerequisites) {
  const steps = []

  if (numCourses <= 0) {
    steps.push({
      phase: 'done', adj: {}, indegree: [], queue: [], visited: 0,
      activeLine: 21, message: 'Invalid number of courses.'
    })
    return steps
  }

  const adj = {}
  const indegree = new Array(numCourses).fill(0)

  for (let i = 0; i < numCourses; i++) {
    adj[i] = []
  }

  steps.push({
    phase: 'init', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [], visited: 0,
    activeLine: 4, message: `Initialize adjacency list and indegree array for \${numCourses} courses.`
  })

  // Build graph
  for (const [crs, pre] of prerequisites) {
    steps.push({
      phase: 'build_graph_read', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [], visited: 0,
      currEdge: [crs, pre],
      activeLine: 6, message: `Read prerequisite: must take \${pre} before \${crs}.`
    })

    if (!adj[pre]) adj[pre] = [] // Handle invalid inputs gracefully in visualizer
    adj[pre].push(crs)

    steps.push({
      phase: 'build_graph_adj', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [], visited: 0,
      currEdge: [crs, pre],
      activeLine: 7, message: `Add directed edge \${pre} -> \${crs} to adjacency list.`
    })

    if (crs < numCourses && crs >= 0) indegree[crs]++

    steps.push({
      phase: 'build_graph_indegree', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [], visited: 0,
      currEdge: [crs, pre],
      activeLine: 8, message: `Increment indegree for course \${crs} (now \${indegree[crs]}).`
    })
  }

  // Initialize Queue
  const queue = []
  for (let i = 0; i < numCourses; i++) {
    if (indegree[i] === 0) queue.push(i)
  }

  steps.push({
    phase: 'init_queue', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited: 0,
    activeLine: 10, message: `Find all courses with 0 prerequisites and add to queue: [\${queue.join(', ')}].`
  })

  let visited = 0
  steps.push({
    phase: 'init_visited', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited,
    activeLine: 11, message: `Initialize visited count to \${visited}.`
  })

  const processedNodes = []

  // Process Queue
  while (queue.length > 0) {
    steps.push({
      phase: 'while_check', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
      activeLine: 13, message: `Queue is not empty (length \${queue.length}). Continue topological sort.`
    })

    const node = queue.shift()
    processedNodes.push(node)

    steps.push({
      phase: 'pop_node', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
      currNode: node,
      activeLine: 14, message: `Pop course \${node} from queue. You can take this course now!`
    })

    visited++
    steps.push({
      phase: 'inc_visited', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
      currNode: node,
      activeLine: 15, message: `Increment visited count to \${visited}.`
    })

    const neighbors = adj[node] || []

    if (neighbors.length === 0) {
      steps.push({
        phase: 'no_neighbors', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
        currNode: node,
        activeLine: 16, message: `Course \${node} has no dependent courses.`
      })
    }

    for (const neighbor of neighbors) {
      steps.push({
        phase: 'visit_neighbor', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
        currNode: node, currNeighbor: neighbor,
        activeLine: 16, message: `Examine dependent course \${neighbor} (requires \${node}).`
      })

      indegree[neighbor]--
      steps.push({
        phase: 'dec_indegree', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
        currNode: node, currNeighbor: neighbor,
        activeLine: 17, message: `Decrement indegree for \${neighbor} (now \${indegree[neighbor]}).`
      })

      steps.push({
        phase: 'check_neighbor_indegree', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
        currNode: node, currNeighbor: neighbor,
        activeLine: 18, message: `Check if \${neighbor} has any remaining prerequisites (indegree == 0?).`
      })

      if (indegree[neighbor] === 0) {
        queue.push(neighbor)
        steps.push({
          phase: 'enqueue_neighbor', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
          currNode: node, currNeighbor: neighbor,
          activeLine: 19, message: `Course \${neighbor} has 0 remaining prerequisites! Add to queue.`
        })
      }
    }
  }

  const success = visited === numCourses
  steps.push({
    phase: 'done', adj: JSON.parse(JSON.stringify(adj)), indegree: [...indegree], queue: [...queue], visited, processedNodes: [...processedNodes],
    success,
    activeLine: 21, message: success
      ? `Visited (\${visited}) == numCourses (\${numCourses}). All courses can be finished!`
      : `Visited (\${visited}) != numCourses (\${numCourses}). Cycle detected, cannot finish all courses!`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Simple Path', numCourses: 2, prerequisites: [[1, 0]] },
  { label: 'Cycle (Fail)', numCourses: 2, prerequisites: [[1, 0], [0, 1]] },
  { label: 'Complex DAG', numCourses: 6, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2], [5, 3], [4, 3]] },
  { label: 'Disconnected', numCourses: 4, prerequisites: [[1, 0], [3, 2]] },
]

const SNIPPETS = [
  { id: 'init', label: 'Init Graph', lines: [3, 4, 6, 7, 8, 10, 11] },
  { id: 'queue', label: 'Queue Loop', lines: [13, 14, 15] },
  { id: 'neighbors', label: 'Neighbor Updates', lines: [16, 17, 18, 19] },
  { id: 'result', label: 'Result Check', lines: [21] },
]

function snippetIdForPhase(phase) {
  if (!phase) return 'init'
  if (phase.startsWith('build') || phase.startsWith('init')) return 'init'
  if (phase === 'while_check' || phase === 'pop_node' || phase === 'inc_visited' || phase === 'no_neighbors') return 'queue'
  if (phase === 'visit_neighbor' || phase === 'dec_indegree' || phase === 'check_neighbor_indegree' || phase === 'enqueue_neighbor') return 'neighbors'
  if (phase === 'done') return 'result'
  return 'queue'
}

// Simple directed graph layout engine for small graphs (force-directed or circular)
function calculateNodePositions(numCourses, width = 400, height = 300) {
  const positions = {}
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.35

  for (let i = 0; i < numCourses; i++) {
    const angle = (i / numCourses) * 2 * Math.PI - Math.PI / 2
    positions[i] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    }
  }
  return positions
}

export default function CourseScheduleVisualizer() {
  const [numCoursesInput, setNumCoursesInput] = useState('6')
  const [prereqInput, setPrereqInput] = useState('[[1, 0], [2, 0], [3, 1], [3, 2], [5, 3], [4, 3]]')

  const { numCourses, prerequisites, inputError } = useMemo(() => {
    try {
      const nc = parseInt(numCoursesInput, 10)
      const pr = JSON.parse(prereqInput)
      if (isNaN(nc) || nc <= 0 || nc > 15) throw new Error('numCourses must be 1-15')
      if (!Array.isArray(pr)) throw new Error('Prerequisites must be a 2D array')
      return { numCourses: nc, prerequisites: pr, inputError: '' }
    } catch (e) {
      return { numCourses: 2, prerequisites: [[1, 0]], inputError: e.message || 'Invalid input' }
    }
  }, [numCoursesInput, prereqInput])

  const steps = useMemo(
    () => generateSteps(numCourses, prerequisites).map((current) => ({
      ...current,
      snippetId: snippetIdForPhase(current.phase),
      relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
    })),
    [numCourses, prerequisites],
  )

  const {
    stepIndex, setStepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useApplyExample((ex) => {
    setNumCoursesInput(String(ex.numCourses))
    setPrereqInput(JSON.stringify(ex.prerequisites))
  }, handleReset)

  const connectivity = useCodeVisualConnectivity({
    steps,
    stepIndex,
    snippetOptions: SNIPPETS,
    onStepJump: setStepIndex,
  })

  const nodePositions = useMemo(() => calculateNodePositions(numCourses), [numCourses])

  // Extract edges from current adjacency list
  const activeEdges = useMemo(() => {
    if (!step) return []
    const edges = []
    for (const [u, neighbors] of Object.entries(step.adj)) {
      for (const v of neighbors) {
        edges.push({ u: Number(u), v: Number(v) })
      }
    }
    return edges
  }, [step])

  return (
    <div className="course-schedule-shell">
      <div className="cs-top">
        <div className="cs-panel" style={{ flex: 1.5 }}>
          <div className="cs-panel-head">
            Graph View
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="cs-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="cs-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '80px' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>numCourses</span>
                <input
                  value={numCoursesInput}
                  onChange={(e) => { setNumCoursesInput(e.target.value); handleReset() }}
                  className="cs-input"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>prerequisites</span>
                <input
                  value={prereqInput}
                  onChange={(e) => { setPrereqInput(e.target.value); handleReset() }}
                  className="cs-input"
                />
              </div>
            </div>

            <div className="cs-graph-container">
              <svg width="100%" height="100%" viewBox="0 0 400 300">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                  </marker>
                  <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                  </marker>
                </defs>

                {/* Draw static prerequisite edges initially if we are building the graph */}
                {(!step || step.phase.startsWith('build')) && prerequisites.map((p, i) => {
                  const pre = p[1], crs = p[0]
                  const isCurrentBuildEdge = step?.currEdge && step.currEdge[0] === crs && step.currEdge[1] === pre
                  const isBuilt = step?.adj[pre]?.includes(crs)
                  if (!nodePositions[pre] || !nodePositions[crs]) return null

                  return (
                    <line
                      key={`pre-\${i}`}
                      x1={nodePositions[pre].x} y1={nodePositions[pre].y}
                      x2={nodePositions[crs].x} y2={nodePositions[crs].y}
                      stroke={isCurrentBuildEdge ? '#3b82f6' : isBuilt ? '#64748b' : 'rgba(100, 116, 139, 0.2)'}
                      strokeWidth={isCurrentBuildEdge ? 3 : 2}
                      strokeDasharray={isBuilt ? "none" : "4 4"}
                      markerEnd={isBuilt || isCurrentBuildEdge ? "url(#arrow)" : ""}
                    />
                  )
                })}

                {/* Draw actual adjacency list edges when sorting */}
                {step && !step.phase.startsWith('build') && activeEdges.map((edge, i) => {
                  const { u, v } = edge
                  const isCurrentEval = step.currNode === u && step.currNeighbor === v
                  if (!nodePositions[u] || !nodePositions[v]) return null
                  return (
                    <line
                      key={`edge-\${i}`}
                      x1={nodePositions[u].x} y1={nodePositions[u].y}
                      x2={nodePositions[v].x} y2={nodePositions[v].y}
                      stroke={isCurrentEval ? '#3b82f6' : '#64748b'}
                      strokeWidth={isCurrentEval ? 3 : 2}
                      markerEnd={isCurrentEval ? "url(#arrow-active)" : "url(#arrow)"}
                      className={isCurrentEval ? 'pulse-line' : ''}
                      onClick={() =>
                        connectivity.setVisualFocus({
                          lines: [16, 17, 18, 19],
                          reason: `Dependency edge ${u} -> ${v} selected.`,
                          targetType: 'edge',
                          targetId: `${u}->${v}`,
                        })
                      }
                      style={{ cursor: 'pointer' }}
                    />
                  )
                })}

                {Array.from({ length: numCourses }).map((_, i) => {
                  const pos = nodePositions[i]
                  const indegree = step?.indegree[i] ?? 0
                  const isProcessed = step?.processedNodes?.includes(i)
                  const isInQueue = step?.queue?.includes(i)
                  const isCurrentNode = step?.currNode === i
                  const isCurrentNeighbor = step?.currNeighbor === i
                  const isCycle = step?.phase === 'done' && !step?.success && !isProcessed

                  let fill = '#1e293b'
                  let stroke = '#334155'

                  if (isProcessed) { fill = '#0f766e'; stroke = '#14b8a6' }
                  else if (isCurrentNode) { fill = '#1d4ed8'; stroke = '#60a5fa' }
                  else if (isInQueue) { fill = '#0369a1'; stroke = '#38bdf8' }
                  else if (isCycle) { fill = '#7f1d1d'; stroke = '#ef4444' }
                  else if (isCurrentNeighbor) { stroke = '#a855f7' }
                  else if (indegree === 0 && step && !step.phase.startsWith('build')) { stroke = '#eab308' } // Ready but not in queue (transient)

                  return (
                    <g key={i} transform={`translate(\${pos.x}, \${pos.y})`}>
                      <motion.circle
                        r="16"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        animate={{
                          scale: isCurrentNode ? 1.2 : 1,
                          fill, stroke
                        }}
                        onClick={() =>
                          connectivity.setVisualFocus({
                            lines: [14, 15, 16, 17, 18, 19],
                            reason: `Course node ${i} selected in graph view.`,
                            targetType: 'course',
                            targetId: String(i),
                          })
                        }
                        style={{ cursor: 'pointer' }}
                      />
                      <text textAnchor="middle" dy=".3em" fill="#f8fafc" fontSize="12" fontFamily="monospace">{i}</text>

                      {/* Indegree badge */}
                      {step && !isProcessed && (
                        <g transform="translate(12, -12)">
                          <circle r="8" fill="#334155" stroke="#0f172a" />
                          <text textAnchor="middle" dy=".3em" fill={indegree === 0 ? "#4ade80" : "#f43f5e"} fontSize="10" fontWeight="bold">
                            {indegree}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="cs-graph-legend">
              <div className="cs-legend-item"><div className="cs-dot processed" /> Processed</div>
              <div className="cs-legend-item"><div className="cs-dot current" /> Current</div>
              <div className="cs-legend-item"><div className="cs-dot queue" /> In Queue</div>
              <div className="cs-legend-item"><div className="cs-dot cycle" /> Cycle (Unreachable)</div>
            </div>
          </div>
        </div>

        <div className="cs-panel" style={{ flex: 1 }}>
          <div className="cs-panel-head">State & Queue</div>
          <div className="cs-panel-body">
            <div className="cs-section">
              <span className="cs-section-title">Queue</span>
              <div className="cs-queue-container">
                <AnimatePresence mode="popLayout">
                  {step?.queue?.map((node, i) => (
                    <motion.div
                      key={`q-\${node}-\${i}`}
                      className="cs-queue-item"
                      layout
                      initial={{ opacity: 0, scale: 0.5, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      {node}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!step || !step.queue || step.queue.length === 0) && (
                  <span style={{ color: '#475569', fontStyle: 'italic', fontSize: 13 }}>Empty</span>
                )}
              </div>
            </div>

            <div className="cs-section">
              <span className="cs-section-title">Indegrees</span>
              <div className="cs-indegree-grid">
                {step?.indegree?.map((deg, i) => {
                  const isProcessed = step?.processedNodes?.includes(i)
                  const isHighlight = step?.currNeighbor === i || step?.currNode === i
                  if (isProcessed) return null
                  return (
                    <div key={i} className={`cs-indegree-item \${isHighlight ? 'highlight' : ''}`}>
                      <span className="cs-node-id">{i}</span>
                      <span className={`cs-deg-val \${deg === 0 ? 'zero' : ''}`}>{deg}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="cs-section" style={{ flex: 1 }}>
              <span className="cs-section-title">Adjacency List</span>
              <div className="cs-adj-list">
                {step && Object.entries(step.adj).map(([node, neighbors]) => {
                  if (neighbors.length === 0) return null
                  return (
                    <div key={node} className="cs-adj-row">
                      <span className="cs-adj-node">{node}</span>
                      <span className="cs-adj-arrow">→</span>
                      <div className="cs-adj-neighbors">
                        {neighbors.map((n, i) => (
                          <span key={i} className="cs-adj-neighbor">{n}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {(!step || Object.values(step.adj).every(n => n.length === 0)) && (
                  <span style={{ color: '#475569', fontStyle: 'italic', fontSize: 13 }}>No edges</span>
                )}
              </div>
            </div>

            <div className="cs-visited-card">
              <span className="cs-visited-label">Visited Courses</span>
              <span className={`cs-visited-val \${step?.phase === 'done' ? (step?.success ? 'success' : 'fail') : ''}`}>
                {step?.visited ?? 0} <span style={{ fontSize: 16, color: '#64748b' }}>/ {numCourses}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <VisualizerPlaybackSection
        step={step}
        codeLines={SOLUTION_CODE}
        codeTraceContainerClassName="course-schedule-middle"
        statusClassName={`cs-status ${step?.phase === 'done' ? (step?.success ? 'success' : 'fail') : step?.phase === 'enqueue_neighbor' ? 'enqueue' : ''}`}
        statusMessage={step?.message}
        fallbackStatus="Press Play or Step to begin."
        controlsContainerClassName="cs-dock"
        playback={{
          stepIndex,
          stepForward,
          stepBack,
          togglePlay,
          handleReset,
          isPlaying,
          speed,
          setSpeed,
          isDone,
        }}
        connectivity={{
          snippetOptions: SNIPPETS,
          activeSnippetId: connectivity.activeSnippetId,
          highlightedLines: connectivity.highlightedLines,
          linkInfo: connectivity.linkInfo,
          onLineSelect: connectivity.handleLineSelect,
          onSnippetSelect: connectivity.handleSnippetSelect,
        }}
      />
    </div>
  )
}
