const API_URL =
  process.env.REACT_APP_AI_URL ||
  "https://daily-tracker-app-g96u.onrender.com/ai";

// ===== RETRY CONFIG =====
const MAX_RETRIES = 2;
const TIMEOUT = 10000;

// ===== SAFE RESPONSE =====
const fallbackResponse = () => ({
  type: "message",
  message: "⚠️ AI is temporarily unavailable. Please try again."
});

export async function processUserInput(input, context = {}, retry = 0) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
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

    const data = await res.json();

    // ===== VALIDATION =====
    if (!data || typeof data !== "object") {
      throw new Error("Invalid AI response");
    }

    // Ensure consistent format
    return {
      type: data.type || "message",
      message: data.message || "AI response",
      ...data
    };

  } catch (err) {
    clearTimeout(timeoutId);

    // ===== RETRY LOGIC =====
    if (retry < MAX_RETRIES) {
      console.warn(`Retrying AI request... (${retry + 1})`);
      return processUserInput(input, context, retry + 1);
    }

    console.error("AI Service Error:", err);

    return fallbackResponse();
  }
}