// aiService.js

import { analyzeWithRules } from "./aiCoach";

// 🔑 Use environment variable (Vite)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function processUserInput(input, context) {
  try {
    // 1. Call LLM for understanding
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an AI productivity coach.

Return ONLY JSON.

Supported actions:
- add_habit
- add_task
- generate_schedule
- analyze

Format:
{
  "type": "action | message",
  "action": "add_habit",
  "data": { ... },
  "message": "text"
}
            `,
          },
          {
            role: "user",
            content: input,
          },
        ],
      }),
    });

    const data = await aiResponse.json();
    const text = data.choices?.[0]?.message?.content;

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // fallback to rules
      return analyzeWithRules(input, context);
    }

    return parsed;
  } catch (err) {
    console.error("AI Error:", err);

    // fallback system
    return analyzeWithRules(input, context);
  }
}