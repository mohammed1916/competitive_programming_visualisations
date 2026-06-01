/**
 * Graph layout algorithms for 3D visualizations
 */

/**
 * Circular layout: places nodes evenly around a circle
 * @param {number[]|string[]} nodeIds - array of node identifiers
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @returns {Array<{id, x, y}>} positioned nodes
 */
export function circularLayout(nodeIds, width = 400, height = 260) {
  const nodes = [];
  const count = nodeIds.length;
  const radius = Math.min(width, height) * 0.34;
  const cx = width / 2;
  const cy = height / 2;

  nodeIds.forEach((id, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    nodes.push({ id, x, y });
  });

  return nodes;
}

/**
 * Layered layout: places nodes in horizontal layers (topological)
 * Good for DAGs (directed acyclic graphs)
 * @param {Object} adjacency - adjacency list { nodeId: [neighbors...] }
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @returns {Array<{id, x, y}>} positioned nodes
 */
export function layeredLayout(adjacency, width = 400, height = 260) {
  const nodeIds = Object.keys(adjacency);
  if (nodeIds.length === 0) return [];

  const layers = [];
  const visited = new Set();
  const inDegree = {};

  nodeIds.forEach((id) => {
    inDegree[id] = 0;
  });

  nodeIds.forEach((id) => {
    adjacency[id].forEach((neighbor) => {
      inDegree[neighbor] = (inDegree[neighbor] || 0) + 1;
    });
  });

  const queue = nodeIds.filter((id) => inDegree[id] === 0);

  while (queue.length > 0) {
    const layer = [];
    const nextQueue = [];

    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      layer.push(id);

      adjacency[id].forEach((neighbor) => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0 && !visited.has(neighbor)) {
          nextQueue.push(neighbor);
        }
      });
    }

    if (layer.length > 0) layers.push(layer);
    queue.push(...nextQueue);
  }

  // Position nodes
  const nodes = [];
  const layerHeight = height / (layers.length + 1);

  layers.forEach((layer, layerIdx) => {
    const y = (layerIdx + 1) * layerHeight;
    const layerWidth = width / (layer.length + 1);

    layer.forEach((id, idx) => {
      const x = (idx + 1) * layerWidth;
      nodes.push({ id, x, y });
    });
  });

  return nodes;
}

/**
 * Spring force-directed layout (Fruchterman-Reingold)
 * Creates organic-looking graph layouts
 * @param {Object} adjacency - adjacency list { nodeId: [neighbors...] }
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @param {number} iterations - simulation iterations (default 80)
 * @returns {Array<{id, x, y}>} positioned nodes
 */
export function springLayout(
  adjacency,
  width = 400,
  height = 260,
  iterations = 80
) {
  const nodeIds = Object.keys(adjacency);
  if (nodeIds.length === 0) return [];

  const nodes = new Map();
  const padding = 30;

  // Initialize positions randomly
  nodeIds.forEach((id) => {
    nodes.set(id, {
      id,
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding),
      vx: 0,
      vy: 0,
    });
  });

  const k = Math.sqrt((width * height) / nodeIds.length); // optimal distance
  const maxForce = 100;
  const attraction = 0.01;
  const repulsion = 10000;
  const damping = 0.85;

  // Simulation
  for (let iter = 0; iter < iterations; iter++) {
    const temperature = 100 * (1 - iter / iterations);

    // Reset forces
    nodes.forEach((node) => {
      node.fx = 0;
      node.fy = 0;
    });

    // Repulsive forces (all pairs)
    const nodeArray = Array.from(nodes.values());
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const a = nodeArray[i];
        const b = nodeArray[j];

        const dx = b.x - a.x || 0.0001;
        const dy = b.y - a.y || 0.0001;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = repulsion / (dist * dist);

        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;

        a.fx -= fx;
        a.fy -= fy;
        b.fx += fx;
        b.fy += fy;
      }
    }

    // Attractive forces (connected pairs)
    nodeIds.forEach((id) => {
      const node = nodes.get(id);
      adjacency[id].forEach((neighborId) => {
        const neighbor = nodes.get(neighborId);
        if (!neighbor) return;

        const dx = neighbor.x - node.x || 0.0001;
        const dy = neighbor.y - node.y || 0.0001;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = attraction * (dist - k);

        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;

        node.fx += fx;
        node.fy += fy;
        neighbor.fx -= fx;
        neighbor.fy -= fy;
      });
    });

    // Update positions
    nodes.forEach((node) => {
      const fx = Math.max(-maxForce, Math.min(maxForce, node.fx));
      const fy = Math.max(-maxForce, Math.min(maxForce, node.fy));

      node.vx = (node.vx + fx) * damping;
      node.vy = (node.vy + fy) * damping;

      node.x += node.vx;
      node.y += node.vy;

      // Bounds
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });
  }

  return nodeArray.map(({ id, x, y }) => ({ id, x, y }));
}
