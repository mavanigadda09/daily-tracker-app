import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= OPENAI =================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("🚀 AI Server Running...");
});

// ================= AI CHAT =================
app.post("/api/ai", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const systemPrompt = `
You are an advanced AI coach for productivity, habits, tasks, and fitness.

Your responsibilities:
- Help user build habits
- Suggest tasks and routines
- Guide weight loss or fitness goals
- Give clear, practical, actionable advice
- Be motivating but realistic

User Data:
${JSON.stringify(context || {})}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("🔥 AI ERROR:", err.message);

    res.status(500).json({
      error: "AI failed",
      details: err.message
    });
  }
});

// ================= START SERVER =================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});