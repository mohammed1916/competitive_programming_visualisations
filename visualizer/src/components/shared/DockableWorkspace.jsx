import { useMemo, useState, useEffect } from "react";
import "./DockableWorkspace.css";

function getGridLayout(layout) {
  const rows = [];
  for (const rowPanels of layout.rows || []) {
    rows.push(Array.isArray(rowPanels) ? rowPanels : [rowPanels]);
  }
  return rows;
}

function removePanelFromLayout(layout, panelId) {
  const rows = getGridLayout(layout).map((row) =>
    row.filter((id) => id !== panelId)
  );
  return {
    rows: rows.filter((row) => row.length > 0),
    minimized: layout.minimized.filter((id) => id !== panelId),
  };
}

function placePanelInZone(layout, panelId, targetRow, targetCol, side) {
  const next = removePanelFromLayout(layout, panelId);
  const rows = getGridLayout(next);

  if (!rows[targetRow]) {
    rows[targetRow] = [];
  }

  if (side === "left" || side === "split-left") {
    rows[targetRow].splice(targetCol, 0, panelId);
  } else if (side === "right" || side === "split-right") {
    rows[targetRow].splice(targetCol + 1, 0, panelId);
  } else if (side === "full" || side === "new-row") {
    rows[targetRow] = [panelId];
  }

  return { rows, minimized: next.minimized };
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
  const [hoveredZone, setHoveredZone] = useState(null);
  const [maximizedId, setMaximizedId] = useState(null);
  const [minimizeFlyer, setMinimizeFlyer] = useState(null);

  const activeMaximizedPanel = maximizedId ? panelMap.get(maximizedId) : null;

  const getZoneAtMouse = (mouseX, mouseY) => {
    const preview = document.querySelector(".dock-layout-preview");
    if (!preview) return null;

    const rect = preview.getBoundingClientRect();
    const grid = document.querySelector(".dock-birdseye-grid");
    if (!grid) return null;

    const cells = grid.querySelectorAll(".dock-cell");
    let closest = null;
    let minDistance = Infinity;

    cells.forEach((cell) => {
      const cellRect = cell.getBoundingClientRect();
      const cellCenterX = cellRect.left - rect.left + cellRect.width / 2;
      const cellCenterY = cellRect.top - rect.top + cellRect.height / 2;
      const distance = Math.sqrt(
        Math.pow(mouseX - (rect.left + cellCenterX), 2) +
          Math.pow(mouseY - (rect.top + cellCenterY), 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = cell.dataset.zone;
      }
    });

    return closest;
  };

  useEffect(() => {
    if (!draggedId) return;

    const handleDocumentDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const zone = getZoneAtMouse(e.clientX, e.clientY);
      setHoveredZone(zone);
    };

    const handleDocumentDrop = (e) => {
      e.preventDefault();
      const zone = getZoneAtMouse(e.clientX, e.clientY);
      if (zone) {
        const [row, col, side] = zone.split("-").map((v, i) => (i < 2 ? Number(v) : v));
        setLayout((current) =>
          placePanelInZone(current, draggedId, row, col, side)
        );
      }
      setDraggedId(null);
      setHoveredZone(null);
    };

    const handleDocumentDragEnd = () => {
      setDraggedId(null);
      setHoveredZone(null);
    };

    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("drop", handleDocumentDrop);
    document.addEventListener("dragend", handleDocumentDragEnd);

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("drop", handleDocumentDrop);
      document.removeEventListener("dragend", handleDocumentDragEnd);
    };
  }, [draggedId]);

  const minimizePanel = (panelId, sourceEvent) => {
    const card = sourceEvent?.currentTarget?.closest(
      ".dock-panel, .dock-maximized"
    );
    if (card) {
      const rect = card.getBoundingClientRect();
      setMinimizeFlyer({
        id: panelId,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      window.setTimeout(() => setMinimizeFlyer(null), 500);
    }
    setLayout((current) => removePanelFromLayout(current, panelId));
    if (maximizedId === panelId) setMaximizedId(null);
  };

  const restorePanel = (panelId) => {
    setLayout((current) => {
      const next = removePanelFromLayout(current, panelId);
      const rows = getGridLayout(next);
      if (!rows.length) rows.push([]);
      rows[0] = [panelId, ...rows[0]];
      return { rows, minimized: next.minimized };
    });
  };

  const startFlyerAnimation = (node) => {
    if (!node || node.dataset.flying) return;
    node.dataset.flying = "true";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        node.style.top = `${window.innerHeight - 64}px`;
        node.style.left = `${window.innerWidth / 2 - 80}px`;
        node.style.width = "160px";
        node.style.height = "36px";
        node.style.opacity = "0";
        node.style.borderRadius = "999px";
      });
    });
  };

  const renderPanelCard = (panelId) => {
    const panel = panelMap.get(panelId);
    if (!panel) return null;

    const handleDragStart = (e) => {
      e.dataTransfer.setData("text/plain", panelId);
      e.dataTransfer.effectAllowed = "move";
      const card = e.currentTarget.closest(".dock-panel");
      if (card) {
        e.dataTransfer.setDragImage(card, 24, 24);
      }
      window.setTimeout(() => setDraggedId(panelId), 0);
    };

    const handleDragEnd = () => {
      setDraggedId(null);
      setHoveredZone(null);
    };

    return (
      <article key={panel.id} className="dock-panel">
        <header
          className="dock-panel-head"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                  current === panel.id ? null : panel.id
                )
              }
            >
              {maximizedId === panel.id ? "Restore" : "Maximize"}
            </button>
            <button
              type="button"
              className="dock-panel-btn"
              onClick={(e) => minimizePanel(panel.id, e)}
            >
              Minimize
            </button>
          </div>
        </header>

        <div className="dock-panel-body">{panel.content}</div>
      </article>
    );
  };

  const gridLayout = getGridLayout(layout);

  return (
    <section className="dock-workspace">
      <header className="dock-workspace-head">
        <div>
          <span className="dock-workspace-kicker">Dockable layout</span>
          <h3>{title}</h3>
        </div>
        <p>
          Drag panels to arrange them like a puzzle. Drop on a panel to split
          it, or drop in gaps to fill them.
        </p>
      </header>

      {draggedId && (
        <div className="dock-layout-preview-wrapper">
          <div className="dock-layout-preview">
            <div className="dock-birdseye-grid">
              {gridLayout.map((row, rowIdx) => (
                <div key={`row-${rowIdx}`} className="dock-birdseye-row">
                  {row.map((panelId, colIdx) => {
                    const panel = panelMap.get(panelId);
                    const zoneId = `${rowIdx}-${colIdx}`;
                    const isHovered = hoveredZone?.startsWith(zoneId);
                    return (
                      <div
                        key={`cell-${panelId}`}
                        className={`dock-cell ${isHovered ? "hovered" : ""}`}
                      >
                        <div className="dock-cell-left" data-zone={`${zoneId}-left`}>
                          <span className="dock-cell-label">
                            {panel?.title || "Panel"}
                          </span>
                        </div>
                        <div className="dock-cell-right" data-zone={`${zoneId}-right`}>
                          <span className="dock-cell-label">→</span>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    key={`gap-${rowIdx}`}
                    className={`dock-cell dock-cell-gap ${
                      hoveredZone === `${rowIdx}-gap` ? "hovered" : ""
                    }`}
                    data-zone={`${rowIdx}-gap`}
                  >
                    <span className="dock-cell-label">+ Fill gap</span>
                  </div>
                </div>
              ))}
              <div className="dock-birdseye-row">
                <div
                  className={`dock-cell dock-cell-new-row ${
                    hoveredZone === "new-row" ? "hovered" : ""
                  }`}
                  data-zone="new-row"
                >
                  <span className="dock-cell-label">+ New row</span>
                </div>
              </div>
            </div>
            <div className="dock-preview-title">Release to place</div>
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
          <div className="dock-maximized-body">
            {activeMaximizedPanel.content}
          </div>
        </div>
      ) : (
        <div className="dock-grid">
          {gridLayout.map((row, rowIdx) => (
            <div key={`grid-row-${rowIdx}`} className="dock-grid-row">
              {row.map((panelId) => renderPanelCard(panelId))}
            </div>
          ))}
          {gridLayout.length === 0 && (
            <div className="dock-empty">Drag panels here to build your layout.</div>
          )}
        </div>
      )}

      {minimizeFlyer ? (
        <div
          className="dock-minimize-flyer"
          ref={startFlyerAnimation}
          style={{
            top: minimizeFlyer.top,
            left: minimizeFlyer.left,
            width: minimizeFlyer.width,
            height: minimizeFlyer.height,
          }}
        />
      ) : null}

      {layout.minimized.length > 0 ? (
        <div className="dock-minimized-bar">
          <span className="dock-minimized-label">Minimized</span>
          {layout.minimized.map((panelId) => {
            const panel = panelMap.get(panelId);
            if (!panel) return null;
            return (
              <button
                key={panelId}
                type="button"
                className="dock-minimized-pill"
                onClick={() => restorePanel(panelId)}
                title={`Restore ${panel.title}`}
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
