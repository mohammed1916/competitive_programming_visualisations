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

export default function ProblemScaffold({ problem }) {
  const tags = problem.tags || []
  const hasGraph = tags.includes('Graph') || tags.includes('Tree')
  const hasDp = tags.includes('Dynamic Programming')
  const hasString = tags.includes('String')

  return (
    <div className="scaffold-shell">
      <div className="scaffold-grid">
        <ScaffoldPanel
          title="Input Panel"
          hint="Self-contained input and constraints panel"
          variant="input"
        >
          <p>Problem #{problem.number}: {problem.title}</p>
          <p className="scaffold-muted">Slug: {problem.slug}</p>
          <div className="scaffold-tags">
            {tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </ScaffoldPanel>

        {hasDp && (
          <ScaffoldPanel
            title="DP State Panel"
            hint="Reusable matrix/table panel. Can be moved above controls later."
            variant="dp"
          >
            <div className="dp-placeholder">DP Grid Placeholder</div>
            <p className="scaffold-muted">
              For large tables, this panel can become docked, collapsible, or relocated without touching algorithm logic.
            </p>
          </ScaffoldPanel>
        )}

        {hasGraph && (
          <ScaffoldPanel
            title="Graph Panel"
            hint="Reusable graph canvas panel"
            variant="graph"
          >
            <div className="graph-placeholder">Graph Canvas Placeholder</div>
            <p className="scaffold-muted">
              Graph interactions should stay isolated so force-layout and rendering can be swapped later.
            </p>
          </ScaffoldPanel>
        )}

        {hasString && (
          <ScaffoldPanel
            title="String Trace Panel"
            hint="Reusable pointer/index visualization panel"
            variant="string"
          >
            <div className="string-placeholder">Pointer / window / token trace placeholder</div>
          </ScaffoldPanel>
        )}

        <ScaffoldPanel
          title="Code Trace Panel"
          hint="Reuses shared CodeTracePanel component in concrete implementations"
          variant="code"
        >
          <p className="scaffold-muted">
            This problem is indexed and filterable. Visualizer implementation is pending.
          </p>
        </ScaffoldPanel>
      </div>

      <div className="scaffold-dock">
        <div className="scaffold-dock-shadow" />
        <div className="scaffold-dock-content">
          <span>Playback Dock (reusable)</span>
          <span className="scaffold-hint">UX hint: slide down or right for hidden panels</span>
        </div>
      </div>
    </div>
  )
}
