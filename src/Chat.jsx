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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff"
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
    color: "#fff",
    marginBottom: 8,
    wordWrap: "break-word"
  },
  typing: {
    padding: "10px 12px",
    color: "#888",
    fontStyle: "italic",
    alignSelf: "flex-start"
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
    color: "#fff",
    border: "1px solid #333",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 14
  },
  button: {
    padding: "10px 14px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    transition: "opacity 0.2s"
  }
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
  onAddTask,
  onAddExpense
}) {

  const [messages, setMessages] = useState(() =>
    getInitialMessages(chatHistory)
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);

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
    if (!chatHistory || chatHistory.length === 0) {
      setMessages(getInitialMessages([]));
      return;
    }

    setMessages(chatHistory);
  }, [chatHistory]);

  // ===== AUTO SCROLL =====
  useEffect(() => {
    if (bottomRef.current) {
      // Use setTimeout to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
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

  // ===== SEND MESSAGE =====
  const sendMessage = async (rawInput) => {
    const text = rawInput.trim();
    if (!text || isTyping || text.length > 2000) return;

    const userMsg = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
          const success = onAddExpense?.(aiResult.payload);
          if (success === false) {
            aiText = "⚠️ Failed to add transaction. Please try again.";
          }
        }

        aiText = aiResult.message || aiText;

      } else if (typeof aiResult === "string") {
        aiText = aiResult;
      }

      const aiMsg = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "ai",
        text: aiText,
        timestamp: Date.now()
      };

      saveMessages((prev) => [...prev, aiMsg]);

    } catch (err) {
      console.error("AI Response Error:", err);

      const errorMsg = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "ai",
        text: err.message?.includes("network") || err.message?.includes("fetch")
          ? "⚠️ Network error. Check your connection and try again."
          : "⚠️ Something went wrong. Please try again.",
        timestamp: Date.now()
      };

      saveMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // ===== ENTER =====
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.headerRow}>
        <h1 style={styles.title}>🤖 AI Coach</h1>
      </div>

      {/* CHAT */}
      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div
            key={msg.id || `msg-${Date.now()}`}
            style={{
              ...styles.msg,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#4f46e5" : "#111827"
            }}
          >
            {msg.text || "Message content unavailable"}
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
          aria-label="Chat message input"
          aria-describedby="chat-instructions"
        />

        <button
          style={{
            ...styles.button,
            opacity: isTyping || !input.trim() ? 0.5 : 1,
            cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer'
          }}
          onClick={() => sendMessage(input)}
          disabled={isTyping || !input.trim()}
          aria-label={isTyping ? "AI is responding" : "Send message"}
        >
          {isTyping ? "Thinking..." : "Send"}
        </button>
      </div>

      <div id="chat-instructions" style={{ display: 'none' }}>
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}