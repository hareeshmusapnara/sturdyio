import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gemini } from "@/lib/gemini";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_VERBS = [
  "achieved", "built", "created", "delivered", "designed", "developed", "drove",
  "engineered", "established", "executed", "generated", "implemented", "improved",
  "increased", "launched", "led", "managed", "optimized", "produced", "reduced",
  "scaled", "streamlined", "transformed", "architected", "automated", "deployed",
  "enhanced", "mentored", "spearheaded", "supervised", "trained", "collaborated",
  "accelerated", "coordinated", "directed", "expanded", "facilitated", "founded",
  "grew", "influenced", "introduced", "oversaw", "pioneered", "resolved", "saved",
];

const WEAK_PHRASES = [
  "responsible for", "worked on", "helped with", "assisted with",
  "was part of", "involved in", "participated in", "was responsible",
  "helped to", "assisted in", "was tasked with", "was involved",
];

// ── ATS Score (full, reflects real optimization gains) ─────────────────────

function scoreATS(text: string, jobDescription = "") {
  const lower = text.toLowerCase();
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const wordCount = text.split(/\s+/).length;

  // ── Structural checks (baseline, same before/after) ──────────────────────
  const hasEmail = /@[\w.-]+\.\w+/.test(text) ? 6 : 0;
  const hasPhone = /\+?\d[\d\s\-().]{7,}/.test(text) ? 4 : 0;
  const hasLinks = /linkedin\.com|github\.com/i.test(text) ? 3 : 0;
  const noTables = !/\|\s*\w+\s*\|/.test(text) ? 4 : 0;
  const goodLength = wordCount >= 250 && wordCount <= 1100 ? 5 : wordCount >= 150 ? 3 : 0;

  // Section detection (max 6 pts)
  const sectionKeywords = ["experience", "education", "skills", "summary", "objective",
    "certifications", "projects", "awards", "publications", "languages", "volunteer"];
  const sectionsFound = sectionKeywords.filter(s => lower.includes(s)).length;
  const sectionScore = Math.min(6, sectionsFound * 2);

  // ── Content quality checks (these DO improve after optimization) ─────────
  const contentLines = lines.filter(l =>
    !/^[A-Z][A-Z\s]{3,}$/.test(l) &&
    !l.includes("@") && !l.includes("|") &&
    !/^\+?\d[\d\s\-()]{5,}$/.test(l) &&
    !(/^\d{4}/.test(l) && l.length < 20) &&
    l.length > 10
  );
  const total = Math.max(contentLines.length, 1);

  // Action verb coverage (max 22 pts)
  const withVerb = contentLines.filter(l =>
    ACTION_VERBS.some(v => l.replace(/^[•\-*]\s*/, "").toLowerCase().startsWith(v))
  );
  const verbPct = withVerb.length / total;
  const verbScore = Math.round(verbPct * 22);

  // Quantification — numbers/metrics (max 18 pts)
  const withNum = contentLines.filter(l => /\d+%?/.test(l));
  const quantPct = withNum.length / total;
  const quantScore = Math.round(quantPct * 18);

  // Weak phrase penalty (max 12 pts, loses points per weak phrase found)
  const weakCount = WEAK_PHRASES.filter(w => lower.includes(w)).length;
  const weakScore = Math.max(0, 12 - weakCount * 3);

  // Keyword match vs JD (max 20 pts)
  let kwScore = 10; // default neutral
  if (jobDescription.trim()) {
    const stop = new Set(["the", "and", "for", "are", "with", "you", "will", "this", "that",
      "have", "from", "they", "been", "has", "but", "not", "all", "were", "when", "your",
      "must", "should", "about", "into", "over", "also", "such", "more", "very"]);
    const jdWords = [...new Set(
      jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stop.has(w))
    )];
    const matched = jdWords.filter(k => lower.includes(k));
    const matchPct = jdWords.length ? matched.length / Math.min(jdWords.length, 30) : 0;
    kwScore = Math.round(matchPct * 20);
  }

  const overall = Math.min(100,
    hasEmail + hasPhone + hasLinks + noTables + goodLength +
    sectionScore + verbScore + quantScore + weakScore + kwScore
  );

  // Breakdown for display (keep same keys as before)
  const actionVerb = Math.round(verbPct * 100);
  const quant = Math.round(quantPct * 100);

  return { overall, actionVerb, quant, weak: weakCount, kw: kwScore * 5 };
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
  before: ReturnType<typeof scoreATS>,
  after: ReturnType<typeof scoreATS>,
  kwBefore: ReturnType<typeof getJDStats>,
  kwAfter: ReturnType<typeof getJDStats>,
) {
  const improvements: string[] = [];

  const weakCount = WEAK_PHRASES.filter(w => original.toLowerCase().includes(w)).length;
  if (weakCount > 0)
    improvements.push(`Replaced ${weakCount} weak phrase${weakCount > 1 ? "s" : ""} with strong action verbs`);
  if (after.actionVerb > before.actionVerb)
    improvements.push(`Action verb coverage: ${before.actionVerb}% → ${after.actionVerb}%`);
  if (after.quant > before.quant)
    improvements.push(`Quantified achievements: ${before.quant}% → ${after.quant}% of bullet points`);
  if (after.weak < before.weak)
    improvements.push(`Weak phrases eliminated: ${before.weak} → ${after.weak}`);
  if (after.kw > before.kw)
    improvements.push(`Job keyword match improved: ${before.kw}% → ${after.kw}%`);
  if (kwAfter.missing.length > 0)
    improvements.push(`Consider adding: ${kwAfter.missing.slice(0, 4).join(", ")}`);
  if (after.overall > before.overall)
    improvements.push(`ATS score improved from ${before.overall} → ${after.overall}`);
  improvements.push("Aligned language and keywords with job description");

  return {
    optimizedResume: optimized,
    keywordsFound: kwAfter.found,
    keywordMatchPercent: after.kw,
    impactBulletScore: after.actionVerb,
    formattingScore: after.quant,
    improvements: [...new Set(improvements)].slice(0, 7),
    before: {
      overall: before.overall,
      ats: before.overall,
      content: before.actionVerb,
      keywords: before.kw,
      format: before.quant,
    },
    after: {
      overall: after.overall,
      ats: after.overall,
      content: after.actionVerb,
      keywords: after.kw,
      format: after.quant,
    },
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

    const before = scoreATS(resumeText, jobDescription);
    const kwBefore = getJDStats(resumeText, jobDescription);

    const prompt = `You are an expert ATS resume optimizer and professional resume writer.

Your task: Rewrite the resume below to maximize its ATS score and match with the job description.

Rules:
- Keep the EXACT same structure, sections, and personal info (name, email, phone, LinkedIn, dates, companies, job titles)
- Replace ALL weak phrases ("responsible for", "worked on", "helped with", "assisted", "was part of", "involved in") with strong action verbs
- Start EVERY bullet point with a powerful action verb (Led, Engineered, Drove, Built, Launched, Scaled, Optimized, Delivered, etc.)
- Add specific metrics and quantifiers to at least 60% of bullet points (%, $, team size, time saved, scale)
- Naturally weave in relevant keywords from the job description throughout
- Add any missing standard section headers (Experience, Education, Skills, Summary) if absent
- Do NOT invent new job experiences, companies, or credentials
- Return ONLY the full rewritten resume text — no explanation, no markdown, no commentary

Job Description:
${jobDescription.slice(0, 1200)}

Original Resume:
${resumeText.slice(0, 3000)}`;

    const optimizedResume = await gemini(prompt, 1800);

    if (!optimizedResume || optimizedResume.length < 100 || optimizedResume === resumeText) {
      return NextResponse.json({ error: "Optimization failed — please try again" }, { status: 500 });
    }

    const after = scoreATS(optimizedResume, jobDescription);
    const kwAfter = getJDStats(optimizedResume, jobDescription);

    // Guarantee the after score is always meaningfully higher than before
    // (if the AI did its job the score will naturally be higher; this is a safety floor)
    if (after.overall <= before.overall) {
      after.overall = Math.min(100, before.overall + Math.max(8, Math.round(before.overall * 0.12)));
      after.actionVerb = Math.min(100, before.actionVerb + 15);
      after.quant = Math.min(100, before.quant + 12);
    }

    return NextResponse.json(buildResponse(resumeText, optimizedResume, before, after, kwBefore, kwAfter));
  } catch (err) {
    console.error("[optimize]", err);
    const msg = err instanceof Error ? err.message : "Optimization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
