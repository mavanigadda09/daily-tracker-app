import { useState, useEffect } from "react";

export default function Goals() {

  const [goal, setGoal] = useState(() => {
    return JSON.parse(localStorage.getItem("goal")) || {
      startWeight: "",
      targetWeight: "",
      startDate: "",
      endDate: ""
    };
  });

  const [logs, setLogs] = useState(() => {
    return JSON.parse(localStorage.getItem("weightLogs")) || [];
  });

  const [weight, setWeight] = useState("");

  useEffect(() => {
    localStorage.setItem("goal", JSON.stringify(goal));
    localStorage.setItem("weightLogs", JSON.stringify(logs));
  }, [goal, logs]);

  const addLog = () => {
    if (!weight) return;

    setLogs([
      ...logs,
      {
        date: new Date().toISOString().split("T")[0],
        weight: Number(weight)
      }
    ]);

    setWeight("");
  };

  const currentWeight = logs.length
    ? logs[logs.length - 1].weight
    : goal.startWeight;

  const totalLoss = goal.startWeight - goal.targetWeight;
  const currentLoss = goal.startWeight - currentWeight;

  const percent = totalLoss
    ? Math.min(Math.round((currentLoss / totalLoss) * 100), 100)
    : 0;

  const daysLeft = goal.endDate
    ? Math.ceil(
        (new Date(goal.endDate) - new Date()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Goal Tracker</h1>
      <p style={styles.subtitle}>Track your transformation journey</p>

      {/* GOAL SETUP */}
      <div style={styles.card}>
        <h3>Set Goal</h3>

        <input
          style={styles.input}
          placeholder="Start Weight"
          value={goal.startWeight}
          onChange={(e) =>
            setGoal({ ...goal, startWeight: Number(e.target.value) })
          }
        />

        <input
          style={styles.input}
          placeholder="Target Weight"
          value={goal.targetWeight}
          onChange={(e) =>
            setGoal({ ...goal, targetWeight: Number(e.target.value) })
          }
        />

        <input
          style={styles.input}
          type="date"
          value={goal.startDate}
          onChange={(e) =>
            setGoal({ ...goal, startDate: e.target.value })
          }
        />

        <input
          style={styles.input}
          type="date"
          value={goal.endDate}
          onChange={(e) =>
            setGoal({ ...goal, endDate: e.target.value })
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

          <p style={styles.subtext}>{currentWeight} kg</p>
        </div>

        <div style={styles.card}>
          <h3>Days Left</h3>
          <div style={styles.big}>{daysLeft}</div>
        </div>

      </div>

      {/* LOG ENTRY */}
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

        {logs.map((l, i) => (
          <div key={i} style={styles.row}>
            <span>{l.date}</span>
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
    marginBottom: 5
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: 20
  },

  card: {
    background: "#ffffff",
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