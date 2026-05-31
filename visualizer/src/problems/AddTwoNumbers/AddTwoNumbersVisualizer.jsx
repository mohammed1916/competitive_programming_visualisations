import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { useProblemCode } from '../../hooks/useProblemCode'
import './AddTwoNumbersVisualizer.css'

function generateSteps(list1, list2) {
  const steps = []

  let ptr1 = 0
  let ptr2 = 0
  let carry = 0
  let res = []

  steps.push({
    phase: 'init', ptr1: null, ptr2: null, carry, res: [],
    v1: null, v2: null, val: null, sum: null,
    activeLine: 5, message: 'Initialize dummy node, curr pointer, and carry = 0.'
  })

  while (ptr1 < list1.length || ptr2 < list2.length || carry > 0) {
    steps.push({
      phase: 'check_loop', ptr1, ptr2, carry, res: [...res],
      v1: null, v2: null, val: null, sum: null,
      activeLine: 7, message: 'Check if l1, l2, or carry exists.'
    })

    const v1 = ptr1 < list1.length ? list1[ptr1] : 0
    const v2 = ptr2 < list2.length ? list2[ptr2] : 0

    steps.push({
      phase: 'get_vals', ptr1, ptr2, carry, res: [...res],
      v1, v2, val: null, sum: null,
      activeLine: 9, message: 'Get values from l1 and l2 (or 0 if null).'
    })

    const sum = v1 + v2 + carry
    steps.push({
      phase: 'sum', ptr1, ptr2, carry, res: [...res],
      v1, v2, val: null, sum,
      activeLine: 11, message: 'sum = v1 + v2 + carry = ' + sum + '.'
    })

    const newCarry = Math.floor(sum / 10)
    const val = sum % 10

    steps.push({
      phase: 'carry', ptr1, ptr2, carry: newCarry, res: [...res],
      v1, v2, val, sum, prevCarry: carry,
      activeLine: 13, message: 'New carry = ' + newCarry + ', node val = ' + val + '.'
    })

    carry = newCarry
    res.push(val)

    steps.push({
      phase: 'append', ptr1, ptr2, carry, res: [...res],
      v1, v2, val, sum,
      activeLine: 15, message: 'Append new node with val ' + val + ' to result.'
    })

    if (ptr1 < list1.length) ptr1++
    if (ptr2 < list2.length) ptr2++

    steps.push({
      phase: 'advance', ptr1, ptr2, carry, res: [...res],
      v1, v2, val, sum,
      activeLine: 19, message: 'Advance pointers l1, l2, and curr.'
    })
  }

  steps.push({
    phase: 'done', ptr1: null, ptr2: null, carry, res: [...res],
    v1: null, v2: null, val: null, sum: null,
    activeLine: 21, message: 'Return dummy.next.'
  })

  return steps
}

const EXAMPLES = [
  { label: 'Equal Length', l1: [2, 4, 3], l2: [5, 6, 4] },
  { label: 'Carry', l1: [2, 4, 9], l2: [5, 6, 4] },
  { label: 'Zeroes', l1: [0], l2: [0] },
  { label: 'Different Length', l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] },
]

