/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";

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
