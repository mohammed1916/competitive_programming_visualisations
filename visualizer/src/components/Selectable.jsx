import { useState, useCallback } from "react";
import { useChatContext } from "../context/ChatContext";

/**
 * Thin wrapper that makes any visualizer element "selectable" for the chatbot.
 *
 * Usage:
 *   <Selectable label="nums[2]" data={{ index: 2, value: 7, step }}>
 *     <span className="cell">7</span>
 *   </Selectable>
 *
 * - Click: attaches context to chatbot (shows selection ring)
 * - Shift+Click: attaches context AND opens the chat drawer
 */
export default function Selectable({ label, data, children, className = "" }) {
  const { attachContext, openChat, selectMode } = useChatContext();
  const [selected, setSelected] = useState(false);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      // Only attach on click when select mode is active, or when shift+click is used
      if (!selectMode && !e.shiftKey) return;
      attachContext(label, data);
      setSelected(true);
      // Deselect ring after 2s
      setTimeout(() => setSelected(false), 2000);
      if (e.shiftKey) openChat();
    },
      [label, data, attachContext, openChat, selectMode],
  );

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // emulate click
      if (!selectMode) return;
      attachContext(label, data);
      setSelected(true);
      setTimeout(() => setSelected(false), 2000);
    }
  }, [selectMode, attachContext, label, data]);

  return (
    <span
      className={`selectable${selected ? " selected" : ""}${className ? " " + className : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title={selectMode ? `Click to attach "${label}" to chat` : `Shift+click to attach and open chat`}
    >
      {children}
    </span>
  );
}
