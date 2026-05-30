import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./StackPanel.css";

export default function StackPanel({
  label,
  items = [],
  emptyText = "empty",
  topBadge = "top",
  highlightIndex = 0,
  reversed = true,
}) {
  const display = reversed ? items.slice().reverse() : items;
  return (
    <div className="sp-col">
      <div className="sp-label">{label}</div>
      <div className="sp-box">
        <AnimatePresence>
          {display.length ? (
            display.map((val, revIdx) => {
              const isTop = revIdx === 0;
              const idx = reversed ? items.length - 1 - revIdx : revIdx;
              const isHighlighted = idx === highlightIndex;
              return (
                <motion.div
                  key={idx}
                  className={`sp-cell${isTop ? " top" : ""}${isHighlighted ? " highlight" : ""}`}
                  initial={false}
                  animate={{}}
                  layout
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={String(val)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {val}
                    </motion.div>
                  </AnimatePresence>
                  {isTop && topBadge ? (
                    <span className="sp-top-badge">{topBadge}</span>
                  ) : null}
                </motion.div>
              );
            })
          ) : (
            <div className="sp-empty">{emptyText}</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
