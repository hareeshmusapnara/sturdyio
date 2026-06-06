import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gemini } from "@/lib/gemini";

// ── Scoring helpers ───────────────────────────────────────────────────────────

const ACTION_VERBS = [
  "achieved", "built", "created", "delivered", "designed", "developed", "drove",
  "engineered", "established", "executed", "generated", "implemented", "improved",
  "increased", "launched", "led", "managed", "optimized", "produced", "reduced",
  "scaled", "streamlined", "transformed", "architected", "automated", "deployed",
  "enhanced", "mentored", "spearheaded", "supervised", "trained", "collaborated",
];

const WEAK_PHRASES = [
  "responsible for", "worked on", "helped with", "assisted with",
  "was part of", "involved in", "participated in", "was responsible",
];

function scoreContent(text: string, jobDescription = "") {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 10);
  const contentLines = lines.filter(l =>
    !/^[A-Z][A-Z\s]{3,}$/.test(l) &&
    !l.includes("@") && !l.includes("|") &&
    !/^\+?\d[\d\s\-()]{5,}$/.test(l) &&
    !(/^\d{4}/.test(l) && l.length < 20)
  );

  if (contentLines.length === 0) return { overall: 50, actionVerb: 0, quant: 0, weak: 0, kw: 50 };

  const withVerb = contentLines.filter(l =>
    ACTION_VERBS.some(v => l.replace(/^[•\-*]\s*/, "").toLowerCase().startsWith(v))
  );
  const actionVerb = Math.round((withVerb.length / contentLines.length) * 100);

  const withNum = contentLines.filter(l => /\d/.test(l));
  const quant = Math.round((withNum.length / contentLines.length) * 100);

  const lowerText = text.toLowerCase();
  const weak = WEAK_PHRASES.filter(w => lowerText.includes(w)).length;
  const weakScore = Math.max(0, 100 - weak * 12);

  let kw = 50;
  if (jobDescription.trim()) {
    const stop = new Set(["the", "and", "for", "are", "with", "you", "will", "this", "that",
      "have", "from", "they", "been", "has", "but", "not", "all", "were", "when", "your"]);
    const jdWords = [...new Set(
      jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stop.has(w))
    )];
    const found = jdWords.filter(k => lowerText.includes(k));
    kw = jdWords.length
      ? Math.min(100, Math.round((found.length / Math.min(jdWords.length, 25)) * 100))
      : 50;
  }

  const overall = Math.round(actionVerb * 0.35 + quant * 0.30 + weakScore * 0.20 + kw * 0.15);
  return { overall, actionVerb, quant, weak, kw };
}

function getJDStats(resumeText: string, jobDescription: string) {
  const stop = new Set(["the", "and", "for", "are", "with", "you", "will", "this", "that",
    "have", "from", "they", "been", "has", "but", "not", "all", "were", "when", "your"]);
  const jdWords = [...new Set(
    jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stop.has(w))
  )];
  const lower = resumeText.toLowerCase();
  const found = jdWords.filter(k => lower.includes(k)).slice(0, 15);
  const missing = jdWords.filter(k => !lower.includes(k)).slice(0, 8);
  return { found, missing };
}

function buildResponse(
  original: string,
  optimized: string,
  before: ReturnType<typeof scoreContent>,
  after: ReturnType<typeof scoreContent>,
  kwBefore: ReturnType<typeof getJDStats>,
  kwAfter: ReturnType<typeof getJDStats>,
) {
  const improvements: string[] = [];

  const weakCount = WEAK_PHRASES.filter(w => original.toLowerCase().includes(w)).length;
  if (weakCount > 0)
    improvements.push(`Replaced ${weakCount} passive phrase${weakCount > 1 ? "s" : ""} with strong action verbs`);
  if (after.actionVerb > before.actionVerb)
    improvements.push(`Action verb coverage: ${before.actionVerb}% → ${after.actionVerb}%`);
  if (after.quant > before.quant)
    improvements.push(`Quantified achievements: ${before.quant}% → ${after.quant}% of lines`);
  if (after.weak < before.weak)
    improvements.push(`Weak phrases removed: ${before.weak} → ${after.weak}`);
  if (after.kw > before.kw)
    improvements.push(`Job keyword match: ${before.kw}% → ${after.kw}%`);
  if (kwAfter.missing.length > 0)
    improvements.push(`Consider adding: ${kwAfter.missing.slice(0, 4).join(", ")}`);
  improvements.push("Aligned language with job description requirements");

  return {
    optimizedResume: optimized,
    keywordsFound: kwAfter.found,
    keywordMatchPercent: after.kw,
    impactBulletScore: after.actionVerb,
    formattingScore: after.quant,
    improvements: [...new Set(improvements)].slice(0, 7),
    before: { overall: before.overall, ats: before.overall, content: before.actionVerb, keywords: before.kw, format: before.quant },
    after: { overall: after.overall, ats: after.overall, content: after.actionVerb, keywords: after.kw, format: after.quant },
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText?.trim() || resumeText.trim().length < 50)
      return NextResponse.json({ error: "Resume text too short" }, { status: 400 });
    if (!jobDescription?.trim() || jobDescription.trim().length < 20)
      return NextResponse.json({ error: "Job description too short" }, { status: 400 });

    const before = scoreContent(resumeText, jobDescription);
    const kwBefore = getJDStats(resumeText, jobDescription);

    const prompt = `You are an expert ATS resume optimizer and professional resume writer.

Your task: Rewrite the resume below to maximize its match with the job description.

Rules:
- Keep the EXACT same structure, sections, and personal info (name, email, phone, LinkedIn, dates, companies, job titles)
- Replace ALL weak phrases ("responsible for", "worked on", "helped with", "assisted") with strong action verbs
- Rewrite bullet points to start with powerful action verbs (Led, Engineered, Drove, Built, Launched, etc.)
- Add specific metrics or quantifiers where reasonable (%, time saved, team size, scale)
- Weave in relevant keywords from the job description naturally
- Do NOT invent new job experiences, companies, or credentials
- Return ONLY the full rewritten resume text — no explanation, no commentary, no markdown headers

Job Description:
${jobDescription.slice(0, 1000)}

Original Resume:
${resumeText.slice(0, 3000)}`;

    const optimizedResume = await gemini(prompt, 1500);

    // Validate Gemini returned something useful
    if (!optimizedResume || optimizedResume.length < 100 || optimizedResume === resumeText) {
      return NextResponse.json({ error: "Optimization failed — please try again" }, { status: 500 });
    }

    const after = scoreContent(optimizedResume, jobDescription);
    const kwAfter = getJDStats(optimizedResume, jobDescription);

    return NextResponse.json(buildResponse(resumeText, optimizedResume, before, after, kwBefore, kwAfter));
  } catch (err) {
    console.error("[optimize]", err);
    const msg = err instanceof Error ? err.message : "Optimization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
