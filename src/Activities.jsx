import { useState, useEffect, useRef, useMemo, useCallback } from "react";

export default function Activities({ items = [], setItems }) {
  const wrapperRef = useRef(null);

  const [activeInput, setActiveInput] = useState(null);
  const [tempValues, setTempValues] = useState({});

  // ✅ Memoized activities
  const activities = useMemo(() => {
    return Array.isArray(items)
      ? items.filter((i) => i.type === "activity")
      : [];
  }, [items]);

  // ✅ Click outside handler
  useEffect(() => {
    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setActiveInput(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ✅ Safe updater
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