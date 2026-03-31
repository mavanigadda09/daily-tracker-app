import { useEffect, useMemo, useRef, useState } from "react";
import { generateAIResponse, getSuggestionPrompts } from "./aiCoach";

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
  onHistoryChange
}) {

  // ===== STATE =====
  const [messages, setMessages] = useState(() =>
    getInitialMessages(chatHistory)
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);

  // ===== MEMOIZED DATA =====
  const habits = useMemo(
    () => items.filter((item) => item.type === "habit"),
    [items]
  );

  const suggestionPrompts = useMemo(
    () => getSuggestionPrompts(module),
    [module]
  );

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

  // ===== SAVE MESSAGES =====
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
      id: `${Date.now()}-user`,
      role: "user",
      text,
      timestamp: Date.now()
    };

    saveMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const aiText = await generateAIResponse(text, {
        habits,
        tasks,
        weightLogs,
        financeData,
        user,
        module
      });

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

  // ===== ENTER KEY SUPPORT =====
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ===== UI =====
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.headerRow}>
        <h1 style={styles.title}>🤖 AI Coach</h1>
        <p style={styles.subtitle}>Module: {module}</p>
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

      {/* SUGGESTIONS */}
      <div style={styles.suggestionsRow}>
        {suggestionPrompts.slice(0, 3).map((prompt) => (
          <button
            key={prompt}
            style={styles.suggestionButton}
            onClick={() => sendMessage(prompt)}
            disabled={isTyping}
          >
            {prompt}
          </button>
        ))}
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
    height: "100%",
    minHeight: 0
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  title: {
    margin: 0,
    fontSize: "1.6rem"
  },
  subtitle: {
    margin: 0,
    color: "#9ca3af"
  },
  chatBox: {
    flex: 1,
    minHeight: 300,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#030712",
    padding: 16,
    borderRadius: 14,
    border: "1px solid #1f2937",
    overflowY: "auto"
  },
  msg: {
    padding: "10px 12px",
    borderRadius: 12,
    maxWidth: "80%",
    color: "#fff",
    whiteSpace: "pre-wrap",
    lineHeight: 1.4
  },
  typing: {
    color: "#9ca3af",
    fontSize: 14
  },
  suggestionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  suggestionButton: {
    background: "#111827",
    border: "1px solid #374151",
    color: "#d1d5db",
    borderRadius: 999,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13
  },
  inputRow: {
    display: "flex",
    gap: 10
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#020617",
    color: "#fff",
    resize: "none"
  },
  button: {
    minWidth: 110,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer"
  }
};