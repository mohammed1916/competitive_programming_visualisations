import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import './CourseScheduleVisualizer.css'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0
const ZOOM_STEP = 0.1

const SOLUTION_CODE = [
  { line: 1, text: 'from collections import deque' },
  { line: 2, text: '' },
  { line: 3, text: 'class Solution(object):' },
  { line: 4, text: '    def canFinish(self, numCourses, prerequisites):' },
  { line: 5, text: '        graph = [[] for _ in range(numCourses)]' },
  { line: 6, text: '        indegree = [0] * numCourses' },
  { line: 7, text: '' },
  { line: 8, text: '        for course, prereq in prerequisites:' },
  { line: 9, text: '            graph[prereq].append(course)' },
  { line: 10, text: '            indegree[course] += 1' },
  { line: 11, text: '' },
  { line: 12, text: '        queue = deque(i for i in range(numCourses) if indegree[i] == 0)' },
  { line: 13, text: '        taken = 0' },
  { line: 14, text: '' },
  { line: 15, text: '        while queue:' },
  { line: 16, text: '            course = queue.popleft()' },
  { line: 17, text: '            taken += 1' },
  { line: 18, text: '' },
  { line: 19, text: '            for neighbor in graph[course]:' },
  { line: 20, text: '                indegree[neighbor] -= 1' },
  { line: 21, text: '                if indegree[neighbor] == 0:' },
  { line: 22, text: '                    queue.append(neighbor)' },
  { line: 23, text: '' },
  { line: 24, text: '        return taken == numCourses' },
]

const DEFAULT_COURSES = 4
const DEFAULT_PREREQS = '[[1,0],[2,0],[3,1],[3,2]]'

const EXAMPLES = [
  {
    label: 'Acyclic chain',
    numCourses: 2,
    prerequisites: '[[1,0]]',
    note: 'Single dep, completable.',
  },
  {
    label: 'Simple cycle',
    numCourses: 2,
    prerequisites: '[[1,0],[0,1]]',
    note: 'Mutual block, not completable.',
  },
  {
    label: 'Diamond DAG',
    numCourses: 4,
    prerequisites: '[[1,0],[2,0],[3,1],[3,2]]',
    note: 'Queue merges at course 3.',
  },
  {
    label: 'No prereqs',
    numCourses: 5,
    prerequisites: '[]',
    note: 'All start in queue at once.',
  },
  {
    label: 'Hidden cycle',
    numCourses: 4,
    prerequisites: '[[1,0],[2,1],[0,2],[3,1]]',
    note: 'Component cycle blocks completion.',
  },
]

const PHASE_META = {
  'build-edge': { label: 'Build Graph', color: 'blue' },
  'push':       { label: 'Push Edge',  color: 'blue' },
  'access':     { label: 'Access',     color: 'purple' },
  'init-queue': { label: 'Init Queue', color: 'amber' },
  'pop':        { label: 'Dequeue',    color: 'orange' },
  'reduce':     { label: 'Reduce',     color: 'slate' },
  'enqueue':    { label: 'Enqueue',    color: 'amber' },
  'final':      { label: 'Complete',   color: 'green' },
}

function parsePrerequisites(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { error: 'Prerequisites must be a JSON array of pairs.' }
    for (const pair of parsed) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        return { error: 'Each prerequisite must be a pair like [a,b].' }
      }
      if (!pair.every((value) => Number.isInteger(value))) {
        return { error: 'Course ids in prerequisites must be integers.' }
      }
    }
    return { value: parsed }
  } catch {
    return { error: 'Prerequisites must be valid JSON, for example [[1,0],[2,1]].' }
  }
}

function cloneGraph(graph) {
  return graph.map((neighbors) => [...neighbors])
}

