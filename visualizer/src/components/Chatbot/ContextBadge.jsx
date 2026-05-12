/**
 * ContextBadge — pill showing what context is attached to the current message.
 * e.g. "Step 3 · Maximum Gap"  or  "nums[2]=7 · Step 3"
 */
export default function ContextBadge({ label, onRemove }) {
  return (
    <span className="ctx-badge">
      <span className="ctx-badge-icon">📎</span>
      <span className="ctx-badge-label">{label}</span>
      {onRemove && (
        <button className="ctx-badge-remove" onClick={onRemove} title="Remove context">
          ✕
        </button>
      )}
    </span>
  );
}
