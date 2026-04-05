import { useState, useMemo } from "react";

export default function Goals({
  weightLogs = [],
  setWeightLogs,
  weightGoal,
  setWeightGoal
}) {

  const [weight, setWeight] = useState("");

  const goal = weightGoal || {
    startWeight: "",
    targetWeight: "",
    startDate: "",
    endDate: ""
  };

  // ===== ADD LOG =====
  const addLog = () => {
    const num = Number(weight);
    if (!num || num <= 0) return;

    const newLog = {
      id: crypto.randomUUID(),
      date: Date.now(),
      weight: num
    };

    setWeightLogs((prev) => [...prev, newLog]);
    setWeight("");
  };

  // ===== SORTED LOGS =====
  const logs = useMemo(() => {
    return [...weightLogs].sort((a, b) => a.date - b.date);
  }, [weightLogs]);

  // ===== CALCULATIONS =====
  const {
    currentWeight,
    percent,
    daysLeft
  } = useMemo(() => {

    if (!goal.startWeight || !goal.targetWeight) {
      return { currentWeight: 0, percent: 0, daysLeft: 0 };
    }

    const currentWeight =
      logs.length > 0
        ? logs[logs.length - 1].weight
        : goal.startWeight;

    const totalLoss = goal.startWeight - goal.targetWeight;
    const currentLoss = goal.startWeight - currentWeight;

    const percent = totalLoss > 0
      ? Math.min(Math.round((currentLoss / totalLoss) * 100), 100)
      : 0;

    const daysLeft = goal.endDate
      ? Math.ceil(
          (new Date(goal.endDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        )
      : 0;

    return { currentWeight, percent, daysLeft };

  }, [goal, logs]);

  // ===== UPDATE GOAL =====
  const updateGoal = (field, value) => {
    setWeightGoal({
      ...goal,
      [field]: value
    });
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🎯 Goal Tracker</h1>

      {/* GOAL */}
      <div style={styles.card}>
        <h3>Set Goal</h3>

        <input
          style={styles.input}
          placeholder="Start Weight"
          value={goal.startWeight}
          onChange={(e) =>
            updateGoal("startWeight", Number(e.target.value))
          }
        />

        <input
          style={styles.input}
          placeholder="Target Weight"
          value={goal.targetWeight}
          onChange={(e) =>
            updateGoal("targetWeight", Number(e.target.value))
          }
        />

        <input
          style={styles.input}
          type="date"
          value={goal.startDate}
          onChange={(e) =>
            updateGoal("startDate", e.target.value)
          }
        />

        <input
          style={styles.input}
          type="date"
          value={goal.endDate}
          onChange={(e) =>
            updateGoal("endDate", e.target.value)
          }
        />
      </div>

      {/* PROGRESS */}
      <div style={styles.grid}>

        <div style={styles.card}>
          <h3>Progress</h3>

          <div style={styles.donut}>
            {percent}%
          </div>

          <p style={styles.subtext}>
            {currentWeight || "--"} kg
          </p>
        </div>

        <div style={styles.card}>
          <h3>Days Left</h3>
          <div style={styles.big}>
            {daysLeft > 0 ? daysLeft : "--"}
          </div>
        </div>

      </div>

      {/* ADD LOG */}
      <div style={styles.card}>
        <h3>Daily Weight</h3>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            style={styles.input}
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <button style={styles.btn} onClick={addLog}>
            Add
          </button>
        </div>
      </div>

      {/* HISTORY */}
      <div style={styles.card}>
        <h3>History</h3>

        {logs.length === 0 && (
          <p style={styles.subtext}>No logs yet</p>
        )}

        {logs.map((l) => (
          <div key={l.id} style={styles.row}>
            <span>
              {new Date(l.date).toLocaleDateString()}
            </span>
            <span>{l.weight} kg</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: {
    padding: 30,
    color: "#111827"
  },

  title: {
    fontSize: 28,
    marginBottom: 10
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f9fafb"
  },

  btn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer"
  },

  donut: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    border: "10px solid #16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px auto",
    fontSize: 20,
    fontWeight: "bold"
  },

  big: {
    fontSize: 40,
    textAlign: "center",
    color: "#16a34a"
  },

  subtext: {
    color: "#6b7280",
    textAlign: "center"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #f3f4f6"
  }
};