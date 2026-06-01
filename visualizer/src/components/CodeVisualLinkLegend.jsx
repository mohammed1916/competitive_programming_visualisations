import './connectivity/CodeConnectivity.css'

export default function CodeVisualLinkLegend({ linkInfo }) {
  if (!linkInfo) return null

  const lineLabel = linkInfo.lines?.length
    ? `Line${linkInfo.lines.length > 1 ? 's' : ''}: ${linkInfo.lines.join(', ')}`
    : 'No lines'

  return (
    <div className="code-link-legend">
      <div className="code-link-legend-line">{lineLabel}</div>
      <div className="code-link-legend-meta">
        <span className="code-link-pill">{linkInfo.targetType}</span>
        {linkInfo.targetId ? <span className="code-link-id">{linkInfo.targetId}</span> : null}
      </div>
      {linkInfo.reason ? <div className="code-link-reason">{linkInfo.reason}</div> : null}
    </div>
  )
}
