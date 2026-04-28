import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function RunHistory({ limit: maxRuns = 20 }) {
  const [runs,    setRuns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    (async () => {
      try {
        const q = query(
          collection(db, "users", uid, "runs"),
          orderBy("createdAt", "desc"),
          limit(maxRuns)
        );
        const snap = await getDocs(q);
        setRuns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("[RunHistory] fetch failed:", e);
        setError("Could not load run history.");
      } finally {
        setLoading(false);
      }
    })();
  }, [maxRuns]);

  if (loading) return <div style={{ padding: "1rem", color: "var(--color-text-secondary)", fontSize: 14 }}>Loading runs...</div>;
  if (error)   return <div style={{ padding: "1rem", color: "#ef4444", fontSize: 14 }}>{error}</div>;
  if (runs.length === 0) return (
    <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
      No runs yet — complete your first run to see history here.
    </div>
  );

  const totalKm  = runs.reduce((a, r) => a + (r.distance ?? 0), 0);
  const totalSec = runs.reduce((a, r) => a + (r.duration ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 4 }}>
        {[
          { label: "Total runs",     value: runs.length },
          { label: "Total distance", value: `${totalKm.toFixed(1)} km` },
          { label: "Total time",     value: fmtDuration(totalSec) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--color-surface, #1a1a2e)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text, #f0f0f0)" }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #888)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {runs.map((run) => (
        <div key={run.id} style={{ background: "var(--color-surface, #1a1a2e)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(251,146,60,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🏃
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text, #f0f0f0)" }}>{(run.distance ?? 0).toFixed(2)} km</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary, #888)", marginTop: 2 }}>{fmtDate(run.date)} · {fmtTime(run.date)}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text, #f0f0f0)" }}>{fmtDuration(run.duration ?? 0)}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary, #888)", marginTop: 2 }}>{run.avgPace ?? "--:--"} /km</div>
            {run.calories > 0 && <div style={{ fontSize: 11, color: "var(--color-text-secondary, #888)", marginTop: 1 }}>{run.calories} kcal</div>}
          </div>
        </div>
      ))}
    </div>
  );
}