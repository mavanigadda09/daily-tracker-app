import { useState, useMemo } from "react";

const SUGGESTED = ["Water", "Workout", "Reading", "Meditation"];

export default function Setup({ addActivity, activities = [] }) {

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("L");
  const [time, setTime] = useState("");
  const [freq, setFreq] = useState("daily");
  const [error, setError] = useState("");

  // ===== VALIDATION =====
  const isValid = name.trim() && Number(target) > 0;

  const handleSave = () => {
    if (!isValid) {
      setError("Enter valid name and target");
      return;
    }

    // 🚫 prevent duplicates
    const exists = activities.some(
      a => a.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      setError("Activity already exists");
      return;
    }

    addActivity({
      id: crypto.randomUUID(),
      name: name.trim(),
      target: Number(target),
      unit,
      reminderTime: time,
      frequency: freq
    });

    // RESET
    setName("");
    setTarget("");
    setTime("");
    setError("");
  };

  // ===== MEMO PREVIEW =====
  const previewList = useMemo(() => activities, [activities]);

  return (
    <div style={container}>

      <h1 style={title}>⚙ Setup Activity</h1>

      <div style={card}>

        {/* FORM */}
        <div style={grid}>

          <input
            list="activities"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Activity name"
            style={input}
          />

          <datalist id="activities">
            {SUGGESTED.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>

          <input
            style={input}
            placeholder="Target"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setError("");
            }}
          />

          <select value={unit} onChange={(e) => setUnit(e.target.value)} style={input}>
            <option value="L">Liters</option>
            <option value="min">Minutes</option>
            <option value="pages">Pages</option>
          </select>

          <input
            style={input}
            placeholder="Reminder (08:00)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <select value={freq} onChange={(e) => setFreq(e.target.value)} style={input}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="weekdays">Weekdays</option>
          </select>

        </div>

        {/* ERROR */}
        {error && <p style={errorStyle}>{error}</p>}

        {/* BUTTON */}
        <button
          style={{
            ...btn,
            opacity: isValid ? 1 : 0.6,
            cursor: isValid ? "pointer" : "not-allowed"
          }}
          onClick={handleSave}
          disabled={!isValid}
        >
          Save Activity
        </button>

        {/* PREVIEW */}
        <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "#cbd5f5" }}>Your Activities</h3>

          {previewList.length === 0 && (
            <p style={{ color: "#64748b" }}>No activities yet</p>
          )}

          {previewList.map((a) => (
            <div key={a.id} style={previewCard}>
              <strong>{a.name}</strong> → {a.target} {a.unit}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ================= STYLES =================

const container = {
  width: "100%",
  maxWidth: 900,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 20
};

const title = {
  color: "#e2e8f0",
  fontSize: 28
};

const card = {
  background: "linear-gradient(145deg, #0f172a, #020617)",
  padding: 30,
  borderRadius: 16,
  border: "1px solid #1e293b"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 15
};

const input = {
  width: "100%",
  padding: 12,
  background: "#020617",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 10
};

const btn = {
  marginTop: 20,
  width: "100%",
  background: "linear-gradient(90deg, #6366f1, #4f46e5)",
  color: "#fff",
  padding: 14,
  border: "none",
  borderRadius: 10,
  fontWeight: "bold"
};

const errorStyle = {
  color: "#ef4444",
  marginTop: 10,
  fontSize: 13
};

const previewCard = {
  padding: 12,
  marginTop: 10,
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: 10
};