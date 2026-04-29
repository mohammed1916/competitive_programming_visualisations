import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './BinarySearchVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def search(self, nums, target):' },
  { line: 3, text: '        left, right = 0, len(nums) - 1' },
  { line: 4, text: '        while left <= right:' },
  { line: 5, text: '            mid = (left + right) // 2' },
  { line: 6, text: '            if nums[mid] == target:' },
  { line: 7, text: '                return mid' },
  { line: 8, text: '            elif nums[mid] < target:' },
  { line: 9, text: '                left = mid + 1' },
  { line: 10, text: '            else:' },
  { line: 11, text: '                right = mid - 1' },
  { line: 12, text: '        return -1' },
]

function generateSteps(nums, target) {
  const steps = []
  let left = 0, right = nums.length - 1

  steps.push({ phase: 'init', left, right, mid: null, found: null, activeLine: 3, message: `left=${left}, right=${right}` })

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    steps.push({ phase: 'mid', left, right, mid, found: null, activeLine: 5, message: `mid = (${left}+${right})//2 = ${mid}  →  nums[${mid}]=${nums[mid]}` })

    if (nums[mid] === target) {
      steps.push({ phase: 'found', left, right, mid, found: mid, activeLine: 7, message: `nums[${mid}]=${nums[mid]} == target=${target}  →  return ${mid}` })
      return steps
    } else if (nums[mid] < target) {
      steps.push({ phase: 'go-right', left: mid + 1, right, mid, found: null, activeLine: 9, message: `${nums[mid]} < ${target}  →  move left to ${mid + 1}` })
      left = mid + 1
    } else {
      steps.push({ phase: 'go-left', left, right: mid - 1, mid, found: null, activeLine: 11, message: `${nums[mid]} > ${target}  →  move right to ${mid - 1}` })
      right = mid - 1
    }
  }

  steps.push({ phase: 'not-found', left, right, mid: null, found: -1, activeLine: 12, message: `left (${left}) > right (${right})  →  return -1 (not found)` })
  return steps
}

const EXAMPLES = [
  { label: 'Found 9', nums: [-1, 0, 3, 5, 9, 12], target: 9 },
  { label: 'Not found', nums: [-1, 0, 3, 5, 9, 12], target: 2 },
  { label: 'Single', nums: [5], target: 5 },
  { label: 'Larger', nums: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], target: 13 },
]

export default function BinarySearchVisualizer() {
  const [numsInput, setNumsInput] = useState('[-1, 0, 3, 5, 9, 12]')
  const [targetInput, setTargetInput] = useState('9')

  const { nums, target, inputError } = useMemo(() => {
    try {
      const n = JSON.parse(numsInput)
      const t = Number(targetInput)
      if (!Array.isArray(n) || isNaN(t)) throw new Error()
      return { nums: n, target: t, inputError: '' }
    } catch {
      return { nums: [-1, 0, 3, 5, 9, 12], target: 9, inputError: 'Invalid input' }
    }
  }, [numsInput, targetInput])

  const steps = useMemo(() => generateSteps(nums, target), [nums, target])

  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    setTargetInput(String(ex.target))
    handleReset()
  }, [handleReset])

  function cellState(idx) {
    if (!step) return 'idle'
    if (step.found === idx) return 'found'
    if (step.mid === idx) return 'mid'
    if (step.left !== null && step.right !== null && idx >= step.left && idx <= step.right) return 'active'
    return 'eliminated'
  }

  return (
    <div className="bs-shell">
      <div className="bs-top">
        <div className="bs-panel">
          <div className="bs-panel-head">
            Sorted Array
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="bs-badge" style={{ background: '#1e293b', color: '#93c5fd' }}>Binary Search</span>
          </div>
          <div className="bs-panel-body">
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <input value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                style={{ flex: 1, padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13 }} />
              <span style={{ color: '#64748b', fontSize: 12 }}>target</span>
              <input value={targetInput} onChange={(e) => { setTargetInput(e.target.value); handleReset() }}
                style={{ width: 56, padding: '5px 8px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13, textAlign: 'center' }} />
            </div>

            <div className="bs-array-row">
              {nums.map((val, idx) => (
                <div className="bs-cell" key={idx}>
                  <motion.div
                    className={`bs-cell-val ${cellState(idx)}`}
                    animate={{ scale: cellState(idx) === 'mid' ? 1.15 : cellState(idx) === 'found' ? 1.2 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  >{val}</motion.div>
                  <div className="bs-cell-idx">{idx}</div>
                  {step && (
                    <div className="bs-cell-ptr">
                      {idx === step.left && idx === step.right ? 'L/R'
                        : idx === step.left ? 'L'
                        : idx === step.right ? 'R'
                        : idx === step.mid ? 'M'
                        : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* search range indicator */}
            {step && step.left !== null && step.right !== null && step.right >= step.left && nums.length > 1 && (
              <div className="bs-range-bar">
                <div style={{ fontSize: 11, color: '#64748b' }}>Search window: [{step.left}, {step.right}]  ({step.right - step.left + 1} elements)</div>
                <div className="bs-range-track">
                  <div className="bs-range-fill" style={{
                    left: `${(step.left / (nums.length - 1)) * 100}%`,
                    width: `${((step.right - step.left) / (nums.length - 1)) * 100 + 100 / nums.length}%`,
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bs-panel">
          <div className="bs-panel-head">Variables</div>
          <div className="bs-panel-body">
            <div className="bs-vars">
              <div className="bs-var-row"><span className="bs-var-name">left</span><span className="bs-var-val">{step?.left ?? '–'}</span></div>
              <div className="bs-var-row"><span className="bs-var-name">right</span><span className="bs-var-val">{step?.right ?? '–'}</span></div>
              <div className="bs-var-row"><span className="bs-var-name">mid</span><span className="bs-var-val orange">{step?.mid ?? '–'}</span></div>
              <div className="bs-var-row"><span className="bs-var-name">nums[mid]</span><span className="bs-var-val">{step?.mid !== null && step?.mid !== undefined ? nums[step.mid] : '–'}</span></div>
              <div className="bs-var-row"><span className="bs-var-name">target</span><span className="bs-var-val">{target}</span></div>
              {step?.found !== null && step?.found !== undefined && (
                <div className="bs-var-row">
                  <span className="bs-var-name">result</span>
                  <span className={`bs-var-val ${step.found >= 0 ? 'green' : 'red'}`}>
                    {step.found >= 0 ? `index ${step.found}` : 'not found'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bs-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={`bs-status${step?.phase === 'found' ? ' found' : step?.phase === 'not-found' ? ' nf' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="bs-dock">
        <PlaybackControls isPlaying={isPlaying} isDone={isDone} speed={speed}
          onTogglePlay={togglePlay} onStepBack={stepBack} onStepForward={stepForward}
          onReset={handleReset} onSpeedChange={setSpeed} />
      </div>
    </div>
  )
}
