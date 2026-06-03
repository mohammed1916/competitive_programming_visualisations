import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import "./CodeTracePanel.css";
import ResizerHandle from "./ResizerHandle";

import MonacoEditor from "@monaco-editor/react";

export default function CodeTracePanel({
  step,
  codeLines,
  highlightedLines = [],
  onLineSelect,
  title = "Solution Code",
  subtitle = null,
  idleLabel = "Press Play to start",
  activeLabelPrefix = "Line",
  activeLabelSuffix = "is active",
}) {
  const codeRef = useRef(null);
  const lastManualScrollTsRef = useRef(0);
  const [copied, setCopied] = useState(false);
  const [panelHeight, setPanelHeight] = useState(() => {
    try {
      const v = window.localStorage.getItem("ctp.panelHeight");
      return v ? Number(v) : 420;
    } catch {
      return 420;
    }
  });
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(panelHeight);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return;
    if (Date.now() - lastManualScrollTsRef.current < 600) return;
    const el = codeRef.current.querySelector(
      `[data-line="${step.activeLine}"]`,
    );
    if (!el) return;
    const container = codeRef.current;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    const ctTop = container.scrollTop;
    const ctBottom = ctTop + container.clientHeight;
    if (elTop < ctTop || elBottom > ctBottom) {
      el.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [step]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      codeLines.map(({ text }) => text).join("\n"),
    );
    setCopied(true);
  };

  const markManualScroll = () => {
    lastManualScrollTsRef.current = Date.now();
  };

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editorPlacement, setEditorPlacement] = useState(() => {
    try {
      const value = window.localStorage.getItem("ctp.editorPlacement");
      return value === "below" ? "below" : "overlay";
    } catch {
      return "overlay";
    }
  });
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [editorLanguage, setEditorLanguage] = useState("python");
  const [fontSize, setFontSize] = useState(() => {
    try {
      return Number(window.localStorage.getItem("ctp.fontSize")) || 14;
    } catch {
      return 14;
    }
  });
  const [minimapEnabled, setMinimapEnabled] = useState(() => {
    try {
      return window.localStorage.getItem("ctp.minimap") === "1";
    } catch {
      return false;
    }
  });
  const [wordWrap, setWordWrap] = useState(() => {
    try {
      return window.localStorage.getItem("ctp.wordWrap") === "1";
    } catch {
      return true;
    }
  });
  const [readOnly, setReadOnly] = useState(false);
  const initialEditor = () => {
    try {
      const v = window.localStorage.getItem("ctp.editorContent");
      if (v) return v;
    } catch (err) {
      void err;
    }
    return codeLines.map(({ text }) => text).join("\n");
  };
  const [editorContent, setEditorContent] = useState(initialEditor);
  const [showComments, setShowComments] = useState(true);
  const highlightedLineSet = useMemo(
    () => new Set(highlightedLines),
    [highlightedLines],
  );
  const commentsText = `# Write your notes here\n# Toggle comments off to edit cleanly.`;
  const fileHandleRef = useRef(null);
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const shouldFocusEditorRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem("ctp.editorContent", editorContent);
    } catch (err) {
      void err;
    }
  }, [editorContent]);

  const toggleEdit = () => {
    setIsEditing((v) => {
      const next = !v;
      if (next) shouldFocusEditorRef.current = true;
      return next;
    });
  };

  useEffect(() => {
    if (monacoRef.current && editorTheme) {
      try {
        monacoRef.current.editor.setTheme(editorTheme);
      } catch (err) {
        void err;
      }
    }
  }, [editorTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem("ctp.fontSize", String(fontSize));
    } catch (err) {
      void err;
    }
    try {
      window.localStorage.setItem("ctp.minimap", minimapEnabled ? "1" : "0");
    } catch (err) {
      void err;
    }
    try {
      window.localStorage.setItem("ctp.wordWrap", wordWrap ? "1" : "0");
    } catch (err) {
      void err;
    }
  }, [fontSize, minimapEnabled, wordWrap]);

  useEffect(() => {
    try {
      window.localStorage.setItem("ctp.editorPlacement", editorPlacement);
    } catch (err) {
      void err;
    }
  }, [editorPlacement]);

  async function saveToFile() {
    const data =
      (showComments ? commentsText + "\n\n" : "") +
      (editorRef.current ? editorRef.current.getValue() : editorContent);
    // Try File System Access API first
    try {
      if (window.showSaveFilePicker) {
        const handle =
          fileHandleRef.current ||
          (await window.showSaveFilePicker({
            suggestedName: "solution.py",
            types: [
              {
                description: "Python",
                accept: { "text/plain": [".py", ".txt"] },
              },
            ],
          }));
        fileHandleRef.current = handle;
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        return;
      }
    } catch (err) {
      void err;
    }

    // Fallback: prompt download
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solution.py";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function loadFromFile() {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker();
        fileHandleRef.current = handle;
        const file = await handle.getFile();
        const text = await file.text();
        // Strip leading comments if present
        const cleaned = text.replace(/^\s*#.*(?:\r?\n|$)/gm, "");
        setEditorContent(cleaned.trim());
        if (editorRef.current) editorRef.current.setValue(cleaned.trim());
        return;
      }
    } catch (err) {
      void err;
    }

    // Fallback: file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".py,.txt";
    input.onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const t = await f.text();
      setEditorContent(t);
      if (editorRef.current) editorRef.current.setValue(t);
    };
    input.click();
  }

  const startDrag = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsResizing(true);
    startYRef.current = e.touches ? e.touches[0].clientY : e.clientY;
    startHeightRef.current = panelHeight;
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientY = e.type.startsWith("touch")
        ? e.touches[0].clientY
        : e.clientY;
      const delta = clientY - startYRef.current;
      const next = Math.max(
        120,
        Math.min(1200, startHeightRef.current + delta),
      );
      setPanelHeight(next);
    };

    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsResizing(false);
      document.body.style.userSelect = "";
      try {
        window.localStorage.setItem("ctp.panelHeight", String(panelHeight));
      } catch (err) {
        void err;
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [panelHeight]);

  const formatDocument = () => {
    try {
      const ed = editorRef.current;
      const mon = monacoRef.current;
      if (!ed || !mon) return;
      const action =
        ed.getAction && ed.getAction("editor.action.formatDocument");
      if (action && action.run) action.run();
      else if (mon && mon.languages && mon.languages.formatting) {
        // best-effort: nothing to do
      }
    } catch (err) {
      void err;
    }
  };

  const toggleEditorPlacement = () => {
    setEditorPlacement((value) => (value === "overlay" ? "below" : "overlay"));
  };

  const isInlineEditor = isEditing && editorPlacement === "below";
  const codeAreaHeight = isInlineEditor
    ? `${Math.max(140, Math.round(panelHeight * 0.46))}px`
    : `${panelHeight}px`;

  const editorBody = (
    <div className="ctp-editor-wrap">
      <div className="ctp-editor-controls">
        <button
          className="ctp-editor-btn"
          onClick={() => setShowComments((s) => !s)}
        >
          {showComments ? "Hide comments" : "Show comments"}
        </button>
        <button className="ctp-editor-btn" onClick={loadFromFile}>
          Load file
        </button>
        <button className="ctp-editor-btn" onClick={saveToFile}>
          Save file
        </button>
        <label
          style={{
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Theme
          <select
            className="ctp-editor-select"
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
          >
            <option value="vs">Light</option>
            <option value="vs-dark">Dark</option>
            <option value="hc-black">High contrast</option>
          </select>
        </label>
        <label
          style={{
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Lang
          <select
            className="ctp-editor-select"
            value={editorLanguage}
            onChange={(e) => {
              setEditorLanguage(e.target.value);
              try {
                if (monacoRef.current && editorRef.current)
                  monacoRef.current.editor.setModelLanguage(
                    editorRef.current.getModel(),
                    e.target.value,
                  );
              } catch (err) {
                void err;
              }
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </select>
        </label>

        <label
          style={{
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Font
          <input
            className="ctp-editor-select"
            type="number"
            min="10"
            max="28"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value) || 14)}
            style={{ width: 72 }}
          />
        </label>

        <label
          style={{
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            checked={minimapEnabled}
            onChange={(e) => setMinimapEnabled(e.target.checked)}
          />{" "}
          Minimap
        </label>

        <label
          style={{
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            checked={wordWrap}
            onChange={(e) => setWordWrap(e.target.checked)}
          />{" "}
          Word wrap
        </label>

        <label
          style={{
            marginLeft: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => setReadOnly(e.target.checked)}
          />{" "}
          Read only
        </label>

        <button
          className="ctp-editor-btn"
          onClick={() => formatDocument()}
          style={{ marginLeft: 8 }}
        >
          Format
        </button>
      </div>
      <Suspense
        fallback={
          <textarea
            className="ctp-editor-textarea"
            value={(showComments ? commentsText + "\n\n" : "") + editorContent}
            onChange={(e) =>
              setEditorContent(
                e.target.value.replace(/^(?:#.*\n)*/, "").replace(/^\n+/, ""),
              )
            }
          />
        }
      >
        <MonacoEditor
          height="420px"
          defaultLanguage={editorLanguage}
          value={(showComments ? commentsText + "\n\n" : "") + editorContent}
          onChange={(v) =>
            setEditorContent(
              (v ?? "").replace(/^(?:#.*\n)*/, "").replace(/^\n+/, ""),
            )
          }
          options={{
            minimap: { enabled: minimapEnabled },
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
            fontSize,
            wordWrap: wordWrap ? "on" : "off",
            readOnly,
          }}
          onMount={(editor, monaco) => {
            monacoRef.current = monaco;
            editorRef.current = editor;
            try {
              monaco.editor.setTheme(editorTheme);
            } catch (err) {
              void err;
            }
            try {
              monaco.editor.setModelLanguage(editor.getModel(), editorLanguage);
            } catch (err) {
              void err;
            }
            if (shouldFocusEditorRef.current) {
              try {
                editor.focus();
              } catch (err) {
                void err;
              }
              shouldFocusEditorRef.current = false;
            }
            try {
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                  saveToFile();
                },
              );
              editor.addCommand(
                monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
                () => {
                  formatDocument();
                },
              );
            } catch (err) {
              void err;
            }
          }}
        />
      </Suspense>
    </div>
  );

  return (
    <motion.div
      className={`ctp-panel ${isInlineEditor ? "editing-below" : ""}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="ctp-head">
        <div>
          <div className="ctp-title">{title}</div>
          <div className="ctp-subtitle">
            {subtitle ||
              (step ? (
                <>
                  {activeLabelPrefix}{" "}
                  <span className="mono ctp-chip">{step.activeLine}</span>{" "}
                  {activeLabelSuffix}
                </>
              ) : (
                idleLabel
              ))}
          </div>
        </div>
        <button
          type="button"
          className={`ctp-copy-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Copied" : "Copy code"}
        </button>
        <button
          type="button"
          className="ctp-copy-btn"
          onClick={toggleEdit}
          style={{ marginLeft: 8 }}
        >
          {isEditing ? "Close editor" : "Edit code"}
        </button>
        <button
          type="button"
          className="ctp-copy-btn"
          onClick={toggleEditorPlacement}
          style={{ marginLeft: 8 }}
        >
          Editor: {editorPlacement === "overlay" ? "Modal" : "Below"}
        </button>
      </div>

      <div
        className="ctp-scroll"
        ref={codeRef}
        onWheel={markManualScroll}
        onTouchMove={markManualScroll}
        style={{ height: codeAreaHeight }}
      >
        {codeLines.map(({ line, text }) => {
          const isActive = step?.activeLine === line;
          const isRelated = step?.relatedLines?.includes(line);
          const isExternallyHighlighted = highlightedLineSet.has(line);
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`ctp-row ${isActive ? "active" : ""} ${isRelated ? "related" : ""} ${isExternallyHighlighted ? "external-highlight" : ""} ${onLineSelect ? "clickable" : ""}`}
              animate={{
                x: isActive ? 6 : 0,
                opacity:
                  isRelated || isActive || isExternallyHighlighted || !step
                    ? 1
                    : 0.56,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={
                onLineSelect ? () => onLineSelect(line, { text }) : undefined
              }
            >
              <span className="ctp-no mono">{line}</span>
              <code className="ctp-text">{text || " "}</code>
            </motion.div>
          );
        })}
      </div>

      <div
        className={`ctp-resizer ${isResizing ? "active" : ""}`}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        aria-hidden="true"
      >
        <ResizerHandle
          side="center"
          className="ctp"
          onPointerDown={startDrag}
        />
      </div>

      {isInlineEditor ? (
        <motion.div
          className="ctp-editor-inline"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {editorBody}
        </motion.div>
      ) : null}
      {isEditing && editorPlacement === "overlay"
        ? createPortal(
            <div className="ctp-editor-backdrop" onClick={toggleEdit}>
              <div
                className="ctp-editor-modal"
                onClick={(event) => event.stopPropagation()}
              >
                {editorBody}
              </div>
            </div>,
            document.body,
          )
        : null}
    </motion.div>
  );
}
