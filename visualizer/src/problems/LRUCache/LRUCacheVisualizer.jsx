import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './LRUCacheVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Node:' },
  { line: 2, text: '    def __init__(self, key, val):' },
  { line: 3, text: '        self.key, self.val = key, val' },
  { line: 4, text: '        self.prev = self.next = None' },
  { line: 5, text: '' },
  { line: 6, text: 'class LRUCache:' },
  { line: 7, text: '    def __init__(self, capacity: int):' },
  { line: 8, text: '        self.cap = capacity' },
  { line: 9, text: '        self.cache = {}' },
  { line: 10, text: '        self.left, self.right = Node(0, 0), Node(0, 0)' },
  { line: 11, text: '        self.left.next, self.right.prev = self.right, self.left' },
  { line: 12, text: '' },
  { line: 13, text: '    def remove(self, node):' },
  { line: 14, text: '        prv, nxt = node.prev, node.next' },
  { line: 15, text: '        prv.next, nxt.prev = nxt, prv' },
  { line: 16, text: '' },
  { line: 17, text: '    def insert(self, node):' },
  { line: 18, text: '        prv, nxt = self.right.prev, self.right' },
  { line: 19, text: '        prv.next = nxt.prev = node' },
  { line: 20, text: '        node.prev, node.next = prv, nxt' },
  { line: 21, text: '' },
  { line: 22, text: '    def get(self, key: int) -> int:' },
  { line: 23, text: '        if key in self.cache:' },
  { line: 24, text: '            self.remove(self.cache[key])' },
  { line: 25, text: '            self.insert(self.cache[key])' },
  { line: 26, text: '            return self.cache[key].val' },
  { line: 27, text: '        return -1' },
  { line: 28, text: '' },
  { line: 29, text: '    def put(self, key: int, value: int) -> None:' },
  { line: 30, text: '        if key in self.cache:' },
  { line: 31, text: '            self.remove(self.cache[key])' },
  { line: 32, text: '        self.cache[key] = Node(key, value)' },
  { line: 33, text: '        self.insert(self.cache[key])' },
  { line: 34, text: '        ' },
  { line: 35, text: '        if len(self.cache) > self.cap:' },
  { line: 36, text: '            lru = self.left.next' },
  { line: 37, text: '            self.remove(lru)' },
  { line: 38, text: '            del self.cache[lru.key]' },
]

