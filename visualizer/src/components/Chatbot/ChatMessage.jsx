import ContextBadge from "./ContextBadge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Renders a single chat message bubble.
 * User messages show any attached context badge and image thumbnails.
 * Assistant messages support streaming (text updates as tokens arrive) and
 * render Markdown + LaTeX via rehype-katex.
 */
export default function ChatMessage({ message }) {
  const { role, text, images, contextLabel, isStreaming } = message;
  const isUser = role === "user";

  const renderText = () => {
    if (!text && isStreaming) return <span className="chat-cursor">▋</span>;
    if (!text) return null;

    // For assistant messages, render Markdown + LaTeX. For user messages, keep plain text
    if (!isUser) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          linkTarget="_blank"
        >
          {text}
        </ReactMarkdown>
      );
    }

    // user message: render as plain text (preserve line breaks)
    return text.split('\n').map((line, i) => (
      <div key={i}>{line}</div>
    ));
  };

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
          {renderText()}
        </div>
      </div>
    </div>
  );
}
