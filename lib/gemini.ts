/**
 * CLōD AI helper — OpenAI-compatible REST API
 * Endpoint : https://api.clod.io/v1/chat/completions
 * Model    : Llama 3.1 8B
 * Auth     : Bearer token via CLOD_API_KEY env var
 *
 * Retries automatically on 429 (rate-limit), up to MAX_RETRIES times,
 * honouring the Retry-After header when present.
 */

const CLOD_ENDPOINT = "https://api.clod.io/v1/chat/completions";
const MODEL = "Llama 3.1 8B";
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Read Retry-After header value (seconds) and convert to ms. Default 15s. */
function retryAfterMs(headers: Headers): number {
  const val = headers.get("retry-after");
  if (val) {
    const secs = parseFloat(val);
    if (!isNaN(secs)) return Math.min(secs * 1000, 60_000);
  }
  return 15_000;
}

/**
 * Call the CLōD / Llama 3.1 8B model with a single user prompt.
 * Returns the assistant reply as a plain string.
 */
export async function gemini(prompt: string, maxTokens = 1024): Promise<string> {
  const apiKey = process.env.CLOD_API_KEY;
  if (!apiKey) throw new Error("CLOD_API_KEY is not set");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;

    try {
      res = await fetch(CLOD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch (fetchErr) {
      // Network / timeout error — retry
      lastError = fetchErr as Error;
      console.warn(`[clod] fetch error attempt ${attempt}/${MAX_RETRIES}:`, (fetchErr as Error).message);
      if (attempt < MAX_RETRIES) {
        await sleep(3_000 * attempt);
        continue;
      }
      break;
    }

    if (res.ok) {
      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content ?? "";
      return text.trim();
    }

    const body = await res.text();

    if (res.status === 429) {
      const delay = retryAfterMs(res.headers);
      console.warn(`[clod] 429 rate-limited (attempt ${attempt}/${MAX_RETRIES}), waiting ${delay}ms...`);
      lastError = new Error(`CLōD rate limited: ${body}`);
      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        continue;
      }
      break;
    }

    // Any other HTTP error — fail immediately, no point retrying
    throw new Error(`CLōD API error ${res.status}: ${body}`);
  }

  throw lastError ?? new Error("CLōD: all retries exhausted");
}
