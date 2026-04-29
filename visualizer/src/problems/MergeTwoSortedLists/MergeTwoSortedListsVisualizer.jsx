import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './MergeTwoSortedListsVisualizer.css'

// ─── Solution code ────────────────────────────────────────────────────────────
const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution(object):' },
  { line: 2,  text: '    def mergeTwoLists(self, list1, list2):' },
  { line: 3,  text: '        dummy = ListNode(0)' },
  { line: 4,  text: '        curr = dummy' },
  { line: 5,  text: '        while list1 and list2:' },
  { line: 6,  text: '            if list1.val <= list2.val:' },
  { line: 7,  text: '                curr.next = list1' },
  { line: 8,  text: '                list1 = list1.next' },
  { line: 9,  text: '            else:' },
  { line: 10, text: '                curr.next = list2' },
  { line: 11, text: '                list2 = list2.next' },
  { line: 12, text: '            curr = curr.next' },
  { line: 13, text: '        curr.next = list1 or list2' },
  { line: 14, text: '        return dummy.next' },
]

// ─── Step generator ───────────────────────────────────────────────────────────
function generateSteps(arr1, arr2) {
  const steps = []
  let i1 = 0, i2 = 0
  const merged = []

  steps.push({
    phase: 'init',
    i1, i2, merged: [],
    activeLine: 3,
    message: 'Create dummy node, curr points to it.',
  })

  while (i1 < arr1.length && i2 < arr2.length) {
    const v1 = arr1[i1], v2 = arr2[i2]

    steps.push({
      phase: 'compare',
      i1, i2, merged: [...merged],
      v1, v2,
      activeLine: 6,
      message: `Compare list1.val=${v1} and list2.val=${v2}`,
    })

    if (v1 <= v2) {
      merged.push({ val: v1, src: 1 })
      steps.push({
        phase: 'pick1',
        i1, i2, merged: [...merged],
        activeLine: 7,
        message: `${v1} ≤ ${v2}: append ${v1} from list1, advance list1`,
      })
      i1++
    } else {
      merged.push({ val: v2, src: 2 })
      steps.push({
        phase: 'pick2',
        i1, i2, merged: [...merged],
        activeLine: 10,
        message: `${v2} < ${v1}: append ${v2} from list2, advance list2`,
      })
      i2++
    }
  }

  // append remainder
  while (i1 < arr1.length) {
    merged.push({ val: arr1[i1], src: 1 })
    i1++
  }
  while (i2 < arr2.length) {
    merged.push({ val: arr2[i2], src: 2 })
    i2++
  }

  steps.push({
    phase: 'done',
    i1: arr1.length,
    i2: arr2.length,
    merged: [...merged],
    activeLine: 14,
    message: `Done! Merged: [${merged.map((n) => n.val).join(' → ')}]`,
  })
  return steps
}

