const RETRYABLE_STATUSES = new Set([408, 500, 502, 503, 504]);
const RETRY_DELAY_MS     = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function processUserInput(input, context = {}, retry = 0) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: input, context }),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    // Only retry on server errors, not client errors
    if (!res.ok) {
      if (RETRYABLE_STATUSES.has(res.status) && retry < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (retry + 1)); // exponential backoff
        return processUserInput(input, context, retry + 1);
      }
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json().catch(() => {
      throw new Error("Invalid JSON response from AI");
    });

    return {
      type:    data.type    ?? "message",
      message: data.message ?? "AI response",
      isError: false,
      ...data,
    };

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError" && retry < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (retry + 1));
      return processUserInput(input, context, retry + 1);
    }

    return {
      ...fallbackResponse(err.message),
      isError: true,
    };
  }
}