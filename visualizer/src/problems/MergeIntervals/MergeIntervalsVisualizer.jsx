import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './MergeIntervalsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution:' },
  { line: 2,  text: '    def merge(self, intervals: List[List[int]]) -> List[List[int]]:' },
  { line: 3,  text: '        intervals.sort(key=lambda x: x[0])' },
  { line: 4,  text: '        merged = []' },
  { line: 5,  text: '        for interval in intervals:' },
  { line: 6,  text: '            if not merged or merged[-1][1] < interval[0]:' },
  { line: 7,  text: '                merged.append(interval)' },
  { line: 8,  text: '            else:' },
  { line: 9,  text: '                merged[-1][1] = max(merged[-1][1], interval[1])' },
  { line: 10, text: '        return merged' },
]

function generateSteps(originalIntervals) {
  const steps = []
  
  // Clone and sort
  const intervals = [...originalIntervals].map(a => [...a])
  
  steps.push({
    phase: 'init',
    intervals: JSON.parse(JSON.stringify(originalIntervals)),
    merged: [],
    currIdx: null,
    activeLine: 3,
    message: 'Sort intervals based on their start times.',
    isSorted: false
  })
  
  intervals.sort((a, b) => a[0] - b[0])
  
  steps.push({
    phase: 'sorted',
    intervals: JSON.parse(JSON.stringify(intervals)),
    merged: [],
    currIdx: null,
    activeLine: 4,
    message: 'Intervals sorted. Initialize empty merged list.',
    isSorted: true
  })

  const merged = []

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i]
    
    steps.push({
      phase: 'eval',
      intervals: JSON.parse(JSON.stringify(intervals)),
      merged: JSON.parse(JSON.stringify(merged)),
      currIdx: i,
      activeLine: 5,
      message: \`Evaluating interval [\${interval[0]}, \${interval[1]}].\`,
      isSorted: true
    })
    
    steps.push({
      phase: 'check',
      intervals: JSON.parse(JSON.stringify(intervals)),
      merged: JSON.parse(JSON.stringify(merged)),
      currIdx: i,
      activeLine: 6,
      message: merged.length === 0 
        ? 'Merged list is empty.' 
        : \`Check if last merged end (\${merged[merged.length-1][1]}) < current start (\${interval[0]}).\`,
      isSorted: true
    })

    if (merged.length === 0 || merged[merged.length - 1][1] < interval[0]) {
      merged.push([...interval])
      steps.push({
        phase: 'append',
        intervals: JSON.parse(JSON.stringify(intervals)),
        merged: JSON.parse(JSON.stringify(merged)),
        currIdx: i,
        activeLine: 7,
        message: \`No overlap. Append [\${interval[0]}, \${interval[1]}] to merged list.\`,
        isSorted: true
      })
    } else {
      const prevEnd = merged[merged.length - 1][1]
      const newEnd = Math.max(prevEnd, interval[1])
      merged[merged.length - 1][1] = newEnd
      
      steps.push({
        phase: 'merge',
        intervals: JSON.parse(JSON.stringify(intervals)),
        merged: JSON.parse(JSON.stringify(merged)),
        currIdx: i,
        activeLine: 9,
        message: \`Overlap detected! Update end of last merged interval to max(\${prevEnd}, \${interval[1]}) = \${newEnd}.\`,
        isSorted: true
      })
    }
  }

  steps.push({
    phase: 'done',
    intervals: JSON.parse(JSON.stringify(intervals)),
    merged: JSON.parse(JSON.stringify(merged)),
    currIdx: null,
    activeLine: 10,
    message: 'All intervals processed. Return merged list.',
    isSorted: true
  })

  return steps
}

const EXAMPLES = [
  { label: 'Classic', intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
  { label: 'Enclosed', intervals: [[1, 4], [2, 3]] },
  { label: 'Contiguous', intervals: [[1, 4], [4, 5]] },
  { label: 'All Overlap', intervals: [[1, 10], [2, 9], [3, 8], [4, 7]] },
  { label: 'Unsorted', intervals: [[15, 18], [1, 3], [8, 10], [2, 6]] },
]

export default function MergeIntervalsVisualizer() {
  const [intervalsInput, setIntervalsInput] = useState('[[1,3],[2,6],[8,10],[15,18]]')

  const { originalIntervals, inputError } = useMemo(() => {
    try {
      const parsed = JSON.parse(intervalsInput)
      if (!Array.isArray(parsed) || parsed.some(arr => !Array.isArray(arr) || arr.length !== 2 || typeof arr[0] !== 'number' || typeof arr[1] !== 'number')) {
        throw new Error('Must be an array of [start, end] pairs.')
      }
      if (parsed.some(arr => arr[0] > arr[1])) {
        throw new Error('Start time cannot be greater than end time.')
      }
      return { originalIntervals: parsed, inputError: '' }
    } catch (e) {
      return { originalIntervals: [[1, 3], [2, 6], [8, 10], [15, 18]], inputError: e.message || 'Invalid input format' }
    }
  }, [intervalsInput])

  const steps = useMemo(() => generateSteps(originalIntervals), [originalIntervals])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setIntervalsInput(JSON.stringify(ex.intervals))
    handleReset()
  }, [handleReset])

  const displayIntervals = step ? step.intervals : originalIntervals
  const displayMerged = step ? step.merged : []
  
  const minVal = Math.min(0, ...displayIntervals.map(i => i[0]))
  const maxVal = Math.max(10, ...displayIntervals.map(i => i[1]))
  const range = Math.max(maxVal - minVal, 1)

  return (
    <div className="merge-intervals-shell">
      <div className="mi-top">
        <div className="mi-panel">
          <div className="mi-panel-head">
            Input Intervals
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="mi-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="mi-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <input
              value={intervalsInput}
              onChange={(e) => { setIntervalsInput(e.target.value); handleReset() }}
              placeholder="[[1,3],[2,6],[8,10],[15,18]]"
              className="mi-input"
            />
            
            <div className="mi-canvas">
              <div className="mi-axis">
                  {Array.from({ length: 11 }).map((_, i) => {
                      const val = Math.round(minVal + (i / 10) * range)
                      return (
                          <div key={i} className="mi-axis-tick" style={{ left: \`\${((val - minVal) / range) * 100}%\` }}>
                              <span className="mi-tick-label">{val}</span>
                          </div>
                      )
                  })}
              </div>
              
              <div className="mi-intervals-list">
                <div className="mi-section-title">Intervals {step?.isSorted ? '(Sorted)' : '(Unsorted)'}</div>
                {displayIntervals.map((interval, i) => {
                  const isActive = step?.currIdx === i
                  const leftPct = ((interval[0] - minVal) / range) * 100
                  const widthPct = ((interval[1] - interval[0]) / range) * 100
                  
                  return (
                    <div key={\`input-\${i}\`} className="mi-row">
                      <div className="mi-row-idx">[{i}]</div>
                      <div className="mi-track">
                        <motion.div 
                          className={\`mi-bar \${isActive ? 'active' : ''}\`}
                          style={{ left: \`\${leftPct}%\`, width: \`\${widthPct}%\` }}
                          layout
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <span className="mi-bar-text">[{interval[0]}, {interval[1]}]</span>
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mi-intervals-list merged-list">
                <div className="mi-section-title">Merged</div>
                {displayMerged.map((interval, i) => {
                  const isLast = i === displayMerged.length - 1
                  const isJustMerged = isLast && step?.phase === 'merge'
                  const isJustAppended = isLast && step?.phase === 'append'
                  const isActive = isLast && (isJustMerged || isJustAppended || step?.phase === 'eval' || step?.phase === 'check')
                  
                  const leftPct = ((interval[0] - minVal) / range) * 100
                  const widthPct = ((interval[1] - interval[0]) / range) * 100
                  
                  return (
                    <div key={\`merged-\${i}\`} className="mi-row">
                      <div className="mi-row-idx">[{i}]</div>
                      <div className="mi-track">
                        <motion.div 
                          className={\`mi-bar merged \${isActive ? 'active' : ''} \${isJustMerged ? 'just-merged' : ''}\`}
                          style={{ left: \`\${leftPct}%\`, width: \`\${widthPct}%\` }}
                          layout
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <span className="mi-bar-text">[{interval[0]}, {interval[1]}]</span>
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
                {displayMerged.length === 0 && (
                    <div className="mi-empty-text">[]</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="merge-intervals-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={\`mi-status \${step?.phase === 'merge' ? 'merge' : step?.phase === 'append' ? 'append' : ''}\`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="mi-dock">
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
