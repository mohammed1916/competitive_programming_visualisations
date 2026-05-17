import { createContext, useContext, useState, useCallback } from "react";

const VisualizationContext = createContext(null);

/**
 * Provides a channel for any visualizer to broadcast its current step
 * so the chatbot can pick it up without prop drilling.
 */
export function VisualizationProvider({ children }) {
  const [currentStep, setCurrentStep] = useState(null);
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState(null);
  // Visualization commands/annotations published by the chatbot
  const [annotations, setAnnotations] = useState([]);

  const publishStep = useCallback((step, title) => {
    setCurrentStep(step);
    if (title !== undefined) setProblemTitle(title);
  }, []);

  const publishDescription = useCallback((description) => {
    setProblemDescription(description);
  }, []);

  const clearStep = useCallback(() => {
    setCurrentStep(null);
    setProblemTitle("");
    setProblemDescription(null);
  }, []);

  const visualizeCommand = useCallback((cmd) => {
    // Minimal interpreter: support `annotate` action for buckets or generic labels
    try {
      if (!cmd || typeof cmd !== 'object') return false;
      if (cmd.action === 'annotate' && Array.isArray(cmd.labels)) {
        // labels: [{ target: 'bucket', index: 2, text: 'b=(x-lo)//bsize' }, ...]
        setAnnotations((prev) => [...prev, ...cmd.labels.map((l, i) => ({ id: Date.now() + i, ...l }))]);
        return true;
      }
      // Generic fallback: store as note
      setAnnotations((prev) => [...prev, { id: Date.now(), type: 'note', payload: cmd }]);
      return true;
    } catch (err) {
      console.warn('visualizeCommand error', err);
      return false;
    }
  }, []);

  const clearAnnotations = useCallback(() => setAnnotations([]), []);

  return (
    <VisualizationContext.Provider value={{ currentStep, problemTitle, problemDescription, publishStep, publishDescription, clearStep, annotations, visualizeCommand, clearAnnotations }}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualizationContext() {
  const ctx = useContext(VisualizationContext);
  if (!ctx) throw new Error("useVisualizationContext must be used inside VisualizationProvider");
  return ctx;
}