function getCodeHighlight(phase) {
  if (phase === 'build-edge') return { activeLine: 9, relatedLines: [8, 9, 10] }
  if (phase === 'push') return { activeLine: 9, relatedLines: [8, 9, 10] }
  if (phase === 'access') return { activeLine: 19, relatedLines: [18, 19, 20, 21] }
  if (phase === 'init-queue') return { activeLine: 12, relatedLines: [12, 13] }
  if (phase === 'pop') return { activeLine: 17, relatedLines: [15, 16, 17] }
  if (phase === 'reduce') return { activeLine: 20, relatedLines: [19, 20, 21, 22] }
  if (phase === 'enqueue') return { activeLine: 22, relatedLines: [19, 20, 21, 22] }
  return { activeLine: 24, relatedLines: [24] }
}

function withCode(step) {
  const code = getCodeHighlight(step.phase)
  return { ...step, activeLine: code.activeLine, relatedLines: code.relatedLines }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildStepDesc(phase, info) {
  const { prereq, course, neighbor, newVal, queue, takenCount, numCourses, result } = info
  switch (phase) {
    case 'build-edge':
      return `about to append ${course} to graph[${prereq}]`
    case 'push':
      return `graph[${prereq}].append(${course})  →  indegree[${course}] += 1  →  indegree[${course}] = ${newVal}`
    case 'access':
      return `accessing graph[${course}] neighbor ${neighbor}`
    case 'init-queue': {
      const seeds = queue.join(', ')
      return queue.length > 0
        ? `for i in range(${numCourses}): check indegree[i] == 0  →  courses [${seeds}] satisfy this  →  queue.extend([${seeds}])`
        : `for i in range(${numCourses}): check indegree[i] == 0  →  all indegrees > 0  →  queue stays empty (possible cycle)`
    }
    case 'pop':
      return `course = queue.popleft()  →  course = ${course}  |  taken += 1  →  taken = ${takenCount} / ${numCourses}`
    case 'reduce':
      return `for neighbor in graph[${course}]: neighbor = ${neighbor}  |  indegree[${neighbor}] -= 1  →  indegree[${neighbor}] = ${newVal}  |  check indegree[${neighbor}] == 0?  →  false  →  skip enqueue`
    case 'enqueue':
      return `for neighbor in graph[${course}]: neighbor = ${neighbor}  |  indegree[${neighbor}] -= 1  →  indegree[${neighbor}] = 0  |  check indegree[${neighbor}] == 0?  →  true  →  queue.append(${neighbor})`
    case 'final':
      return `return taken == numCourses  →  ${takenCount} == ${numCourses}  →  ${result}`
    default:
      return ''
  }
}

function generateCourseSteps(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => [])
  const indegree = Array(numCourses).fill(0)
  const steps = []

  prerequisites.forEach(([course, prereq], index) => {
    // record intent to modify graph
    steps.push(withCode({
      phase: 'build-edge',
      edgeIndex: index,
      activeCourse: course,
      activeNeighbor: course,
      activePrereq: prereq,
      graph: cloneGraph(graph),
      indegree: [...indegree],
      queue: [],
      takenOrder: [],
      takenCount: 0,
      description: buildStepDesc('build-edge', { prereq, course, newVal: indegree[course] }),
      result: null,
      event: null,
      queueSnapshot: [],
    }))

    // perform the append and record the mutation as its own step
    graph[prereq].push(course)
    indegree[course] += 1
    steps.push(withCode({
      phase: 'push',
      edgeIndex: index,
      activeCourse: course,
      activeNeighbor: course,
      activePrereq: prereq,
      graph: cloneGraph(graph),
      indegree: [...indegree],
      queue: [],
      takenOrder: [],
      takenCount: 0,
      description: buildStepDesc('push', { prereq, course, newVal: indegree[course] }),
      result: null,
      event: 'push',
      queueSnapshot: [],
    }))
  })

  const queue = []
  for (let course = 0; course < numCourses; course++) {
    if (indegree[course] === 0) queue.push(course)
  }

  steps.push(withCode({
    phase: 'init-queue',
    activeCourse: null,
    activeNeighbor: null,
    activePrereq: null,
    graph: cloneGraph(graph),
    indegree: [...indegree],
    queue: [...queue],
    takenOrder: [],
    takenCount: 0,
    description: buildStepDesc('init-queue', { queue: [...queue], numCourses }),
    result: null,
    event: 'init',
    queueSnapshot: [...queue],
  }))

  const takenOrder = []

  while (queue.length > 0) {
    const course = queue.shift()
    takenOrder.push(course)

    steps.push(withCode({
      phase: 'pop',
      activeCourse: course,
      activeNeighbor: null,
      activePrereq: null,
      graph: cloneGraph(graph),
      indegree: [...indegree],
      queue: [...queue],
      takenOrder: [...takenOrder],
      takenCount: takenOrder.length,
      description: buildStepDesc('pop', { course, takenCount: takenOrder.length, numCourses }),
      result: null,
      event: 'dequeue',
      queueSnapshot: [...queue],
    }))

    // iterate by index so we can record an explicit 'access' step
    for (let ni = 0; ni < graph[course].length; ni++) {
      const neighbor = graph[course][ni]

      // record access to graph[course] -> neighbor before mutating indegree
      steps.push(withCode({
        phase: 'access',
        activeCourse: course,
        activeNeighbor: neighbor,
        activePrereq: course,
        graph: cloneGraph(graph),
        indegree: [...indegree],
        queue: [...queue],
        takenOrder: [...takenOrder],
        takenCount: takenOrder.length,
        description: buildStepDesc('access', { course, neighbor }),
        result: null,
        event: 'access',
        queueSnapshot: [...queue],
      }))

      indegree[neighbor] -= 1
      const becameZero = indegree[neighbor] === 0

      steps.push(withCode({
        phase: becameZero ? 'enqueue' : 'reduce',
        activeCourse: course,
        activeNeighbor: neighbor,
        activePrereq: course,
        graph: cloneGraph(graph),
        indegree: [...indegree],
        queue: [...queue],
        takenOrder: [...takenOrder],
        takenCount: takenOrder.length,
        description: buildStepDesc(becameZero ? 'enqueue' : 'reduce', {
          course, neighbor, newVal: indegree[neighbor],
        }),
        result: null,
        event: becameZero ? 'enqueue' : 'reduce',
        queueSnapshot: [...queue],
      }))

      if (becameZero) queue.push(neighbor)
    }
  }

  const result = takenOrder.length === numCourses
  steps.push(withCode({
    phase: 'final',
    activeCourse: null,
    activeNeighbor: null,
    activePrereq: null,
    graph: cloneGraph(graph),
    indegree: [...indegree],
    queue: [...queue],
    takenOrder: [...takenOrder],
    takenCount: takenOrder.length,
    description: buildStepDesc('final', { takenCount: takenOrder.length, numCourses, result }),
    result,
  }))

  return steps
}

