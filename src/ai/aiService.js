const API_URL = process.env.REACT_APP_AI_URL || "https://daily-tracker-app-g96u.onrender.com/ai";

export async function processUserInput(input, context = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    // Basic validation
    if (!data || typeof data !== "object") {
      throw new Error("Invalid AI response format");
    }

    return data;

  } catch (err) {
    console.error("AI Service Error:", err);

    return {
      type: "message",
      message: "⚠️ AI is temporarily unavailable. Please try again."
    };
  }
}