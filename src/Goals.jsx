import { useState, useEffect } from "react";

export default function Goals() {

  // ================= LOAD =================
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

  // ================= SAVE =================
  useEffect(() => {
    localStorage.setItem("goal", JSON.stringify(goal));
    localStorage.setItem("weightLogs", JSON.stringify(logs));
  }, [goal, logs]);

  // ================= ADD LOG =================
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

  // ================= CALCULATIONS =================
  const currentWeight = logs.length ? logs[logs.length - 1].weight : goal.startWeight;

  const totalLoss = goal.startWeight - goal.targetWeight;
  const currentLoss = goal.startWeight - currentWeight;

  const percent = totalLoss
    ? Math.min(Math.round((currentLoss / totalLoss) * 100), 100)
    : 0;

  const daysLeft = goal.endDate
    ? Math.ceil(
        (new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  // ================= UI =================
  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🎯 Goal Tracker</h1>

      {/* GOAL SETUP */}
      <div style={styles.card}>
        <h3>Set Goal</h3>

        <input
          placeholder="Start Weight"
          value={goal.startWeight}
          onChange={(e) => setGoal({ ...goal, startWeight: Number(e.target.value) })}
        />

        <input
          placeholder="Target Weight"
          value={goal.targetWeight}
          onChange={(e) => setGoal({ ...goal, targetWeight: Number(e.target.value) })}
        />

        <input
          type="date"
          value={goal.startDate}
          onChange={(e) => setGoal({ ...goal, startDate: e.target.value })}
        />

        <input
          type="date"
          value={goal.endDate}
          onChange={(e) => setGoal({ ...goal, endDate: e.target.value })}
        />
      </div>

      {/* PROGRESS */}
      <div style={styles.grid}>

        {/* DONUT */}
        <div style={styles.card}>
          <h3>Progress</h3>

          <div style={styles.donut}>
            {percent}%
          </div>

          <p>{currentWeight} kg</p>
        </div>

        {/* DAYS LEFT */}
        <div style={styles.card}>
          <h3>Days Left</h3>
          <div style={styles.big}>{daysLeft}</div>
        </div>

      </div>

      {/* LOG ENTRY */}
      <div style={styles.card}>
        <h3>Daily Weight</h3>

        <input
          placeholder="Enter weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <button onClick={addLog}>Add</button>
      </div>

      {/* LOG TABLE */}
      <div style={styles.card}>
        <h3>History</h3>

        {logs.map((l, i) => (
          <div key={i}>
            {l.date} — {l.weight} kg
          </div>
        ))}
      </div>

    </div>
  );
}

// ================= STYLES =================

const styles = {
  container: {
    padding: 30
  },

  title: {
    fontSize: 28,
    marginBottom: 20
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16,
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

  donut: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    border: "10px solid #f59e0b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px auto",
    fontSize: 20,
    fontWeight: "bold"
  },

  big: {
    fontSize: 40,
    textAlign: "center"
  }
};