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
  const { attachContext, openChat } = useChatContext();
  const [selected, setSelected] = useState(false);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      attachContext(label, data);
      setSelected(true);
      // Deselect ring after 2s
      setTimeout(() => setSelected(false), 2000);
      if (e.shiftKey) openChat();
    },
    [label, data, attachContext, openChat],
  );

  return (
    <span
      className={`selectable${selected ? " selected" : ""}${className ? " " + className : ""}`}
      onClick={handleClick}
      title={`Click to attach "${label}" to chat · Shift+click to open chat`}
    >
      {children}
    </span>
  );
}
