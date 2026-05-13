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

  return (
    <VisualizationContext.Provider value={{ currentStep, problemTitle, problemDescription, publishStep, publishDescription, clearStep }}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualizationContext() {
  const ctx = useContext(VisualizationContext);
  if (!ctx) throw new Error("useVisualizationContext must be used inside VisualizationProvider");
  return ctx;
}
