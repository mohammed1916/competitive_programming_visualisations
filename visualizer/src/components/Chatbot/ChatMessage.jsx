import ContextBadge from "./ContextBadge";

/**
 * Renders a single chat message bubble.
 * User messages show any attached context badge and image thumbnails.
 * Assistant messages support streaming (text updates as tokens arrive).
 */
export default function ChatMessage({ message }) {
  const { role, text, images, contextLabel, isStreaming } = message;
  const isUser = role === "user";

  return (
    <div className={`chat-msg chat-msg--${role}`}>
      <div className="chat-msg-avatar">{isUser ? "🧑" : "🤖"}</div>
      <div className="chat-msg-body">
        {/* Attached context badge (user messages only) */}
        {isUser && contextLabel && (
          <div className="chat-msg-ctx">
            <ContextBadge label={contextLabel} />
          </div>
        )}

        {/* Image thumbnails (user messages only) */}
        {isUser && images && images.length > 0 && (
          <div className="chat-msg-images">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`attachment-${i}`}
                className="chat-msg-img"
              />
            ))}
          </div>
        )}

        {/* Message text */}
        <div className={`chat-msg-text${isStreaming ? " streaming" : ""}`}>
          {text || (isStreaming ? <span className="chat-cursor">▋</span> : null)}
        </div>
      </div>
    </div>
  );
}
