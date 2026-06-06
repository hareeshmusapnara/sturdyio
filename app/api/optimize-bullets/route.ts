import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bullets, jobTitle } = await req.json() as { bullets: string[]; jobTitle?: string };

    if (!Array.isArray(bullets) || bullets.length === 0) {
      return NextResponse.json({ error: "No bullets provided" }, { status: 400 });
    }

    const cleanBullets = bullets
      .slice(0, 10)
      .filter((b) => typeof b === "string" && b.trim().length > 5);

    const numbered = cleanBullets.map((b, i) => `${i + 1}. ${b}`).join("\n");

    const prompt = `You are an expert resume writer specializing in impactful bullet points.

Rewrite each bullet point below to be stronger. For each bullet:
- Start with a powerful action verb (Led, Engineered, Drove, Built, Scaled, Launched, Optimized, etc.)
- Add a specific metric or result where it makes sense (%, time saved, team size, revenue, etc.)
- Remove all weak phrases ("responsible for", "worked on", "helped with", "assisted")
- Keep it concise — one strong sentence per bullet

Role context: ${jobTitle || "Professional"}

Original bullets:
${numbered}

Return ONLY a numbered list of rewritten bullets in the same order. No intro, no explanation.`;

    const output = await gemini(prompt, 500);

    const optimized = output
      .split("\n")
      .map(l => l.replace(/^\s*\d+[.)]\s*/, "").replace(/^[-•*]\s*/, "").trim())
      .filter(l => l.length > 10)
      .slice(0, cleanBullets.length);

    if (!optimized.length) {
      return NextResponse.json({ error: "Failed to optimize bullets — please try again" }, { status: 500 });
    }

    return NextResponse.json({ optimized });
  } catch (err) {
    console.error("[optimize-bullets]", err);
    const msg = err instanceof Error ? err.message : "Bullet optimization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
