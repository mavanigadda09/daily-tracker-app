import { useState } from "react";
import { addFinance, deleteFinance } from "./cloud";

export default function Finance({ data }) {
  const finance = data?.financeData || [];

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    if (!amount) return;

    addFinance({
      amount,
      type,
      category,
      note
    });

    setAmount("");
    setCategory("");
    setNote("");
  };

  const income = finance
    .filter(f => f.type === "income")
    .reduce((sum, f) => sum + f.amount, 0);

  const expense = finance
    .filter(f => f.type === "expense")
    .reduce((sum, f) => sum + f.amount, 0);

  const balance = income - expense;

  return (
    <div style={{ padding: 20 }}>
      <h2>Finance</h2>

      <div>
        <input
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

      <hr />

      <h3>Summary</h3>
      <p>Income: ₹{income}</p>
      <p>Expense: ₹{expense}</p>
      <p>Balance: ₹{balance}</p>

      <hr />

      <h3>Transactions</h3>

      {finance.map((f) => (
        <div key={f.id} style={{ marginBottom: 10 }}>
          <b>{f.type}</b> ₹{f.amount} — {f.category}
          <br />
          <small>{f.note}</small>
          <br />
          <button onClick={() => deleteFinance(f.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}