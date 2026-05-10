import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './LargestRectangleInHistogramVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def largestRectangleArea(self, heights):' },
  { line: 3, text: '        stack = []  # (start, height)' },
  { line: 4, text: '        best = 0' },
  { line: 5, text: '        for i, h in enumerate(heights):' },
  { line: 6, text: '            start = i' },
  { line: 7, text: '            while stack and stack[-1][1] > h:' },
  { line: 8, text: '                idx, ht = stack.pop()' },
  { line: 9, text: '                best = max(best, ht * (i - idx))' },
  { line: 10, text: '                start = idx' },
  { line: 11, text: '            stack.append((start, h))' },
  { line: 12, text: '        for i, h in stack:' },
  { line: 13, text: '            best = max(best, h * (len(heights) - i))' },
  { line: 14, text: '        return best' },
]

function parseHeights(input) {
  const parsed = JSON.parse(input)
  if (!Array.isArray(parsed)) throw new Error('Input must be array')
  return parsed.map((n) => Math.max(0, Number(n)))
}

function generateSteps(heights) {
  const steps = []
  const stack = []
  let best = 0
  steps.push({ phase: 'init', activeLine: 4, heights, i: -1, stack: [...stack], best, area: 0, rect: null, message: 'Initialize stack and best area.' })
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i]
    let start = i
    steps.push({ phase: 'iterate', activeLine: 6, heights, i, h, stack: [...stack], best, area: 0, rect: null, message: `Index ${i}, height ${h}.` })
    while (stack.length && stack[stack.length - 1].h > h) {
      const top = stack.pop()
      const area = top.h * (i - top.start)
      best = Math.max(best, area)
      start = top.start
      steps.push({
        phase: 'pop',
        activeLine: 9,
        heights,
        i,
        h,
        stack: [...stack],
        best,
        area,
        rect: { start: top.start, end: i - 1, height: top.h },
        message: `Pop height ${top.h}, width ${i - top.start}, area ${area}.`,
      })
    }
    stack.push({ start, h })
    steps.push({ phase: 'push', activeLine: 11, heights, i, h, stack: [...stack], best, area: 0, rect: null, message: `Push bar (${start}, ${h}).` })
  }
  for (const item of stack) {
    const area = item.h * (heights.length - item.start)
    best = Math.max(best, area)
    steps.push({
      phase: 'finalize',
      activeLine: 13,
      heights,
      i: heights.length - 1,
      h: item.h,
      stack: [...stack],
      best,
      area,
      rect: { start: item.start, end: heights.length - 1, height: item.h },
      message: `Finalize bar ${item.h}: area=${area}.`,
    })
  }
  steps.push({ phase: 'done', activeLine: 14, heights, i: heights.length - 1, stack: [...stack], best, area: 0, rect: null, message: `Largest rectangle area = ${best}.` })
  return steps
}

const EXAMPLES = [
  { label: 'Classic', heights: [2, 1, 5, 6, 2, 3] },
  { label: 'Simple', heights: [2, 4] },
  { label: 'Plateau', heights: [2, 2, 2, 2] },
]

export default function LargestRectangleInHistogramVisualizer() {
  const [input, setInput] = useState('[2,1,5,6,2,3]')
  const { heights, inputError } = useMemo(() => {
    try {
      return { heights: parseHeights(input), inputError: '' }
    } catch (e) {
      return { heights: [2, 1, 5, 6, 2, 3], inputError: e.message || 'Invalid input' }
    }
  }, [input])
  const steps = useMemo(() => generateSteps(heights), [heights])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null
  const applyExample = useCallback((ex) => { setInput(JSON.stringify(ex.heights)); handleReset() }, [handleReset])

  return (
    <div className="lr-shell">
      <div className="lr-top">
        <section className="lr-panel">
          <header className="lr-head"><span>Histogram Stack Sweep</span>{inputError && <span className="lr-error">{inputError}</span>}</header>
          <div className="lr-body">
            <div className="lr-examples">{EXAMPLES.map((ex) => <button key={ex.label} className="lr-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}</div>
            <input className="lr-input" value={input} onChange={(e) => { setInput(e.target.value); handleReset() }} />
            <div className="lr-bars">
              {heights.map((v, i) => {
                const active = step?.i === i
                const inRect = step?.rect && i >= step.rect.start && i <= step.rect.end && v >= step.rect.height
                return (
                  <div key={`${v}-${i}`} className="lr-col">
                    <motion.div className={`lr-bar ${active ? 'active' : ''} ${inRect ? 'rect' : ''}`} style={{ height: `${Math.max(20, v * 18)}px` }} animate={active ? { y: -4 } : { y: 0 }}>
                      <span>{v}</span>
                    </motion.div>
                    <small>{i}</small>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        <section className="lr-panel side">
          <header className="lr-head"><span>Stack / Best</span></header>
          <div className="lr-body">
            <div className="lr-stack">{(step?.stack || []).map((s, i) => <span key={`${s.start}-${s.h}-${i}`}>({s.start},{s.h})</span>)}</div>
            <div className="lr-best">best area: <strong>{step?.best ?? 0}</strong></div>
            <div className="lr-status">{step?.message || 'Press Play.'}</div>
          </div>
        </section>
      </div>
      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
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
