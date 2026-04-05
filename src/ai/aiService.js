const API_URL =
  import.meta.env.VITE_AI_URL ||
  "https://daily-tracker-app-g96u.onrender.com/ai";

// ===== CONFIG =====
const MAX_RETRIES = 2;
const TIMEOUT = 10000;

// ===== DEV LOGGER =====
const log = (...args) => {
  if (import.meta.env.DEV) {
    console.log("[AI Service]:", ...args);
  }
};

// ===== SAFE RESPONSE =====
const fallbackResponse = (reason = "AI unavailable") => ({
  type: "message",
  message: "⚠️ AI is temporarily unavailable. Please try again.",
  error: reason
});

export async function processUserInput(input, context = {}, retry = 0) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    log("Sending request:", { input, context });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: input,
        context
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    let data;

    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error("Invalid JSON response from AI");
    }

    // ===== VALIDATION =====
    if (!data || typeof data !== "object") {
      throw new Error("Invalid AI response format");
    }

    log("Response received:", data);

    // ===== NORMALIZE RESPONSE =====
    return {
      type: data.type ?? "message",
      message: data.message ?? "AI response",
      ...data
    };

  } catch (err) {
    clearTimeout(timeoutId);

    // ===== ABORT / TIMEOUT =====
    if (err.name === "AbortError") {
      log("Request timed out");
    } else {
      log("Error:", err.message);
    }

    // ===== RETRY =====
    if (retry < MAX_RETRIES) {
      log(`Retrying... (${retry + 1})`);
      return processUserInput(input, context, retry + 1);
    }

    console.error("AI Service Final Error:", err);

    return fallbackResponse(err.message);
  }
}