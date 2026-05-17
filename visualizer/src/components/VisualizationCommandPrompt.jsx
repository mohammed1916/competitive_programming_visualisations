import { useEffect } from "react";
import { useVisualizationContext } from "../context/VisualizationContext";

export default function VisualizationCommandPrompt() {
  const { pendingCommands, acceptCommand, rejectCommand } = useVisualizationContext();
  const { validateCommand } = useVisualizationContext();

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
      {pendingCommands.map(({ id, cmdOriginal, cmdToApply, valid, errors }) => (
        <div key={id} style={{ background: 'linear-gradient(180deg,#031025,#071029)', color: '#e6eefc', padding: '10px 12px', borderRadius: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.6)', minWidth: 320 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Assistant suggested a visualization command</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#cfe8ff', margin: 0 }}>{JSON.stringify(cmdOriginal, null, 2)}</pre>
          {/* validation */}
          {!valid && <div style={{ color: '#fca5a5', marginTop: 8 }}>This command may be invalid or reference unknown targets. Resolve or dismiss.</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button disabled={!valid} onClick={() => acceptCommand(id)} style={{ background: valid ? '#38bdf8' : '#6b7280', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: valid ? 'pointer' : 'not-allowed' }}>Apply</button>
            <button onClick={() => rejectCommand(id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#cfe8ff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Dismiss</button>
          </div>
          {errors && errors.length > 0 && (
            <ul style={{ marginTop: 8, color: '#fecaca', fontSize: 12 }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
