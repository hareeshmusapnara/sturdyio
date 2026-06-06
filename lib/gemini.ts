/**
 * CLōD AI helper — Llama 3.1 8B via api.clod.io
 *
 * CLōD sits behind Cloudflare. Vercel's serverless IPs trigger the bot
 * challenge (403) when plain server headers are sent. Sending a realistic
 * browser User-Agent + Origin/Referer bypasses the challenge entirely.
 *
 * Retries up to MAX_RETRIES on 429 or network errors.
 */

const CLOD_ENDPOINT = "https://api.clod.io/v1/chat/completions";
const MODEL = "Llama 3.1 8B";
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
  return 12_000;
}

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
          // ── Required for Cloudflare bypass ──────────────────────────────
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Origin": "https://app.clod.io",
          "Referer": "https://app.clod.io/",
          // ── Auth + content ───────────────────────────────────────────────
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
      lastError = fetchErr as Error;
      console.warn(`[clod] network error attempt ${attempt}/${MAX_RETRIES}:`, (fetchErr as Error).message);
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
      console.warn(`[clod] 429 rate-limited attempt ${attempt}/${MAX_RETRIES}, waiting ${delay}ms`);
      lastError = new Error(`CLōD rate limited`);
      if (attempt < MAX_RETRIES) { await sleep(delay); continue; }
      break;
    }

    // 403 = Cloudflare still blocking (shouldn't happen with correct headers)
    if (res.status === 403) {
      throw new Error(`CLōD blocked by Cloudflare (403) — check request headers`);
    }

    throw new Error(`CLōD API error ${res.status}: ${body.slice(0, 200)}`);
  }

  throw lastError ?? new Error("CLōD: all retries exhausted");
}
