export async function processUserInput(input, context) {
  try {
    const res = await fetch("https://daily-tracker-app-g96u.onrender.com/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: input,
        context
      })
    });

    const data = await res.json();

    return data;
  } catch (err) {
    console.error("AI Error:", err);

    return {
      type: "message",
      message: "⚠️ AI is temporarily unavailable"
    };
  }
}