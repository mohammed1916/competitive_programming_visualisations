import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import './LRUCacheVisualizer.css'

const DEFAULT_CAPACITY = 2
const DEFAULT_OPS = '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]'
const DEFAULT_ARGS = '[[2], [1,1], [2,2], [1], [3,3], [2], [4,4], [1], [3], [4]]'

const EXAMPLES = [
  {
    label: 'LeetCode Example',
    capacity: 2,
    operations: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]',
    arguments: '[[2], [1,1], [2,2], [1], [3,3], [2], [4,4], [1], [3], [4]]',
    note: 'Output: [null, null, null, 1, null, -1, null, -1, 3, 4]',
  },
  {
    label: 'Updates Existing Key',
    capacity: 2,
    operations: '["LRUCache", "put", "put", "put", "get", "get"]',
    arguments: '[[2], [1,10], [2,20], [1,99], [1], [2]]',
    note: 'put(1,99) moves key 1 to MRU.',
  },
  {
    label: 'Capacity 1',
    capacity: 1,
    operations: '["LRUCache", "put", "put", "get", "get"]',
    arguments: '[[1], [2,200], [3,300], [2], [3]]',
    note: 'Each new insert evicts previous key.',
  },
]

const SOLUTION_CODE = [
  { line: 1, text: 'class Node:' },
  { line: 2, text: '    def __init__(self, key=0, value=0):' },
  { line: 3, text: '        self.key = key; self.value = value' },
  { line: 4, text: '        self.prev = None; self.next = None' },
  { line: 5, text: '' },
  { line: 6, text: 'class LRUCache:' },
  { line: 7, text: '    def __init__(self, capacity: int):' },
  { line: 8, text: '        self.capacity = capacity' },
  { line: 9, text: '        self.cache = {}' },
  { line: 10, text: '        self.left = Node()   # LRU sentinel' },
  { line: 11, text: '        self.right = Node()  # MRU sentinel' },
  { line: 12, text: '        self.left.next = self.right; self.right.prev = self.left' },
  { line: 13, text: '' },
  { line: 14, text: '    def _remove(self, node):' },
  { line: 15, text: '        prev, nxt = node.prev, node.next' },
  { line: 16, text: '        prev.next = nxt; nxt.prev = prev' },
  { line: 17, text: '' },
  { line: 18, text: '    def _insert_mru(self, node):' },
  { line: 19, text: '        prev = self.right.prev; nxt = self.right' },
  { line: 20, text: '        prev.next = node; node.prev = prev' },
  { line: 21, text: '        node.next = nxt; nxt.prev = node' },
  { line: 22, text: '' },
  { line: 23, text: '    def get(self, key: int) -> int:' },
  { line: 24, text: '        if key not in self.cache: return -1' },
  { line: 25, text: '        node = self.cache[key]' },
  { line: 26, text: '        self._remove(node); self._insert_mru(node)' },
  { line: 27, text: '        return node.value' },
  { line: 28, text: '' },
  { line: 29, text: '    def put(self, key: int, value: int) -> None:' },
  { line: 30, text: '        if key in self.cache:' },
  { line: 31, text: '            self._remove(self.cache[key])' },
  { line: 32, text: '        self.cache[key] = Node(key, value)' },
  { line: 33, text: '        self._insert_mru(self.cache[key])' },
  { line: 34, text: '        if len(self.cache) > self.capacity:' },
  { line: 35, text: '            lru = self.left.next' },
  { line: 36, text: '            self._remove(lru)' },
  { line: 37, text: '            del self.cache[lru.key]' },
]

const PHASE_META = {
  init: { label: 'Init', color: 'blue' },
  'get-hit': { label: 'Get Hit', color: 'green' },
  'get-miss': { label: 'Get Miss', color: 'red' },
  'put-insert': { label: 'Put Insert', color: 'amber' },
  'put-update': { label: 'Put Update', color: 'violet' },
  'put-evict': { label: 'Put + Evict', color: 'orange' },
}

function parseJson(raw) {
  try {
    return { value: JSON.parse(raw) }
  } catch {
    return { error: 'Invalid JSON. Please use valid JSON arrays.' }
  }
}

