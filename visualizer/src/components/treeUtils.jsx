/**
 * Shared tree utilities for binary tree visualizers.
 * Trees are represented as level-order arrays (LeetCode format).
 * null values represent missing nodes.
 */

/**
 * Build a linked node structure from a level-order array.
 * Returns the root node or null.
 * Each node: { id, val, left, right }
 */
export function buildTree(arr) {
    if (!arr || arr.length === 0 || arr[0] == null) return null
    const nodes = arr.map((val, i) => (val == null ? null : { id: i, val, left: null, right: null }))
    for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i]) continue
        const li = 2 * i + 1
        const ri = 2 * i + 2
        if (li < nodes.length) nodes[i].left = nodes[li]
        if (ri < nodes.length) nodes[i].right = nodes[ri]
    }
    return nodes[0]
}

/**
 * Compute layout positions for each node.
 * Returns a Map of node id -> { x, y }.
 * Root is centered at canvasWidth/2. Each level is spaced by levelH.
 */
export function computeLayout(root, canvasWidth = 500, levelH = 72) {
    const positions = new Map()
    if (!root) return positions

    function place(node, depth, leftBound, rightBound) {
        if (!node) return
        const x = (leftBound + rightBound) / 2
        const y = depth * levelH + 40
        positions.set(node.id, { x, y })
        place(node.left, depth + 1, leftBound, x)
        place(node.right, depth + 1, x, rightBound)
    }

    place(root, 0, 0, canvasWidth)
    return positions
}

/**
 * Collect all nodes into a flat array via BFS order.
 */
export function collectNodes(root) {
    const result = []
    if (!root) return result
    const q = [root]
    while (q.length) {
        const node = q.shift()
        result.push(node)
        if (node.left) q.push(node.left)
        if (node.right) q.push(node.right)
    }
    return result
}

/**
 * Build edges list: array of { fromId, toId }.
 */
export function buildEdges(root) {
    const edges = []
    if (!root) return edges
    const q = [root]
    while (q.length) {
        const node = q.shift()
        if (node.left) { edges.push({ fromId: node.id, toId: node.left.id }); q.push(node.left) }
        if (node.right) { edges.push({ fromId: node.id, toId: node.right.id }); q.push(node.right) }
    }
    return edges
}

/**
 * Parse a JSON array input into a validated level-order array.
 */
export function parseTreeInput(input) {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed)) throw new Error('Input must be an array')
    return parsed.map((v) => {
        if (v === null || v === 'null') return null
        const n = Number(v)
        if (Number.isNaN(n)) throw new Error(`Invalid value: ${v}`)
        return n
    })
}

/**
 * Render an SVG layer with edges using given positions map.
 */
export function TreeSVG({ edges, positions, canvasWidth, canvasHeight, highlightPairs = [] }) {
    return (
        <svg
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            width={canvasWidth}
            height={canvasHeight}
        >
            {edges.map(({ fromId, toId }) => {
                const from = positions.get(fromId)
                const to = positions.get(toId)
                if (!from || !to) return null
                const isHighlighted = highlightPairs.some(([a, b]) => (a === fromId && b === toId) || (a === toId && b === fromId))
                return (
                    <line
                        key={`${fromId}-${toId}`}
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        stroke={isHighlighted ? '#f9e2af' : '#45475a'}
                        strokeWidth={isHighlighted ? 2.5 : 1.5}
                    />
                )
            })}
        </svg>
    )
}
