import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Queue3D.css";

export default function Queue3D({
  label,
  items = [],
  frontIndex = 0,
  backIndex = -1,
  activeIndex = -1,
  emptyText = "empty",
}) {
  const actualBackIndex = backIndex === -1 ? items.length - 1 : backIndex;

  return (
    <div className="q3d-col">
      <div className="q3d-label">{label}</div>
      <div className="q3d-perspective-box">
        <div className="q3d-pointers">
          <div
            className="q3d-pointer q3d-front"
            style={{
              left: `${frontIndex > 0 ? 16 + (frontIndex - 1) * 56 : 16}px`,
            }}
          >
            Front
          </div>
          {actualBackIndex >= 0 && items.length > 0 && (
            <div
              className="q3d-pointer q3d-back"
              style={{
                left: `${16 + actualBackIndex * 56 + 48}px`,
              }}
            >
              Back
            </div>
          )}
        </div>

        <div className="q3d-box">
          <AnimatePresence>
            {items.length ? (
              items.map((val, idx) => {
                const isActive = idx === activeIndex;
                const isFront = idx === frontIndex;
                const isBack = idx === actualBackIndex;

                return (
                  <motion.div
                    key={idx}
                    className={`q3d-cell${isActive ? " active" : ""}${isFront ? " front" : ""}${isBack ? " back" : ""}`}
                    initial={{ opacity: 0, scale: 0.88, x: 40 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.88, x: -40 }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="q3d-cell-content">
                      <div className="q3d-cell-front">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={String(val)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="q3d-value"
                          >
                            {val}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <div className="q3d-cell-top" />
                      <div className="q3d-cell-right" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="q3d-empty">{emptyText}</div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
