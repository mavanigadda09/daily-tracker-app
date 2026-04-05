import { useEffect, useRef, useState } from "react";
import { processUserInput } from "./ai/aiService.js";

// ===== INITIAL =====
const getInitialMessages = (history = []) => {
  if (history?.length) return history;

  return [
    {
      id: "welcome",
      role: "ai",
      text: "🤖 Hi! I am your AI coach. Ask me anything."
    }
  ];
};

// ===== SUGGESTIONS =====
const suggestions = [
  "Analyze my habits",
  "What should I improve today?",
  "Add task: workout",
  "I spent 200 on food"
];

export default function Chat({
  items = [],
  tasks = [],
  weightLogs = [],
  financeData = [],
  user,
  chatHistory = [],
  setChatHistory,
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

      setChatHistory?.(next);
      return next;
    });
  };

  // ===== TYPING EFFECT =====
  const typeMessage = async (text) => {
    const id = Date.now();
    let current = "";

    saveMessages((prev) => [...prev, { id, role: "ai", text: "" }]);

    for (let i = 0; i < text.length; i++) {
      current += text[i];

      await new Promise((r) => setTimeout(r, 10)); // faster typing

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, text: current } : m
        )
      );
    }
  };

  // ===== SEND =====
  const sendMessage = async (rawInput) => {
    const text = rawInput?.trim();
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
        }

        aiText = aiResult.message || "Action completed ✅";
      } else {
        aiText = aiResult?.message || "AI response";
      }

      await typeMessage(aiText);

    } catch (err) {
      console.error("Chat Error:", err);

      saveMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: "⚠️ AI error. Please try again."
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

      {/* SUGGESTIONS */}
      <div style={styles.suggestions}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            style={styles.suggestionBtn}
            onClick={() => sendMessage(s)}
            disabled={isTyping}
          >
            {s}
          </button>
        ))}
      </div>

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
          disabled={isTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage(input);
          }}
        />

        <button
          onClick={() => sendMessage(input)}
          style={styles.button}
          disabled={isTyping}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ===== STYLES =====
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

  suggestions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 10
  },

  suggestionBtn: {
    padding: "6px 10px",
    background: "#1f2937",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
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
    color: "#fff",
    wordBreak: "break-word"
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