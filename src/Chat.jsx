import { useState } from "react";
import { getUnifiedAI } from "./ai";

export default function Chat({
  items = [],
  tasks = [],
  weightLogs = [],
  user
}) {

  const [messages, setMessages] = useState([
    { role: "ai", text: "👋 Ask me anything about your progress." }
  ]);

  const [input, setInput] = useState("");

  const habits = items.filter(i => i.type === "habit");

  const handleSend = () => {
    if (!input) return;

    const userMsg = { role: "user", text: input };

    // 🧠 AI RESPONSE
    const aiReply = getUnifiedAI({
      habits,
      tasks,
      weightLogs,
      goal: user?.goal || {},
      streak: 0,
      consistency: 0.5
    });

    const aiMsg = {
      role: "ai",
      text: aiReply
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div style={styles.container}>

      <h1>🤖 AI Assistant</h1>

      {/* CHAT BOX */}
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#6366f1" : "#1f2937"
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          style={styles.input}
        />

        <button style={styles.button} onClick={handleSend}>
          Send
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    height: "100%"
  },

  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#020617",
    padding: 16,
    borderRadius: 12,
    overflowY: "auto"
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    color: "#fff"
  },

  inputRow: {
    display: "flex",
    gap: 10
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#020617",
    color: "#fff"
  },

  button: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#6366f1",
    color: "#fff"
  }
};