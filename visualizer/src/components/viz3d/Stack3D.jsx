import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Stack3D.css";

export default function Stack3D({
  label,
  items = [],
  emptyText = "empty",
  topBadge = "top",
  highlightIndex = 0,
  reversed = true,
}) {
  const display = reversed ? items.slice().reverse() : items;

  return (
    <div className="s3d-col">
      <div className="s3d-label">{label}</div>
      <div className="s3d-perspective-box">
        <div className="s3d-box">
          <AnimatePresence>
            {display.length ? (
              display.map((val, revIdx) => {
                const isTop = revIdx === 0;
                const idx = reversed ? items.length - 1 - revIdx : revIdx;
                const isHighlighted = idx === highlightIndex;
                const depth = revIdx * 4;

                return (
                  <motion.div
                    key={idx}
                    className={`s3d-slab${isTop ? " top" : ""}${isHighlighted ? " highlight" : ""}`}
                    initial={{ opacity: 0, scale: 0.88, translateZ: 60 }}
                    animate={{ opacity: 1, scale: 1, translateZ: depth }}
                    exit={{ opacity: 0, scale: 0.88, translateZ: 60 }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center",
                    }}
                  >
                    <div className="s3d-slab-content">
                      <div className="s3d-slab-front">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={String(val)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="s3d-value"
                          >
                            {val}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <div className="s3d-slab-top" />
                      <div className="s3d-slab-right" />
                    </div>
                    {isTop && topBadge ? (
                      <span className="s3d-top-badge">{topBadge}</span>
                    ) : null}
                  </motion.div>
                );
              })
            ) : (
              <div className="s3d-empty">{emptyText}</div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
