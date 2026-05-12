import { useEffect, useRef, useCallback } from "react";
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
  } = useChatContext();

  const { currentStep, problemTitle } = useVisualizationContext();
  const messagesEndRef = useRef(null);
  const isStreamingRef = useRef(false);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      try {
        // Build history for Ollama — use full contextual text for last user message
        const history = [
          {
            role: "system",
            text: "You are a helpful coding assistant embedded in a competitive programming visualizer. When the user shares visualizer step data, explain what is happening in the algorithm at that step in clear, concise terms. When asked about code or data structures, be precise and educational.",
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
      }
    },
    [messages, addMessage, updateLastMessage, problemTitle],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (click to close) */}
      <div className="chat-backdrop" onClick={closeChat} />

      <div className="chat-drawer" role="complementary" aria-label="AI Chat Assistant">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="chat-header-icon">🤖</span>
            <div>
              <div className="chat-header-title">Gemma Assistant</div>
              <div className="chat-header-sub">gemma4:e2b · Ollama</div>
            </div>
          </div>
          <div className="chat-header-actions">
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
          disabled={isStreamingRef.current}
        />
      </div>
    </>
  );
}
