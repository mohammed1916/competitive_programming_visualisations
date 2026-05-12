import { useState, useRef, useCallback, useEffect } from "react";
import ContextBadge from "./ContextBadge";
import { captureVisualizer } from "../../services/screenshot";

/**
 * Chat input bar with:
 * - Textarea (Enter sends, Shift+Enter newline)
 * - Image upload button (file input)
 * - Clipboard paste handler (captures images from clipboard)
 * - 🎤 Mic button (Web Speech API → text)
 * - 📸 Screenshot button (captures current visualizer panel)
 * - Attached context badge with ✕ to remove
 * - Image thumbnail previews with ✕ to remove each
 */
export default function ChatInput({ onSend, attachedContext, onClearContext, disabled }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // base64 data URLs
  const [isListening, setIsListening] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [text]);

  const addImageFromFile = useCallback((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImages((prev) => [...prev, e.target.result]);
    reader.readAsDataURL(file);
  }, []);

  // Paste handler — capture images from clipboard
  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          addImageFromFile(item.getAsFile());
        }
      }
    },
    [addImageFromFile],
  );

  const handleFileChange = useCallback(
    (e) => {
      for (const file of e.target.files) addImageFromFile(file);
      e.target.value = "";
    },
    [addImageFromFile],
  );

  const removeImage = useCallback((idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Screenshot capture
  const handleScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      const dataUrl = await captureVisualizer();
      setImages((prev) => [...prev, dataUrl]);
    } catch (err) {
      console.warn("Screenshot failed:", err.message);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Voice input (Web Speech API)
  const handleMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [isListening]);

  const canSend = !disabled && (text.trim() || images.length > 0);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend({ text: text.trim(), images, contextLabel: attachedContext?.label, contextData: attachedContext?.data });
    setText("");
    setImages([]);
    onClearContext?.();
    textareaRef.current?.focus();
  }, [canSend, text, images, attachedContext, onSend, onClearContext]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="chat-input-wrap">
      {/* Attached context badge */}
      {attachedContext && (
        <div className="chat-input-ctx">
          <ContextBadge label={attachedContext.label} onRemove={onClearContext} />
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="chat-input-images">
          {images.map((src, i) => (
            <div key={i} className="chat-input-img-wrap">
              <img src={src} alt={`preview-${i}`} className="chat-input-img" />
              <button className="chat-input-img-remove" onClick={() => removeImage(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-row">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Image upload */}
        <button
          className="chat-icon-btn"
          title="Attach image"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          🖼️
        </button>

        {/* Screenshot */}
        <button
          className={`chat-icon-btn${isCapturing ? " active" : ""}`}
          title="Screenshot visualizer"
          onClick={handleScreenshot}
          disabled={disabled || isCapturing}
        >
          📸
        </button>

        {/* Mic */}
        <button
          className={`chat-icon-btn${isListening ? " active mic-pulse" : ""}`}
          title={isListening ? "Stop listening" : "Voice input"}
          onClick={handleMic}
          disabled={disabled}
        >
          🎤
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask about the visualizer… (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
        />

        {/* Send */}
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!canSend}
          title="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
