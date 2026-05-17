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
  const [pendingCommands, setPendingCommands] = useState([]);

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

  const visualizeCommand = useCallback((cmd, commandId = null) => {
    // Minimal interpreter: support `annotate` action for buckets or generic labels
    try {
      if (!cmd || typeof cmd !== 'object') return false;
      if (cmd.action === 'annotate' && Array.isArray(cmd.labels)) {
        // labels: [{ target: 'bucket', index: 2, text: 'b=(x-lo)//bsize' }, ...]
        setAnnotations((prev) => [...prev, ...cmd.labels.map((l, i) => ({ id: Date.now() + i, addedBy: commandId || null, ...l }))]);
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

  // Queue/accept/reject flow for assistant-sent commands
  const queueCommand = useCallback((cmd) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setPendingCommands((p) => [...p, { id, cmd, time: Date.now() }]);
    return id;
  }, []);

  const acceptCommand = useCallback((id) => {
    setPendingCommands((p) => {
      const found = p.find(x => x.id === id);
      if (found) visualizeCommand(found.cmd, id);
      return p.filter(x => x.id !== id);
    });
  }, [visualizeCommand]);

  const rejectCommand = useCallback((id) => setPendingCommands((p) => p.filter(x => x.id !== id)), []);

  return (
    <VisualizationContext.Provider value={{ currentStep, problemTitle, problemDescription, publishStep, publishDescription, clearStep, annotations, visualizeCommand, clearAnnotations, pendingCommands, queueCommand, acceptCommand, rejectCommand }}>
      {children}
    </VisualizationContext.Provider>
  );
}

export function useVisualizationContext() {
  const ctx = useContext(VisualizationContext);
  if (!ctx) throw new Error("useVisualizationContext must be used inside VisualizationProvider");
  return ctx;
}
