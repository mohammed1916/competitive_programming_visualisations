import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './MergeTwoSortedListsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def mergeTwoLists(self, list1, list2):' },
  { line: 3, text: '        dummy = ListNode()' },
  { line: 4, text: '        tail = dummy' },
  { line: 5, text: '        ' },
  { line: 6, text: '        while list1 and list2:' },
  { line: 7, text: '            if list1.val < list2.val:' },
  { line: 8, text: '                tail.next = list1' },
  { line: 9, text: '                list1 = list1.next' },
  { line: 10, text: '            else:' },
  { line: 11, text: '                tail.next = list2' },
  { line: 12, text: '                list2 = list2.next' },
  { line: 13, text: '            tail = tail.next' },
  { line: 14, text: '            ' },
  { line: 15, text: '        if list1:' },
  { line: 16, text: '            tail.next = list1' },
  { line: 17, text: '        elif list2:' },
  { line: 18, text: '            tail.next = list2' },
  { line: 19, text: '            ' },
  { line: 20, text: '        return dummy.next' },
]

function generateSteps(arr1, arr2) {
  const steps = []

  let l1 = 0
  let l2 = 0

  // The merged list stores indices or values. We can store { from: 'l1'/'l2', idx: number, val: number }
  const merged = []

  steps.push({
    phase: 'init', l1, l2, merged: [...merged],
    activeLine: 4, message: 'Initialize dummy node and set tail = dummy.'
  })

  while (l1 < arr1.length && l2 < arr2.length) {
    steps.push({
      phase: 'while_check', l1, l2, merged: [...merged],
      activeLine: 6, message: `Check if list1 (\${l1 < arr1.length ? 'not empty' : 'empty'}) and list2 (\${l2 < arr2.length ? 'not empty' : 'empty'}).`
    })

    const val1 = arr1[l1]
    const val2 = arr2[l2]

    steps.push({
      phase: 'compare', l1, l2, merged: [...merged],
      activeLine: 7, message: `Compare list1.val (\${val1}) with list2.val (\${val2}).`
    })

    if (val1 < val2) {
      merged.push({ from: 'l1', idx: l1, val: val1 })
      steps.push({
        phase: 'append_l1', l1, l2, merged: [...merged],
        activeLine: 8, message: `\${val1} < \${val2}, so tail.next = list1.`
      })
      l1++
      steps.push({
        phase: 'advance_l1', l1, l2, merged: [...merged],
        activeLine: 9, message: `Advance list1 to next node.`
      })
    } else {
      merged.push({ from: 'l2', idx: l2, val: val2 })
      steps.push({
        phase: 'append_l2', l1, l2, merged: [...merged],
        activeLine: 11, message: `\${val1} >= \${val2}, so tail.next = list2.`
      })
      l2++
      steps.push({
        phase: 'advance_l2', l1, l2, merged: [...merged],
        activeLine: 12, message: `Advance list2 to next node.`
      })
    }

    steps.push({
      phase: 'advance_tail', l1, l2, merged: [...merged],
      activeLine: 13, message: 'Advance tail = tail.next.'
    })
  }

  steps.push({
    phase: 'while_end', l1, l2, merged: [...merged],
    activeLine: 6, message: 'One of the lists is empty. Exit loop.'
  })

  steps.push({
    phase: 'check_rem_l1', l1, l2, merged: [...merged],
    activeLine: 15, message: `Check if list1 has remaining nodes (\${l1 < arr1.length}).`
  })

  if (l1 < arr1.length) {
    while (l1 < arr1.length) {
      merged.push({ from: 'l1', idx: l1, val: arr1[l1] })
      l1++
    }
    steps.push({
      phase: 'append_rem_l1', l1, l2, merged: [...merged],
      activeLine: 16, message: 'Append remaining nodes of list1 to tail.'
    })
  } else {
    steps.push({
      phase: 'check_rem_l2', l1, l2, merged: [...merged],
      activeLine: 17, message: `Check if list2 has remaining nodes (\${l2 < arr2.length}).`
    })

    if (l2 < arr2.length) {
      while (l2 < arr2.length) {
        merged.push({ from: 'l2', idx: l2, val: arr2[l2] })
        l2++
      }
      steps.push({
        phase: 'append_rem_l2', l1, l2, merged: [...merged],
        activeLine: 18, message: 'Append remaining nodes of list2 to tail.'
      })
    }
  }

  steps.push({
    phase: 'done', l1, l2, merged: [...merged],
    activeLine: 20, message: 'Return dummy.next (head of merged list).'
  })

  return steps
}

const EXAMPLES = [
  { label: 'Standard', list1: [1, 2, 4], list2: [1, 3, 4] },
  { label: 'Different Sizes', list1: [1, 2, 4, 8, 9], list2: [3, 5] },
  { label: 'Empty List1', list1: [], list2: [0] },
  { label: 'Both Empty', list1: [], list2: [] },
]

