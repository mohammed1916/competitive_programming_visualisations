import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './TwoSumVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def twoSum(self, nums: List[int], target: int) -> List[int]:' },
  { line: 3, text: '        prevMap = {}  # val -> index' },
  { line: 4, text: '        ' },
  { line: 5, text: '        for i, n in enumerate(nums):' },
  { line: 6, text: '            diff = target - n' },
  { line: 7, text: '            if diff in prevMap:' },
  { line: 8, text: '                return [prevMap[diff], i]' },
  { line: 9, text: '            prevMap[n] = i' },
  { line: 10, text: '        ' },
  { line: 11, text: '        return []' },
]

function generateSteps(nums, target) {
  const steps = []

  if (!nums || nums.length < 2) {
    steps.push({
      phase: 'done', i: null, prevMap: {}, diff: null,
      activeLine: 11, message: 'Invalid array. Return [].'
    })
    return steps
  }

  const prevMap = {}

  steps.push({
    phase: 'init', i: null, prevMap: {...prevMap}, diff: null,
    activeLine: 3, message: 'Initialize empty hash map to store previously seen values and their indices.'
  })

  for (let i = 0; i < nums.length; i++) {
    const n = nums[i]
    
    steps.push({
      phase: 'loop', i, prevMap: {...prevMap}, diff: null, n,
      activeLine: 5, message: \`Check element nums[\${i}] = \${n}.\`
    })

    const diff = target - n
    steps.push({
      phase: 'calc_diff', i, prevMap: {...prevMap}, diff, n,
      activeLine: 6, message: \`Calculate diff = target (\${target}) - n (\${n}) = \${diff}.\`
    })

    steps.push({
      phase: 'check_map', i, prevMap: {...prevMap}, diff, n,
      activeLine: 7, message: \`Check if diff (\${diff}) is in prevMap.\`
    })

    if (diff in prevMap) {
      steps.push({
        phase: 'found', i, prevMap: {...prevMap}, diff, n, matchIdx: prevMap[diff],
        activeLine: 8, message: \`Match found! \${diff} is at index \${prevMap[diff]}. Return [\${prevMap[diff]}, \${i}].\`
      })
      return steps
    } else {
      prevMap[n] = i
      steps.push({
        phase: 'add_map', i, prevMap: {...prevMap}, diff, n,
        activeLine: 9, message: \`Not found. Add \${n} to prevMap at index \${i}.\`
      })
    }
  }

  steps.push({
    phase: 'done', i: null, prevMap: {...prevMap}, diff: null,
    activeLine: 11, message: 'No two sum solution found. Return [].'
  })

  return steps
}

const EXAMPLES = [
  { label: 'Example 1', nums: [2, 7, 11, 15], target: 9 },
  { label: 'Example 2', nums: [3, 2, 4], target: 6 },
  { label: 'Same Values', nums: [3, 3], target: 6 },
  { label: 'Negatives', nums: [-3, 4, 3, 90], target: 0 },
]

export default function TwoSumVisualizer() {
  const [numsInput, setNumsInput] = useState('[2, 7, 11, 15]')
  const [targetInput, setTargetInput] = useState('9')

  const { nums, target, inputError } = useMemo(() => {
    try {
      const n = JSON.parse(numsInput)
      const t = Number(targetInput)
      if (!Array.isArray(n)) throw new Error('nums must be an array')
      if (isNaN(t)) throw new Error('target must be a number')
      return { nums: n, target: t, inputError: '' }
    } catch (e) {
      return { nums: [2, 7, 11, 15], target: 9, inputError: e.message || 'Invalid input' }
    }
  }, [numsInput, targetInput])

  const steps = useMemo(() => generateSteps(nums, target), [nums, target])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    setTargetInput(String(ex.target))
    handleReset()
  }, [handleReset])

  return (
    <div className="twosum-shell">
      <div className="twosum-top">
        <div className="twosum-panel" style={{ flex: 1.5 }}>
          <div className="twosum-panel-head">
            Array & Target
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="twosum-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="twosum-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <input
                value={numsInput}
                onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                placeholder="[2, 7, 11, 15]"
                className="twosum-input"
                style={{ flex: 1, margin: 0 }}
              />
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>target=</span>
              <input
                value={targetInput}
                onChange={(e) => { setTargetInput(e.target.value); handleReset() }}
                placeholder="9"
                className="twosum-input"
                style={{ width: '60px', margin: 0, textAlign: 'center' }}
              />
            </div>

            <div className="twosum-array-container">
              {nums.map((num, idx) => {
                const isActive = step?.i === idx
                const isMatch = step?.phase === 'found' && (step.matchIdx === idx || step.i === idx)
                const isStored = step?.prevMap && num in step.prevMap && step.prevMap[num] === idx

                return (
                  <div key={idx} className="twosum-cell-wrapper">
                    <span className="twosum-index">{idx}</span>
                    <motion.div 
                        className={\`twosum-cell \${isActive ? 'active' : ''} \${isMatch ? 'match' : ''} \${isStored && !isActive && !isMatch ? 'stored' : ''}\`}
                        animate={isActive ? { y: -5 } : { y: 0 }}
                    >
                      {num}
                    </motion.div>
                    <div className="twosum-ptr-container">
                        {isActive && <div className="twosum-ptr">i</div>}
                        {isMatch && step.matchIdx === idx && <div className="twosum-ptr match">match</div>}
                    </div>
                  </div>
                )
              })}
            </div>

            {step && step.phase !== 'init' && step.i !== null && (
                <div className="twosum-formula-box">
                    <div className="twosum-formula">
                        <span className="var">target</span>
                        <span className="op">-</span>
                        <span className="var">nums[i]</span>
                        <span className="op">=</span>
                        <span className="var diff">diff</span>
                    </div>
                    <div className="twosum-formula vals">
                        <span className="val">{target}</span>
                        <span className="op">-</span>
                        <span className="val">{step.n}</span>
                        <span className="op">=</span>
                        <span className={\`val diff \${step.diff !== null ? 'visible' : ''} \${step.phase === 'found' ? 'match' : ''}\`}>
                            {step.diff}
                        </span>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="twosum-panel" style={{ flex: 1 }}>
          <div className="twosum-panel-head">Hash Map (prevMap)</div>
          <div className="twosum-panel-body">
            <div className="twosum-map-container">
                <div className="twosum-map-headers">
                    <span>Key (Value)</span>
                    <span>Val (Index)</span>
                </div>
                <AnimatePresence>
                    {step?.prevMap && Object.entries(step.prevMap).map(([val, idx]) => {
                        const isChecking = step.diff !== null && Number(val) === step.diff
                        const isMatch = step.phase === 'found' && Number(val) === step.diff

                        return (
                            <motion.div 
                                key={val}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={\`twosum-map-row \${isChecking ? 'checking' : ''} \${isMatch ? 'match' : ''}\`}
                            >
                                <span className="twosum-map-key">{val}</span>
                                <span className="twosum-map-arrow">→</span>
                                <span className="twosum-map-val">{idx}</span>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                {(!step?.prevMap || Object.keys(step.prevMap).length === 0) && (
                    <div className="twosum-empty-map">Map is empty</div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="twosum-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={\`twosum-status \${step?.phase === 'found' ? 'success' : step?.phase === 'done' ? 'fail' : ''}\`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="twosum-dock">
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