// ─── Examples ─────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: 'Basic',    l1: [1, 2, 4], l2: [1, 3, 4] },
  { label: 'One empty', l1: [], l2: [0] },
  { label: 'Both empty', l1: [], l2: [] },
  { label: 'Longer',   l1: [1, 3, 5, 7], l2: [2, 4, 6, 8] },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function MergeTwoSortedListsVisualizer() {
  const [l1Input, setL1Input] = useState('[1, 2, 4]')
  const [l2Input, setL2Input] = useState('[1, 3, 4]')
  const { arr1, arr2, inputError } = useMemo(() => {
    try {
      const a1 = JSON.parse(l1Input)
      const a2 = JSON.parse(l2Input)
      if (!Array.isArray(a1) || !Array.isArray(a2)) throw new Error()
      return { arr1: a1, arr2: a2, inputError: '' }
    } catch {
      return { arr1: [1, 2, 4], arr2: [1, 3, 4], inputError: 'Invalid list' }
    }
  }, [l1Input, l2Input])

  const steps = useMemo(() => generateSteps(arr1, arr2), [arr1, arr2])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setL1Input(JSON.stringify(ex.l1))
    setL2Input(JSON.stringify(ex.l2))
    handleReset()
  }, [handleReset])

  function node1State(idx) {
    if (!step) return 'idle'
    if (step.phase === 'done' || idx < step.i1) return 'used'
    if (idx === step.i1) return 'active'
    return 'idle'
  }

  function node2State(idx) {
    if (!step) return 'idle'
    if (step.phase === 'done' || idx < step.i2) return 'used'
    if (idx === step.i2) return 'active'
    return 'idle'
  }

  return (
    <div className="ml-shell">
      {/* ── top: lists ── */}
      <div className="ml-top">
        {/* examples + inputs */}
        <div className="ml-panel">
          <div className="ml-panel-head">
            Input Lists
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="ml-badge" style={{ background: '#1e293b', color: '#93c5fd' }}>Linked List</span>
          </div>
          <div className="ml-panel-body">
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
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>list1</span>
              <input value={l1Input} onChange={(e) => { setL1Input(e.target.value); handleReset() }}
                style={{ flex: 1, padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13 }} />
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>list2</span>
              <input value={l2Input} onChange={(e) => { setL2Input(e.target.value); handleReset() }}
                style={{ flex: 1, padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13 }} />
            </div>

            {/* list1 nodes */}
            <div style={{ marginBottom: 6, fontSize: 11, color: '#64748b' }}>list1</div>
            <div className="ml-list-row">
              {arr1.length === 0
                ? <span style={{ color: '#475569', fontSize: 12 }}>null</span>
                : arr1.map((val, idx) => (
                  <div className="ml-node" key={idx}>
                    <motion.div
                      className={`ml-node-box ${node1State(idx)}`}
                      animate={{ scale: node1State(idx) === 'active' ? 1.12 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    >{val}</motion.div>
                    {idx < arr1.length - 1 && <div className="ml-arrow">→</div>}
                  </div>
                ))
              }
            </div>

            {/* list2 nodes */}
            <div style={{ marginTop: 12, marginBottom: 6, fontSize: 11, color: '#64748b' }}>list2</div>
            <div className="ml-list-row">
              {arr2.length === 0
                ? <span style={{ color: '#475569', fontSize: 12 }}>null</span>
                : arr2.map((val, idx) => (
                  <div className="ml-node" key={idx}>
                    <motion.div
                      className={`ml-node-box ${node2State(idx)}`}
                      animate={{ scale: node2State(idx) === 'active' ? 1.12 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    >{val}</motion.div>
                    {idx < arr2.length - 1 && <div className="ml-arrow">→</div>}
                  </div>
                ))
              }
            </div>

            {/* Merged output */}
            {step && step.merged.length > 0 && (
              <>
                <div style={{ marginTop: 14, marginBottom: 6, fontSize: 11, color: '#22c55e' }}>merged</div>
                <div className="ml-merged-row">
                  {step.merged.map((node, idx) => {
                    const isLatest = idx === step.merged.length - 1 && step.phase !== 'done'
                    return (
                      <div className="ml-merged-node" key={idx}>
                        <motion.div
                          className={`ml-merged-box${isLatest ? ' latest' : ''}`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >{node.val}</motion.div>
                        {idx < step.merged.length - 1 && <div className="ml-arrow" style={{ color: '#22c55e' }}>→</div>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── middle: code + vars ── */}
      <div className="ml-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
        <div className="ml-panel">
          <div className="ml-panel-head">Variables</div>
          <div className="ml-panel-body">
            <div className="ml-vars">
              <div className="ml-var-row">
                <span className="ml-var-name">list1 ptr</span>
                <span className="ml-var-val">{step ? (step.i1 < arr1.length ? `val=${arr1[step.i1]}` : 'null') : '–'}</span>
              </div>
              <div className="ml-var-row">
                <span className="ml-var-name">list2 ptr</span>
                <span className="ml-var-val">{step ? (step.i2 < arr2.length ? `val=${arr2[step.i2]}` : 'null') : '–'}</span>
              </div>
              <div className="ml-var-row">
                <span className="ml-var-name">merged len</span>
                <span className="ml-var-val">{step?.merged?.length ?? '–'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── status ── */}
      <div className={`ml-status${step?.phase === 'done' ? ' done' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      {/* ── dock ── */}
      <div className="ml-dock">
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
          onSpeedChange={setSpeed}
        />
      </div>
    </div>
  )
}