export default function MergeTwoSortedListsVisualizer() {
  const [l1Input, setL1Input] = useState('[1, 2, 4]')
  const [l2Input, setL2Input] = useState('[1, 3, 4]')

  const { list1, list2, inputError } = useMemo(() => {
    try {
      let arr1 = JSON.parse(l1Input)
      let arr2 = JSON.parse(l2Input)
      if (!Array.isArray(arr1) || !Array.isArray(arr2)) throw new Error('Both inputs must be arrays')
      arr1 = arr1.map(Number).sort((a, b) => a - b)
      arr2 = arr2.map(Number).sort((a, b) => a - b)
      return { list1: arr1, list2: arr2, inputError: '' }
    } catch (e) {
      return { list1: [1, 2, 4], list2: [1, 3, 4], inputError: 'Invalid input. Using default.' }
    }
  }, [l1Input, l2Input])

  const steps = useMemo(() => generateSteps(list1, list2), [list1, list2])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setL1Input(JSON.stringify(ex.list1))
    setL2Input(JSON.stringify(ex.list2))
    handleReset()
  }, [handleReset])

  return (
    <div className="mtsl-shell">
      <div className="mtsl-top">
        <div className="mtsl-panel" style={{ flex: 1.5 }}>
          <div className="mtsl-panel-head">
            Linked Lists
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="mtsl-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="mtsl-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <span style={{ color: '#f43f5e', fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold' }}>list1=</span>
              <input
                value={l1Input}
                onChange={(e) => { setL1Input(e.target.value); handleReset() }}
                placeholder="[1, 2, 4]"
                className="mtsl-input"
                style={{ flex: 1, margin: 0, borderColor: 'rgba(244, 63, 94, 0.3)' }}
              />
              <span style={{ color: '#0ea5e9', fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold' }}>list2=</span>
              <input
                value={l2Input}
                onChange={(e) => { setL2Input(e.target.value); handleReset() }}
                placeholder="[1, 3, 4]"
                className="mtsl-input"
                style={{ flex: 1, margin: 0, borderColor: 'rgba(14, 165, 233, 0.3)' }}
              />
            </div>

            <div className="mtsl-lists-container">
              {/* List 1 */}
              <div className="mtsl-list-row">
                <div className="mtsl-list-label" style={{ color: '#f43f5e' }}>list1</div>
                <div className="mtsl-list-nodes">
                  {list1.map((val, idx) => {
                    const isProcessed = step?.merged?.some(m => m.from === 'l1' && m.idx === idx)
                    const isCurrent = step?.l1 === idx
                    const isComparing = step?.phase === 'compare' && isCurrent

                    let cellClass = "mtsl-node l1 "
                    if (isProcessed) cellClass += "processed "
                    if (isCurrent && !isProcessed) cellClass += "current "
                    if (isComparing) cellClass += "comparing "

                    return (
                      <div key={`l1-\${idx}`} className="mtsl-node-wrapper">
                        <div className={cellClass}>
                          {val}
                        </div>
                        {idx < list1.length - 1 && <div className={`mtsl-node-arrow \${isProcessed ? 'processed' : ''}`}>→</div>}
                      </div>
                    )
                  })}
                  {list1.length === 0 && <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 12 }}>null</span>}
                  {step?.l1 >= list1.length && list1.length > 0 && <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 12, marginLeft: 8 }}>null</span>}
                </div>
              </div>

              {/* List 2 */}
              <div className="mtsl-list-row">
                <div className="mtsl-list-label" style={{ color: '#0ea5e9' }}>list2</div>
                <div className="mtsl-list-nodes">
                  {list2.map((val, idx) => {
                    const isProcessed = step?.merged?.some(m => m.from === 'l2' && m.idx === idx)
                    const isCurrent = step?.l2 === idx
                    const isComparing = step?.phase === 'compare' && isCurrent

                    let cellClass = "mtsl-node l2 "
                    if (isProcessed) cellClass += "processed "
                    if (isCurrent && !isProcessed) cellClass += "current "
                    if (isComparing) cellClass += "comparing "

                    return (
                      <div key={`l2-\${idx}`} className="mtsl-node-wrapper">
                        <div className={cellClass}>
                          {val}
                        </div>
                        {idx < list2.length - 1 && <div className={`mtsl-node-arrow \${isProcessed ? 'processed' : ''}`}>→</div>}
                      </div>
                    )
                  })}
                  {list2.length === 0 && <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 12 }}>null</span>}
                  {step?.l2 >= list2.length && list2.length > 0 && <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 12, marginLeft: 8 }}>null</span>}
                </div>
              </div>
            </div>

            <div className="mtsl-merged-container">
              <div className="mtsl-merged-header">
                <span className="mtsl-merged-title">Merged List (dummy.next)</span>
                <span className="mtsl-tail-indicator">tail pointer →</span>
              </div>
              <div className="mtsl-list-nodes merged-area">
                <div className="mtsl-node-wrapper">
                  <div className="mtsl-node dummy">D</div>
                  {step?.merged?.length > 0 && <div className="mtsl-node-arrow">→</div>}
                </div>

                <AnimatePresence mode="popLayout">
                  {step?.merged?.map((m, idx) => {
                    const isLast = idx === step.merged.length - 1
                    const isNewlyAdded = isLast && (step.phase.startsWith('append') || step.phase.startsWith('advance_tail'))

                    return (
                      <motion.div
                        key={`merged-\${idx}-\${m.from}-\${m.idx}`}
                        layout
                        initial={{ opacity: 0, scale: 0.5, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className="mtsl-node-wrapper"
                      >
                        <div className={`mtsl-node \${m.from} \${isNewlyAdded ? 'pulse' : ''}`}>
                          {m.val}
                        </div>
                        {idx < step.merged.length - 1 && <div className="mtsl-node-arrow">→</div>}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="mtsl-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={`mtsl-status \${step?.phase === 'done' ? 'success' : step?.phase === 'compare' ? 'compare' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="mtsl-dock">
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
