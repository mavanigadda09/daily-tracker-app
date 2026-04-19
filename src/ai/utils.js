/**
 * ai/utils.js
 * Pure utility functions for AI response processing only.
 * No API calls. No domain logic. No imports from other files.
 */

// ─── Constants ──────────────────────────────────────────────

export const VALID_ACTIONS = [
  "ADD_TASK",
  "ADD_HABIT",
  "ADD_EXPENSE",
  "ADD_GOAL",
];

export const AI_ERROR_MESSAGES = {
  NETWORK: "Connection failed. Check your internet and try again.",
  TIMEOUT: "Response took too long. Please try again.",
  INVALID: "Received an unexpected response. Please try again.",
  BLOCKED: "That request couldn't be processed. Try rephrasing.",
  DEFAULT: "Something went wrong. Please try again.",
};

// ─── History ────────────────────────────────────────────────

/**
 * Trims conversation history to last N turns.
 * Prevents context window overflow on long chats.
 * @param {Array}  messages  - Full chat history [{role, content}]
 * @param {number} maxTurns  - Max user+assistant pairs to keep
 */
export function formatHistory(messages, maxTurns = 10) {
  const turns = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  return turns.slice(-(maxTurns * 2));
}

// ─── Action Parsing ─────────────────────────────────────────

/**
 * Safely parses an AI action block from response text.
 * Returns null if missing, malformed, or unrecognised action type.
 * Never throws.
 *
 * Expected shape: { "action": "ADD_TASK", "data": { ... } }
 */
export function parseAction(text) {
  try {
    const match = text.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);

    if (!parsed.action || !parsed.data)          return null;
    if (!VALID_ACTIONS.includes(parsed.action))  return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Maps a parsed action to a human-readable string.
 * Used in chat UI to show confirmation before executing.
 */
export function describeAction(action) {
  if (!action?.action || !action?.data) return "Unknown action";

  const descriptions = {
    ADD_TASK:    (d) => `Add task: "${d.title}"`,
    ADD_HABIT:   (d) => `Add habit: "${d.name}"`,
    ADD_EXPENSE: (d) => `Log ₹${d.amount} expense — ${d.category}`,
    ADD_GOAL:    (d) => `Create goal: "${d.title}"`,
  };

  return descriptions[action.action]?.(action.data) ?? "Unknown action";
}

// ─── Input Sanitisation ─────────────────────────────────────

/**
 * Sanitises raw user input before sending to AI.
 * Strips known prompt injection patterns.
 * Hard caps at 2000 chars.
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .slice(0, 2000)
    .replace(/\[INST\]|\[\/INST\]|<s>|<\/s>/gi, "")
    .replace(/ignore\s+(previous|all|above)\s+instructions?/gi, "");
}

/**
 * Returns true if the input looks like an action request.
 * Used to decide whether to attach a data snapshot to the message.
 */
export function isActionRequest(input) {
  const keywords = [
    "add", "create", "new", "log", "track",
    "set", "schedule", "remind", "record",
  ];
  const lower = input.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

// ─── Response Formatting ────────────────────────────────────

/**
 * Cleans AI response text for display.
 * Strips action JSON blocks and collapses extra whitespace.
 */
export function formatResponse(text) {
  if (typeof text !== "string") return "";

  return text
    .replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}