function generateSteps(commands, argsList) {
  const steps = []

  if (!commands || commands.length === 0 || commands[0] !== 'LRUCache') {
    steps.push({
      phase: 'done', cache: {}, list: [], capacity: 0, outputs: [],
      activeLine: 6, message: 'Invalid commands sequence. Must start with LRUCache initialization.'
    })
    return steps
  }

  let capacity = argsList[0][0]
  let cache = {} // key -> { key, val }
  let list = [] // array of keys, 0 is LRU (left), end is MRU (right)
  let outputs = [null]

  steps.push({
    phase: 'init', cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs],
    activeLine: 7, message: `Initialize LRUCache with capacity \${capacity}. Create dummy left and right nodes.`
  })

  for (let i = 1; i < commands.length; i++) {
    const cmd = commands[i]
    const args = argsList[i]

    steps.push({
      phase: `cmd_\${i}_start`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
      activeLine: cmd === 'get' ? 22 : 29, message: `Execute \${cmd}(\${args.join(', ')}).`
    })

    if (cmd === 'get') {
      const key = args[0]
      steps.push({
        phase: `cmd_\${i}_check`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
        activeLine: 23, message: `Check if key \${key} is in cache.`
      })

      if (key in cache) {
        // remove from list
        list = list.filter(k => k !== key)
        steps.push({
          phase: `cmd_\${i}_remove`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 24, message: `Key \${key} exists. Remove node from its current position in the linked list.`
        })

        // insert at right
        list.push(key)
        steps.push({
          phase: `cmd_\${i}_insert`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 25, message: `Insert node \${key} at the right end (most recently used).`
        })

        outputs.push(cache[key].val)
        steps.push({
          phase: `cmd_\${i}_return`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 26, message: `Return value \${cache[key].val}.`
        })
      } else {
        outputs.push(-1)
        steps.push({
          phase: `cmd_\${i}_notfound`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 27, message: `Key \${key} not found. Return -1.`
        })
      }
    } else if (cmd === 'put') {
      const key = args[0]
      const val = args[1]

      steps.push({
        phase: `cmd_\${i}_check`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
        activeLine: 30, message: `Check if key \${key} is already in cache.`
      })

      if (key in cache) {
        list = list.filter(k => k !== key)
        steps.push({
          phase: `cmd_\${i}_remove_exist`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 31, message: `Key \${key} exists. Remove existing node from the list.`
        })
      }

      cache[key] = { key, val }
      steps.push({
        phase: `cmd_\${i}_create`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
        activeLine: 32, message: `Create new Node(\${key}, \${val}) and store in cache dictionary.`
      })

      list.push(key)
      steps.push({
        phase: `cmd_\${i}_insert`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
        activeLine: 33, message: `Insert new node at the right end (most recently used).`
      })

      steps.push({
        phase: `cmd_\${i}_check_cap`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
        activeLine: 35, message: `Check if cache size (\${Object.keys(cache).length}) > capacity (\${capacity}).`
      })

      if (Object.keys(cache).length > capacity) {
        const lruKey = list[0]
        steps.push({
          phase: `cmd_\${i}_lru`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 36, message: `Cache is full. Identify the least recently used node (leftmost node: key \${lruKey}).`
        })

        list.shift()
        steps.push({
          phase: `cmd_\${i}_remove_lru`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 37, message: `Remove LRU node from the linked list.`
        })

        delete cache[lruKey]
        steps.push({
          phase: `cmd_\${i}_del_lru`, cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs], currCmd: cmd, currArgs: args, cmdIndex: i,
          activeLine: 38, message: `Delete key \${lruKey} from the cache dictionary.`
        })
      }

      outputs.push(null)
      // Done with put
    }
  }

  steps.push({
    phase: 'done', cache: JSON.parse(JSON.stringify(cache)), list: [...list], capacity, outputs: [...outputs],
    activeLine: 6, message: 'All commands executed successfully.'
  })

  return steps
}

const EXAMPLES = [
  {
    label: 'Classic 146',
    commands: ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"],
    argsList: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
  },
  {
    label: 'Overwrite',
    commands: ["LRUCache", "put", "put", "put", "get"],
    argsList: [[2], [2, 1], [2, 2], [2, 3], [2]]
  },
  {
    label: 'Capacity 1',
    commands: ["LRUCache", "put", "get", "put", "get", "get"],
    argsList: [[1], [2, 1], [2], [3, 2], [2], [3]]
  },
]

