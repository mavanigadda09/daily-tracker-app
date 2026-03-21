import { useState } from "react";

export default function Dashboard({ activities, addActivity, updateActivity }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [inputs, setInputs] = useState({});

  return (
    <div>
      <h1 style={styles.title}>Dashboard</h1>

      {/* Add */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Activity"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <button style={styles.btn} onClick={() => {
          addActivity(name, target);
          setName("");
          setTarget("");
        }}>
          Add
        </button>
      </div>

      {/* Activities */}
      <div style={styles.grid}>
        {activities.map((a) => {
          const percent = (a.value / a.target) * 100;

          return (
            <div key={a.id} style={styles.card}>
              <h3>{a.name}</h3>

              {/* Progress */}
              <div style={styles.progress}>
                <div style={{ ...styles.fill, width: `${percent}%` }} />
              </div>

              <p>{a.value} / {a.target}</p>

              {/* INPUT BASED CONTROL */}
              <div style={styles.row}>
                <button
                  style={styles.step}
                  onClick={() =>
                    updateActivity(a.id, -Number(inputs[a.id] || 0))
                  }
                >
                  −
                </button>

                <input
                  style={styles.smallInput}
                  placeholder="value"
                  value={inputs[a.id] || ""}
                  onChange={(e) =>
                    setInputs({ ...inputs, [a.id]: e.target.value })
                  }
                />

                <button
                  style={styles.step}
                  onClick={() =>
                    updateActivity(a.id, Number(inputs[a.id] || 0))
                  }
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  title: { marginBottom: 20 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },

  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 16
  },

  row: {
    display: "flex",
    gap: 10,
    marginTop: 10,
    alignItems: "center"
  },

  input: {
    padding: 10,
    borderRadius: 8,
    background: "#020617",
    color: "#fff",
    border: "1px solid #334155"
  },

  smallInput: {
    width: 60,
    textAlign: "center",
    padding: 8,
    borderRadius: 8,
    background: "#020617",
    color: "#fff",
    border: "1px solid #334155"
  },

  btn: {
    background: "#22c55e",
    padding: 10,
    borderRadius: 8,
    border: "none",
    color: "#fff"
  },

  step: {
    background: "#6366f1",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    color: "#fff"
  },

  progress: {
    height: 8,
    background: "#1e293b",
    borderRadius: 10,
    marginTop: 10
  },

  fill: {
    height: "100%",
    background: "#22c55e"
  }
};