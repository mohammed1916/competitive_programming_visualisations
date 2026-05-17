import { useEffect, useRef, useCallback, useState } from "react";
import { useChatContext } from "../../context/ChatContext";
import { useVisualizationContext } from "../../context/VisualizationContext";
import { streamChat } from "../../services/ollama";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

/**
 * Formats the current visualizer step as a readable context string
 * to inject into the chat message before the user's question.
 */
function formatStepContext(step, problemTitle) {
  if (!step) return null;
  const lines = [`[Context: ${problemTitle || "Visualizer"} — Step data]`];
  for (const [key, value] of Object.entries(step)) {
    if (key === "buckets" && Array.isArray(value)) {
      const filled = value.filter((b) => b[0] !== Infinity);
      lines.push(`  buckets (filled): ${JSON.stringify(filled)}`);
    } else if (typeof value !== "object" || value === null) {
      lines.push(`  ${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`  ${key}: [${value.join(", ")}]`);
    }
  }
  return lines.join("\n");
}

function formatElementContext(label, data) {
  if (!data) return label;
  const lines = [`[Context: Selected element — ${label}]`];
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "object" || value === null) {
      lines.push(`  ${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

export default function ChatDrawer() {
  const {
    messages, addMessage, updateLastMessage, clearMessages,
    attachedContext, attachContext, clearContext,
    isOpen, closeChat,
    selectMode, toggleSelectMode,
    floatingMode, toggleFloatingMode,
  } = useChatContext();
  const [selectAnnouncement, setSelectAnnouncement] = useState('');

  const handleToggleSelectMode = useCallback(() => {
    const newMode = !selectMode;
    toggleSelectMode();
    try {
      if (newMode) document.body.classList.add('chat-select-mode');
      else document.body.classList.remove('chat-select-mode');
    } catch (err) { void err }
    setSelectAnnouncement(newMode ? 'Select mode enabled' : 'Select mode disabled');
    const t = setTimeout(() => setSelectAnnouncement(''), 1800);
    return () => clearTimeout(t);
  }, [selectMode, toggleSelectMode]);

  const { currentStep, problemTitle, problemDescription } = useVisualizationContext();
  const messagesEndRef = useRef(null);
  const isStreamingRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Floating position (persisted) and dragging refs — keep hooks unconditionally
  const [pos, setPos] = useState(() => {
    try { const s = window.localStorage.getItem('chat.pos'); if (s) return JSON.parse(s); } catch (err) { void err }
    // default near bottom-right
    return { x: window.innerWidth - 420, y: window.innerHeight - 520 };
  });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const nx = Math.max(6, Math.min(window.innerWidth - 200, dragStartRef.current.origX + dx));
      const ny = Math.max(6, Math.min(window.innerHeight - 120, dragStartRef.current.origY + dy));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try { window.localStorage.setItem('chat.pos', JSON.stringify(pos)); } catch (err) { void err }
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [pos]);

  // Attach current step to context
  const handleAttachStep = useCallback(() => {
    if (!currentStep) return;
    attachContext(
      `Step${currentStep.activeLine ? ` (line ${currentStep.activeLine})` : ""} · ${problemTitle || "Visualizer"}`,
      currentStep,
    );
  }, [currentStep, problemTitle, attachContext]);

  const handleSend = useCallback(
    async ({ text, images, contextLabel, contextData }) => {
      if (isStreamingRef.current) return;

      // Build context block to prepend to the user's question
      let contextBlock = "";
      if (contextData) {
        const isStep = contextData.activeLine !== undefined || contextData.phase !== undefined;
        contextBlock = isStep
          ? formatStepContext(contextData, problemTitle)
          : formatElementContext(contextLabel, contextData);
      }

      const fullText = contextBlock ? `${contextBlock}\n\nQuestion: ${text}` : text;

      // Add the user's message to UI (show original text, send contextual text to model)
      const userMsg = {
        id: Date.now(),
        role: "user",
        text,
        images,
        contextLabel,
      };
      addMessage(userMsg);

      // Placeholder streaming assistant message
      const assistantId = Date.now() + 1;
      addMessage({ id: assistantId, role: "assistant", text: "", isStreaming: true });

      isStreamingRef.current = true;
      setIsStreaming(true);
      try {
        // Build history for Ollama — use full contextual text for last user message
        const problemContext = problemTitle
          ? `The user is currently viewing the "${problemTitle}" problem in the visualizer.`
          : "The user is in a competitive programming visualizer.";
        const stepContext = currentStep
          ? ` They are on a specific algorithm step (step data may be attached to the message).`
          : "";
        const descContext = problemDescription
          ? `\n\nHere is the full problem statement:\n${problemDescription}`
          : "";
        const history = [
          {
            role: "system",
            text: `You are a helpful coding assistant embedded in a competitive programming visualizer. ${problemContext}${stepContext}${descContext}\n\nAnswer questions assuming this problem context. When the user asks about "why" or "how" something works, answer in the context of this problem's algorithm. When the user shares visualizer step data, explain what is happening in the algorithm at that step in clear, concise terms. When asked about code or data structures, be precise and educational.`,
          },
          // Previous messages (last 10 pairs for context window)
          ...messages.slice(-20).map((m) => ({ role: m.role, text: m.text, images: m.images })),
          { role: "user", text: fullText, images },
        ];

        let accumulated = "";
        for await (const delta of streamChat(history)) {
          accumulated += delta;
          updateLastMessage({ text: accumulated });
        }
        updateLastMessage({ text: accumulated, isStreaming: false });
      } catch (err) {
        updateLastMessage({
          text: `⚠️ Error: ${err.message}\n\nMake sure Ollama is running with \`ollama serve\` and the model gemma4:e2b is available.`,
          isStreaming: false,
        });
      } finally {
        isStreamingRef.current = false;
        setIsStreaming(false);
      }
    },
    [messages, addMessage, updateLastMessage, problemTitle, currentStep, problemDescription],
  );

  if (!isOpen) return null;
  // Floating position (persisted)
  const startDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY, origX: pos.x, origY: pos.y };
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      {/* Backdrop (click to close) — ignore when select or floating mode is active */}
      <div
        className="chat-backdrop"
        onClick={() => {
          if (selectMode || floatingMode) return;
          closeChat();
        }}
      />

      <div
        className={`chat-drawer ${floatingMode ? 'chat-drawer--floating' : ''}`}
        role="complementary"
        aria-label="AI Chat Assistant"
        style={floatingMode ? { left: `${pos.x}px`, top: `${pos.y}px`, position: 'fixed' } : {}}
      >
        {/* Header */}
        <div
          className="chat-header"
          onMouseDown={floatingMode ? startDrag : undefined}
          onTouchStart={floatingMode ? startDrag : undefined}
          style={floatingMode ? { cursor: 'move' } : {}}
        >
          <div className="chat-header-left">
            <span className="chat-header-icon">🤖</span>
            <div>
              <div className="chat-header-title">Gemma Assistant</div>
              <div className="chat-header-sub">gemma4:e2b · Ollama</div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              className={`chat-float-toggle ${floatingMode ? 'active' : ''}`}
              onClick={() => toggleFloatingMode()}
              title="Toggle floating chat"
            >
              ⛶ Float
            </button>
            <button
              className={`chat-select-toggle ${selectMode ? 'active' : ''}`}
              onClick={handleToggleSelectMode}
              aria-pressed={selectMode}
              title="Toggle Select Mode (hover to highlight, click to attach)"
            >
              🔍 Select mode
            </button>
            {selectMode && <span className="chat-select-hint">Select mode ON</span>}
            <div className="visually-hidden" aria-live="polite">{selectAnnouncement}</div>
            {/* Attach current step button */}
            <button
              className="chat-attach-step-btn"
              onClick={handleAttachStep}
              disabled={!currentStep}
              title={currentStep ? `Attach current step from ${problemTitle || "visualizer"}` : "No active visualizer step"}
            >
              📎 Attach step
            </button>
            <button className="chat-clear-btn" onClick={clearMessages} title="Clear chat">
              🗑️
            </button>
            <button className="chat-close-btn" onClick={closeChat} title="Close chat">
              ✕
            </button>
          </div>
        </div>

        {/* Message list */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p>Ask Gemma anything about the algorithm you&apos;re visualizing.</p>
              <p className="chat-empty-hint">
                Use <strong>📎 Attach step</strong> to share the current timestep, or click any highlighted element in the visualizer.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          attachedContext={attachedContext}
          onClearContext={clearContext}
          disabled={isStreaming}
        />
      </div>
    </>
  );
}
