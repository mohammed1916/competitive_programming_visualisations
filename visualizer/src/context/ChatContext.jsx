/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useVisualizationContext } from "./VisualizationContext";

const ChatContext = createContext(null);
const CHAT_STORAGE_KEY = "chat.conversations.v1";

function makeConversation(title = "New Chat") {
  const now = Date.now();
  return {
    id: `chat-${now}-${Math.floor(Math.random() * 1000)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function loadConversations() {
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [makeConversation()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [makeConversation()];
    return parsed;
  } catch (err) {
    void err;
    return [makeConversation()];
  }
}

function loadInitialChatState() {
  const convs = loadConversations();
  return { conversations: convs, activeConversationId: convs[0].id };
}

/**
 * Global chat state:
 * - messages[]          — conversation history
 * - attachedContext     — { label, data } | null — data from a visualizer element/step
 * - isOpen              — whether the chat drawer is visible
 */
export function ChatProvider({ children }) {
  const initial = useMemo(() => loadInitialChatState(), []);
  const [conversations, setConversations] = useState(initial.conversations);
  const [activeConversationId, setActiveConversationId] = useState(initial.activeConversationId);
  const [attachedContext, setAttachedContext] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [floatingMode, setFloatingMode] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
    } catch (err) {
      void err;
    }
  }, [conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || conversations[0],
    [conversations, activeConversationId],
  );
  const messages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

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
    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeConversationId) return c;
      const nextMsgs = [...(c.messages || []), msg];
      const nextTitle = (c.title === "New Chat" && msg.role === "user" && msg.text)
        ? msg.text.slice(0, 48)
        : c.title;
      return { ...c, title: nextTitle, updatedAt: Date.now(), messages: nextMsgs };
    }));
  }, [activeConversationId]);

  /** Replace the last message (used for streaming assistant tokens). */
  const updateLastMessage = useCallback((updater) => {
    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeConversationId) return c;
      const curr = c.messages || [];
      if (curr.length === 0) return c;
      const last = curr[curr.length - 1];
      const updatedLast = typeof updater === "function" ? updater(last) : { ...last, ...updater };
      return { ...c, updatedAt: Date.now(), messages: [...curr.slice(0, -1), updatedLast] };
    }));
  }, [activeConversationId]);

  const clearMessages = useCallback(() => {
    setConversations((prev) => prev.map((c) => c.id === activeConversationId ? { ...c, updatedAt: Date.now(), messages: [] } : c));
  }, [activeConversationId]);

  const newChat = useCallback(() => {
    const created = makeConversation();
    setConversations((prev) => [created, ...prev]);
    setActiveConversationId(created.id);
    setAttachedContext(null);
    return created.id;
  }, []);

  const switchChat = useCallback((id) => {
    setActiveConversationId(id);
    setAttachedContext(null);
  }, []);

  const deleteChat = useCallback((id) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fallback = makeConversation();
        setActiveConversationId(fallback.id);
        return [fallback];
      }
      if (id === activeConversationId) setActiveConversationId(next[0].id);
      return next;
    });
    setAttachedContext(null);
  }, [activeConversationId]);

  // Integrate with VisualizationContext to accept structured commands from assistant messages
  const viz = useVisualizationContext();
  const processedCmdIdsRef = useRef(new Set());

  useEffect(() => {
    processedCmdIdsRef.current.clear();
  }, [activeConversationId]);

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
        // Queue the command for user confirmation before applying
        if (viz && typeof viz.queueCommand === 'function') {
          viz.queueCommand(parsed);
        } else {
          // Fallback: apply directly
          viz && viz.visualizeCommand && viz.visualizeCommand(parsed);
        }
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
        conversations,
        activeConversationId,
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
        newChat,
        switchChat,
        deleteChat,
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
