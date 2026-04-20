import { useState, useMemo, useCallback } from "react";
import { addFinance, deleteFinance } from "../../utils/cloud";
import { useFinanceForm, CATEGORIES } from "../../hooks/useFinanceForm";
import { useNotification } from "../../context/NotificationContext";

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatCurrency = (num) =>
  `₹${Number(num).toLocaleString("en-IN")}`;

/**
 * Normalizes dates from three formats Firebase can produce:
 *   1. Firestore Timestamp  → .toDate()
 *   2. ISO string / epoch   → new Date(val)
 *   3. Already a Date       → passthrough
 */
const normalizeDate = (val) => {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (val) => {
  const d = normalizeDate(val);
  return d
    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Finance({ financeData = [] }) {
  const { notify } = useNotification();
  const [pendingDelete, setPendingDelete] = useState(null);

  const { fields, setField, handleSubmit, isSubmitting } = useFinanceForm(
    (entry) => addFinance(entry),
    notify
  );

  // ── Data cleaning ──────────────────────────────────────────────────────────
  const validFinance = useMemo(
    () =>
      financeData.filter(
        (f) => f && typeof f.amount === "number" && f.amount > 0 && f.id
      ),
    [financeData]
  );

  // ── Summary ────────────────────────────────────────────────────────────────
  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    validFinance.forEach((f) => {
      if (f.type === "income") income += f.amount;
      else expense += f.amount;
    });
    return { income, expense, balance: income - expense };
  }, [validFinance]);

  // ── Category breakdown (expense only) ─────────────────────────────────────
  const expenseByCategory = useMemo(() => {
    const map = {};
    validFinance.forEach((f) => {
      if (f.type !== "expense") return;
      map[f.category] = (map[f.category] || 0) + f.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [validFinance]);

  // ── Sorted transactions ────────────────────────────────────────────────────
  const transactions = useMemo(
    () =>
      [...validFinance].sort((a, b) => {
        const da = normalizeDate(a.date);
        const db = normalizeDate(b.date);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      }),
    [validFinance]
  );

  // ── Delete with confirmation ───────────────────────────────────────────────
  const handleDeleteClick = useCallback((id) => {
    setPendingDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await deleteFinance(pendingDelete);
    } catch {
      notify?.({ type: "error", message: "Delete failed. Try again." });
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, notify]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <h2 style={styles.title}>Finance</h2>

      {/* SUMMARY */}
      <div style={styles.summary}>
        <SummaryCard label="Income"  value={formatCurrency(income)} />
        <SummaryCard label="Expense" value={formatCurrency(expense)} />
        <SummaryCard
          label="Balance"
          value={formatCurrency(balance)}
          valueStyle={{
            color: balance < 0
              ? "var(--color-text-danger)"
              : "var(--color-text-success)",
          }}
        />
      </div>

      {/* ADD FORM */}
      <div style={styles.form}>
        <input
          style={styles.input}
          type="number"
          placeholder="Amount"
          value={fields.amount}
          onChange={(e) => setField("amount", e.target.value)}
          min="0"
        />

        <select
          style={styles.select}
          value={fields.type}
          onChange={(e) => setField("type", e.target.value)}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <select
          style={styles.select}
          value={fields.category}
          onChange={(e) => setField("category", e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          style={styles.input}
          placeholder="Note (optional)"
          value={fields.note}
          onChange={(e) => setField("note", e.target.value)}
        />

        <button
          style={{
            ...styles.addBtn,
            opacity: isSubmitting ? 0.6 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding…" : "Add"}
        </button>
      </div>

      {/* QUICK CATEGORY PICK */}
      <div style={styles.quickRow}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            style={{
              ...styles.quickBtn,
              // FIX: was var(--color-border-primary) — now uses the defined token
              outline: fields.category === c
                ? "2px solid var(--color-border-primary)"
                : "none",
              background: fields.category === c
                ? "var(--color-background-info)"
                : "var(--color-background-secondary)",
              color: fields.category === c
                ? "var(--color-text-info)"
                : "var(--color-text-secondary)",
            }}
            onClick={() => setField("category", c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* BREAKDOWN */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Expense breakdown</h3>
        {expenseByCategory.length === 0 ? (
          <p style={styles.empty}>No expenses recorded yet</p>
        ) : (
          expenseByCategory.map(([cat, amt]) => (
            <div key={cat} style={styles.row}>
              <span>{cat}</span>
              <span>{formatCurrency(amt)}</span>
            </div>
          ))
        )}
      </section>

      {/* TRANSACTIONS */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Transactions</h3>
        {transactions.length === 0 ? (
          <p style={styles.empty}>No transactions yet</p>
        ) : (
          transactions.map((f) => (
            <div key={f.id} style={styles.tx}>
              <div>
                <span style={{
                  ...styles.typeBadge,
                  // FIX: replaced undefined --color-background-success/danger
                  // with the tokens now defined in index.css
                  background: f.type === "income"
                    ? "var(--color-background-success)"
                    : "var(--color-background-danger)",
                  color: f.type === "income"
                    ? "var(--color-text-success)"
                    : "var(--color-text-danger)",
                }}>
                  {f.type}
                </span>
                {" "}
                <b>{formatCurrency(f.amount)}</b>
                <div style={styles.meta}>
                  {f.category} · {formatDate(f.date)}
                </div>
                {f.note && <div style={styles.note}>{f.note}</div>}
              </div>

              {pendingDelete === f.id ? (
                <div style={styles.deleteConfirm}>
                  <span style={styles.deletePrompt}>Delete?</span>
                  <button style={styles.confirmBtn} onClick={handleDeleteConfirm}>Yes</button>
                  <button style={styles.cancelBtn} onClick={() => setPendingDelete(null)}>No</button>
                </div>
              ) : (
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDeleteClick(f.id)}
                  aria-label="Delete transaction"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, valueStyle }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, ...valueStyle }}>{value}</div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    padding: 20,
    color: "var(--color-text-primary)",
  },
  title: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 600,
  },
  summary: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  card: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    borderRadius: 10,
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
  },
  cardLabel: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--color-text-primary)",
  },
  form: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: 100,
    padding: "8px 10px",
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 6,
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
  },
  select: {
    padding: "8px 10px",
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 6,
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
  },
  addBtn: {
    padding: "8px 18px",
    background: "var(--color-background-info)",
    color: "var(--color-text-info)",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
  },
  quickRow: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  quickBtn: {
    padding: "5px 10px",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.1s",
    fontFamily: "inherit",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 10,
    color: "var(--color-text-primary)",
  },
  empty: {
    color: "var(--color-text-tertiary)",
    fontSize: 14,
    padding: "20px 0",
    textAlign: "center",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: "1px solid var(--color-border-tertiary)",
    fontSize: 14,
  },
  tx: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "10px 0",
    borderBottom: "1px solid var(--color-border-tertiary)",
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 4,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  meta: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
    marginTop: 3,
  },
  note: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    marginTop: 2,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "var(--color-text-tertiary)",
    cursor: "pointer",
    fontSize: 14,
    padding: "2px 6px",
    borderRadius: 4,
    flexShrink: 0,
  },
  deleteConfirm: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  deletePrompt: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
  },
  confirmBtn: {
    background: "var(--color-background-danger)",
    color: "var(--color-text-danger)",
    border: "1px solid var(--color-border-danger)",
    borderRadius: 4,
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  cancelBtn: {
    background: "var(--color-background-secondary)",
    color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 4,
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: 12,
  },
};
