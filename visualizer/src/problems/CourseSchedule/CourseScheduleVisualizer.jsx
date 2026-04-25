import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './CourseScheduleVisualizer.css'
import ResizablePanel from '../../components/ResizablePanel'

const MIN_ZOOM = 0.65
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.1
const MIN_GRAPH_WIDTH = 360
const MAX_GRAPH_WIDTH = 920
const MIN_GRAPH_HEIGHT = 280
const MAX_GRAPH_HEIGHT = 620

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
    note: 'Single dependency, so all courses can be completed.',
  },
  {
    label: 'Simple cycle',
    numCourses: 2,
    prerequisites: '[[1,0],[0,1]]',
    note: 'Each course blocks the other, so the queue becomes empty early.',
  },
  {
    label: 'Diamond DAG',
    numCourses: 4,
    prerequisites: '[[1,0],[2,0],[3,1],[3,2]]',
    note: 'Good example for queue growth and merging prerequisites.',
  },
  {
    label: 'No prerequisites',
    numCourses: 5,
    prerequisites: '[]',
    note: 'All courses start with indegree 0.',
  },
  {
    label: 'Hidden cycle',
    numCourses: 4,
    prerequisites: '[[1,0],[2,1],[0,2],[3,1]]',
    note: 'One component has a cycle, even though course 3 looks reachable.',
  },
]

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
  if (phase === 'build-edge') return { activeLine: 10, relatedLines: [8, 9, 10] }
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

function generateCourseSteps(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => [])
  const indegree = Array(numCourses).fill(0)
  const steps = []

  prerequisites.forEach(([course, prereq], index) => {
    graph[prereq].push(course)
    indegree[course] += 1
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
      description: `Add edge ${prereq} -> ${course}, then increase indegree[${course}] to ${indegree[course]}.`,
      result: null,
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
    description: queue.length > 0
      ? `Start the queue with all zero-indegree courses: ${queue.join(', ')}.`
      : 'No course has indegree 0, so the queue starts empty.',
    result: null,
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
      description: `Take course ${course} from the front of the queue.`,
      result: null,
    }))

    for (const neighbor of graph[course]) {
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
        description: becameZero
          ? `Decrease indegree[${neighbor}] to 0, so enqueue course ${neighbor}.`
          : `Decrease indegree[${neighbor}] to ${indegree[neighbor]}; it still has unresolved prerequisites.`,
        result: null,
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
    description: result
      ? `Processed all ${numCourses} courses, so the answer is true.`
      : `Only processed ${takenOrder.length} of ${numCourses} courses, so a cycle blocks completion and the answer is false.`,
    result,
  }))

  return steps
}

