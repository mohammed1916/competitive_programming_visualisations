import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './KthLargestElementVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def findKthLargest(self, nums, k):' },
  { line: 3, text: '        heap = []' },
  { line: 4, text: '        for n in nums:' },
  { line: 5, text: '            heappush(heap, n)' },
  { line: 6, text: '            if len(heap) > k:' },
  { line: 7, text: '                heappop(heap)' },
  { line: 8, text: '        return heap[0]' },
]

function parseArray(input) {
  const parsed = JSON.parse(input)
  if (!Array.isArray(parsed)) throw new Error('nums must be array')
  return parsed.map(Number)
}

function generateSteps(nums, k) {
  const steps = []
  const heap = []
  steps.push({ phase: 'init', activeLine: 3, nums, k, heap: [...heap], i: -1, val: null, message: `Build min-heap of size k=${k}.` })
  for (let i = 0; i < nums.length; i++) {
    const val = nums[i]
    heap.push(val)
    heap.sort((a, b) => a - b)
    steps.push({ phase: 'push', activeLine: 5, nums, k, heap: [...heap], i, val, message: `Push ${val}.` })
    if (heap.length > k) {
      const removed = heap.shift()
      steps.push({ phase: 'pop', activeLine: 7, nums, k, heap: [...heap], i, val, removed, message: `Heap size > k, pop ${removed}.` })
    }
  }
  steps.push({ phase: 'done', activeLine: 8, nums, k, heap: [...heap], i: nums.length - 1, val: null, message: `kth largest = ${heap[0]}.` })
  return steps
}

const EXAMPLES = [
  { label: 'Example 1', nums: [3, 2, 1, 5, 6, 4], k: 2 },
  { label: 'Example 2', nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 },
  { label: 'Small', nums: [7, 10, 4, 3, 20, 15], k: 3 },
]

export default function KthLargestElementVisualizer() {
  const [numsInput, setNumsInput] = useState('[3,2,1,5,6,4]')
  const [kInput, setKInput] = useState('2')
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

  const { nums, k, inputError } = useMemo(() => {
    try {
      const arr = parseArray(numsInput)
      const kv = Number(kInput)
      if (!Number.isInteger(kv) || kv < 1 || kv > arr.length) throw new Error('k must be between 1 and len(nums)')
      return { nums: arr, k: kv, inputError: '' }
    } catch (e) {
      return { nums: [3, 2, 1, 5, 6, 4], k: 2, inputError: e.message || 'Invalid input' }
    }
  }, [numsInput, kInput])

  const steps = useMemo(() => generateSteps(nums, k), [nums, k])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    setKInput(String(ex.k))
    handleReset()
  }, [handleReset])

  return (
    <div className="kl-shell">
      <div className="kl-top">
        <section className="kl-panel">
          <header className="kl-head"><span>Heap Evolution</span>{inputError && <span className="kl-error">{inputError}</span>}</header>
          <div className="kl-body">
            <div className="kl-examples">{EXAMPLES.map((ex) => <button key={ex.label} className="kl-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}</div>
            <div className="kl-inputs">
              <input className="kl-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />
              <input className="kl-input small" value={kInput} onChange={(e) => { setKInput(e.target.value); handleReset() }} />
            </div>
            <div className="kl-stream">
              {nums.map((v, i) => <motion.div key={`${v}-${i}`} className={`kl-num ${step?.i === i ? 'active' : ''}`} animate={step?.i === i ? { y: -5 } : { y: 0 }}>{v}</motion.div>)}
            </div>
          </div>
        </section>
        <section className="kl-panel side">
          <header className="kl-head"><span>Min-Heap (size k)</span></header>
          <div className="kl-body">
            <div className="kl-heap">{(step?.heap || []).map((v, i) => <div key={`${v}-${i}`} className={`kl-node ${i === 0 ? 'root' : ''}`}>{v}</div>)}</div>
            <div className={`kl-result ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.phase === 'done' ? `Return ${step.heap[0]}` : `Current kth candidate: ${step?.heap?.[0] ?? '—'}`}</div>
            <div className="kl-status">{step?.message || 'Press Play.'}</div>
          </div>
        </section>
      </div>
      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
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
      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  )
}
