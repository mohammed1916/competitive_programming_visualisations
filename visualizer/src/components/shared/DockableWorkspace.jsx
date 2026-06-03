import { useMemo, useState } from "react";
import "./DockableWorkspace.css";

const ZONES = ["left", "right", "full"];

function removeFromZones(layout, panelId) {
  return {
    left: layout.left.filter((id) => id !== panelId),
    right: layout.right.filter((id) => id !== panelId),
    full: layout.full.filter((id) => id !== panelId),
    minimized: layout.minimized.filter((id) => id !== panelId),
  };
}

function movePanel(layout, panelId, targetZone) {
  const next = removeFromZones(layout, panelId);
  next[targetZone] = [...next[targetZone], panelId];
  return next;
}

export default function DockableWorkspace({
  panels,
  initialLayout,
  title = "Workspace",
}) {
  const panelMap = useMemo(
    () => new Map(panels.map((panel) => [panel.id, panel])),
    [panels],
  );
  const [layout, setLayout] = useState(initialLayout);
  const [draggedId, setDraggedId] = useState(null);
  const [hoverZone, setHoverZone] = useState(null);
  const [maximizedId, setMaximizedId] = useState(null);

  const activeMaximizedPanel = maximizedId ? panelMap.get(maximizedId) : null;

  const placePanel = (panelId, targetZone) => {
    setLayout((current) => movePanel(current, panelId, targetZone));
    setHoverZone(null);
  };

  const minimizePanel = (panelId) => {
    setLayout((current) => {
      const next = removeFromZones(current, panelId);
      next.minimized = [...next.minimized, panelId];
      return next;
    });
    if (maximizedId === panelId) setMaximizedId(null);
  };

  const restorePanel = (panelId, preferredZone = "right") => {
    setLayout((current) => {
      const next = removeFromZones(current, panelId);
      next[preferredZone] = [...next[preferredZone], panelId];
      return next;
    });
  };

  const renderPanelCard = (panelId) => {
    const panel = panelMap.get(panelId);
    if (!panel) return null;

    return (
      <article
        key={panel.id}
        className="dock-panel"
        draggable
        onDragStart={() => setDraggedId(panel.id)}
        onDragEnd={() => {
          setDraggedId(null);
          setHoverZone(null);
        }}
      >
        <header className="dock-panel-head">
          <div className="dock-panel-title-group">
            <span className="dock-panel-grip" aria-hidden="true">
              :::
            </span>
            <div>
              <strong>{panel.title}</strong>
              {panel.subtitle ? <small>{panel.subtitle}</small> : null}
            </div>
          </div>

          <div className="dock-panel-actions">
            <button
              type="button"
              className="dock-panel-btn"
              onClick={() =>
                setMaximizedId((current) =>
                  current === panel.id ? null : panel.id,
                )
              }
            >
              {maximizedId === panel.id ? "Restore" : "Maximize"}
            </button>
            <button
              type="button"
              className="dock-panel-btn"
              onClick={() => minimizePanel(panel.id)}
            >
              Minimize
            </button>
          </div>
        </header>

        <div className="dock-panel-body">{panel.content}</div>
      </article>
    );
  };

  return (
    <section className="dock-workspace">
      <header className="dock-workspace-head">
        <div>
          <span className="dock-workspace-kicker">Dockable layout</span>
          <h3>{title}</h3>
        </div>
        <p>
          Drag panels into the left half, right half, or full-width lane. Use
          maximize for focus mode and minimize to collapse a panel back into a tab.
        </p>
      </header>

      {draggedId ? (
        <div className="dock-drop-row">
          {ZONES.map((zone) => (
            <button
              key={zone}
              type="button"
              className={`dock-drop-zone ${hoverZone === zone ? "active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setHoverZone(zone);
              }}
              onDragLeave={() => setHoverZone((current) => (current === zone ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                placePanel(draggedId, zone);
                setDraggedId(null);
              }}
            >
              <span>{zone === "full" ? "Full width" : `${zone} half`}</span>
              <strong>
                {zone === "left"
                  ? "Snap to left"
                  : zone === "right"
                    ? "Snap to right"
                    : "Take the whole row"}
              </strong>
            </button>
          ))}
        </div>
      ) : null}

      {activeMaximizedPanel ? (
        <div className="dock-maximized">
          <div className="dock-maximized-bar">
            <strong>{activeMaximizedPanel.title}</strong>
            <button
              type="button"
              className="dock-panel-btn"
              onClick={() => setMaximizedId(null)}
            >
              Back to layout
            </button>
          </div>
          <div className="dock-maximized-body">{activeMaximizedPanel.content}</div>
        </div>
      ) : (
        <div className="dock-grid">
          <div className="dock-column">
            {layout.left.length > 0 ? (
              layout.left.map(renderPanelCard)
            ) : (
              <div className="dock-empty">Drop a panel into the left half.</div>
            )}
          </div>
          <div className="dock-column">
            {layout.right.length > 0 ? (
              layout.right.map(renderPanelCard)
            ) : (
              <div className="dock-empty">Drop a panel into the right half.</div>
            )}
          </div>
          <div className="dock-full-lane">
            {layout.full.length > 0 ? (
              layout.full.map(renderPanelCard)
            ) : (
              <div className="dock-empty">Full-width panels appear here.</div>
            )}
          </div>
        </div>
      )}

      {layout.minimized.length > 0 ? (
        <div className="dock-minimized-row">
          <span className="dock-minimized-label">Minimized panels</span>
          {layout.minimized.map((panelId) => {
            const panel = panelMap.get(panelId);
            if (!panel) return null;
            return (
              <button
                key={panelId}
                type="button"
                className="dock-minimized-pill"
                onClick={() => restorePanel(panelId, panel.defaultZone || "right")}
              >
                {panel.title}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
