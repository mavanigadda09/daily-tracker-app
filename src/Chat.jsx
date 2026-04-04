import { useEffect, useMemo, useRef, useState } from "react";
import { processUserInput } from "../ai/aiService";

// ===== INITIAL =====
const getInitialMessages = (history = []) => {
  if (history.length) return history;

  return [
    {
      id: "welcome",
      role: "ai",
      text: "🤖 Hi! I am your AI coach. Ask me anything.",
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
  chatHistory = [],
  onHistoryChange,
  onAddHabit,
  onAddTask,
  onAddExpense
}) {

  const [messages, setMessages] = useState(() =>
    getInitialMessages(chatHistory)
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);

  // ===== SAVE =====
  const saveMessages = (updater) => {
    setMessages((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;

      onHistoryChange?.(next);
      return next;
    });
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async (rawInput) => {
    const text = rawInput.trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text
    };

    saveMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const aiResult = await processUserInput(text, {
        items,
        tasks,
        weightLogs,
        financeData,
        user
      });

      let aiText = "⚠️ AI response failed";

      // 🔥 EXECUTE ACTIONS
      if (aiResult?.type === "action") {

        switch (aiResult.action) {

          case "add_task":
            onAddTask?.(aiResult.data?.title || "New Task");
            break;

          case "add_habit":
            onAddHabit?.(aiResult.data?.title || "New Habit");
            break;

          case "add_expense":
            onAddExpense?.(aiResult.data);
            break;

          default:
            break;
        }

        aiText = aiResult.message || "Action completed ✅";

      } else {
        aiText = aiResult.message || "AI response";
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: aiText
      };

      saveMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);

      saveMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: "⚠️ AI error. Try again."
        }
      ]);
    }

    setIsTyping(false);
  };

  // ===== AUTO SCROLL =====
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>🤖 AI Coach</h1>

      {/* CHAT */}
      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.msg,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#22c55e" : "#111827"
            }}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && <div style={styles.typing}>AI is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          style={styles.input}
        />

        <button onClick={() => sendMessage(input)} style={styles.button}>
          Send
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },

  title: {
    fontSize: 22,
    marginBottom: 10
  },

  chatBox: {
    flex: 1,
    background: "#020617",
    padding: 12,
    borderRadius: 12,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    color: "#fff"
  },

  typing: {
    fontStyle: "italic",
    color: "#888"
  },

  inputRow: {
    display: "flex",
    gap: 8,
    marginTop: 10
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#020617",
    color: "#fff"
  },

  button: {
    padding: "10px 14px",
    background: "#22c55e",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  }
};