export default function LRUCacheVisualizer() {
  const [commandsInput, setCommandsInput] = useState('["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]')
  const [argsInput, setArgsInput] = useState('[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]')
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

  const { commands, argsList, inputError } = useMemo(() => {
    try {
      const cmds = JSON.parse(commandsInput)
      const args = JSON.parse(argsInput)
      if (!Array.isArray(cmds) || !Array.isArray(args) || cmds.length !== args.length) {
        throw new Error('Commands and arguments must be arrays of equal length.')
      }
      return { commands: cmds, argsList: args, inputError: '' }
    } catch (e) {
      return {
        commands: ["LRUCache", "put", "put", "get", "put"],
        argsList: [[2], [1, 1], [2, 2], [1], [3, 3]],
        inputError: e.message || 'Invalid JSON format'
      }
    }
  }, [commandsInput, argsInput])

  const steps = useMemo(() => generateSteps(commands, argsList), [commands, argsList])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setCommandsInput(JSON.stringify(ex.commands))
    setArgsInput(JSON.stringify(ex.argsList))
    handleReset()
  }, [handleReset])

  return (
    <div className="lru-shell">
      <div className="lru-top">
        <div className="lru-panel" style={{ flex: 1 }}>
          <div className="lru-panel-head">
            Sequence Commands
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="lru-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="lru-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>commands</span>
                <input
                  value={commandsInput}
                  onChange={(e) => { setCommandsInput(e.target.value); handleReset() }}
                  className="lru-input"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>args</span>
                <input
                  value={argsInput}
                  onChange={(e) => { setArgsInput(e.target.value); handleReset() }}
                  className="lru-input"
                />
              </div>
            </div>

            <div className="lru-commands-list">
              {commands.map((cmd, i) => {
                const isActive = step?.cmdIndex === i
                const isPassed = step?.cmdIndex > i || step?.phase === 'done'
                const output = step?.outputs?.[i]

                return (
                  <div key={i} className={`lru-cmd-item \${isActive ? 'active' : ''} \${isPassed ? 'passed' : ''}`}>
                    <span className="lru-cmd-idx">{i}</span>
                    <span className="lru-cmd-name">{cmd}</span>
                    <span className="lru-cmd-args">({argsList[i].join(', ')})</span>
                    <span className="lru-cmd-output">
                      {output !== undefined ? `→ \${output === null ? 'null' : output}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lru-panel" style={{ flex: 1.5 }}>
          <div className="lru-panel-head">Doubly Linked List & Hash Map</div>
          <div className="lru-panel-body lru-visuals">

            {/* Linked List visualization */}
            <div className="lru-list-container">
              <span className="lru-section-title">
                Doubly Linked List (Left=LRU, Right=MRU)
              </span>
              <div className="lru-list-track">
                <div className="lru-dummy-node">LEFT</div>

                <AnimatePresence mode="popLayout">
                  {step?.list?.map((key, index) => {
                    const node = step.cache[key]
                    if (!node) return null
                    const isNew = step.phase === `cmd_\${step.cmdIndex}_create` || step.phase === `cmd_\${step.cmdIndex}_insert`
                    const isActive = step.currArgs?.[0] === key

                    return (
                      <motion.div
                        key={key}
                        layout
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`lru-node \${isActive ? 'active' : ''}`}
                      >
                        <div className="lru-node-key">{node.key}</div>
                        <div className="lru-node-val">{node.val}</div>
                        {/* Connector to next */}
                        <div className="lru-node-connector" />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                <div className="lru-dummy-node right">RIGHT</div>
              </div>
            </div>

            {/* Hash Map visualization */}
            <div className="lru-map-container">
              <div className="lru-map-header">
                <span className="lru-section-title">Hash Map (self.cache)</span>
                <span className="lru-capacity-badge">
                  Size: {Object.keys(step?.cache || {}).length} / {step?.capacity || 0}
                </span>
              </div>
              <div className="lru-map-grid">
                <AnimatePresence>
                  {step && Object.entries(step.cache).map(([keyStr, node]) => {
                    const key = Number(keyStr)
                    const isActive = step.currArgs?.[0] === key
                    const isDeleting = step.phase.includes('remove') && step.currArgs?.[0] === key

                    return (
                      <motion.div
                        key={`map-\${key}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, backgroundColor: '#ef4444' }}
                        className={`lru-map-entry \${isActive ? 'active' : ''}`}
                      >
                        <span className="lru-map-key">{key}</span>
                        <span className="lru-map-arrow">→</span>
                        <span className="lru-map-ptr">Node({node.key}, {node.val})</span>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {(!step || Object.keys(step.cache).length === 0) && (
                  <span style={{ color: '#475569', fontStyle: 'italic', fontSize: 13, padding: 8 }}>Cache is empty</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="lru-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      </div>

      <div className={`lru-status \${step?.phase?.includes('return') ? 'success' : step?.phase?.includes('notfound') || step?.phase?.includes('lru') ? 'fail' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="lru-dock">
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
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
        />
      </div>

      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  )
}
