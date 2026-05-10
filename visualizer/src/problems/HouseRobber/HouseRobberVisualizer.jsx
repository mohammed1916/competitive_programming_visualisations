import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './HouseRobberVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def rob(self, nums):' },
  { line: 3, text: '        if not nums: return 0' },
  { line: 4, text: '        prev2 = 0' },
  { line: 5, text: '        prev1 = 0' },
  { line: 6, text: '        for money in nums:' },
  { line: 7, text: '            take = prev2 + money' },
  { line: 8, text: '            skip = prev1' },
  { line: 9, text: '            curr = max(take, skip)' },
  { line: 10, text: '            prev2 = prev1' },
  { line: 11, text: '            prev1 = curr' },
  { line: 12, text: '        return prev1' },
]

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

export default function HouseRobberVisualizer() {
  const [numsInput, setNumsInput] = useState('[2,7,9,3,1]')

  const { nums, inputError } = useMemo(() => {
    try {
      return { nums: parseNums(numsInput), inputError: '' }
    } catch (e) {
      return { nums: [2, 7, 9, 3, 1], inputError: e.message || 'Invalid input' }
    }
  }, [numsInput])

  const steps = useMemo(() => generateSteps(nums), [nums])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    handleReset()
  }, [handleReset])

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
            <div className="hr-street">
              {nums.map((value, i) => {
                const active = step?.i === i
                return (
                  <motion.div key={`${i}-${value}`} className={`hr-house ${active ? 'active' : ''}`} animate={active ? { y: -6 } : { y: 0 }}>
                    <small>{i}</small>
                    <strong>{value}</strong>
                  </motion.div>
                )
              })}
            </div>
            <div className="hr-formula">
              <span>take = prev2 + nums[i] = {step?.take ?? 0}</span>
              <span>skip = prev1 = {step?.skip ?? 0}</span>
              <span>curr = max(take, skip) = {step?.curr ?? 0}</span>
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

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className={`hr-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
  )
}
