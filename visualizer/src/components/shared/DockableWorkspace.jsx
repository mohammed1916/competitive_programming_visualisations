import { useMemo, useState, useEffect } from "react";
import "./DockableWorkspace.css";

const ZONES = ["left", "right", "full"];

const LAYOUT_ZONES = {
  topLeft: { name: 'Left Panel', label: 'LEFT', row: 0, col: 0, zone: 'left' },
  topCenter: { name: 'Visualization', label: 'VIZ', row: 0, col: 1, zone: 'full' },
  topRight: { name: 'Right Panel', label: 'RIGHT', row: 0, col: 2, zone: 'right' },
  bottomLeft: { name: 'Left Panel', label: 'LEFT', row: 1, col: 0, zone: 'left' },
  bottomCenter: { name: 'Full Width', label: 'FULL', row: 1, col: 1, zone: 'full' },
  bottomRight: { name: 'Right Panel', label: 'RIGHT', row: 1, col: 2, zone: 'right' },
};

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
  const [hoveredLayoutZone, setHoveredLayoutZone] = useState(null);
  const [maximizedId, setMaximizedId] = useState(null);

  const activeMaximizedPanel = maximizedId ? panelMap.get(maximizedId) : null;

  const getClosestLayoutZone = (mouseX, mouseY) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const previewWidth = 600;
    const previewHeight = 400;
    const startX = centerX - previewWidth / 2;
    const startY = centerY - previewHeight / 2;

    const cellWidth = previewWidth / 3;
    const cellHeight = previewHeight / 2;

    let closest = null;
    let minDistance = Infinity;

    Object.entries(LAYOUT_ZONES).forEach(([key, zone]) => {
      const zoneX = startX + zone.col * cellWidth + cellWidth / 2;
      const zoneY = startY + zone.row * cellHeight + cellHeight / 2;
      const distance = Math.sqrt(Math.pow(mouseX - zoneX, 2) + Math.pow(mouseY - zoneY, 2));

      if (distance < minDistance) {
        minDistance = distance;
        closest = key;
      }
    });

    return closest;
  };

  const placePanel = (panelId, targetZone) => {
    setLayout((current) => movePanel(current, panelId, targetZone));
    setHoverZone(null);
    setHoveredLayoutZone(null);
  };

  useEffect(() => {
    if (!draggedId) return;

    const handleDocumentDragOver = (e) => {
      e.preventDefault();
      const zone = getClosestLayoutZone(e.clientX, e.clientY);
      setHoveredLayoutZone(zone);
    };

    const handleDocumentDragEnd = () => {
      setDraggedId(null);
      setHoveredLayoutZone(null);
    };

    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragend', handleDocumentDragEnd);

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragend', handleDocumentDragEnd);
    };
  }, [draggedId]);

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

      {draggedId && (
        <div className="dock-layout-preview-wrapper">
          <div className="dock-layout-preview">
            <div className="dock-layout-grid">
              {Object.entries(LAYOUT_ZONES).map(([key, zone]) => {
                const isHovered = key === hoveredLayoutZone;
                return (
                  <div
                    key={key}
                    className={`dock-zone ${isHovered ? 'hovered' : ''}`}
                    style={{
                      gridRow: zone.row + 1,
                      gridColumn: zone.col + 1,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoveredLayoutZone(key);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      placePanel(draggedId, zone.zone);
                      setDraggedId(null);
                    }}
                  >
                    <div className="dock-zone-inner">
                      <div className="dock-zone-label">{zone.label}</div>
                      <div className="dock-zone-name">{zone.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="dock-preview-title">Drop Panel Here</div>
          </div>
          <div className="dock-preview-backdrop" />
        </div>
      )}

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
