import { useEffect, useMemo, useState } from "react";
import { useVisualizationContext } from "../context/VisualizationContext";

export default function VisualizationCommandPrompt() {
  const { pendingCommands, acceptCommand, acceptCommandWithOverride, rejectCommand, targets } = useVisualizationContext();
  const [fixes, setFixes] = useState({});

  const targetsByType = useMemo(() => {
    return {
      bucket: targets.filter((t) => t.type === "bucket"),
      "array-item": targets.filter((t) => t.type === "array-item"),
      any: targets,
    };
  }, [targets]);

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

  const unresolvedLabelIndexes = (cmdOriginal) => {
    if (!cmdOriginal || cmdOriginal.action !== "annotate" || !Array.isArray(cmdOriginal.labels)) return [];
    return cmdOriginal.labels
      .map((lab, i) => ({ lab, i }))
      .filter(({ lab }) => {
        if (!lab || !lab.target) return true;
        return !targets.some((t) => t.id === lab.target);
      });
  };

  const candidateTargets = (lab) => {
    const raw = (lab?.target || "").toLowerCase();
    if (raw === "bucket") return targetsByType.bucket;
    if (raw === "nums" || raw === "array-item") return targetsByType["array-item"];
    return targetsByType.any;
  };

  const buildPatchedCommand = (id, cmdOriginal) => {
    const clone = JSON.parse(JSON.stringify(cmdOriginal));
    if (!clone || clone.action !== "annotate" || !Array.isArray(clone.labels)) return clone;
    clone.labels = clone.labels.map((lab, i) => {
      const key = `${id}:${i}`;
      const selected = fixes[key];
      if (!selected) return lab;
      const out = { ...lab, target: selected };
      if ("index" in out) delete out.index;
      return out;
    });
    return clone;
  };

  return (
    <div style={{ position: 'fixed', right: 22, bottom: 120, zIndex: 11000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {pendingCommands.map(({ id, cmdOriginal, valid, errors }) => (
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

          {!valid && unresolvedLabelIndexes(cmdOriginal).length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
              <div style={{ fontSize: 12, color: '#93c5fd', marginBottom: 6 }}>Quick-fix unresolved targets</div>
              {unresolvedLabelIndexes(cmdOriginal).map(({ lab, i }) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#bfdbfe', minWidth: 90 }}>label {i}</span>
                  <select
                    value={fixes[`${id}:${i}`] || ''}
                    onChange={(e) => setFixes((f) => ({ ...f, [`${id}:${i}`]: e.target.value }))}
                    style={{ background: '#0b1220', color: '#e6eefc', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, padding: '4px 6px', minWidth: 180 }}
                  >
                    <option value="">Select target for {lab?.target || 'unknown'}</option>
                    {candidateTargets(lab).map((t) => (
                      <option key={t.id} value={t.id}>{t.label || t.id}</option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                onClick={() => acceptCommandWithOverride(id, buildPatchedCommand(id, cmdOriginal))}
                style={{ background: '#22d3ee', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}
              >
                Apply with fixes
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
