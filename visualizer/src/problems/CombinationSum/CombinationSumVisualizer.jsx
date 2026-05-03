import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './CombinationSumVisualizer.css'

const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution:' },
  { line: 2,  text: '    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:' },
  { line: 3,  text: '        res = []' },
  { line: 4,  text: '        def dfs(i, current_path, total):' },
  { line: 5,  text: '            if total == target:' },
  { line: 6,  text: '                res.append(current_path.copy())' },
  { line: 7,  text: '                return' },
  { line: 8,  text: '            if i >= len(candidates) or total > target:' },
  { line: 9,  text: '                return' },
  { line: 10, text: '            ' },
  { line: 11, text: '            # Include candidates[i]' },
  { line: 12, text: '            current_path.append(candidates[i])' },
  { line: 13, text: '            dfs(i, current_path, total + candidates[i])' },
  { line: 14, text: '            ' },
  { line: 15, text: '            # Skip candidates[i]' },
  { line: 16, text: '            current_path.pop()' },
  { line: 17, text: '            dfs(i + 1, current_path, total)' },
  { line: 18, text: '            ' },
  { line: 19, text: '        dfs(0, [], 0)' },
  { line: 20, text: '        return res' },
]

function generateSteps(candidates, target) {
  const steps = []
  const res = []
  const callStack = []
  let stepCounter = 0

  if (!candidates || candidates.length === 0) {
    steps.push({
      phase: 'done', i: null, path: [], total: 0, res: [], callStack: [],
      activeLine: 20, message: 'Empty candidates array. Return [].'
    })
    return steps
  }

  // Pre-sort candidates for more logical visual progression (optional, but good practice)
  const sortedCandidates = [...candidates].sort((a, b) => a - b)

  steps.push({
    phase: 'init', i: null, path: [], total: 0, res: [...res], callStack: [],
    activeLine: 3, message: 'Initialize empty results list res = [].'
  })
  
  steps.push({
    phase: 'call_dfs', i: null, path: [], total: 0, res: [...res], callStack: [],
    activeLine: 19, message: 'Initial call: dfs(0, [], 0).'
  })

  function dfs(i, current_path, total) {
    // Artificial limit to prevent infinite loops / huge traces
    if (stepCounter++ > 1500) return

    const stackEntry = \`dfs(\${i}, [\${current_path.join(', ')}], \${total})\`
    callStack.push(stackEntry)

    steps.push({
      phase: 'enter_dfs', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 4, message: \`Entering \${stackEntry}.\`
    })

    steps.push({
      phase: 'check_target', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 5, message: \`Check if total (\${total}) == target (\${target}).\`
    })

    if (total === target) {
      res.push([...current_path])
      steps.push({
        phase: 'found', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
        activeLine: 6, message: \`Target reached! Append [\${current_path.join(', ')}] to res.\`
      })
      steps.push({
        phase: 'return_target', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
        activeLine: 7, message: 'Return from current DFS call.'
      })
      callStack.pop()
      return
    }

    steps.push({
      phase: 'check_bound', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 8, message: \`Check if out of bounds (i >= \${sortedCandidates.length}) or exceeded target (\${total} > \${target}).\`
    })

    if (i >= sortedCandidates.length || total > target) {
      steps.push({
        phase: 'return_bound', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
        activeLine: 9, message: \`Condition met (i=\${i}, total=\${total}). Backtrack/return.\`
      })
      callStack.pop()
      return
    }

    // Include candidate
    current_path.push(sortedCandidates[i])
    steps.push({
      phase: 'include', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 12, message: \`Include candidates[\${i}] (\${sortedCandidates[i]}). Path is now [\${current_path.join(', ')}].\`
    })

    steps.push({
      phase: 'call_include', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 13, message: \`Recursive call including \${sortedCandidates[i]}: dfs(\${i}, [\${current_path.join(', ')}], \${total + sortedCandidates[i]}).\`
    })
    
    dfs(i, current_path, total + sortedCandidates[i])

    // Skip candidate
    const popped = current_path.pop()
    steps.push({
      phase: 'pop', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 16, message: \`Backtrack: pop \${popped} from path. Path is now [\${current_path.join(', ')}].\`
    })

    steps.push({
      phase: 'call_skip', i, path: [...current_path], total, res: [...res], callStack: [...callStack],
      activeLine: 17, message: \`Recursive call skipping candidates[\${i}]: dfs(\${i + 1}, [\${current_path.join(', ')}], \${total}).\`
    })

    dfs(i + 1, current_path, total)

    callStack.pop()
  }

  dfs(0, [], 0)

  steps.push({
    phase: 'done', i: null, path: [], total: 0, res: [...res], callStack: [],
    activeLine: 20, message: \`Search complete. Found \${res.length} combinations.\`
  })

  // To simplify rendering, we attach the sorted candidates to the first step
  steps[0].sortedCandidates = sortedCandidates

  return steps
}

const EXAMPLES = [
  { label: 'Classic', candidates: [2, 3, 6, 7], target: 7 },
  { label: 'Multiple', candidates: [2, 3, 5], target: 8 },
  { label: 'No Answer', candidates: [4, 5], target: 3 },
  { label: 'Single', candidates: [2], target: 4 },
]

export default function CombinationSumVisualizer() {
  const [candidatesInput, setCandidatesInput] = useState('[2, 3, 6, 7]')
  const [targetInput, setTargetInput] = useState('7')

  const { candidates, target, inputError } = useMemo(() => {
    try {
      const c = JSON.parse(candidatesInput)
      const t = Number(targetInput)
      if (!Array.isArray(c) || c.some((x) => typeof x !== 'number' || x <= 0)) throw new Error('Candidates must be positive integers.')
      if (isNaN(t) || t <= 0) throw new Error('Target must be a positive integer.')
      return { candidates: c, target: t, inputError: '' }
    } catch (e) {
      return { candidates: [2, 3, 6, 7], target: 7, inputError: e.message || 'Invalid input' }
    }
  }, [candidatesInput, targetInput])

  const steps = useMemo(() => generateSteps(candidates, target), [candidates, target])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null
  const sortedCandidates = steps[0]?.sortedCandidates || [...candidates].sort((a,b) => a - b)

  const applyExample = useCallback((ex) => {
    setCandidatesInput(JSON.stringify(ex.candidates))
    setTargetInput(String(ex.target))
    handleReset()
  }, [handleReset])

  return (
    <div className="combination-sum-shell">
      <div className="cs-top">
        <div className="cs-panel">
          <div className="cs-panel-head">
            State & Recursion Tree
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="cs-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="cs-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <input
                value={candidatesInput}
                onChange={(e) => { setCandidatesInput(e.target.value); handleReset() }}
                placeholder="[2, 3, 6, 7]"
                className="cs-input"
                style={{ flex: 1, margin: 0 }}
              />
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>target=</span>
              <input
                value={targetInput}
                onChange={(e) => { setTargetInput(e.target.value); handleReset() }}
                placeholder="7"
                className="cs-input"
                style={{ width: '60px', margin: 0, textAlign: 'center' }}
              />
            </div>

            <div className="cs-candidates-row">
                <span className="cs-label">Candidates (Sorted):</span>
                <div className="cs-array">
                    {sortedCandidates.map((val, idx) => (
                        <div key={idx} className={\`cs-candidate \${step?.i === idx ? 'active' : ''}\`}>
                            <span className="cs-val">{val}</span>
                            <span className="cs-idx">i={idx}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cs-state-cards">
                <div className="cs-card">
                    <div className="cs-card-title">current_path</div>
                    <div className="cs-card-value">
                        [{step?.path?.join(', ') || ''}]
                    </div>
                </div>
                <div className="cs-card">
                    <div className="cs-card-title">total</div>
                    <div className={\`cs-card-value \${step?.total === target ? 'match' : step?.total > target ? 'exceed' : ''}\`}>
                        {step?.total ?? 0} <span className="cs-card-sub">/ {target}</span>
                    </div>
                </div>
            </div>

            <div className="cs-stack-container">
                <div className="cs-section-title">Call Stack</div>
                <div className="cs-stack-list">
                    <AnimatePresence>
                        {step?.callStack?.map((call, idx) => {
                            const isTop = idx === step.callStack.length - 1
                            return (
                                <motion.div 
                                    key={\`\${call}-\${idx}\`}
                                    className={\`cs-stack-item \${isTop ? 'top' : ''}\`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <span className="cs-stack-depth">{'>'.repeat(idx + 1)}</span>
                                    {call}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                    {(!step || !step.callStack || step.callStack.length === 0) && (
                        <div className="cs-empty-stack">Stack is empty</div>
                    )}
                </div>
            </div>

            <div className="cs-res-container">
                <div className="cs-section-title">Results (res)</div>
                <div className="cs-res-list">
                    <AnimatePresence>
                        {step?.res?.map((arr, idx) => (
                            <motion.div 
                                key={idx}
                                className="cs-res-item"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                [{arr.join(', ')}]
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {(!step || step.res.length === 0) && <span style={{ color: '#475569', fontStyle: 'italic', fontSize: 13 }}>[ ]</span>}
                </div>
            </div>

          </div>
        </div>
      </div>

      <div className="combination-sum-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={\`cs-status \${step?.phase === 'found' ? 'found' : step?.phase === 'return_bound' ? 'bound' : ''}\`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="cs-dock">
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