function toNullableOutput(value) {
  return value === null ? 'null' : String(value)
}

function getCodeHighlight(phase) {
  if (phase === 'init') return { activeLine: 8, relatedLines: [7, 8, 9, 10, 11, 12] }
  if (phase === 'get-hit') return { activeLine: 26, relatedLines: [23, 24, 25, 26, 27] }
  if (phase === 'get-miss') return { activeLine: 24, relatedLines: [23, 24] }
  if (phase === 'put-update') return { activeLine: 31, relatedLines: [29, 30, 31, 32, 33] }
  if (phase === 'put-evict') return { activeLine: 37, relatedLines: [29, 32, 33, 34, 35, 36, 37] }
  return { activeLine: 33, relatedLines: [29, 32, 33] }
}

function withCode(step) {
  const code = getCodeHighlight(step.phase)
  return { ...step, activeLine: code.activeLine, relatedLines: code.relatedLines }
}

function makeDescription({ phase, key, value, result, evictedKey }) {
  if (phase === 'init') return 'Initialize cache with empty hash map + doubly linked list sentinels.'
  if (phase === 'get-hit') return `get(${key}) hit -> return ${result} and move key ${key} to MRU.`
  if (phase === 'get-miss') return `get(${key}) miss -> return -1. Cache order is unchanged.`
  if (phase === 'put-update') return `put(${key}, ${value}) updates existing key and moves it to MRU.`
  if (phase === 'put-evict') return `put(${key}, ${value}) inserts new key; capacity exceeded, evict LRU key ${evictedKey}.`
  return `put(${key}, ${value}) inserts new key and marks it as MRU.`
}

function moveKeyToFront(order, key) {
  const idx = order.indexOf(key)
  if (idx !== -1) order.splice(idx, 1)
  order.unshift(key)
}

function snapshotEntries(order, store) {
  return order.map((key) => ({ key, value: store.get(key) }))
}

function validateInput(capacity, operations, args) {
  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 3000) {
    return 'Capacity must be an integer between 1 and 3000.'
  }
  if (!Array.isArray(operations) || !Array.isArray(args)) {
    return 'Operations and Arguments must both be arrays.'
  }
  if (operations.length !== args.length) {
    return 'Operations and Arguments length must match.'
  }
  if (operations.length === 0) {
    return 'Provide at least one operation.'
  }
  if (operations[0] !== 'LRUCache') {
    return 'First operation must be "LRUCache".'
  }
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    const a = args[i]
    if (!Array.isArray(a)) return `Arguments at index ${i} must be an array.`
    if (op === 'LRUCache' && a.length !== 1) return 'LRUCache operation must have one argument: [capacity].'
    if (op === 'get' && a.length !== 1) return `get at index ${i} must be [key].`
    if (op === 'put' && a.length !== 2) return `put at index ${i} must be [key, value].`
    if (!['LRUCache', 'get', 'put'].includes(op)) return `Unsupported operation "${op}" at index ${i}.`
  }
  return null
}

