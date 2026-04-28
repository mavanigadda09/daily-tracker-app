/**
 * aiService.js
 * Calls Anthropic API directly from the app.
 * No backend server required.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL             = "claude-sonnet-4-20250514";
const MAX_TOKENS        = 1000;
const TIMEOUT_MS        = 30_000;
const MAX_RETRIES       = 2;
const RETRY_DELAY_MS    = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildSystemPrompt(context) {
  const { items = [], tasks = [], weightLogs = [], financeData = [], user = {} } = context;

  const habitSummary = items.length
    ? items.map((h) => `- ${h.title} (streak: ${h.streak ?? 0})`).join("\n")
    : "No habits tracked yet.";

  const taskSummary = tasks.length
    ? tasks.filter((t) => !t.completed).slice(0, 5).map((t) => `- ${t.title}`).join("\n")
    : "No pending tasks.";

  const latestWeight = weightLogs.length
    ? weightLogs.at(-1)?.weight + " kg"
    : "Not logged.";

  return `You are Phoenix AI Coach, a personal productivity and health assistant inside the Phoenix Tracker app.

User: ${user?.name ?? "User"}
Active Habits:\n${habitSummary}
Pending Tasks:\n${taskSummary}
Latest Weight: ${latestWeight}

You help users track habits, tasks, fitness, and finances. Be concise, motivating, and actionable.
Keep responses under 3 sentences unless analysis is requested.

You can trigger actions by responding with JSON in this exact format:
- Add task: {"type":"action","action":"add_task","data":{"title":"Task name"},"message":"Added task: Task name"}
- Add habit: {"type":"action","action":"add_habit","data":{"title":"Habit name"},"message":"Added habit: Habit name"}  
- Add expense: {"type":"action","action":"add_expense","data":{"amount":100,"category":"Food","note":"lunch"},"message":"Logged expense"}
- Regular message: {"type":"message","message":"Your response here"}

Always respond with valid JSON only. No markdown, no extra text.`;
}

function fallbackResponse(errMsg) {
  return {
    type:    "message",
    message: "I'm having trouble connecting right now. Please try again in a moment.",
    isError: true,
    error:   errMsg,
  };
}

export async function processUserInput(input, context = {}, retry = 0) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":         "application/json",
        "x-api-key":            import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version":    "2023-06-01",
        "anthropic-dangerous-allow-browser": "true",
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system:     buildSystemPrompt(context),
        messages:   [{ role: "user", content: input }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[aiService] API error:", res.status, errBody);

      if ([408, 500, 502, 503, 504].includes(res.status) && retry < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (retry + 1));
        return processUserInput(input, context, retry + 1);
      }
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    const rawText = data?.content?.[0]?.text ?? "";

    // Parse JSON response from Claude
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return {
        type:    parsed.type    ?? "message",
        message: parsed.message ?? rawText,
        action:  parsed.action  ?? null,
        data_:   parsed.data    ?? null,
        isError: false,
        ...parsed,
      };
    } catch {
      // Claude returned plain text instead of JSON — wrap it
      return { type: "message", message: rawText, isError: false };
    }

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError" && retry < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (retry + 1));
      return processUserInput(input, context, retry + 1);
    }

    console.error("[aiService] Failed:", err.message);
    return fallbackResponse(err.message);
  }
}