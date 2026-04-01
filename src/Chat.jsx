import { useEffect, useMemo, useRef, useState } from "react";
import { generateAIResponse, getSuggestionPrompts } from "./aiCoach";
import Papa from "papaparse"; // install this

// ===== INITIAL MESSAGES =====
const getInitialMessages = (history = []) => {
  if (history.length) return history;

  return [
    {
      id: "welcome",
      role: "ai",
      text: "👋 Hi! I am your AI coach. Ask me about habits, tasks, health, or finance.",
      timestamp: Date.now()
    }
  ];
};

export default function Chat({
  items = [],
  tasks = [],
  weightLogs = [],
  financeData = [],
  user,
  module = "general",
  chatHistory = [],
  onHistoryChange,
  onAddHabit,
  onAddTask
}) {

  const [messages, setMessages] = useState(() =>
    getInitialMessages(chatHistory)
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // ✅ NEW: Expenses state
  const [expenses, setExpenses] = useState([]);

  const bottomRef = useRef(null);

  const habits = useMemo(
    () => items.filter((item) => item.type === "habit"),
    [items]
  );

  const suggestionPrompts = useMemo(
    () => getSuggestionPrompts(module),
    [module]
  );

  // ===== FETCH EXPENSES =====
  const fetchExpenses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ===== EXPORT CSV =====
  const exportCSV = () => {
    const csv = Papa.unparse(expenses);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
  };

  // ===== SYNC HISTORY =====
  useEffect(() => {
    if (!chatHistory.length) return;

    setMessages((prev) =>
      prev.length === chatHistory.length ? prev : chatHistory
    );
  }, [chatHistory]);

  // ===== AUTO SCROLL =====
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ===== SAVE =====
  const saveMessages = (updater) => {
    setMessages((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;

      onHistoryChange?.(next);
      return next;
    });
  };

  // ===== ADD EXPENSE (NEW) =====
  const addExpense = async (expense) => {
    try {
      await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(expense)
      });

      fetchExpenses(); // refresh list
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async (rawInput) => {
    const text = rawInput.trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
      timestamp: Date.now()
    };

    saveMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const aiResult = await generateAIResponse(text, {
        habits,
        tasks,
        weightLogs,
        financeData,
        user,
        module
      });

      let aiText = "⚠️ Unexpected AI response.";

      // ===== HANDLE AI ACTIONS =====
      if (aiResult && typeof aiResult === "object") {

        if (aiResult.type === "add_habit" && aiResult.payload?.name) {
          onAddHabit?.(aiResult.payload.name);
        }

        if (aiResult.type === "add_task" && aiResult.payload?.name) {
          onAddTask?.(aiResult.payload.name);
        }

        // ✅ NEW: HANDLE EXPENSE
        if (aiResult.type === "add_expense" && aiResult.payload) {
          await addExpense(aiResult.payload);
        }

        aiText = aiResult.message || aiText;

      } else if (typeof aiResult === "string") {
        aiText = aiResult;
      }

      const aiMsg = {
        id: `${Date.now()}-ai`,
        role: "ai",
        text: aiText,
        timestamp: Date.now()
      };

      saveMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);

      saveMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "ai",
          text: "⚠️ Something went wrong. Try again.",
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ===== ENTER =====
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.headerRow}>
        <h1 style={styles.title}>🤖 AI Coach</h1>
        <button onClick={exportCSV} style={styles.exportBtn}>
          Export CSV
        </button>
      </div>

      {/* CHAT */}
      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.msg,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#4f46e5" : "#111827"
            }}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && <div style={styles.typing}>AI is typing...</div>}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach anything..."
          style={styles.input}
          rows={2}
          disabled={isTyping}
        />

        <button
          style={styles.button}
          onClick={() => sendMessage(input)}
          disabled={isTyping || !input.trim()}
        >
          {isTyping ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    height: "100%"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between"
  },
  exportBtn: {
    background: "#10b981",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },
  chatBox: {
    flex: 1,
    background: "#030712",
    padding: 16,
    borderRadius: 14,
    overflowY: "auto"
  },
  msg: {
    padding: "10px 12px",
    borderRadius: 12,
    maxWidth: "80%",
    color: "#fff"
  },
  inputRow: {
    display: "flex",
    gap: 10
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    background: "#020617",
    color: "#fff"
  },
  button: {
    padding: "10px 14px",
    background: "#6366f1",
    color: "#fff",
    border: "none"
  }
};