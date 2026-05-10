import { motion } from 'framer-motion'

export function TagPills({ tags = [] }) {
  return (
    <div className="svp-tags">
      {tags.map((tag) => (
        <span key={tag} className="svp-tag">
          {tag}
        </span>
      ))}
    </div>
  )
}

export function MiniArray({ values = [], activeIndex = -1, compareIndex = -1 }) {
  return (
    <div className="svp-array">
      {values.map((value, index) => (
        <motion.div
          key={`${value}-${index}`}
          className={`svp-array-cell ${index === activeIndex ? 'active' : ''} ${index === compareIndex ? 'compare' : ''}`}
          animate={index === activeIndex ? { y: -4 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          <span>{value}</span>
          <small>{index}</small>
        </motion.div>
      ))}
    </div>
  )
}

export function MiniMatrix({ matrix = [], activeCell = null }) {
  return (
    <div className="svp-matrix">
      {matrix.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isActive = activeCell?.r === rowIndex && activeCell?.c === colIndex
          return (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`svp-matrix-cell ${isActive ? 'active' : ''}`}
              animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              {value}
            </motion.div>
          )
        }),
      )}
    </div>
  )
}

export function MiniStringWindow({ text = '', left = 0, right = -1 }) {
  return (
    <div className="svp-string">
      {text.split('').map((char, index) => {
        const inWindow = index >= left && index <= right
        const isLeft = index === left
        const isRight = index === right
        return (
          <div
            key={`${char}-${index}`}
            className={`svp-char ${inWindow ? 'in-window' : ''} ${isLeft ? 'left' : ''} ${isRight ? 'right' : ''}`}
          >
            <span>{char}</span>
            <small>{index}</small>
          </div>
        )
      })}
    </div>
  )
}

export function MiniGraph({ nodes = [], edges = [], activeNode = null }) {
  return (
    <div className="svp-graph">
      <div className="svp-graph-edges">
        {edges.slice(0, 8).map((edge, index) => (
          <div key={`${edge[0]}-${edge[1]}-${index}`} className="svp-edge">
            {edge[0]} → {edge[1]}
          </div>
        ))}
      </div>
      <div className="svp-graph-nodes">
        {nodes.map((node) => (
          <motion.div
            key={node}
            className={`svp-node ${node === activeNode ? 'active' : ''}`}
            animate={node === activeNode ? { y: -5 } : { y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 25 }}
          >
            {node}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function StepPulse({ label, value, tone = 'neutral' }) {
  return (
    <div className={`svp-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