function generateLRUSteps(initialCapacity, operations, args) {
  const steps = []
  const outputs = []
  const store = new Map()
  const order = [] // MRU -> LRU
  let capacity = initialCapacity

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    const arg = args[i]

    if (op === 'LRUCache') {
      capacity = Number(arg[0])
      store.clear()
      order.length = 0
      outputs.push(null)
      steps.push(withCode({
        index: i,
        op,
        arg,
        phase: 'init',
        key: null,
        value: null,
        result: null,
        evictedKey: null,
        capacity,
        entries: [],
        keysInMap: [],
        outputs: [...outputs],
        description: makeDescription({ phase: 'init' }),
      }))
      continue
    }

    if (op === 'get') {
      const key = Number(arg[0])
      if (store.has(key)) {
        const value = store.get(key)
        moveKeyToFront(order, key)
        outputs.push(value)
        steps.push(withCode({
          index: i,
          op,
          arg,
          phase: 'get-hit',
          key,
          value,
          result: value,
          evictedKey: null,
          capacity,
          entries: snapshotEntries(order, store),
          keysInMap: [...order],
          outputs: [...outputs],
          description: makeDescription({ phase: 'get-hit', key, result: value }),
        }))
      } else {
        outputs.push(-1)
        steps.push(withCode({
          index: i,
          op,
          arg,
          phase: 'get-miss',
          key,
          value: null,
          result: -1,
          evictedKey: null,
          capacity,
          entries: snapshotEntries(order, store),
          keysInMap: [...order],
          outputs: [...outputs],
          description: makeDescription({ phase: 'get-miss', key, result: -1 }),
        }))
      }
      continue
    }

    const key = Number(arg[0])
    const value = Number(arg[1])

    if (store.has(key)) {
      store.set(key, value)
      moveKeyToFront(order, key)
      outputs.push(null)
      steps.push(withCode({
        index: i,
        op,
        arg,
        phase: 'put-update',
        key,
        value,
        result: null,
        evictedKey: null,
        capacity,
        entries: snapshotEntries(order, store),
        keysInMap: [...order],
        outputs: [...outputs],
        description: makeDescription({ phase: 'put-update', key, value }),
      }))
      continue
    }

    store.set(key, value)
    order.unshift(key)
    outputs.push(null)

    if (order.length > capacity) {
      const evictedKey = order.pop()
      store.delete(evictedKey)
      steps.push(withCode({
        index: i,
        op,
        arg,
        phase: 'put-evict',
        key,
        value,
        result: null,
        evictedKey,
        capacity,
        entries: snapshotEntries(order, store),
        keysInMap: [...order],
        outputs: [...outputs],
        description: makeDescription({ phase: 'put-evict', key, value, evictedKey }),
      }))
    } else {
      steps.push(withCode({
        index: i,
        op,
        arg,
        phase: 'put-insert',
        key,
        value,
        result: null,
        evictedKey: null,
        capacity,
        entries: snapshotEntries(order, store),
        keysInMap: [...order],
        outputs: [...outputs],
        description: makeDescription({ phase: 'put-insert', key, value }),
      }))
    }
  }

  return steps
}

function CodePanel({ step }) {
  const codeRef = useRef(null)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  return (
    <div className="lru-code-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Python O(1) Design</div>
        <div className="lru-subtitle">Hash map + doubly linked list</div>
      </div>
      <div className="lru-code-scroll" ref={codeRef}>
        {SOLUTION_CODE.map(({ line, text }) => {
          const isActive = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`lru-code-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{ x: isActive ? 6 : 0, opacity: isActive || isRelated || !step ? 1 : 0.55 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            >
              <span className="lru-code-line mono">{line}</span>
              <code className="lru-code-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function CacheOrder({ step }) {
  const entries = step?.entries ?? []

  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Cache Order</div>
        <div className="lru-subtitle">MRU on left, LRU on right</div>
      </div>
      <div className="lru-order-wrap">
        {entries.length === 0 ? (
          <div className="lru-empty">Cache is empty</div>
        ) : (
          entries.map((entry, idx) => (
            <div key={entry.key} className="lru-order-node-wrap">
              <motion.div
                className={`lru-order-node ${idx === 0 ? 'mru' : ''} ${idx === entries.length - 1 ? 'lru' : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="lru-order-key mono">{entry.key}</div>
                <div className="lru-order-val mono">{entry.value}</div>
              </motion.div>
              {idx < entries.length - 1 && <span className="lru-arrow">→</span>}
            </div>
          ))
        )}
      </div>
      <div className="lru-order-legend">
        <span className="lru-badge mru">MRU</span>
        <span className="lru-badge lru">LRU</span>
      </div>
    </div>
  )
}

