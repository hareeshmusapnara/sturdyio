import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gemini } from "@/lib/gemini";
import { db } from "@/lib/db";
import { analyses, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { parseResumeText } from "@/lib/parser";

export const dynamic = "force-dynamic";
import {
  scoreATS, scoreContent, scoreKeywords, scoreFormat,
  categorizeSkills, matchJobDescription, detectIndustry, detectExperienceLevel,
} from "@/lib/analyzer";
import type { AnalysisResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, jobDescription } = await req.json() as { text: string; jobDescription?: string };

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Resume text too short or empty" }, { status: 400 });
    }

    // ── Local scoring (fast, no API needed) ──────────────────────────────────
    const parsed = parseResumeText(text);
    const industry = detectIndustry(text);
    const experienceLevel = detectExperienceLevel(text, parsed.experience);
    const atsScore = scoreATS(parsed);
    const contentScore = scoreContent(parsed);
    const keywordScore = scoreKeywords(parsed, industry);
    const formatScore = scoreFormat(parsed);
    const skills = categorizeSkills(parsed.skills);
    const overallScore = Math.round(
      atsScore.score * 0.25 +
      contentScore.score * 0.30 +
      keywordScore.score * 0.25 +
      formatScore.score * 0.20
    );
    const jobMatch = jobDescription ? matchJobDescription(parsed, jobDescription) : undefined;

    // ── Gemini: AI suggestions + interview questions ──────────────────────────
    const jdSection = jobDescription?.trim()
      ? `\nJob Description:\n${jobDescription.slice(0, 800)}`
      : "";

    const prompt = `You are a senior career coach and resume expert.

Analyze the resume below and provide exactly:
- 5 specific, actionable improvement suggestions (be concrete, reference actual content from the resume)
- 5 predicted interview questions based on this candidate's background

Resume scores: ATS ${atsScore.score}/100 · Content ${contentScore.score}/100 · Keywords ${keywordScore.score}/100 · Format ${formatScore.score}/100
Industry: ${industry} · Level: ${experienceLevel}

Resume:
${text.slice(0, 2500)}${jdSection}

Respond in EXACTLY this format (no extra text):
SUGGESTIONS:
1. [suggestion]
2. [suggestion]
3. [suggestion]
4. [suggestion]
5. [suggestion]

INTERVIEW QUESTIONS:
1. [question]
2. [question]
3. [question]
4. [question]
5. [question]`;

    let aiSuggestions: string[] = [];
    let interviewQuestions: string[] = [];

    try {
      const output = await gemini(prompt, 700);

      // Parse SUGGESTIONS section
      const sugMatch = output.match(/SUGGESTIONS:\s*([\s\S]*?)(?=INTERVIEW QUESTIONS:|$)/i);
      if (sugMatch) {
        aiSuggestions = sugMatch[1]
          .split("\n")
          .map(l => l.replace(/^\s*\d+[.)]\s*/, "").trim())
          .filter(l => l.length > 10)
          .slice(0, 5);
      }

      // Parse INTERVIEW QUESTIONS section
      const qMatch = output.match(/INTERVIEW QUESTIONS:\s*([\s\S]*?)$/i);
      if (qMatch) {
        interviewQuestions = qMatch[1]
          .split("\n")
          .map(l => l.replace(/^\s*\d+[.)]\s*/, "").trim())
          .filter(l => l.length > 10)
          .slice(0, 5);
      }
    } catch (e) {
      console.error("[analyze] Gemini error:", e);
    }

    // ── Fallback if Gemini failed or returned empty ───────────────────────────
    if (!aiSuggestions.length) {
      const s: string[] = [];
      if (atsScore.score < 80) s.push("Add your LinkedIn profile URL to improve ATS compatibility.");
      if (contentScore.score < 70) s.push("Replace 'responsible for' with strong action verbs: Engineered, Drove, Scaled.");
      if (keywordScore.score < 70) s.push("Add industry-relevant keywords throughout your experience section.");
      if (formatScore.score < 70) s.push("Add clearly labeled sections: Summary, Experience, Education, Skills.");
      s.push("Quantify at least 50% of bullet points with numbers, percentages, or timeframes.");
      s.push("Tailor your resume summary specifically for each role you apply to.");
      aiSuggestions = s.slice(0, 5);
    }

    if (!interviewQuestions.length) {
      interviewQuestions = [
        "Tell me about yourself and your most relevant experience.",
        "What is your greatest professional achievement and how did you measure its impact?",
        "Describe a challenging project you led and how you overcame obstacles.",
        "How do you prioritize tasks when managing multiple competing deadlines?",
        "Where do you see yourself in 3–5 years and how does this role align with your goals?",
      ];
    }

    const result: AnalysisResult = {
      parsed, atsScore, contentScore, keywordScore, formatScore,
      overallScore, skills, jobMatch, industry, experienceLevel,
      aiSuggestions, interviewQuestions,
    };

    // ── Save to DB (fire-and-forget, never block the response) ────────────
    const userId = (session.user as { id?: string })?.id;
    if (userId) {
      db.insert(analyses).values({
        userId,
        filename: "resume.txt",
        overallScore,
        atsScore: atsScore.score,
        contentScore: contentScore.score,
        keywordScore: keywordScore.score,
        formatScore: formatScore.score,
        industry: industry ?? null,
        experienceLevel: experienceLevel ?? null,
        parsedResume: parsed as unknown as Record<string, unknown>,
        aiSuggestions: aiSuggestions as unknown as string[],
        interviewQuestions: interviewQuestions as unknown as string[],
        jobDescription: jobDescription ?? null,
      }).catch(e => console.error("[analyze] DB insert error:", e));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
