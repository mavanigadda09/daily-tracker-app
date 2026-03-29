import { useState, useEffect, useRef } from "react";

export default function Activities({ items = [], setItems }) {

  const activities = Array.isArray(items)
    ? items.filter(i => i.type === "activity")
    : [];

  const [activeInput, setActiveInput] = useState(null);
  const [tempValues, setTempValues] = useState({});
  const wrapperRef = useRef(null);

  // ================= CLOSE DROPDOWN ON OUTSIDE CLICK =================
  useEffect(() => {
    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setActiveInput(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ================= UPDATE =================
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

  if (!items) {
    return (
      <div style={container}>
        <p style={{ color: "#94a3b8" }}>Loading activities...</p>
      </div>
    );
  }

  return (
    <div style={container} ref={wrapperRef}>
      <h1 style={title}>📊 Daily Activities</h1>

      {activities.length === 0 && (
        <p style={{ color: "#64748b" }}>No activities added</p>
      )}

      <div style={grid}>
        {activities.map((a) => {
          const percent = a.target
            ? Math.min((a.value / a.target) * 100, 100)
            : 0;

          const inputValue = tempValues[a.id] ?? "";

          return (
            <div key={a.id} style={card}>

              <h3 style={name}>{a.name}</h3>

              <p style={stats}>
                {a.value || 0} / {a.target || 0} {a.unit || ""}
              </p>

              {/* PROGRESS BAR */}
              <div style={barBg}>
                <div style={{ ...barFill, width: `${percent}%` }} />
              </div>

              {/* CONTROLS */}
              <div style={controls}>

                {/* MINUS */}
                <button
                  onClick={() => {
                    const val = Number(inputValue) || 1;
                    updateActivity(a.id, -val, "increment");
                    setTempValues((p) => ({ ...p, [a.id]: "" }));
                  }}
                  style={btn}
                >
                  −
                </button>

                {/* INPUT */}
                <div style={inputWrapper}>
                  <input
                    value={inputValue}
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
                    placeholder="0"
                    style={input}
                  />

                  {/* DROPDOWN */}
                  {activeInput === a.id && (
                    <div style={dropdown}>
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <div
                          key={num}
                          style={option}
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

                {/* PLUS */}
                <button
                  onClick={() => {
                    const val = Number(inputValue) || 1;
                    updateActivity(a.id, val, "increment");
                    setTempValues((p) => ({ ...p, [a.id]: "" }));
                  }}
                  style={btn}
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

const container = {
  display: "flex",
  flexDirection: "column",
  gap: 20
};

const title = {
  fontSize: 28,
  color: "#e2e8f0"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 20
};

const card = {
  background: "linear-gradient(145deg, #0f172a, #020617)",
  padding: 20,
  borderRadius: 14,
  border: "1px solid #1e293b",
  boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
  transition: "0.2s"
};

const name = {
  color: "#e2e8f0",
  marginBottom: 5
};

const stats = {
  color: "#94a3b8"
};

const barBg = {
  height: 8,
  background: "#1e293b",
  borderRadius: 10,
  marginTop: 10
};

const barFill = {
  height: 8,
  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
  borderRadius: 10
};

const controls = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 15
};

const btn = {
  padding: "8px 12px",
  background: "#6366f1",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold"
};

const inputWrapper = {
  position: "relative",
  flex: 1
};

const input = {
  width: "100%",
  padding: 8,
  textAlign: "center",
  background: "#020617",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 8
};

const dropdown = {
  position: "absolute",
  top: "110%",
  left: 0,
  right: 0,
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  zIndex: 10
};

const option = {
  padding: 8,
  cursor: "pointer",
  borderBottom: "1px solid #1e293b",
  color: "#e2e8f0"
};