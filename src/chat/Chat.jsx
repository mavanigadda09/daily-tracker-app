import { useEffect, useRef, useState, useCallback } from "react";
import { processUserInput } from "../ai/aiService.js";

// ─── Constants ────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  id:   "welcome",
  role: "ai",
  text: "🔥 Hi! I'm your Phoenix AI coach. Ask me anything.",
};

const SUGGESTIONS = [
  "Analyze my habits",
  "What should I improve today?",
  "Add task: workout",
  "I spent 200 on food",
];

const TYPING_DELAY_MS = 8; // ms per character

// ─── Component ────────────────────────────────────────────────
export default function Chat({
  items       = [],
  tasks       = [],
  weightLogs  = [],
  financeData = [],
  user,
  chatHistory    = [],
  setChatHistory,
  onAddHabit,
  onAddTask,
  onAddExpense,
}) {
  const [messages,  setMessages]  = useState(() =>
    chatHistory.length ? chatHistory : [WELCOME_MESSAGE]
  );
  const [input,    setInput]    = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);

  // ─── Persist messages ─────────────────────────────────────
  // Only called with the final complete message array —
  // never called mid-type so chatHistory is always complete.
  const persist = useCallback((msgs) => {
    setChatHistory?.(msgs);
  }, [setChatHistory]);

  // ─── Typing effect ────────────────────────────────────────
  /**
   * Animates a message character by character.
   * Returns the final completed message list so the caller
   * can persist it after the animation finishes.
   */
  const typeMessage = useCallback(async (text, currentMessages) => {
    const id = `ai-${Date.now()}`;
    const placeholder = { id, role: "ai", text: "" };

    // Add empty message shell
    const withPlaceholder = [...currentMessages, placeholder];
    setMessages(withPlaceholder);

    let built = "";
    for (const char of text) {
      built += char;
      await new Promise((r) => setTimeout(r, TYPING_DELAY_MS));
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: built } : m))
      );
    }

    // Return completed message list for persistence
    return withPlaceholder.map((m) =>
      m.id === id ? { ...m, text } : m
    );
  }, []);

  // ─── Send ─────────────────────────────────────────────────
  const sendMessage = useCallback(async (rawInput) => {
    const text = rawInput?.trim();
    if (!text || isTyping) return;

    const userMsg = { id: `user-${Date.now()}`, role: "user", text };
    const withUser = [...messages, userMsg];

    setMessages(withUser);
    setInput("");
    setIsTyping(true);

    let aiText = "⚠️ AI response failed.";

    try {
      const aiResult = await processUserInput(text, {
        items, tasks, weightLogs, financeData, user,
      });

      if (aiResult?.type === "action") {
        switch (aiResult.action) {
          case "add_task":    onAddTask?.(aiResult.data?.title    || "New Task");    break;
          case "add_habit":   onAddHabit?.(aiResult.data?.title   || "New Habit");   break;
          case "add_expense": onAddExpense?.(aiResult.data);                          break;
        }
        aiText = aiResult.message || "Action completed ✅";
      } else {
        aiText = aiResult?.message || "I didn't catch that.";
      }
    } catch (err) {
      console.error("[Chat] processUserInput failed:", err);
      aiText = "⚠️ Something went wrong. Please try again.";
    }

    // Type animation — always runs, even on error message
    try {
      const finalMessages = await typeMessage(aiText, withUser);
      // Persist only after animation completes — history is always complete
      persist(finalMessages);
    } catch (err) {
      console.error("[Chat] typeMessage failed:", err);
    }

    setIsTyping(false);
  }, [
    isTyping, messages, items, tasks, weightLogs,
    financeData, user, onAddTask, onAddHabit,
    onAddExpense, typeMessage, persist,
  ]);

  // ─── Auto scroll ──────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 AI Coach</h1>

      {/* SUGGESTIONS */}
      <div style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            style={styles.suggestionBtn}
            onClick={() => sendMessage(s)}
            disabled={isTyping}
          >
            {s}
          </button>
        ))}
      </div>

      {/* CHAT BOX */}
      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.msg,
              alignSelf:  msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user"
                ? "var(--accent)"
                : "var(--card-hover)",
              color: msg.role === "user" ? "#020617" : "var(--text)",
            }}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div style={styles.typingIndicator}>
            <span style={styles.dot} />
            <span style={styles.dot} />
            <span style={styles.dot} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT ROW */}
      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
          placeholder="Ask anything..."
          style={styles.input}
          disabled={isTyping}
        />
        <button
          onClick={() => sendMessage(input)}
          style={{
            ...styles.sendBtn,
            opacity: isTyping ? 0.5 : 1,
          }}
          disabled={isTyping}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  container: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "var(--text)",
  },
  suggestions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  suggestionBtn: {
    padding: "6px 12px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: 12,
    transition: "var(--transition)",
  },
  chatBox: {
    flex: 1,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    padding: 16,
    borderRadius: "var(--radius)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 300,
  },
  msg: {
    padding: "10px 14px",
    borderRadius: 12,
    maxWidth: "75%",
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: 1.5,
  },
  typingIndicator: {
    display: "flex",
    gap: 4,
    padding: "8px 12px",
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--text-muted)",
    display: "inline-block",
    animation: "pulse 1.2s ease-in-out infinite",
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    padding: "10px 18px",
    background: "var(--accent)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "#020617",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity var(--transition)",
  },
}``