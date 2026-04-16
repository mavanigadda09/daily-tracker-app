import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ================= MEMORY STORAGE ================= */
const MEMORY_FILE = "./memory.json";

const loadMemory = () => {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return {};
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  } catch (err) {
    console.error("Memory load error:", err);
    return {};
  }
};

const saveMemory = (data) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Memory save error:", err);
  }
};

let userMemory = loadMemory();

/* ================= SAFE JSON PARSER ================= */
const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return {
      type: "message",
      message: text || "AI response error"
    };
  }
};

/* ================= DEEP MERGE ================= */
const deepMerge = (target, source) => {
  const output = { ...target };

  for (const key in source) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
};

/* ================= RETRY ================= */
const callOpenAI = async (messages, retries = 2) => {
  try {
    return await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7
    });
  } catch (err) {
    if (retries > 0) {
      console.log("🔁 Retrying OpenAI...");
      return callOpenAI(messages, retries - 1);
    }
    throw err;
  }
};

/* ================= RATE LIMIT ================= */
const requests = {};

const isRateLimited = (userId) => {
  const now = Date.now();

  if (!requests[userId]) {
    requests[userId] = [];
  }

  requests[userId] = requests[userId].filter(
    (t) => now - t < 60000
  );

  if (requests[userId].length > 20) return true;

  requests[userId].push(now);
  return false;
};

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AI server running 🚀"
  });
});

/* ================= AI ROUTE ================= */
app.post("/ai", async (req, res) => {
  try {
    const { message, context, userId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({
        type: "message",
        message: "Message required"
      });
    }

    if (isRateLimited(userId)) {
      return res.status(429).json({
        type: "message",
        message: "Too many requests"
      });
    }

    /* ================= LOAD MEMORY ================= */
    const memory = userMemory[userId] || {
      history: [],
      preferences: {},
      patterns: {}
    };

    /* ================= AI CALL ================= */
    const completion = await callOpenAI([
      {
        role: "system",
        content: `
You are an AI productivity + fitness coach.

RULES:
- ONLY return valid JSON
- No extra text

Actions:
add_habit, add_task, complete_habit, generate_schedule, analyze

Format:
{
  "type": "action" | "message",
  "action": "",
  "data": {},
  "message": "",
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
    ]);

    const raw = completion.choices?.[0]?.message?.content || "";

    const parsed = safeParse(raw);

    /* ================= MEMORY UPDATE ================= */
    if (parsed.memory_update) {
      userMemory[userId] = deepMerge(memory, parsed.memory_update);
    }

    /* ================= SAVE HISTORY ================= */
    userMemory[userId] = {
      ...userMemory[userId],
      history: [
        ...(memory.history || []),
        { message, timestamp: Date.now() }
      ].slice(-20)
    };

    saveMemory(userMemory);

    res.json(parsed);

  } catch (err) {
    console.error("❌ AI Server Error:", err);

    res.status(500).json({
      type: "message",
      message: "AI server error"
    });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AI Server running on http://localhost:${PORT}`);
});