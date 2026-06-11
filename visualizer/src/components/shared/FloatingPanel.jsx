import { useRef, useState, useLayoutEffect } from "react";
import "./FloatingPanel.css";

export default function FloatingPanel({
  title = "Panel",
  children,
  defaultPosition = null,
}) {
  const panelRef = useRef(null);
  const dragState = useRef(null);
  const [position, setPosition] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    if (position) return;
    const node = panelRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setPosition(
      defaultPosition ?? {
        x: (window.innerWidth - rect.width) / 2,
        y: window.innerHeight - rect.height - 84,
      },
    );
  }, [position, defaultPosition]);

  const clampToViewport = (point) => {
    const rect = panelRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max(point.x, 8), window.innerWidth - rect.width - 8),
      y: Math.min(Math.max(point.y, 8), window.innerHeight - rect.height - 8),
    };
  };

  const handlePointerDown = (event) => {
    if (event.target.closest("button")) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState.current) return;
    setPosition(
      clampToViewport({
        x: event.clientX - dragState.current.offsetX,
        y: event.clientY - dragState.current.offsetY,
      }),
    );
  };

  const handlePointerUp = (event) => {
    if (!dragState.current) return;
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={panelRef}
      className={`floating-panel ${collapsed ? "collapsed" : ""}`}
      style={position ? { top: position.y, left: position.x } : undefined}
    >
      <div
        className="floating-panel-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className="floating-panel-grip" aria-hidden="true">
          :::
        </span>
        <span className="floating-panel-title">{title}</span>
        <button
          type="button"
          className="floating-panel-collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>
      {!collapsed && <div className="floating-panel-body">{children}</div>}
    </div>
  );
}
