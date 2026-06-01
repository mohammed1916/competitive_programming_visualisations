import React, { useMemo } from "react";
import { motion } from "framer-motion";
import "./GraphCanvas3D.css";

export default function GraphCanvas3D({
  nodes = [],
  edges = [],
  visitedSet = new Set(),
  activeNode = null,
  activeNeighbor = null,
  cloneEdgeSet = new Set(),
  width = 400,
  height = 260,
  isClone = false,
  nodeRadius = 22,
}) {
  const nodeMap = useMemo(
    () =>
      new Map(
        nodes.map((n) => [
          n.id,
          { ...n, x: Number(n.x), y: Number(n.y) },
        ])
      ),
    [nodes]
  );

  const getNodeColor = (nodeId) => {
    const isActive = nodeId === activeNode;
    const isNeighbor = nodeId === activeNeighbor;
    const isVisited = visitedSet.has(nodeId);

    if (isClone) {
      if (!isVisited) return { bg: "#1e1e2e", border: "#313244", text: "#45475a" };
      if (isActive)
        return {
          bg: "#0d2a1a",
          border: "#a6e3a1",
          text: "#a6e3a1",
        };
      if (isNeighbor)
        return {
          bg: "#1a0d2a",
          border: "#cba6f7",
          text: "#cba6f7",
        };
      return { bg: "#002010", border: "#a6e3a1", text: "#a6e3a1" };
    } else {
      if (isActive)
        return {
          bg: "#0d1a2a",
          border: "#89b4fa",
          text: "#89b4fa",
        };
      if (isNeighbor)
        return {
          bg: "#1a0d2a",
          border: "#cba6f7",
          text: "#cba6f7",
        };
      return { bg: "#313244", border: "#45475a", text: "#a6adc8" };
    }
  };

  const bezierPath = (fromPos, toPos) => {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const offsetDist = dist * 0.2;
    const perpX = (-dy / dist) * offsetDist;
    const perpY = (dx / dist) * offsetDist;

    const cpx1 = fromPos.x + perpX;
    const cpy1 = fromPos.y + perpY;
    const cpx2 = toPos.x + perpX;
    const cpy2 = toPos.y + perpY;

    return `M ${fromPos.x} ${fromPos.y} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${toPos.x} ${toPos.y}`;
  };

  const uniqueEdges = useMemo(() => {
    const seen = new Set();
    return edges.filter(({ fromId, toId }) => {
      const key = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [edges]);

  return (
    <div className="gc3d-container">
      <svg
        className="gc3d-canvas"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          {uniqueEdges.map(({ fromId, toId }) => {
            const isActive = cloneEdgeSet.has(
              `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`
            );
            const gradId = `grad-gc3d-${fromId}-${toId}`;
            const glowId = `glow-gc3d-${fromId}-${toId}`;

            return (
              <g key={gradId}>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={isActive ? "#a6e3a1" : "#45475a"}
                    stopOpacity={isActive ? "0.9" : "0.5"}
                  />
                  <stop
                    offset="100%"
                    stopColor={isActive ? "#a6e3a1" : "#313244"}
                    stopOpacity={isActive ? "0.7" : "0.3"}
                  />
                </linearGradient>
                <filter id={glowId}>
                  <feGaussianBlur
                    stdDeviation={isActive ? "2" : "0.8"}
                    result="coloredBlur"
                  />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </g>
            );
          })}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#a6e3a1" />
          </marker>
        </defs>

        <g className="gc3d-edges">
          {uniqueEdges.map(({ fromId, toId }) => {
            const fromNode = nodeMap.get(fromId);
            const toNode = nodeMap.get(toId);
            if (!fromNode || !toNode) return null;

            const isActive = cloneEdgeSet.has(
              `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`
            );

            return (
              <g key={`edge-${fromId}-${toId}`}>
                <path
                  d={bezierPath(
                    { x: fromNode.x, y: fromNode.y },
                    { x: toNode.x, y: toNode.y }
                  )}
                  fill="none"
                  stroke={`url(#grad-gc3d-${fromId}-${toId})`}
                  strokeWidth={isActive ? 2 : 1}
                  strokeLinecap="round"
                  filter={`url(#glow-gc3d-${fromId}-${toId})`}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>

        <g className="gc3d-nodes">
          {nodes.map((node) => {
            const colors = getNodeColor(node.id);
            return (
              <g key={`node-${node.id}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={activeNode === node.id ? 2.5 : 1.5}
                  style={{
                    filter: `drop-shadow(0 0 ${activeNode === node.id ? "12" : "6"}px ${colors.border}88)`,
                  }}
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={colors.text}
                  fontSize="15"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label ?? node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
