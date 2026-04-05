import { useState, useEffect, useRef, useMemo, useCallback } from "react";

export default function Activities({ items = [], setItems }) {
  const wrapperRef = useRef(null);

  const [activeInput, setActiveInput] = useState(null);
  const [tempValues, setTempValues] = useState({});

  const activities = useMemo(() => {
    return Array.isArray(items)
      ? items.filter((i) => i.type === "activity")
      : [];
  }, [items]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setActiveInput(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updateActivity = useCallback((id, value, mode) => {
    if (!setItems) return;

    setItems((prev = []) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let newValue = item.value || 0;

        if (mode === "set") {
          newValue = Number(value) || 0;
        } else {
          newValue += Number(value) || 0;
        }

        return {
          ...item,
          value: Math.max(newValue, 0)
        };
      })
    );
  }, [setItems]);

  const updateTempValue = (id, value) => {
    setTempValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const clearTemp = (id) => {
    setTempValues((prev) => ({
      ...prev,
      [id]: ""
    }));
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

          const handleAdd = () => {
            const val = Number(inputValue) || 1;
            updateActivity(a.id, val, "increment");
            clearTemp(a.id);
          };

          const handleSubtract = () => {
            const val = Number(inputValue) || 1;
            updateActivity(a.id, -val, "increment");
            clearTemp(a.id);
          };

          return (
            <div key={a.id} style={styles.card}>
              <h3>{a.name}</h3>

              <p style={styles.stats}>
                {a.value || 0} / {a.target || 0} {a.unit || ""}
              </p>

              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${percent}%`
                  }}
                />
              </div>

              <div style={styles.controls}>
                <button style={styles.btn} onClick={handleSubtract}>
                  −
                </button>

                <div style={styles.inputWrapper}>
                  <input
                    value={inputValue}
                    placeholder="0"
                    style={styles.input}
                    onFocus={() => setActiveInput(a.id)}
                    onChange={(e) =>
                      updateTempValue(a.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAdd();
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

                <button style={styles.btn} onClick={handleAdd}>
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


// ✅ REQUIRED STYLES (FIX)
const styles = {
  container: { padding: 20, color: "white" },

  title: { fontSize: 24 },
  subtitle: { color: "#94a3b8", marginBottom: 10 },

  empty: { color: "#94a3b8" },

  grid: {
    display: "grid",
    gap: 15,
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
  },

  card: {
    padding: 15,
    background: "#0f172a",
    borderRadius: 10
  },

  stats: { marginBottom: 8 },

  barBg: {
    height: 8,
    background: "#1e293b",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10
  },

  barFill: {
    height: "100%",
    background: "#22c55e"
  },

  controls: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },

  btn: {
    padding: "6px 10px",
    background: "#1e293b",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer"
  },

  inputWrapper: {
    position: "relative"
  },

  input: {
    width: 60,
    padding: 6,
    textAlign: "center"
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#111827",
    borderRadius: 6,
    marginTop: 4,
    zIndex: 10
  },

  option: {
    padding: 6,
    cursor: "pointer",
    color: "white"
  }
};