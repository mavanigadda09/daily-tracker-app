import { useState } from "react";
import { addFinance, deleteFinance } from "./cloud";

export default function Finance({ financeData }) {
  const finance = financeData || [];

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }

    addFinance({
      amount: numAmount,
      type,
      category: category || "Other",
      note
    });

    setAmount("");
    setCategory("");
    setNote("");
  };

  // ===== CALCULATIONS =====
  const validFinance = finance.filter(f =>
    f &&
    typeof f.amount === 'number' &&
    !isNaN(f.amount) &&
    f.amount > 0 &&
    ['income', 'expense'].includes(f.type) &&
    f.id &&
    typeof f.date === 'number'
  );

  const income = validFinance
    .filter(f => f.type === "income")
    .reduce((sum, f) => sum + f.amount, 0);

  const expense = validFinance
    .filter(f => f.type === "expense")
    .reduce((sum, f) => sum + f.amount, 0);

  const balance = income - expense;

  // ===== CATEGORY BREAKDOWN =====
  const categoryMap = {};

  validFinance.forEach((f) => {
    if (f.type !== "expense") return;

    if (!categoryMap[f.category]) {
      categoryMap[f.category] = 0;
    }

    categoryMap[f.category] += f.amount;
  });

  const categories = Object.entries(categoryMap);

  return (
    <div style={{ padding: 20 }}>

      <h2>Finance Dashboard</h2>

      {/* ===== SUMMARY CARDS ===== */}
      <div style={styles.summary}>
        <div style={styles.card}>
          <h4>Income</h4>
          <p>₹{income}</p>
        </div>
        <div style={styles.card}>
          <h4>Expense</h4>
          <p>₹{expense}</p>
        </div>
        <div style={styles.card}>
          <h4>Balance</h4>
          <p style={{ color: balance < 0 ? "red" : "lightgreen" }}>
            ₹{balance}
          </p>
        </div>
      </div>

      {/* ===== ADD FORM ===== */}
      <div style={styles.form}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button onClick={handleAdd}>Add</button>
      </div>

      {/* ===== CATEGORY BREAKDOWN ===== */}
      <div style={styles.section}>
        <h3>Expense Breakdown</h3>

        {categories.length === 0 && <p>No expense data</p>}

        {categories.map(([cat, amt]) => (
          <div key={cat} style={styles.row}>
            <span>{cat}</span>
            <span>₹{amt}</span>
          </div>
        ))}
      </div>

      {/* ===== TRANSACTIONS ===== */}
      <div style={styles.section}>
        <h3>Transactions</h3>

        {validFinance.map((f) => (
          <div key={f.id} style={styles.tx}>
            <div>
              <b>{f.type.toUpperCase()}</b> ₹{f.amount}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {f.category} • {new Date(f.date).toLocaleDateString()}
              </div>
              {f.note && (
                <div style={{ fontSize: 12 }}>{f.note}</div>
              )}
            </div>

            <button onClick={() => deleteFinance(f.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  summary: {
    display: "flex",
    gap: 12,
    marginBottom: 20
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    background: "#111",
    color: "#fff"
  },
  form: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap"
  },
  section: {
    marginBottom: 20
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0"
  },
  tx: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #333"
  }
};