// ── GraphView ─────────────────────────────────────────────────────────────────

const NODE_R   = 26
const GRAPH_VW = 480
const GRAPH_VH = 360

function computeNodePositions(numCourses) {
  const cx = GRAPH_VW / 2
  const cy = GRAPH_VH / 2
  return Array.from({ length: numCourses }, (_, course) => {
    if (numCourses === 1) return { course, x: cx, y: cy }
    const radius = numCourses <= 3 ? 90 : numCourses <= 6 ? 135 : 155
    const angle  = (course / numCourses) * Math.PI * 2 - Math.PI / 2
    return { course, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })
}

function GraphView({ numCourses, step, zoom, onZoomChange }) {
  const nodes      = computeNodePositions(numCourses)
  const nodeLookup = new Map(nodes.map((n) => [n.course, n]))

  const edges = []
  step?.graph?.forEach((nbrs, prereq) => {
    nbrs.forEach((course) => edges.push({ prereq, course }))
  })

  const handleWheel = (e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    onZoomChange((z) => clamp(Number((z + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM))
  }

  return (
    <div className="cs-graph-wrap" onWheel={handleWheel}>
      {/* Zoom toolbar */}
      <div className="cs-graph-toolbar">
        <button
          type="button"
          className="cs-icon-btn"
          onClick={() => onZoomChange((z) => clamp(Number((z - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
          aria-label="Zoom out"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="cs-zoom-label mono">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="cs-icon-btn"
          onClick={() => onZoomChange((z) => clamp(Number((z + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
          aria-label="Zoom in"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <span className="cs-zoom-hint">Ctrl + scroll</span>
      </div>

      {/* SVG */}
      <div className="cs-graph-stage" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <svg
          className="cs-graph-svg"
          viewBox={`0 0 ${GRAPH_VW} ${GRAPH_VH}`}
          role="img"
          aria-label="Course dependency graph"
        >
          <defs>
            <marker id="cs-arr"        markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L8,3 z" className="cs-arrowhead" />
            </marker>
            <marker id="cs-arr-active" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L8,3 z" className="cs-arrowhead active" />
            </marker>
          </defs>

          {/* Edges — trimmed so they don't overlap node circles */}
          {edges.map(({ prereq, course }, i) => {
            const from = nodeLookup.get(prereq)
            const to   = nodeLookup.get(course)
            if (!from || !to) return null
            const isActive = step?.activePrereq === prereq && step?.activeNeighbor === course
            const dx = to.x - from.x, dy = to.y - from.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const nx = dx / dist, ny = dy / dist
            const x1 = from.x + nx * (NODE_R + 3)
            const y1 = from.y + ny * (NODE_R + 3)
            const x2 = to.x   - nx * (NODE_R + 9)
            const y2 = to.y   - ny * (NODE_R + 9)
            return (
              <line
                key={`e-${prereq}-${course}-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={`cs-edge ${isActive ? 'active' : ''}`}
                markerEnd={isActive ? 'url(#cs-arr-active)' : 'url(#cs-arr)'}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(({ course, x, y }) => {
            const indegree = step?.indegree?.[course] ?? 0
            const inQueue  = step?.queue?.includes(course)
            const taken    = step?.takenOrder?.includes(course)
            const active   = step?.activeCourse === course || step?.activeNeighbor === course
            const stateClass = active ? 'active' : taken ? 'taken' : inQueue ? 'queued' : ''
            return (
              <g key={`n-${course}`} transform={`translate(${x},${y})`}>
                <circle className={`cs-node ${stateClass}`} r={NODE_R} />
                <text className="cs-node-num" textAnchor="middle" dy="5">{course}</text>
                <text className="cs-node-deg" textAnchor="middle" dy={NODE_R + 14}>{`in=${indegree}`}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="cs-graph-legend">
        <span className="cs-legend-item cs-legend-default">Default</span>
        <span className="cs-legend-item cs-legend-queued">In Queue</span>
        <span className="cs-legend-item cs-legend-taken">Taken</span>
        <span className="cs-legend-item cs-legend-active">Active</span>
      </div>
    </div>
  )
}

// ── CodePanel ─────────────────────────────────────────────────────────────────

function CodePanel({ step }) {
  const codeRef  = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SOLUTION_CODE.map(({ text }) => text).join('\n'))
    setCopied(true)
  }

  return (
    <div className="cs-code-panel">
      <div className="cs-code-head">
        <div>
          <div className="cs-section-label">Solution Code</div>
          <div className="cs-code-subtitle">
            {step
              ? <>Line <span className="mono cs-code-chip">{step.activeLine}</span> active</>
              : 'Press Play to start'}
          </div>
        </div>
        <button type="button" className={`cs-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="cs-code-scroll" ref={codeRef}>
        {SOLUTION_CODE.map(({ line, text }) => {
          const isActive  = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`cs-code-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{ x: isActive ? 6 : 0, opacity: isRelated || isActive || !step ? 1 : 0.5 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              <span className="cs-code-no mono">{line}</span>
              <code className="cs-code-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CourseScheduleVisualizer() {
  const [courseInput,     setCourseInput]     = useState(String(DEFAULT_COURSES))
  const [prereqInput,     setPrereqInput]     = useState(DEFAULT_PREREQS)
  const [numCourses,      setNumCourses]      = useState(DEFAULT_COURSES)
  const [prerequisites,   setPrerequisites]   = useState(() => JSON.parse(DEFAULT_PREREQS))
  const [steps,           setSteps]           = useState(() => generateCourseSteps(DEFAULT_COURSES, JSON.parse(DEFAULT_PREREQS)))
  const [stepIndex,       setStepIndex]       = useState(-1)
  const [isPlaying,       setIsPlaying]       = useState(false)
  const [speed,           setSpeed]           = useState(520)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [graphZoom,       setGraphZoom]       = useState(1)
  const [leftWidth,       setLeftWidth]       = useState(560)
  const intervalRef = useRef(null)

  const startDrag = (side) => (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidth
    document.body.classList.add('resizing-panel')
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const next = Math.max(360, Math.min(1100, startW + dx))
      setLeftWidth(next)
    }
    const onUp = () => {
      document.body.classList.remove('resizing-panel')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  const parsedCourses     = Number(courseInput)
  const coursesValid      = Number.isInteger(parsedCourses) && parsedCourses >= 1 && parsedCourses <= 12
  const parsedPrereqs     = parsePrerequisites(prereqInput)
  const prereqValue       = useMemo(() => parsedPrereqs.value ?? [], [parsedPrereqs.value])
  const prereqRangeValid  = coursesValid && parsedPrereqs.value
    ? prereqValue.every(([a, b]) => a >= 0 && a < parsedCourses && b >= 0 && b < parsedCourses)
    : false

  const inputError = attemptedSubmit && !coursesValid
    ? 'numCourses must be an integer between 1 and 12.'
    : attemptedSubmit && parsedPrereqs.error
      ? parsedPrereqs.error
      : attemptedSubmit && !prereqRangeValid
        ? 'Every course id must be between 0 and numCourses − 1.'
        : null

  // ── Derived ─────────────────────────────────────────────────────────────────
  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const progress    = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0
  const isDone      = stepIndex === steps.length - 1
  const phaseMeta   = currentStep ? PHASE_META[currentStep.phase] : null

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleVisualize = useCallback(() => {
    setAttemptedSubmit(true)
    if (!coursesValid || parsedPrereqs.error || !prereqRangeValid) return
    setNumCourses(parsedCourses)
    setPrerequisites(prereqValue)
    setSteps(generateCourseSteps(parsedCourses, prereqValue))
    setStepIndex(-1)
    setIsPlaying(false)
  }, [coursesValid, parsedCourses, parsedPrereqs.error, prereqRangeValid, prereqValue])

  const applyExample = useCallback((example) => {
    setCourseInput(String(example.numCourses))
    setPrereqInput(example.prerequisites)
    setNumCourses(example.numCourses)
    const parsed = JSON.parse(example.prerequisites)
    setPrerequisites(parsed)
    setSteps(generateCourseSteps(example.numCourses, parsed))
    setStepIndex(-1)
    setIsPlaying(false)
    setAttemptedSubmit(false)
  }, [])

  const stepForward = useCallback(() => {
    setStepIndex((cur) => {
      if (cur >= steps.length - 1) { setIsPlaying(false); return cur }
      return cur + 1
    })
  }, [steps.length])

  const stepBack    = () => setStepIndex((cur) => Math.max(-1, cur - 1))
  const handleReset = () => { setStepIndex(-1); setIsPlaying(false) }
  const togglePlay  = () => {
    if (stepIndex >= steps.length - 1) setStepIndex(-1)
    setIsPlaying((p) => !p)
  }

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIndex((cur) => {
          if (cur >= steps.length - 1) { setIsPlaying(false); return cur }
          return cur + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, steps.length])

  // ── Render ──────────────────────────────────────────────────────────────────
  const isActiveExample = (ex) => numCourses === ex.numCourses && prereqInput === ex.prerequisites

  return (
    <div className="cs">

      {/* ── Input card ── */}
      <div className="cs-card cs-input-card">
        <div className="cs-input-row">
          <div className="cs-field">
            <label className="cs-label">Courses</label>
            <input
              className={`cs-input cs-input-sm ${attemptedSubmit && !coursesValid ? 'has-error' : ''}`}
              value={courseInput}
              onChange={(e) => {
                setCourseInput(e.target.value.replace(/[^0-9]/g, ''))
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              inputMode="numeric"
              aria-label="Number of courses"
            />
          </div>

          <div className="cs-field cs-field-grow">
            <label className="cs-label">
              Prerequisites <span className="cs-label-hint">[[course, prereq], …] JSON</span>
            </label>
            <textarea
              className={`cs-input cs-textarea mono ${attemptedSubmit && (parsedPrereqs.error || !prereqRangeValid) ? 'has-error' : ''}`}
              value={prereqInput}
              onChange={(e) => {
                setPrereqInput(e.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              rows={2}
              aria-label="Prerequisites JSON"
            />
          </div>

          <button className="cs-btn cs-btn-primary" onClick={handleVisualize}>
            Visualize
          </button>
        </div>

        <div className="cs-support-row">
          <p className={`cs-hint ${inputError ? 'error' : ''}`}>
            {inputError || "Kahn's algorithm — BFS topological sort. Max 12 courses."}
          </p>
          <div className="cs-meta-row">
            <span className="cs-pill mono">{courseInput || 0} courses</span>
            <span className="cs-pill mono">{prerequisites.length} edges</span>
          </div>
        </div>

        <div className="cs-examples">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className={`cs-example-chip ${isActiveExample(ex) ? 'active' : ''}`}
              onClick={() => applyExample(ex)}
            >
              <span className="cs-chip-label">{ex.label}</span>
              <span className="cs-chip-note">{ex.note}</span>
              <span className="cs-chip-courses mono">{ex.numCourses}c</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress band ── */}
      <div className="cs-progress-band">
        <div className="cs-progress-track">
          <motion.div
            className="cs-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.14 }}
          />
        </div>
        <div className="cs-step-info">
          <span className="cs-step-counter">
            {stepIndex < 0
              ? 'Not started — press Play or step forward'
              : isDone
                ? `Done — canFinish = ${String(currentStep?.result)}`
                : `Step ${stepIndex + 1} / ${steps.length}`}
          </span>
          {phaseMeta && (
            <span className={`cs-phase-badge phase-${phaseMeta.color}`}>
              {phaseMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="cs-main">

        {/* Resizable shell: left (graph) and right (variables) */}
        <div className="cs-content-shell" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="cs-col-left" style={{ width: `${leftWidth}px`, flex: '0 0 auto' }}>
          <div className="cs-card cs-graph-card">
            <div className="cs-card-head">
              <div>
                <div className="cs-section-label">Dependency Graph</div>
                <p className="cs-card-sub">Edges: prerequisite → course unlocked</p>
              </div>
              <div className="cs-verdict">
                <span className="cs-verdict-label">Result</span>
                <span className={`cs-verdict-value mono ${currentStep?.result === false ? 'fail' : currentStep?.result === true ? 'pass' : ''}`}>
                  {currentStep?.result == null ? '—' : String(currentStep.result)}
                </span>
              </div>
            </div>
            <GraphView
              numCourses={numCourses}
              step={currentStep}
              zoom={graphZoom}
              onZoomChange={setGraphZoom}
            />
          </div>
          </div>

            {/* Move: Queue/Taken and In-degree into left column below graph */}
            <div className="cs-card cs-state-card" style={{ marginTop: '0.9rem' }}>
              <div className="cs-state-section">
                <div className="cs-section-label">Queue</div>
                <div className="cs-token-row">
                  {(currentStep?.queue ?? []).length > 0
                    ? currentStep.queue.map((c) => (
                        <span key={c} className="cs-token cs-token-queue mono">{c}</span>
                      ))
                    : <span className="cs-empty">Empty</span>}
                </div>
              </div>
              <div className="cs-state-divider" />
              <div className="cs-state-section">
                <div className="cs-section-label">Taken Order</div>
                <div className="cs-token-row">
                  {(currentStep?.takenOrder ?? []).length > 0
                    ? currentStep.takenOrder.map((c) => (
                        <span key={c} className="cs-token cs-token-taken mono">{c}</span>
                      ))
                    : <span className="cs-empty">None yet</span>}
                </div>
              </div>
            </div>

            <div className="cs-card cs-indegree-card" style={{ marginTop: '0.9rem' }}>
              <div className="cs-section-label">In-degree Table</div>
              <div className="cs-indegree-row">
                {Array.from({ length: numCourses }, (_, course) => {
                  const val      = currentStep?.indegree?.[course] ?? 0
                  const isActive = currentStep?.activeNeighbor === course || currentStep?.activeCourse === course
                  return (
                    <div key={course} className={`cs-deg-item ${isActive ? 'active' : ''} ${val === 0 ? 'zero' : ''}`}>
                      <span className="cs-deg-course mono">{course}</span>
                      <span className="cs-deg-val mono">{val}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          {/* <div className="cs-card cs-step-card">
            <p className="cs-step-text">
              {currentStep?.description || 'Press Play or step through the algorithm.'}
            </p>
          </div> */}
          {/* splitter */}
          <button
            type="button"
            className="panel-splitter"
            aria-label="Resize graph and variable panels"
            onPointerDown={startDrag('middle')}
            style={{ alignSelf: 'stretch', marginTop: '8px' }}
          >
            <span className="panel-splitter-grip" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          {/* Right column: Debug panels */}
          <div className="cs-col-right" style={{ flex: '1 1 auto' }}>
            <div className="cs-card cs-graph-json-card">
              <div className="cs-section-label">Graph JSON</div>
              <pre className="cs-graph-json mono">{JSON.stringify(currentStep?.graph ?? Array.from({ length: numCourses }, () => []), null, 2)}</pre>
            </div>

            <div className="cs-card cs-queue-timeline-card">
              <div className="cs-section-label">Queue Timeline</div>
              <div className="cs-queue-timeline">
                {steps.map((s, idx) => {
                  const isCur = idx === stepIndex
                  const was = steps[idx - 1]
                  let changed = null
                  if (s.event === 'dequeue') changed = { type: 'dequeue', value: was?.queue?.[0] ?? null }
                  if (s.event === 'enqueue') changed = { type: 'enqueue', value: null }
                  if (s.event === 'init') changed = { type: 'init', value: null }
                  return (
                    <div
                      key={idx}
                      className={`cs-queue-snap ${isCur ? 'cur' : ''} ${idx < stepIndex ? 'past' : ''}`}
                      onClick={() => setStepIndex(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cs-queue-index">{idx + 1}</div>
                      <div className="cs-queue-list mono">
                        {(s.queueSnapshot || []).map((q, i) => (
                          <span key={q} className={`cs-queue-item ${changed && changed.type === 'dequeue' && i === 0 ? 'deq' : ''}`}>{q}</span>
                        ))}
                        {(s.queueSnapshot || []).length === 0 && '—'}
                      </div>
                      <div className="cs-queue-event">
                        {s.event === 'enqueue' && <span className="cs-evt plus">+</span>}
                        {s.event === 'dequeue' && <span className="cs-evt minus">−</span>}
                        {s.event === 'init' && <span className="cs-evt init">●</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="cs-controls">
        <div className="cs-controls-play">
          <button className="cs-btn cs-btn-ghost cs-btn-icon" onClick={handleReset} disabled={stepIndex < 0} title="Reset">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button className="cs-btn cs-btn-ghost" onClick={stepBack} disabled={stepIndex < 0}>‹ Prev</button>
          <button className="cs-btn cs-btn-play" onClick={togglePlay}>
            {isPlaying ? '⏸ Pause' : isDone ? '↺ Replay' : '▶ Play'}
          </button>
          <button className="cs-btn cs-btn-ghost" onClick={stepForward} disabled={isDone}>Next ›</button>
        </div>

        <div className="cs-controls-options">
          <div className="cs-speed-wrap">
            <span className="cs-label">Speed</span>
            <input
              type="range"
              min={80}
              max={1400}
              step={60}
              value={1480 - speed}
              onChange={(e) => setSpeed(1480 - Number(e.target.value))}
              aria-label="Playback speed"
            />
          </div>
        </div>
      </div>

      {/* ── Code panel (always visible) ── */}
      <CodePanel step={currentStep} />

    </div>
  )
}

