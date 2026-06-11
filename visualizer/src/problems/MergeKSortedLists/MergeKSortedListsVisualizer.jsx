import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import DockableWorkspace from '../../components/shared/DockableWorkspace'
import FloatingPanel from '../../components/shared/FloatingPanel'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import './MergeKSortedListsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def mergeKLists(self, lists):' },
  { line: 3, text: '        heap = []' },
  { line: 4, text: '        for i, head in enumerate(lists):' },
  { line: 5, text: '            if head: heappush(heap, (head.val, i, head))' },
  { line: 6, text: '        dummy = ListNode(0)' },
  { line: 7, text: '        tail = dummy' },
  { line: 8, text: '        while heap:' },
  { line: 9, text: '            val, i, node = heappop(heap)' },
  { line: 10, text: '            tail.next = node; tail = tail.next' },
  { line: 11, text: '            if node.next: heappush(heap, (node.next.val, i, node.next))' },
  { line: 12, text: '        return dummy.next' },
]

function parseLists(input) {
  const parsed = JSON.parse(input)
  if (!Array.isArray(parsed)) throw new Error('Input must be list of lists')
  return parsed.map((lst) => {
    if (!Array.isArray(lst)) throw new Error('Each list must be an array')
    return lst.map(Number)
  })
}

function generateSteps(lists) {
  const pointers = Array(lists.length).fill(0)
  const heap = []
  const merged = []
  const steps = []

  for (let i = 0; i < lists.length; i++) {
    if (lists[i].length) heap.push({ val: lists[i][0], listIdx: i, pos: 0 })
  }
  heap.sort((a, b) => a.val - b.val)
  steps.push({ phase: 'init', activeLine: 5, lists, pointers: [...pointers], heap: [...heap], merged: [...merged], popped: null, message: `Initialize heap with ${heap.length} list heads.` })

  while (heap.length) {
    heap.sort((a, b) => a.val - b.val)
    const top = heap.shift()
    merged.push(top.val)
    pointers[top.listIdx] = top.pos + 1
    steps.push({
      phase: 'pop',
      activeLine: 10,
      lists,
      pointers: [...pointers],
      heap: [...heap],
      merged: [...merged],
      popped: top,
      message: `Pop ${top.val} from list ${top.listIdx}, append to merged output.`,
    })
    const nextPos = top.pos + 1
    if (nextPos < lists[top.listIdx].length) {
      heap.push({ val: lists[top.listIdx][nextPos], listIdx: top.listIdx, pos: nextPos })
      steps.push({
        phase: 'push_next',
        activeLine: 11,
        lists,
        pointers: [...pointers],
        heap: [...heap].sort((a, b) => a.val - b.val),
        merged: [...merged],
        popped: top,
        message: `Push next value ${lists[top.listIdx][nextPos]} from list ${top.listIdx}.`,
      })
    }
  }

  steps.push({ phase: 'done', activeLine: 12, lists, pointers: [...pointers], heap: [], merged: [...merged], popped: null, message: `Finished merge: [${merged.join(', ')}].` })
  return steps
}

const EXAMPLES = [
  { label: 'Classic', lists: [[1, 4, 5], [1, 3, 4], [2, 6]] },
  { label: 'Uneven', lists: [[1, 10], [2, 3, 4], [5], [6, 7, 8, 9]] },
]

// Visualization component for the k lists and heap state
function HeapVisualizationPanel({ step, lists, inputError, input, onInputChange, onApplyExample }) {
  return (
    <div className="mk-body">
      <div className="mk-examples">{EXAMPLES.map((ex) => <button key={ex.label} className="mk-chip" onClick={() => onApplyExample(ex)}>{ex.label}</button>)}</div>
      {inputError ? (
        <>
          <input className="mk-input" value={input} onChange={onInputChange} />
          <div className="mk-error-box">{inputError}</div>
        </>
      ) : (
        <>
          <input className="mk-input" value={input} onChange={onInputChange} />
          <div className="mk-row-group">
            <div className="mk-row-label-title">Input Lists</div>
            {(step?.lists || lists).map((list, li) => (
              <div key={li} className="mk-row">
                <span className="mk-row-label">L{li}</span>
                {list.map((v, i) => <motion.div key={`${li}-${i}-${v}`} className={`mk-cell ${(step?.pointers?.[li] ?? 0) === i ? 'ptr' : ''}`}>{v}</motion.div>)}
              </div>
            ))}
          </div>
          <div className="mk-row-group">
            <div className="mk-row-label-title">Heap State</div>
            <div className="mk-heap">{(step?.heap || []).map((h, i) => <div key={`${h.listIdx}-${h.pos}-${i}`} className="mk-heap-item">{h.val} <small>L{h.listIdx}</small></div>)}</div>
          </div>
          <div className="mk-row-group">
            <div className="mk-row-label-title">Merged Output</div>
            <div className="mk-merged">{(step?.merged || []).map((v, i) => <span key={`${v}-${i}`}>{v}</span>)}</div>
          </div>
          <div className="mk-status">{step?.message || 'Press Play.'}</div>
        </>
      )}
    </div>
  )
}

export default function MergeKSortedListsVisualizer() {
  const [input, setInput] = useState('[[1,4,5],[1,3,4],[2,6]]')
  const { lists, inputError } = useMemo(() => {
    try {
      return { lists: parseLists(input), inputError: '' }
    } catch (e) {
      return { lists: [[1, 4, 5], [1, 3, 4], [2, 6]], inputError: e.message || 'Invalid input' }
    }
  }, [input])

  const steps = useMemo(() => generateSteps(lists), [lists])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null
  const applyExample = useCallback((ex) => { setInput(JSON.stringify(ex.lists)); handleReset() }, [handleReset])
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()
  const [autoScrollCode, setAutoScrollCode] = useAutoScroll()

  const handleInputChange = (e) => {
    setInput(e.target.value)
    handleReset()
  }

  const dockPanels = [
    {
      id: 'viz',
      title: 'Heap Visualization',
      subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : 'Press play to start.',
      defaultZone: 'left',
      content: (
        <HeapVisualizationPanel
          step={step}
          lists={lists}
          inputError={inputError}
          input={input}
          onInputChange={handleInputChange}
          onApplyExample={applyExample}
        />
      ),
    },
    {
      id: 'code',
      title: 'Code Trace',
      subtitle: step ? `Active line ${step.activeLine}` : 'Line-by-line solution view.',
      defaultZone: 'right',
      content: (
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          onActiveLineDomChange={setActiveLineDom}
          autoScroll={autoScrollCode}
        />
      ),
    },
  ]

  return (
    <div className="mk-shell">
      <DockableWorkspace
        title="Merge K Sorted Lists Workspace"
        panels={dockPanels}
        initialLayout={{
          rows: [['viz', 'code']],
          minimized: [],
        }}
      />

      <FloatingPanel title="Playback Controls">
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
          speedIndicator={`${speed}ms`}
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
          autoScroll={autoScrollCode}
          onAutoScrollChange={setAutoScrollCode}
          autoScrollLabel="Auto-scroll code"
          showAutoScroll
        />
      </FloatingPanel>

      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  )
}
