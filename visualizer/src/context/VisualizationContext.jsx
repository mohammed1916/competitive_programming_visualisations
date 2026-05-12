import { createContext, useContext, useState, useCallback } from "react";

const VisualizationContext = createContext(null);

/**
 * Provides a channel for any visualizer to broadcast its current step
 * so the chatbot can pick it up without prop drilling.
 */
export function VisualizationProvider({ children }) {
  const [currentStep, setCurrentStep] = useState(null);
  const [problemTitle, setProblemTitle] = useState("");

  const publishStep = useCallback((step, title) => {
    setCurrentStep(step);
    if (title !== undefined) setProblemTitle(title);
  }, []);

  const clearStep = useCallback(() => {
    setCurrentStep(null);
    setProblemTitle("");
  }, []);

  return (
    <VisualizationContext.Provider value={{ currentStep, problemTitle, publishStep, clearStep }}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualizationContext() {
  const ctx = useContext(VisualizationContext);
  if (!ctx) throw new Error("useVisualizationContext must be used inside VisualizationProvider");
  return ctx;
}
