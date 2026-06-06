/**
 * OpenRouter AI helper — poolside/laguna-xs.2:free
 * Endpoint : https://openrouter.ai/api/v1/chat/completions
 * Docs     : https://openrouter.ai/docs
 *
 * OpenRouter is OpenAI-compatible. No Cloudflare issues from Vercel.
 * Retries up to MAX_RETRIES on 429 / network errors.
 */

const OR_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "poolside/laguna-xs.2:free";
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function retryAfterMs(headers: Headers): number {
  const val = headers.get("retry-after");
  if (val) {
    const secs = parseFloat(val);
    if (!isNaN(secs)) return Math.min(secs * 1000, 60_000);
  }
  return 10_000;
}

export async function gemini(prompt: string, maxTokens = 1024): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;

    try {
      res = await fetch(OR_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          // OpenRouter recommends these for routing and analytics
          "HTTP-Referer": "https://sturdyio.vercel.app",
          "X-Title": "Sturdy AI",
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
      lastError = fetchErr as Error;
      console.warn(`[openrouter] network error attempt ${attempt}/${MAX_RETRIES}:`, (fetchErr as Error).message);
      if (attempt < MAX_RETRIES) { await sleep(3_000 * attempt); continue; }
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
      console.warn(`[openrouter] 429 rate-limited attempt ${attempt}/${MAX_RETRIES}, waiting ${delay}ms`);
      lastError = new Error("OpenRouter rate limited — please try again shortly");
      if (attempt < MAX_RETRIES) { await sleep(delay); continue; }
      break;
    }

    throw new Error(`OpenRouter API error ${res.status}: ${body.slice(0, 300)}`);
  }

  throw lastError ?? new Error("OpenRouter: all retries exhausted");
}
