import { useState, useMemo } from "react";
import { addFinance, deleteFinance } from "./cloud";

const categoriesList = [
  "Food", "Travel", "Shopping", "Health", "Bills", "Other"
];

export default function Finance({ financeData = [] }) {

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const formatCurrency = (num) =>
    `₹${num.toLocaleString("en-IN")}`;

  // ===== ADD =====
  const handleAdd = () => {
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      alert("Enter valid amount");
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

  // ===== CLEAN DATA =====
  const validFinance = useMemo(() => {
    return financeData.filter(f =>
      f &&
      typeof f.amount === "number" &&
      f.amount > 0 &&
      f.id
    );
  }, [financeData]);

  // ===== CALCULATIONS =====
  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    validFinance.forEach(f => {
      if (f.type === "income") income += f.amount;
      else expense += f.amount;
    });

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [validFinance]);

  // ===== CATEGORY =====
  const categories = useMemo(() => {
    const map = {};

    validFinance.forEach(f => {
      if (f.type !== "expense") return;

      map[f.category] = (map[f.category] || 0) + f.amount;
    });

    return Object.entries(map);
  }, [validFinance]);

  // ===== SORTED TRANSACTIONS =====
  const transactions = useMemo(() => {
    return [...validFinance].sort((a, b) => b.date - a.date);
  }, [validFinance]);

  return (
    <div style={{ padding: 20 }}>

      <h2>💰 Finance Dashboard</h2>

      {/* ===== SUMMARY ===== */}
      <div style={styles.summary}>
        <div style={styles.card}>
          <h4>Income</h4>
          <p>{formatCurrency(income)}</p>
        </div>

        <div style={styles.card}>
          <h4>Expense</h4>
          <p>{formatCurrency(expense)}</p>
        </div>

        <div style={styles.card}>
          <h4>Balance</h4>
          <p style={{ color: balance < 0 ? "red" : "lightgreen" }}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* ===== FORM ===== */}
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

      {/* ===== CATEGORY QUICK PICK ===== */}
      <div style={styles.quick}>
        {categoriesList.map((c) => (
          <button
            key={c}
            style={styles.quickBtn}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ===== BREAKDOWN ===== */}
      <div style={styles.section}>
        <h3>Expense Breakdown</h3>

        {categories.length === 0 && <p>No data yet</p>}

        {categories.map(([cat, amt]) => (
          <div key={cat} style={styles.row}>
            <span>{cat}</span>
            <span>{formatCurrency(amt)}</span>
          </div>
        ))}
      </div>

      {/* ===== TRANSACTIONS ===== */}
      <div style={styles.section}>
        <h3>Transactions</h3>

        {transactions.length === 0 && <p>No transactions yet</p>}

        {transactions.map((f) => (
          <div key={f.id} style={styles.tx}>
            <div>
              <b>{f.type.toUpperCase()}</b> {formatCurrency(f.amount)}
              <div style={styles.meta}>
                {f.category} • {new Date(f.date).toLocaleDateString()}
              </div>
              {f.note && <div style={styles.note}>{f.note}</div>}
            </div>

            <button onClick={() => deleteFinance(f.id)}>✕</button>
          </div>
        ))}
      </div>

    </div>
  );
}

// ================= STYLES =================
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
    marginBottom: 10,
    flexWrap: "wrap"
  },

  quick: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
    flexWrap: "wrap"
  },

  quickBtn: {
    padding: "6px 10px",
    background: "#1f2937",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer"
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
  },

  meta: {
    fontSize: 12,
    opacity: 0.7
  },

  note: {
    fontSize: 12
  }
};