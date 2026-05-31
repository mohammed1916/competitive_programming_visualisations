import { motion } from 'framer-motion'
import './AnimatedIterationList.css'

function normalizeState(result) {
  if (!result) return { stateClass: '', isActive: false }
  if (typeof result === 'string') {
    return { stateClass: result, isActive: result.includes('active') || result.includes('cur') }
  }
  return {
    stateClass: result.stateClass || '',
    isActive: Boolean(result.isActive),
  }
}

export default function AnimatedIterationList({
  items,
  styleName = 'default',
  className = '',
  getItemState,
  renderItem,
  showIndex = true,
  onItemClick,
  getItemKey,
  activeOffsetY = -4,
  activeScale = 1.12,
}) {
  return (
    <div className={`ail-list ail-style-${styleName} ${className}`.trim()}>
      {items.map((item, index) => {
        const key = getItemKey ? getItemKey(item, index) : index
        const { stateClass, isActive } = normalizeState(getItemState?.(item, index))

        return (
          <div key={key} className="ail-item-col">
            <motion.div
              className={`ail-item ${stateClass}`.trim()}
              animate={{
                scale: isActive ? activeScale : 1,
                y: isActive ? activeOffsetY : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              onClick={onItemClick ? () => onItemClick(item, index) : undefined}
              style={onItemClick ? { cursor: 'pointer' } : undefined}
            >
              {renderItem ? renderItem(item, index) : item}
            </motion.div>
            {showIndex ? <div className="ail-index">{index}</div> : null}
          </div>
        )
      })}
    </div>
  )
}