function GraphView({ numCourses, step, zoom, onZoomChange }) {
  const nodes = Array.from({ length: numCourses }, (_, course) => {
    const angle = (course / Math.max(numCourses, 1)) * Math.PI * 2 - Math.PI / 2
    const radius = numCourses <= 2 ? 0 : 120
    return {
      course,
      x: 180 + Math.cos(angle) * radius,
      y: 150 + Math.sin(angle) * radius,
    }
  })

  const nodeLookup = new Map(nodes.map((node) => [node.course, node]))
  const edges = []
  step?.graph?.forEach((neighbors, prereq) => {
    neighbors.forEach((course) => edges.push({ prereq, course }))
  })

  const handleWheel = (event) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    onZoomChange((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM))
  }

  return (
    <div className="cs-graph-shell">
      <div className="cs-graph-toolbar">
        <div className="cs-graph-toolbar-copy">Hold Ctrl and scroll to zoom</div>
        <div className="cs-graph-actions">
          <button type="button" className="cs-graph-icon-btn" onClick={() => onZoomChange((current) => clamp(Number((current - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom out graph">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <span className="cs-zoom-readout mono">{Math.round(zoom * 100)}%</span>
          <button type="button" className="cs-graph-icon-btn" onClick={() => onZoomChange((current) => clamp(Number((current + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} aria-label="Zoom in graph">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div className="cs-graph-wrap" onWheel={handleWheel}>
        <div className="cs-graph-stage" style={{ transform: `scale(${zoom})` }}>
          <svg className="cs-graph" viewBox="0 0 360 300" role="img" aria-label="Course dependency graph">
        <defs>
          <marker id="cs-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(148,163,184,0.8)" />
          </marker>
        </defs>

        {edges.map((edge, index) => {
          const from = nodeLookup.get(edge.prereq)
          const to = nodeLookup.get(edge.course)
          const isActive = step?.activePrereq === edge.prereq && step?.activeNeighbor === edge.course
          return (
            <line
              key={`${edge.prereq}-${edge.course}-${index}`}
              x1={from?.x}
              y1={from?.y}
              x2={to?.x}
              y2={to?.y}
              className={`cs-edge ${isActive ? 'active' : ''}`}
              markerEnd="url(#cs-arrow)"
            />
          )
        })}

        {nodes.map((node) => {
          const indegree = step?.indegree?.[node.course] ?? 0
          const inQueue = step?.queue?.includes(node.course)
          const taken = step?.takenOrder?.includes(node.course)
          const active = step?.activeCourse === node.course || step?.activeNeighbor === node.course
          return (
            <g key={node.course} transform={`translate(${node.x}, ${node.y})`}>
              <circle className={`cs-node ${taken ? 'taken' : ''} ${inQueue ? 'queued' : ''} ${active ? 'active' : ''}`} r="28" />
              <text className="cs-node-label" textAnchor="middle" dy="5">{node.course}</text>
              <text className="cs-node-degree" textAnchor="middle" dy="44">in {indegree}</text>
            </g>
          )
        })}
          </svg>
        </div>
      </div>

    </div>
  )
}

function CodePanel({ step }) {
  const codeRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    const activeLine = codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)
    activeLine?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SOLUTION_CODE.map(({ text }) => text).join('\n'))
    setCopied(true)
  }

  return (
    <motion.div className="cs-code-panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
      <div className="cs-code-head">
        <div>
          <div className="cs-section-label">Solution Code</div>
          <div className="cs-code-subtitle">{step ? <>Line <span className="mono cs-chip">{step.activeLine}</span> is active</> : 'Press Play to start'}</div>
        </div>
        <button type="button" className={`cs-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <div className="cs-code-scroll" ref={codeRef}>
        {SOLUTION_CODE.map(({ line, text }) => {
          const isActive = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`cs-code-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{ x: isActive ? 6 : 0, opacity: isRelated || isActive || !step ? 1 : 0.56 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              <span className="cs-code-no mono">{line}</span>
              <code className="cs-code-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function CourseScheduleVisualizer() {
  const [courseInput, setCourseInput] = useState(String(DEFAULT_COURSES))
  const [prereqInput, setPrereqInput] = useState(DEFAULT_PREREQS)
  const [numCourses, setNumCourses] = useState(DEFAULT_COURSES)
  const [prerequisites, setPrerequisites] = useState(() => JSON.parse(DEFAULT_PREREQS))
  const [steps, setSteps] = useState(() => generateCourseSteps(DEFAULT_COURSES, JSON.parse(DEFAULT_PREREQS)))
  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(520)
  const [showCode, setShowCode] = useState(true)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [graphZoom, setGraphZoom] = useState(1)
  const [graphPanelWidth, setGraphPanelWidth] = useState(560)
  const [graphPanelHeight, setGraphPanelHeight] = useState(360)
  const contentShellRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(null)
  const contentRightResizeRef = useRef(null)
  const intervalRef = useRef(null)
  const graphResizeRef = useRef(null)

  const parsedCourses = Number(courseInput)
  const coursesValid = Number.isInteger(parsedCourses) && parsedCourses >= 1 && parsedCourses <= 12
  const parsedPrereqs = parsePrerequisites(prereqInput)
  const prereqValue = parsedPrereqs.value ?? []
  const prereqRangeValid = coursesValid && parsedPrereqs.value
    ? prereqValue.every(([a, b]) => a >= 0 && a < parsedCourses && b >= 0 && b < parsedCourses)
    : false

  const inputError = attemptedSubmit && !coursesValid
    ? 'For the visualizer, numCourses must be an integer between 1 and 12.'
    : attemptedSubmit && parsedPrereqs.error
      ? parsedPrereqs.error
      : attemptedSubmit && !prereqRangeValid
        ? 'Every prerequisite course id must be between 0 and numCourses - 1.'
        : null

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0
  const isDone = stepIndex === steps.length - 1

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
    setStepIndex((current) => {
      if (current >= steps.length - 1) {
        setIsPlaying(false)
        return current
      }
      return current + 1
    })
  }, [steps.length])

  const stepBack = () => setStepIndex((current) => Math.max(-1, current - 1))
  const handleReset = () => {
    setStepIndex(-1)
    setIsPlaying(false)
  }
  const togglePlay = () => {
    if (stepIndex >= steps.length - 1) setStepIndex(-1)
    setIsPlaying((current) => !current)
  }

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIndex((current) => {
          if (current >= steps.length - 1) {
            setIsPlaying(false)
            return current
          }
          return current + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, steps.length])

  useEffect(() => {
    const handlePointerMove = (event) => {
      const resize = graphResizeRef.current
      if (!resize) return
      const dx = event.clientX - resize.startX
      const dy = event.clientY - resize.startY
      let nextWidth = resize.startWidth
      let nextHeight = resize.startHeight

      if (resize.direction === 'right') {
        nextWidth = resize.startWidth + dx
      } else if (resize.direction === 'top') {
        // dragging the top edge: moving pointer down (dy > 0) should decrease height
        nextHeight = resize.startHeight - dy
      } else {
        // corner / both
        nextWidth = resize.startWidth + dx
        nextHeight = resize.startHeight + dy
      }

      setGraphPanelWidth(clamp(nextWidth, MIN_GRAPH_WIDTH, MAX_GRAPH_WIDTH))
      setGraphPanelHeight(clamp(nextHeight, MIN_GRAPH_HEIGHT, MAX_GRAPH_HEIGHT))
    }

    const handlePointerUp = () => {
      if (!graphResizeRef.current) return
      graphResizeRef.current = null
      document.body.classList.remove('cs-resizing-graph')
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.classList.remove('cs-resizing-graph')
      document.body.style.cursor = ''
    }
  }, [])

  useEffect(() => {
    const handleGlobalMove = (event) => {
      const cr = graphResizeRef.current
      const rr = contentRightResizeRef.current
      if (cr && cr._contentStartY != null) {
        const dy = event.clientY - cr._contentStartY
        const nextH = Math.max(320, Math.min(1100, cr._contentStartHeight - dy))
        setContentHeight(nextH)
        return
      }

      if (rr && rr.startX != null) {
        const dx = event.clientX - rr.startX
        const nextW = Math.max(320, Math.min(1400, rr.startWidth + dx))
        setGraphPanelWidth(nextW)
        return
      }
    }

    const handleGlobalUp = () => {
      if (graphResizeRef.current) {
        delete graphResizeRef.current._contentStartY
        delete graphResizeRef.current._contentStartHeight
      }
      if (contentRightResizeRef.current) contentRightResizeRef.current = { startX: null }
      document.body.classList.remove('cs-resizing-graph')
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handleGlobalMove)
    window.addEventListener('pointerup', handleGlobalUp)
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove)
      window.removeEventListener('pointerup', handleGlobalUp)
    }
  }, [])

  const startGraphResize = (event, direction = 'corner') => {
    event.preventDefault()
    graphResizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: graphPanelWidth,
      startHeight: graphPanelHeight,
      direction,
    }
    document.body.classList.add('cs-resizing-graph')
    // set cursor affordance for immediate feedback
    if (direction === 'right') document.body.style.cursor = 'ew-resize'
    else if (direction === 'top') document.body.style.cursor = 'ns-resize'
    else document.body.style.cursor = 'nwse-resize'
  }

  const startContentResize = (event) => {
    event.preventDefault()
    const rect = contentShellRef.current?.getBoundingClientRect()
    const startY = event.clientY
    const startHeight = rect ? rect.height : 520
    contentRightResizeRef.current = { startX: null }
    // store on ref for global handler
    graphResizeRef.current = { _contentStartY: startY, _contentStartHeight: startHeight }
    document.body.classList.add('cs-resizing-graph')
    document.body.style.cursor = 'ns-resize'
  }

  const startContentRightResize = (event) => {
    event.preventDefault()
    const rect = contentShellRef.current?.getBoundingClientRect()
    contentRightResizeRef.current = { startX: event.clientX, startWidth: rect ? rect.width : 900 }
    document.body.classList.add('cs-resizing-graph')
    document.body.style.cursor = 'ew-resize'
  }

  return (
    <div className="cs">
      <div className="cs-card cs-input-card">
        <div className="cs-input-grid">
          <div className="cs-field-group small">
            <label className="cs-input-label">Courses</label>
            <input
              className={`cs-input ${inputError && !coursesValid ? 'has-error' : ''}`}
              value={courseInput}
              onChange={(event) => {
                setCourseInput(event.target.value.replace(/[^0-9]/g, ''))
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              inputMode="numeric"
            />
          </div>

          <div className="cs-field-group large">
            <label className="cs-input-label">Prerequisites</label>
            <textarea
              className={`cs-input cs-textarea mono ${inputError && (parsedPrereqs.error || !prereqRangeValid) ? 'has-error' : ''}`}
              value={prereqInput}
              onChange={(event) => {
                setPrereqInput(event.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              rows={3}
            />
          </div>

          <button className="cs-btn cs-btn-primary" onClick={handleVisualize}>Visualize</button>
        </div>

        <div className="cs-support-row">
          <p className={`cs-hint ${inputError ? 'error' : ''}`}>{inputError || 'This walkthrough uses Kahn\'s algorithm. The visualizer limits courses to 12 so the graph stays readable.'}</p>
          <div className="cs-meta-row">
            <span className="cs-pill mono">courses {courseInput || 0}</span>
            <span className="cs-pill mono">edges {prerequisites.length}</span>
          </div>
        </div>

        <div className="cs-example-grid">
          {EXAMPLES.map((example) => (
            <button key={example.label} type="button" className={`cs-example-card ${numCourses === example.numCourses && prereqInput === example.prerequisites ? 'active' : ''}`} onClick={() => applyExample(example)}>
              <span className="cs-example-top">
                <span className="cs-example-label">{example.label}</span>
                <span className="cs-example-chip mono">{example.numCourses}c</span>
              </span>
              <span className="cs-example-note">{example.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cs-progress-track">
        <motion.div className="cs-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.14 }} />
      </div>
      <div className="cs-step-counter">
        {stepIndex < 0
          ? 'Not started — press Play or Next'
          : isDone
            ? `Done! canFinish = ${String(currentStep?.result)}`
            : `Step ${stepIndex + 1} / ${steps.length}`}
      </div>

      <div className="cs-toolbar">
        <div className="cs-toggle-group">
          <span className="cs-toggle-label">View</span>
          <div className="cs-toggle-pill">
            <button className={`cs-toggle-btn ${!showCode ? 'active' : ''}`} onClick={() => setShowCode(false)}>Visual only</button>
            <button className={`cs-toggle-btn ${showCode ? 'active' : ''}`} onClick={() => setShowCode(true)}>Visual + code</button>
          </div>
        </div>
      </div>

      <div className={`cs-layout ${showCode ? 'with-code' : ''}`}>
        <div className="cs-main-column">
          <ResizablePanel width={graphPanelWidth} height={graphPanelHeight} minWidth={MIN_GRAPH_WIDTH} minHeight={MIN_GRAPH_HEIGHT} onResize={(v) => {
            if (v.width) setGraphPanelWidth(v.width)
            if (v.height) setGraphPanelHeight(v.height)
          }}>
            <div className="cs-card cs-graph-card">
            <div className="cs-card-head">
              <div>
                <div className="cs-section-label">Dependency Graph</div>
                <div className="cs-subtitle">Edges point from prerequisite to course that becomes available after it.</div>
              </div>
              <div className="cs-result-preview">
                <span className="cs-output-label">Verdict</span>
                <span className={`mono cs-output-text ${currentStep?.result === false ? 'fail' : ''}`}>{currentStep?.result == null ? 'pending' : String(currentStep.result)}</span>
              </div>
            </div>
             <div className="cs-layout" ref={contentShellRef} style={contentHeight ? { height: `${contentHeight}px` } : undefined}>
              <GraphView
              numCourses={numCourses}
              step={currentStep}
              zoom={graphZoom}
              onZoomChange={setGraphZoom}
            />
              </div>
              </div>
            </ResizablePanel>

          <div className="cs-state-grid">
            <div className="cs-card">
              <div className="cs-section-label">Queue</div>
              <div className="cs-queue-row">
                {(currentStep?.queue ?? []).length > 0
                  ? currentStep.queue.map((course) => <span key={course} className="cs-token mono">{course}</span>)
                  : <span className="cs-empty-text">Queue is empty</span>}
              </div>
            </div>

            <div className="cs-card">
              <div className="cs-section-label">Taken Order</div>
              <div className="cs-queue-row">
                {(currentStep?.takenOrder ?? []).length > 0
                  ? currentStep.takenOrder.map((course) => <span key={course} className="cs-token mono taken">{course}</span>)
                  : <span className="cs-empty-text">No course processed yet</span>}
              </div>
            </div>
          </div>

          <div className="cs-card">
            <div className="cs-section-label">Indegree Table</div>
            <div className="cs-indegree-grid">
              {Array.from({ length: numCourses }, (_, course) => (
                <div key={course} className={`cs-indegree-item ${currentStep?.activeNeighbor === course || currentStep?.activeCourse === course ? 'active' : ''}`}>
                  <span className="cs-indegree-course mono">course {course}</span>
                  <span className="cs-indegree-value mono">{currentStep?.indegree?.[course] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cs-card">
            <div className="cs-section-label">Explanation</div>
            <div className="cs-explanation">{currentStep?.description || 'Start the walkthrough to build the graph and process the queue.'}</div>
          </div>
        </div>

        <AnimatePresence>
          {showCode && <CodePanel step={currentStep} />}
        </AnimatePresence>
      </div>

      <div className="cs-controls">
        <button className="cs-btn cs-btn-ghost" onClick={handleReset} disabled={stepIndex < 0}>Reset</button>
        <button className="cs-btn cs-btn-ghost" onClick={stepBack} disabled={stepIndex < 0}>Prev</button>
        <button className="cs-btn cs-btn-play" onClick={togglePlay}>{isPlaying ? 'Pause' : isDone ? 'Replay' : 'Play'}</button>
        <button className="cs-btn cs-btn-ghost" onClick={stepForward} disabled={isDone}>Next</button>
        <div className="cs-speed-wrap">
          <span className="cs-speed-label">Speed</span>
          <input type="range" min={80} max={1400} step={60} value={1480 - speed} onChange={(event) => setSpeed(1480 - Number(event.target.value))} />
        </div>
      </div>
    </div>
  )
}