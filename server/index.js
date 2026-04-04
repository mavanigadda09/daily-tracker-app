import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🧠 IN-MEMORY STORE (replace with DB later)
const userMemory = {};

app.post("/ai", async (req, res) => {
  try {
    const { message, context, userId = "default" } = req.body;

    // 🧠 LOAD MEMORY
    const memory = userMemory[userId] || {
      history: [],
      preferences: {},
      patterns: {}
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an AI productivity + fitness coach.

IMPORTANT:
- Always return ONLY valid JSON
- No extra text outside JSON

Supported actions:
- add_habit
- add_task
- complete_habit
- generate_schedule
- analyze

You MUST:
- Learn user behavior
- Use memory for personalization

Format:
{
  "type": "action" | "message",
  "action": "add_task",
  "data": {},
  "message": "text",
  "memory_update": {
    "preferences": {},
    "patterns": {}
  }
}

User Memory:
${JSON.stringify(memory)}

User Data:
${JSON.stringify(context)}
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const raw = completion.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = {
        type: "message",
        message: raw || "AI response failed"
      };
    }

    // 🧠 UPDATE MEMORY
    if (parsed.memory_update) {
      userMemory[userId] = {
        ...memory,
        ...parsed.memory_update
      };
    }

    // 🧠 SAVE HISTORY (last 20 messages)
    userMemory[userId] = {
      ...userMemory[userId],
      history: [
        ...(memory.history || []),
        { message, timestamp: Date.now() }
      ].slice(-20)
    };

    res.json(parsed);

  } catch (err) {
    console.error("❌ AI Server Error:", err);

    res.status(500).json({
      type: "message",
      message: "AI server error"
    });
  }
});

app.listen(5000, () => {
  console.log("🚀 AI Server running on http://localhost:5000");
});