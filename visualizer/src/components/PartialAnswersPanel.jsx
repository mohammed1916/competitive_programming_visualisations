import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./PartialAnswersPanel.css";

export default function PartialAnswersPanel({
  label = "Partial answers",
  answers = [],
  prevAnswers = null,
  labelPrefix = "a",
  changedClass = "changed",
  unchangedClass = "unchanged",
}) {
  return (
    <div className="partial-answers-wrap">
      <div className="partial-answers-label">{label}</div>
      <div className="partial-answers-grid mono">
        {(answers ?? []).length === 0 ? (
          <div className="partial-answers-empty">No step yet</div>
        ) : (
          (answers ?? []).map((val, idx) => {
            const prevVal =
              prevAnswers && Array.isArray(prevAnswers)
                ? prevAnswers[idx]
                : undefined;
            const changed = prevVal !== val;
            return (
              <div
                key={idx}
                className={`partial-answer-cell ${changed ? changedClass : unchangedClass}`}
              >
                <div className="partial-answer-chip">
                  {labelPrefix}
                  {idx + 1}
                </div>
                {changed ? (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={String(val)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="partial-answer-value"
                    >
                      {val}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <span className="partial-answer-value">{val}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
