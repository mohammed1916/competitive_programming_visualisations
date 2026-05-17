import { useEffect, useRef, useCallback, useState } from "react";
import { useChatContext } from "../../context/ChatContext";
import { useVisualizationContext } from "../../context/VisualizationContext";
import { streamChat } from "../../services/ollama";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ResizablePanel from "../ResizablePanel";

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
    conversations, activeConversationId, newChat, switchChat, deleteChat,
    attachedContext, attachContext, clearContext,
    isOpen, closeChat,
    selectMode, toggleSelectMode,
    floatingMode, toggleFloatingMode,
  } = useChatContext();
  const [selectAnnouncement, setSelectAnnouncement] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const viz = useVisualizationContext();
  const { currentStep, problemTitle, problemDescription, problemState, getManifest } = viz;
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

  // Chat size (persisted) — width and height for floating, width for docked
  const [chatSize, setChatSize] = useState(() => {
    try { const s = window.localStorage.getItem('chat.size'); if (s) return JSON.parse(s); } catch (err) { void err }
    return { width: 380, height: 520 };
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
      const wantsVisualization = /\b(visuali[sz]e|show|annotat|highlight|animate)\b/i.test(text || "");
      if (contextData) {
        const isStep = contextData.activeLine !== undefined || contextData.phase !== undefined;
        contextBlock = isStep
          ? formatStepContext(contextData, problemTitle)
          : formatElementContext(contextLabel, contextData);
      } else if (wantsVisualization && (currentStep || problemState)) {
        const baseline = problemState ? `[Context: Problem state]\n${JSON.stringify(problemState, null, 2)}` : "";
        const stepCtx = currentStep ? formatStepContext(currentStep, problemTitle) : "";
        contextBlock = [baseline, stepCtx].filter(Boolean).join("\n\n");
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
        const manifest = getManifest ? getManifest() : null;
        const manifestText = manifest ? `\n\nAvailable visualization primitives and targets:\n${JSON.stringify(manifest, null, 2)}` : '';
        const stepStateText = currentStep ? `\n\nCurrent visualizer state (JSON):\n${JSON.stringify(currentStep, null, 2)}` : '';
        const problemStateText = problemState ? `\n\nBaseline problem state (JSON):\n${JSON.stringify(problemState, null, 2)}` : '';
        const assistantInstructions = `\n\nIf the user asks to visualize a calculation or expression, use only the available targets and primitives from the manifest and the current visualizer state. Do NOT ask for variables that are already present in the current state. When producing visualization output, prefer emitting a single fenced JSON block using either ~~~json or ~~~viz containing a command object. Example command (annotate buckets):\n\n~~~json\n{\n  "action": "annotate",\n  "labels": [ { "target": "bucket", "index": 2, "text": "b = (x - lo) // bsize" } ]\n}\n~~~\n\nThe JSON schema: top-level object with 'action' (string) and action-specific fields. Allowed actions: 'annotate', 'highlight', 'animate'. Use target types from the manifest (e.g., 'bucket', 'array-item').`;
        const history = [
          {
            role: "system",
            text: `You are a helpful coding assistant embedded in a competitive programming visualizer. ${problemContext}${stepContext}${descContext}${manifestText}${stepStateText}${problemStateText}${assistantInstructions}\n\nAnswer questions assuming this problem context. When the user asks about "why" or "how" something works, answer in the context of this problem's algorithm. When the user shares visualizer step data, explain what is happening in the algorithm at that step in clear, concise terms. When asked about code or data structures, be precise and educational.`,
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
    [messages, addMessage, updateLastMessage, problemTitle, currentStep, problemDescription, problemState, getManifest],
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
  const handleResize = (size, type) => {
    setChatSize((prev) => {
      const newSize = { ...prev, ...(size.width ? { width: size.width } : {}), ...(size.height ? { height: size.height } : {}) };
      // Adjust position when resizing from left or top to keep the opposite edge fixed
      if (floatingMode) {
        if (type === 'left' && size.width) {
          setPos((p) => ({ x: Math.max(6, Math.min(window.innerWidth - 200, p.x + (prev.width - size.width))), y: p.y }));
        }
        if (type === 'top' && size.height) {
          setPos((p) => ({ x: p.x, y: Math.max(6, Math.min(window.innerHeight - 120, p.y + (prev.height - size.height))) }));
        }
      }
      return newSize;
    });
  };
  const handleResizeEnd = () => {
    try { window.localStorage.setItem('chat.size', JSON.stringify(chatSize)); } catch (err) { void err }
  };

  // render content (header, messages, input)
  const chatContent = (
    <div
      className={`chat-drawer ${floatingMode ? 'chat-drawer--floating' : 'chat-drawer--docked'}`}
      role="complementary"
      aria-label="AI Chat Assistant"
      style={floatingMode ? { position: 'relative', width: '100%', height: '100%', cursor: 'default' } : { position: 'relative', width: '100%', height: '100%' }}
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
            <div className="chat-header-title">Gemma Assistant <span className="chat-shortcut">(Alt+C)</span></div>
            <div className="chat-header-sub">gemma4:e2b · Ollama</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="chat-history-toggle"
            onClick={() => setHistoryOpen((v) => !v)}
            title="Toggle chat history"
          >
            🕘 History
          </button>
          <button
            className="chat-new-toggle"
            onClick={() => {
              newChat();
              setHistoryOpen(false);
            }}
            title="Start new chat"
          >
            ＋ New
          </button>
          <button
            className={`chat-float-toggle ${floatingMode ? 'active' : ''}`}
            onClick={() => toggleFloatingMode()}
            title="Toggle floating chat"
          >
            <span className="">⛶</span> {floatingMode ? 'Dock' : 'Float'}
          </button>
          <button
            className={`chat-select-toggle ${selectMode ? 'active' : ''}`}
            onClick={handleToggleSelectMode}
            aria-pressed={selectMode}
            title="Toggle Select Mode (hover to highlight, click to attach)"
          >
            🔍 Select mode
            {selectMode && <span className="chat-select-hint">Select mode ON</span>}
          </button>
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

      {historyOpen && (
        <div className="chat-history-panel">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`chat-history-item ${c.id === activeConversationId ? 'active' : ''}`}
              onClick={() => {
                switchChat(c.id);
                setHistoryOpen(false);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  switchChat(c.id);
                  setHistoryOpen(false);
                }
              }}
            >
              <div className="chat-history-main">
                <div className="chat-history-title">{c.title || 'New Chat'}</div>
                <div className="chat-history-meta">{(c.messages || []).length} msgs</div>
              </div>
              <button
                className="chat-history-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

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
    </div >
  );

  return (
    <>
      {/* Backdrop (click to close) — ignore when select or floating mode is active */}
      <div
        className="chat-backdrop"
        style={(floatingMode || selectMode) ? { pointerEvents: 'none' } : {}}
        onClick={() => {
          if (selectMode || floatingMode) return;
          closeChat();
        }}
      />

      {/* Floating: position wrapper + full resizable panel; Docked: resizable panel anchored left */}
      {floatingMode ? (
        <div style={{ position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 1000 }}>
          <ResizablePanel width={chatSize.width} height={chatSize.height} onResize={handleResize} onResizeEnd={handleResizeEnd} handles={['left', 'right', 'top', 'bottom', 'corner']}>
            {chatContent}
          </ResizablePanel>
        </div>
      ) : (
        <ResizablePanel
          width={chatSize.width}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
          handles={['left']}
          className="chat-panel-docked"
          style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 1002 }}
        >
          {chatContent}
        </ResizablePanel>
      )}
    </>
  );
}
