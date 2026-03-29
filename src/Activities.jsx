import { useState, useEffect, useRef } from "react";

export default function Activities({ items = [], setItems }) {

  const activities = Array.isArray(items)
    ? items.filter(i => i.type === "activity")
    : [];

  const [activeInput, setActiveInput] = useState(null);
  const [tempValues, setTempValues] = useState({});
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setActiveInput(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updateActivity = (id, value, mode) => {
    if (!setItems) return;

    setItems((prev = []) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newValue = item.value || 0;

        if (mode === "set") {
          newValue = Number(value) || 0;
        } else {
          newValue = newValue + (Number(value) || 0);
        }

        return {
          ...item,
          value: Math.max(newValue, 0)
        };
      })
    );
  };

  return (
    <div style={styles.container} ref={wrapperRef}>

      <h1 style={styles.title}>Activities</h1>
      <p style={styles.subtitle}>Track your daily progress</p>

      {activities.length === 0 && (
        <p style={styles.empty}>No activities added</p>
      )}

      <div style={styles.grid}>
        {activities.map((a) => {
          const percent = a.target
            ? Math.min((a.value / a.target) * 100, 100)
            : 0;

          const inputValue = tempValues[a.id] ?? "";

          return (
            <div key={a.id} style={styles.card}>

              <h3>{a.name}</h3>

              <p style={styles.stats}>
                {a.value || 0} / {a.target || 0} {a.unit || ""}
              </p>

              {/* PROGRESS */}
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${percent}%`
                  }}
                />
              </div>

              {/* CONTROLS */}
              <div style={styles.controls}>

                <button
                  style={styles.btn}
                  onClick={() => {
                    const val = Number(inputValue) || 1;
                    updateActivity(a.id, -val, "increment");
                    setTempValues((p) => ({ ...p, [a.id]: "" }));
                  }}
                >
                  −
                </button>

                <div style={styles.inputWrapper}>
                  <input
                    value={inputValue}
                    placeholder="0"
                    style={styles.input}
                    onFocus={() => setActiveInput(a.id)}
                    onChange={(e) =>
                      setTempValues({
                        ...tempValues,
                        [a.id]: e.target.value
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = Number(inputValue) || 0;
                        updateActivity(a.id, val, "increment");
                        setTempValues((p) => ({ ...p, [a.id]: "" }));
                        setActiveInput(null);
                      }
                    }}
                  />

                  {activeInput === a.id && (
                    <div style={styles.dropdown}>
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <div
                          key={num}
                          style={styles.option}
                          onClick={() => {
                            updateActivity(a.id, num, "increment");
                            setActiveInput(null);
                          }}
                        >
                          +{num}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  style={styles.btn}
                  onClick={() => {
                    const val = Number(inputValue) || 1;
                    updateActivity(a.id, val, "increment");
                    setTempValues((p) => ({ ...p, [a.id]: "" }));
                  }}
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

// ================= STYLES =================
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  title: {
    fontSize: 28
  },

  subtitle: {
    color: "var(--text-muted)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
    gap: 16
  },

  card: {
    background: "var(--card)",
    padding: 16,
    borderRadius: 12,
    border: "1px solid var(--border)"
  },

  stats: {
    color: "var(--text-muted)"
  },

  barBg: {
    height: 8,
    background: "var(--border)",
    borderRadius: 10,
    marginTop: 10
  },

  barFill: {
    height: 8,
    background: "var(--accent)",
    borderRadius: 10
  },

  controls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 14
  },

  btn: {
    padding: "6px 10px",
    background: "var(--accent)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  inputWrapper: {
    position: "relative",
    flex: 1
  },

  input: {
    width: "100%",
    padding: 8,
    textAlign: "center",
    background: "#020617",
    color: "#fff",
    border: "1px solid var(--border)",
    borderRadius: 8
  },

  dropdown: {
    position: "absolute",
    top: "110%",
    left: 0,
    right: 0,
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    zIndex: 10
  },

  option: {
    padding: 8,
    cursor: "pointer",
    borderBottom: "1px solid var(--border)",
    color: "var(--text)"
  },

  empty: {
    color: "var(--text-muted)"
  }
};