function MapTable({ step }) {
  const entries = step?.entries ?? []
  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Hash Map View</div>
        <div className="lru-subtitle">O(1) key -&gt; node lookup</div>
      </div>
      <div className="lru-map-grid">
        {entries.length === 0 ? (
          <div className="lru-empty">No keys</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.key} className="lru-map-item">
              <span className="lru-map-key mono">{entry.key}</span>
              <span className="lru-map-sep">:</span>
              <span className="lru-map-val mono">{entry.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OutputPanel({ step }) {
  const outputs = step?.outputs ?? []
  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Output Stream</div>
        <div className="lru-subtitle">LeetCode-style return list</div>
      </div>
      <div className="lru-output mono">
        [
        {outputs.map((value, idx) => (
          <span key={`${idx}-${value}`} className="lru-output-item">
            {toNullableOutput(value)}
            {idx < outputs.length - 1 ? ', ' : ''}
          </span>
        ))}
        ]
      </div>
    </div>
  )
}

export default function LRUCacheVisualizer() {
  const [capacityInput, setCapacityInput] = useState(String(DEFAULT_CAPACITY))
  const [opsInput, setOpsInput] = useState(DEFAULT_OPS)
  const [argsInput, setArgsInput] = useState(DEFAULT_ARGS)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [operations, setOperations] = useState(() => JSON.parse(DEFAULT_OPS))
  const [argumentsList, setArgumentsList] = useState(() => JSON.parse(DEFAULT_ARGS))
  const [steps, setSteps] = useState(() => generateLRUSteps(DEFAULT_CAPACITY, JSON.parse(DEFAULT_OPS), JSON.parse(DEFAULT_ARGS)))

  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(560)
  const intervalRef = useRef(null)

  const parsedCapacity = Number(capacityInput)
  const parsedOps = useMemo(() => parseJson(opsInput), [opsInput])
  const parsedArgs = useMemo(() => parseJson(argsInput), [argsInput])

  const structuralError = useMemo(() => {
    if (parsedOps.error || parsedArgs.error) return null
    if (!parsedOps.value || !parsedArgs.value) return null
    return validateInput(parsedCapacity, parsedOps.value, parsedArgs.value)
  }, [parsedOps, parsedArgs, parsedCapacity])

  const inputError = attemptedSubmit
    ? (parsedOps.error || parsedArgs.error || structuralError)
    : null

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const phaseMeta = currentStep ? PHASE_META[currentStep.phase] : null
  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0
  const isDone = stepIndex === steps.length - 1

  const applyExample = useCallback((example) => {
    setCapacityInput(String(example.capacity))
    setOpsInput(example.operations)
    setArgsInput(example.arguments)

    const parsedO = JSON.parse(example.operations)
    const parsedA = JSON.parse(example.arguments)

    setCapacity(example.capacity)
    setOperations(parsedO)
    setArgumentsList(parsedA)
    setSteps(generateLRUSteps(example.capacity, parsedO, parsedA))
    setStepIndex(-1)
    setIsPlaying(false)
    setAttemptedSubmit(false)
  }, [])

  const handleVisualize = useCallback(() => {
    setAttemptedSubmit(true)
    if (parsedOps.error || parsedArgs.error || structuralError) return
    setCapacity(parsedCapacity)
    setOperations(parsedOps.value)
    setArgumentsList(parsedArgs.value)
    setSteps(generateLRUSteps(parsedCapacity, parsedOps.value, parsedArgs.value))
    setStepIndex(-1)
    setIsPlaying(false)
  }, [parsedCapacity, parsedOps, parsedArgs, structuralError])

  const stepForward = useCallback(() => {
    setStepIndex((cur) => {
      if (cur >= steps.length - 1) {
        setIsPlaying(false)
        return cur
      }
      return cur + 1
    })
  }, [steps.length])

  const stepBack = () => setStepIndex((cur) => Math.max(-1, cur - 1))
  const handleReset = () => {
    setStepIndex(-1)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (stepIndex >= steps.length - 1) setStepIndex(-1)
    setIsPlaying((p) => !p)
  }

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIndex((cur) => {
          if (cur >= steps.length - 1) {
            setIsPlaying(false)
            return cur
          }
          return cur + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, steps.length])

  const activeOpIndex = currentStep?.index ?? -1

  return (
    <div className="lru">
      <div className="lru-card lru-input-card">
        <div className="lru-top-row">
          <div>
            <div className="lru-section-label">Problem Link</div>
            <a className="lru-link" href="https://leetcode.com/problems/lru-cache/" target="_blank" rel="noreferrer">
              https://leetcode.com/problems/lru-cache/
            </a>
          </div>
          <div className="lru-pill mono">Calls &lt;= 2 * 10^5</div>
        </div>

        <div className="lru-input-row">
          <div className="lru-field lru-field-sm">
            <label className="lru-label">Capacity</label>
            <input
              className={`lru-input ${attemptedSubmit && !Number.isInteger(parsedCapacity) ? 'has-error' : ''}`}
              value={capacityInput}
              onChange={(e) => {
                setCapacityInput(e.target.value.replace(/[^0-9]/g, ''))
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              inputMode="numeric"
            />
          </div>

          <div className="lru-field">
            <label className="lru-label">Operations (JSON Array)</label>
            <textarea
              className={`lru-input lru-textarea mono ${attemptedSubmit && parsedOps.error ? 'has-error' : ''}`}
              value={opsInput}
              onChange={(e) => {
                setOpsInput(e.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              rows={2}
            />
          </div>

          <div className="lru-field">
            <label className="lru-label">Arguments (JSON Array of Arrays)</label>
            <textarea
              className={`lru-input lru-textarea mono ${attemptedSubmit && parsedArgs.error ? 'has-error' : ''}`}
              value={argsInput}
              onChange={(e) => {
                setArgsInput(e.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              rows={2}
            />
          </div>

          <button className="lru-btn lru-btn-primary" onClick={handleVisualize}>Visualize</button>
        </div>

        <div className="lru-support-row">
          <p className={`lru-hint ${inputError ? 'error' : ''}`}>
            {inputError || 'Use hash map + doubly linked list to keep get/put in O(1) average time.'}
          </p>
          <div className="lru-meta-row">
            <span className="lru-pill mono">capacity {capacity}</span>
            <span className="lru-pill mono">ops {operations.length}</span>
            <span className="lru-pill mono">args {argumentsList.length}</span>
          </div>
        </div>

        <div className="lru-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" className="lru-example" onClick={() => applyExample(ex)}>
              <span className="lru-example-label">{ex.label}</span>
              <span className="lru-example-note">{ex.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lru-progress-card">
        <div className="lru-progress-track">
          <motion.div className="lru-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
        </div>
        <div className="lru-progress-row">
          <span className="lru-step-counter">
            {stepIndex < 0 ? 'Not started' : `Step ${stepIndex + 1} / ${steps.length} (op index ${activeOpIndex})`}
          </span>
          {phaseMeta && <span className={`lru-phase phase-${phaseMeta.color}`}>{phaseMeta.label}</span>}
        </div>
      </div>

      <div className="lru-layout">
        <div className="lru-main">
          <div className="lru-card">
            <div className="lru-card-head">
              <div className="lru-section-label">Operation Timeline</div>
              <div className="lru-subtitle">Click any operation to jump</div>
            </div>
            <div className="lru-timeline mono">
              {operations.map((op, idx) => (
                <button
                  key={`${op}-${idx}`}
                  type="button"
                  className={`lru-op-chip ${idx === activeOpIndex ? 'active' : ''}`}
                  onClick={() => setStepIndex(idx)}
                >
                  <span>{idx}</span>
                  <span>{op}</span>
                </button>
              ))}
            </div>
            <p className="lru-step-desc mono">{currentStep?.description || 'Press Play or Next to start simulation.'}</p>
          </div>

          <CacheOrder step={currentStep} />
          <MapTable step={currentStep} />
          <OutputPanel step={currentStep} />
        </div>

        <CodePanel step={currentStep} />
      </div>

      <div className="lru-controls">
        <div className="lru-controls-left">
          <button className="lru-btn lru-btn-ghost" onClick={handleReset} disabled={stepIndex < 0}>Reset</button>
          <button className="lru-btn lru-btn-ghost" onClick={stepBack} disabled={stepIndex < 0}>Prev</button>
          <button className="lru-btn lru-btn-play" onClick={togglePlay}>{isPlaying ? 'Pause' : isDone ? 'Replay' : 'Play'}</button>
          <button className="lru-btn lru-btn-ghost" onClick={stepForward} disabled={isDone}>Next</button>
        </div>

        <div className="lru-speed">
          <span className="lru-label">Speed</span>
          <input
            type="range"
            min={80}
            max={1400}
            step={60}
            value={1480 - speed}
            onChange={(e) => setSpeed(1480 - Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
