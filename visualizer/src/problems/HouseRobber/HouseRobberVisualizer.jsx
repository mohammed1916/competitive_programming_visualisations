import { useState, useMemo } from 'react'
import VisualizerPlaybackSection from '../../components/VisualizerPlaybackSection'
import AnimatedIterationList from '../../components/shared/AnimatedIterationList'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { useProblemCode } from '../../hooks/useProblemCode'
import { useParsedInput } from '../../hooks/useParsedInput'
import { useApplyExample } from '../../hooks/useApplyExample'
import './HouseRobberVisualizer.css'

function parseNums(input) {
  const parsed = JSON.parse(input)
  if (!Array.isArray(parsed)) throw new Error('Input must be an array')
  return parsed.map((n) => {
    const v = Number(n)
    if (Number.isNaN(v) || v < 0) throw new Error('Values must be non-negative numbers')
    return v
  })
}

function generateSteps(nums) {
  const steps = []
  if (!nums.length) {
    return [{ phase: 'done', activeLine: 3, i: -1, nums, prev2: 0, prev1: 0, take: 0, skip: 0, curr: 0, message: 'Empty list. Return 0.' }]
  }

  let prev2 = 0
  let prev1 = 0
  steps.push({ phase: 'init', activeLine: 5, i: -1, nums, prev2, prev1, take: 0, skip: 0, curr: 0, picked: [], message: 'Initialize rolling DP states prev2 and prev1 to 0.' })

  for (let i = 0; i < nums.length; i++) {
    const money = nums[i]
    const take = prev2 + money
    const skip = prev1
    const curr = Math.max(take, skip)
    steps.push({
      phase: 'calc',
      activeLine: 9,
      i,
      nums,
      prev2,
      prev1,
      take,
      skip,
      curr,
      picked: [],
      message: `House ${i}: take=${prev2}+${money}=${take}, skip=${skip}, curr=max=${curr}.`,
    })
    prev2 = prev1
    prev1 = curr
    steps.push({
      phase: 'advance',
      activeLine: 11,
      i,
      nums,
      prev2,
      prev1,
      take,
      skip,
      curr,
      picked: [],
      message: `Shift window: prev2=${prev2}, prev1=${prev1}.`,
    })
  }

  steps.push({
    phase: 'done',
    activeLine: 12,
    i: nums.length - 1,
    nums,
    prev2,
    prev1,
    take: 0,
    skip: 0,
    curr: prev1,
    picked: [],
    message: `Maximum robbed amount = ${prev1}.`,
  })
  return steps
}

const EXAMPLES = [
  { label: 'Basic', nums: [1, 2, 3, 1] },
  { label: 'LeetCode', nums: [2, 7, 9, 3, 1] },
  { label: 'Alternating', nums: [6, 1, 6, 1, 6] },
  { label: 'Large Peaks', nums: [2, 1, 1, 9, 1, 1, 8] },
]

const SNIPPETS = [
  { id: 'init', label: 'Initialize', lines: [3, 4, 5] },
  { id: 'iterate', label: 'Evaluate House', lines: [6, 7, 8, 9] },
  { id: 'shift', label: 'Shift State', lines: [10, 11] },
  { id: 'return', label: 'Return', lines: [12] },
]

function snippetIdForPhase(phase) {
  if (phase === 'init') return 'init'
  if (phase === 'calc') return 'iterate'
  if (phase === 'advance') return 'shift'
  if (phase === 'done') return 'return'
  return 'iterate'
}

export default function HouseRobberVisualizer({ problem }) {
  const [numsInput, setNumsInput] = useState('[2,7,9,3,1]')
  const codeLines = useProblemCode(problem, 'house-robber')

  const { value: nums, error: inputError } = useParsedInput(
    numsInput,
    parseNums,
    [2, 7, 9, 3, 1],
  )

  const steps = useMemo(
    () => generateSteps(nums).map((current) => ({
      ...current,
      snippetId: snippetIdForPhase(current.phase),
      relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
    })),
    [nums],
  )
  const { stepIndex, setStepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useApplyExample((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
  }, handleReset)

  const connectivity = useCodeVisualConnectivity({
    steps,
    stepIndex,
    snippetOptions: SNIPPETS,
    onStepJump: setStepIndex,
  })

  return (
    <div className="hr-shell">
      <div className="hr-top">
        <section className="hr-panel">
          <header className="hr-head">
            <span>Street & DP Transition</span>
            {inputError && <span className="hr-error">{inputError}</span>}
          </header>
          <div className="hr-body">
            <div className="hr-examples">
              {EXAMPLES.map((ex) => <button key={ex.label} className="hr-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}
            </div>
            <input className="hr-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />
            <AnimatedIterationList
              items={nums}
              styleName="dp-house"
              className="hr-street"
              showIndex={false}
              activeOffsetY={-6}
              activeScale={1.2}
              getItemKey={(value, index) => `${index}-${value}`}
              getItemState={(_, index) => ({
                stateClass: step?.i === index ? 'active' : '',
                isActive: step?.i === index,
              })}
              renderItem={(value, index) => (
                <>
                  <small>{index}</small>
                  <strong>{value}</strong>
                </>
              )}
              onItemClick={(value, index) =>
                connectivity.setVisualFocus({
                  lines: [6, 7, 8, 9, 10, 11],
                  reason: `House ${index} selected with value ${value}.`,
                  targetType: 'house',
                  targetId: String(index),
                })
              }
            />
            <div className="hr-formula">
              <span
                onClick={() =>
                  connectivity.setVisualFocus({
                    lines: [7],
                    reason: 'Take branch selected.',
                    targetType: 'formula',
                    targetId: 'take',
                  })
                }
                style={{ cursor: 'pointer' }}
              >
                take = prev2 + nums[i] = {step?.take ?? 0}
              </span>
              <span
                onClick={() =>
                  connectivity.setVisualFocus({
                    lines: [8],
                    reason: 'Skip branch selected.',
                    targetType: 'formula',
                    targetId: 'skip',
                  })
                }
                style={{ cursor: 'pointer' }}
              >
                skip = prev1 = {step?.skip ?? 0}
              </span>
              <span
                onClick={() =>
                  connectivity.setVisualFocus({
                    lines: [9],
                    reason: 'Current DP update selected.',
                    targetType: 'formula',
                    targetId: 'curr',
                  })
                }
                style={{ cursor: 'pointer' }}
              >
                curr = max(take, skip) = {step?.curr ?? 0}
              </span>
            </div>
          </div>
        </section>

        <section className="hr-panel side">
          <header className="hr-head"><span>Rolling State</span></header>
          <div className="hr-body">
            <div className="hr-metrics">
              <div><span>prev2</span><strong>{step?.prev2 ?? 0}</strong></div>
              <div><span>prev1</span><strong>{step?.prev1 ?? 0}</strong></div>
              <div><span>index</span><strong>{step?.i ?? -1}</strong></div>
            </div>
            <div className={`hr-result ${step?.phase === 'done' ? 'ok' : ''}`}>
              {step?.phase === 'done' ? `Return ${step.prev1}` : 'Iterating houses'}
            </div>
          </div>
        </section>
      </div>

      <VisualizerPlaybackSection
        step={step}
        codeLines={codeLines}
        statusClassName="hr-status"
        statusDone={step?.phase === 'done'}
        statusMessage={step?.message}
        fallbackStatus="Press Play to begin."
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
