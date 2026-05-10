import { useMemo } from 'react'
import { motion } from 'framer-motion'
import PlaybackControls from '../PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import {
  MiniArray,
  MiniGraph,
  MiniMatrix,
  MiniStringWindow,
  StepPulse,
  TagPills,
} from '../scaffold/ScaffoldVisualPrimitives'
import '../scaffold/ScaffoldVisualPrimitives.css'
import './ProblemScaffold.css'

function ScaffoldPanel({ title, hint, variant, children }) {
  return (
    <section className={`scaffold-panel scaffold-${variant}`}>
      <header className="scaffold-panel-head">
        <h3>{title}</h3>
        <span>{hint}</span>
      </header>
      <div className="scaffold-panel-body">{children}</div>
    </section>
  )
}

function buildTemplateSteps(tags, title) {
  const graphMode = tags.includes('Graph') || tags.includes('Tree')
  const dpMode = tags.includes('Dynamic Programming')
  const stringMode = tags.includes('String') || tags.includes('Sliding Window')

  return Array.from({ length: 8 }).map((_, index) => {
    const active = index % 6
    return {
      iteration: index + 1,
      activeIndex: active,
      compareIndex: (active + 2) % 6,
      matrixCell: { r: index % 3, c: (index + 1) % 4 },
      left: Math.max(0, active - 1),
      right: Math.min(8, active + 2),
      activeNode: String.fromCharCode(65 + (index % 6)),
      phase: index < 2 ? 'expand state' : index < 6 ? 'evaluate transition' : 'finalize answer',
      message: graphMode
        ? `Traverse relation frontier for ${title} and update visited/degree state.`
        : dpMode
          ? `Fill transition state from previous subproblems for ${title}.`
          : stringMode
            ? `Adjust active window while preserving invariants for ${title}.`
            : `Process candidate index ${active} and update best answer if needed.`,
    }
  })
}

export default function ProblemScaffold({ problem }) {
  const tags = problem.tags || []
  const hasGraph = tags.includes('Graph') || tags.includes('Tree')
  const hasDp = tags.includes('Dynamic Programming')
  const hasString = tags.includes('String') || tags.includes('Sliding Window')
  const steps = useMemo(() => buildTemplateSteps(tags, problem.title), [tags, problem.title])
  const sampleArray = [2, 7, 1, 8, 2, 8]
  const sampleMatrix = [
    [1, 1, 2, 3],
    [2, 3, 5, 8],
    [3, 5, 8, 13],
  ]
  const sampleNodes = ['A', 'B', 'C', 'D', 'E', 'F']
  const sampleEdges = [
    ['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E'], ['C', 'F'],
  ]
  const sampleText = problem.slug.replaceAll('-', '')

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  return (
    <div className="scaffold-shell">
      <div className="scaffold-grid">
        <ScaffoldPanel
          title="Problem Context"
          hint="Auto-generated interactive fallback"
          variant="input"
        >
          <p className="scaffold-title">Problem #{problem.number}: {problem.title}</p>
          <p className="scaffold-muted">Slug: {problem.slug}</p>
          <TagPills tags={tags} />
          <motion.div
            className="scaffold-status"
            key={step?.iteration ?? 'idle'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {step?.message || 'Press play to run animated algorithm template.'}
          </motion.div>
        </ScaffoldPanel>

        <ScaffoldPanel
          title="Core State"
          hint="Reusable array and pointer lane"
          variant="array"
        >
          <MiniArray
            values={sampleArray}
            activeIndex={step?.activeIndex ?? -1}
            compareIndex={step?.compareIndex ?? -1}
          />
          <div className="scaffold-metrics">
            <StepPulse label="iteration" value={step?.iteration ?? 0} tone="info" />
            <StepPulse label="phase" value={step?.phase || 'idle'} />
          </div>
        </ScaffoldPanel>

        {hasDp && (
          <ScaffoldPanel
            title="DP State Panel"
            hint="Reusable matrix animation primitive"
            variant="dp"
          >
            <MiniMatrix matrix={sampleMatrix} activeCell={step?.matrixCell} />
          </ScaffoldPanel>
        )}

        {hasGraph && (
          <ScaffoldPanel
            title="Graph Panel"
            hint="Reusable node + edge primitive"
            variant="graph"
          >
            <MiniGraph nodes={sampleNodes} edges={sampleEdges} activeNode={step?.activeNode} />
          </ScaffoldPanel>
        )}

        {hasString && (
          <ScaffoldPanel
            title="String Trace Panel"
            hint="Window / pointers primitive"
            variant="string"
          >
            <MiniStringWindow
              text={sampleText}
              left={step?.left ?? 0}
              right={step?.right ?? -1}
            />
          </ScaffoldPanel>
        )}

        <ScaffoldPanel
          title="Implementation Notes"
          hint="Ready to swap with problem-specific logic"
          variant="code"
        >
          <p className="scaffold-muted">
            This problem now uses a reusable animated fallback instead of a static placeholder.
            You can plug in real step generation while keeping these shared primitives.
          </p>
          <div className="scaffold-metrics">
            <StepPulse label="render mode" value="modular fallback" tone="success" />
            <StepPulse label="status" value={isDone ? 'completed' : 'running'} />
          </div>
        </ScaffoldPanel>
      </div>

      <div className="scaffold-dock">
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
