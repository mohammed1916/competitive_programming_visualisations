import './connectivity/CodeConnectivity.css'

export default function CodeSnippetChips({ snippets = [], activeSnippetId = null, onSnippetSelect }) {
  if (!snippets.length) return null

  return (
    <div className="code-snippet-chips" role="tablist" aria-label="Code snippets">
      {snippets.map((snippet) => (
        <button
          key={snippet.id}
          type="button"
          className={`code-snippet-chip ${snippet.id === activeSnippetId ? 'active' : ''}`}
          onClick={() => onSnippetSelect?.(snippet)}
        >
          {snippet.label}
        </button>
      ))}
    </div>
  )
}
