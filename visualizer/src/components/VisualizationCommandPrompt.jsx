import { useEffect } from "react";
import { useVisualizationContext } from "../context/VisualizationContext";

export default function VisualizationCommandPrompt() {
  const { pendingCommands, acceptCommand, rejectCommand } = useVisualizationContext();

  useEffect(() => {
    // auto-dismiss stale commands after 60s
    const t = setInterval(() => {
      const now = Date.now();
      pendingCommands.forEach((c) => {
        if (now - c.time > 60000) rejectCommand(c.id);
      });
    }, 5000);
    return () => clearInterval(t);
  }, [pendingCommands, rejectCommand]);

  if (!pendingCommands || pendingCommands.length === 0) return null;

  return (
    <div style={{ position: 'fixed', right: 22, bottom: 120, zIndex: 11000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {pendingCommands.map(({ id, cmd }) => (
        <div key={id} style={{ background: 'linear-gradient(180deg,#031025,#071029)', color: '#e6eefc', padding: '10px 12px', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.6)', minWidth: 280 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Assistant suggested a visualization command</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#cfe8ff', margin: 0 }}>{JSON.stringify(cmd, null, 2)}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => acceptCommand(id)} style={{ background: '#38bdf8', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Apply</button>
            <button onClick={() => rejectCommand(id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#cfe8ff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}
