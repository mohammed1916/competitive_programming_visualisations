import React, { useMemo } from "react";
import { motion } from "framer-motion";
import "./TreeCanvas3D.css";

function computeDepth(nodeId, allNodes, buildDepth) {
  if (!buildDepth.has(nodeId)) {
    let depth = 0;
    for (const node of allNodes) {
      if (node.id === nodeId) break;
      depth++;
    }
    buildDepth.set(nodeId, depth);
  }
  return buildDepth.get(nodeId) || 0;
}

export default function TreeCanvas3D({
  positions = new Map(),
  edges = [],
  allNodes = [],
  activeIds = new Set(),
  visitedIds = new Set(),
  queueIds = new Set(),
  canvasWidth = 520,
  canvasHeight = 320,
  nodeRadius = 22,
}) {
  const depthMap = useMemo(
    () => {
      const map = new Map();
      for (const node of allNodes) {
        const y = positions.get(node.id)?.y ?? 0;
        map.set(node.id, Math.max(0, canvasHeight - y));
      }
      return map;
    },
    [allNodes, positions, canvasHeight]
  );

  const bezierPath = (fromId, toId) => {
    const from = positions.get(fromId);
    const to = positions.get(toId);
    if (!from || !to) return "";

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const offsetX = (to.x - from.x) * 0.15;
    const offsetY = (to.y - from.y) * 0.2;

    return `M ${from.x} ${from.y} C ${midX + offsetX} ${from.y + offsetY}, ${midX - offsetX} ${to.y - offsetY}, ${to.x} ${to.y}`;
  };

  return (
    <div
      className="tc3d-canvas"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        perspective: "1000px",
      }}
    >
      <svg
        className="tc3d-edges"
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      >
        {edges.map(({ fromId, toId }) => {
          const isActive = activeIds.has(fromId) || activeIds.has(toId);
          const isVisited =
            visitedIds.has(fromId) && visitedIds.has(toId);

          return (
            <g key={`${fromId}-${toId}`}>
              <defs>
                <linearGradient
                  id={`grad-${fromId}-${toId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={isActive ? "#f9e2af" : "#45475a"}
                    stopOpacity="0.8"
                  />
                  <stop
                    offset="100%"
                    stopColor={isVisited ? "#a6e3a1" : "#313244"}
                    stopOpacity="0.6"
                  />
                </linearGradient>
                <filter id={`glow-${fromId}-${toId}`}>
                  <feGaussianBlur
                    stdDeviation={isActive ? "2.5" : "0.8"}
                    result="coloredBlur"
                  />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={bezierPath(fromId, toId)}
                fill="none"
                stroke={`url(#grad-${fromId}-${toId})`}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeLinecap="round"
                filter={`url(#glow-${fromId}-${toId})`}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      <div className="tc3d-nodes-container">
        {allNodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isActive = activeIds.has(node.id);
          const isVisited = visitedIds.has(node.id);
          const isQueued = queueIds.has(node.id);
          const zOffset = depthMap.get(node.id) ?? 0;

          let bgColor = "#313244";
          let borderColor = "#45475a";
          let textColor = "#cdd6f4";
          let glowColor = "rgba(0, 0, 0, 0)";

          if (isActive) {
            bgColor = "#0d1a2a";
            borderColor = "#89b4fa";
            textColor = "#89b4fa";
            glowColor = "rgba(137, 180, 250, 0.4)";
          } else if (isQueued) {
            bgColor = "#0d2a1a";
            borderColor = "#a6e3a1";
            textColor = "#a6e3a1";
            glowColor = "rgba(166, 227, 161, 0.3)";
          } else if (isVisited) {
            bgColor = "#1a1a2a";
            borderColor = "#6c7086";
            textColor = "#a6adc8";
            glowColor = "rgba(108, 112, 134, 0.2)";
          }

          return (
            <motion.div
              key={node.id}
              className="tc3d-node"
              style={{
                left: pos.x - nodeRadius,
                top: pos.y - nodeRadius,
              }}
              animate={{
                left: pos.x - nodeRadius,
                top: pos.y - nodeRadius,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <motion.div
                className="tc3d-node-sphere"
                animate={{
                  scale: isActive ? 1.15 : 1,
                  boxShadow: `0 0 ${isActive ? 24 : 12}px ${glowColor}, inset 0 0 8px rgba(0, 0, 0, 0.3)`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: nodeRadius * 2,
                  height: nodeRadius * 2,
                  background: `radial-gradient(circle at 35% 35%, ${bgColor}, #1a1a2e)`,
                  borderColor,
                  borderWidth: isActive ? 2.5 : 1.5,
                }}
              >
                <span
                  className="tc3d-node-label"
                  style={{ color: textColor }}
                >
                  {node.val}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
