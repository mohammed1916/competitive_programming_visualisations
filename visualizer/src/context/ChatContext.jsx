/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useVisualizationContext } from "./VisualizationContext";

const ChatContext = createContext(null);

/**
 * Global chat state:
 * - messages[]          — conversation history
 * - attachedContext     — { label, data } | null — data from a visualizer element/step
 * - isOpen              — whether the chat drawer is visible
 */
export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [attachedContext, setAttachedContext] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [floatingMode, setFloatingMode] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  // Global keyboard shortcut: Alt+C toggles the chat drawer
  useEffect(() => {
    const onKey = (e) => {
      // Ignore if the user is typing in an input or textarea
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const enableSelectMode = useCallback(() => setSelectMode(true), []);
  const disableSelectMode = useCallback(() => setSelectMode(false), []);
  const toggleSelectMode = useCallback(() => setSelectMode((v) => !v), []);

  const enableFloatingMode = useCallback(() => setFloatingMode(true), []);
  const disableFloatingMode = useCallback(() => setFloatingMode(false), []);
  const toggleFloatingMode = useCallback(() => setFloatingMode((v) => !v), []);

  /** Attach a labelled data payload from any visualizer element or step. */
  const attachContext = useCallback((label, data) => {
    setAttachedContext({ label, data });
  }, []);

  const clearContext = useCallback(() => setAttachedContext(null), []);

  /** Append a message to the conversation. */
  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /** Replace the last message (used for streaming assistant tokens). */
  const updateLastMessage = useCallback((updater) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), typeof updater === "function" ? updater(last) : { ...last, ...updater }];
    });
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  // Integrate with VisualizationContext to accept structured commands from assistant messages
  const viz = useVisualizationContext();
  const processedCmdIdsRef = useRef(new Set());

  useEffect(() => {
    if (!viz) return;
    const last = messages.length ? messages[messages.length - 1] : null;
    if (!last || last.role !== 'assistant' || !last.text) return;
    if (processedCmdIdsRef.current.has(last.id)) return;

    // Look for fenced JSON blocks marked as ```json or ```viz
    const m = last.text.match(/```(?:json|viz)\s*([\s\S]*?)```/i);
    if (!m) return;
    try {
      const parsed = JSON.parse(m[1]);
      // Basic validation: must be an object with an action
      if (parsed && typeof parsed === 'object' && parsed.action) {
        // For minimal demo: auto-apply the command
        viz.visualizeCommand(parsed);
      }
    } catch (err) {
      console.warn('Failed to parse visualization command from assistant message', err);
    }
    processedCmdIdsRef.current.add(last.id);
  }, [messages, viz]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        attachedContext,
        selectMode,
        floatingMode,
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        enableSelectMode,
        disableSelectMode,
        toggleSelectMode,
        enableFloatingMode,
        disableFloatingMode,
        toggleFloatingMode,
        attachContext,
        clearContext,
        addMessage,
        updateLastMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}