export default function AddTwoNumbersVisualizer({ problem }) {
  const [l1Input, setL1Input] = useState('[2, 4, 3]')
  const [l2Input, setL2Input] = useState('[5, 6, 4]')
  const codeLines = useProblemCode(problem, 'add-two-numbers')

  const { list1, list2, inputError } = useMemo(() => {
    try {
      const parsed1 = JSON.parse(l1Input)
      const parsed2 = JSON.parse(l2Input)
      if (!Array.isArray(parsed1) || !Array.isArray(parsed2)) throw new Error()
      return { list1: parsed1.map(Number), list2: parsed2.map(Number), inputError: '' }
    } catch {
      return { list1: [2, 4, 3], list2: [5, 6, 4], inputError: 'Invalid input arrays' }
    }
  }, [l1Input, l2Input])

  const steps = useMemo(
    () =>
      generateSteps(list1, list2).map((current) => ({
        ...current,
        relatedLines:
          current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
      })),
    [list1, list2],
  )

  const {
    stepIndex, setStepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setL1Input(JSON.stringify(ex.l1))
    setL2Input(JSON.stringify(ex.l2))
    handleReset()
  }, [handleReset])

  const connectivity = useCodeVisualConnectivity({
    steps,
    stepIndex,
    onStepJump: setStepIndex,
  })

  return (
    <div className="atn-shell">
      <div className="atn-top">
        <div className="atn-panel" style={{ flex: 1.5 }}>
          <div className="atn-panel-head">
            Linked Lists
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="atn-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="atn-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>l1=</span>
              <input
                value={l1Input}
                onChange={(e) => { setL1Input(e.target.value); handleReset() }}
                placeholder="[2, 4, 3]"
                className="atn-input"
                style={{ flex: 1, margin: 0 }}
              />
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>l2=</span>
              <input
                value={l2Input}
                onChange={(e) => { setL2Input(e.target.value); handleReset() }}
                placeholder="[5, 6, 4]"
                className="atn-input"
                style={{ flex: 1, margin: 0 }}
              />
            </div>

            <div className="atn-lists-container">
              {/* L1 */}
              <div className="atn-list-row">
                <div className="atn-list-label">l1:</div>
                <div className="atn-list-nodes">
                  {list1.map((val, idx) => {
                    const isCurrent = step?.ptr1 === idx && step?.phase !== 'done'
                    const isProcessed = step?.ptr1 > idx
                    return (
                      <div key={'l1-' + idx} className="atn-node-wrapper">
                        <div className={'atn-node l1 ' + (isCurrent ? 'current' : '') + (isProcessed ? ' processed' : '')}>
                          {val}
                        </div>
                        {idx < list1.length - 1 && <div className="atn-node-arrow">→</div>}
                      </div>
                    )
                  })}
                  {list1.length === 0 && <div className="atn-node dummy">null</div>}
                </div>
              </div>

              {/* L2 */}
              <div className="atn-list-row">
                <div className="atn-list-label">l2:</div>
                <div className="atn-list-nodes">
                  {list2.map((val, idx) => {
                    const isCurrent = step?.ptr2 === idx && step?.phase !== 'done'
                    const isProcessed = step?.ptr2 > idx
                    return (
                      <div key={'l2-' + idx} className="atn-node-wrapper">
                        <div className={'atn-node l2 ' + (isCurrent ? 'current' : '') + (isProcessed ? ' processed' : '')}>
                          {val}
                        </div>
                        {idx < list2.length - 1 && <div className="atn-node-arrow">→</div>}
                      </div>
                    )
                  })}
                  {list2.length === 0 && <div className="atn-node dummy">null</div>}
                </div>
              </div>
            </div>

            {/* Merged */}
            <div className="atn-merged-container">
              <div className="atn-merged-header">
                <div className="atn-merged-title">Result List</div>
                <div className="atn-tail-indicator">curr</div>
              </div>
              <div className="atn-list-nodes merged-area">
                <div className="atn-node-wrapper">
                  <div className="atn-node dummy">dum</div>
                  {step?.res && step.res.length > 0 && <div className="atn-node-arrow">→</div>}
                </div>
                {step?.res?.map((val, idx) => {
                  const isNewlyAdded = idx === step.res.length - 1 && step.phase === 'append'
                  return (
                    <motion.div key={'res-' + idx} className="atn-node-wrapper" initial={isNewlyAdded ? { scale: 0 } : false} animate={{ scale: 1 }}>
                      <div className={'atn-node res ' + (idx === step.res.length - 1 ? 'pulse' : '')}>
                        {val}
                      </div>
                      {idx < step.res.length - 1 && <div className="atn-node-arrow">→</div>}
                    </motion.div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        <div className="atn-panel" style={{ flex: 1 }}>
          <div className="atn-panel-head">State Variables</div>
          <div className="atn-panel-body" style={{ gap: 16 }}>

            <div className="atn-var-card carry">
              <span className="atn-var-title">carry</span>
              <div className="atn-var-value">
                {step?.carry ?? 0}
              </div>
            </div>

            {step && step.v1 !== null && step.v2 !== null && (
              <div className="atn-math-box">
                <div className="atn-math-row">
                  <span>v1</span> + <span>v2</span> + <span>carry</span> = <span>sum</span>
                </div>
                <div className="atn-math-row vals">
                  <span className="val1">{step.v1}</span> +
                  <span className="val2">{step.v2}</span> +
                  <span className="val3">{step.phase === 'carry' || step.phase === 'append' || step.phase === 'advance' ? step.prevCarry : step.carry}</span> =
                  <span className="val4">{step.sum}</span>
                </div>
                {step.val !== null && (
                  <div className="atn-math-res">
                    node = {step.val}, next carry = {step.carry}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="atn-middle">
        <CodeTracePanel
          step={step}
          codeLines={codeLines}
          highlightedLines={connectivity.highlightedLines}
          onLineSelect={connectivity.handleLineSelect}
        />
      </div>

      <div className="atn-status">
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="atn-dock">
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
