import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gemini } from "@/lib/gemini";
import { db } from "@/lib/db";
import { coverLetters } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText?.trim() || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is too short" }, { status: 400 });
    }

    const jdSection = jobDescription?.trim()
      ? `\n\nJob Description to tailor the letter for:\n${jobDescription.slice(0, 1500)}`
      : "";

    const prompt = `You are an expert career coach and professional cover letter writer.

Write a compelling, personalized 3-paragraph cover letter for the candidate below.

Rules:
- Start directly with the opening paragraph — no "Dear Hiring Manager", no date, no address header
- Be specific and reference actual skills, technologies, and experience from their resume
- Paragraph 1: Strong opening that mentions their key expertise and excitement about the role
- Paragraph 2: 2–3 concrete achievements or skills from their resume with impact
- Paragraph 3: Brief closing that expresses enthusiasm and requests next steps
- Keep each paragraph to 3–4 sentences — professional and concise
- Do NOT add a sign-off (no "Sincerely", no name at the end)
- Return only the cover letter text, nothing else

Candidate Resume:
${resumeText.slice(0, 2000)}${jdSection}`;

    const coverLetter = await gemini(prompt, 600);

    if (!coverLetter || coverLetter.length < 100) {
      return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 });
    }

    // ── Save to DB ────────────────────────────────────────────────────────
    const userId = (session.user as { id?: string })?.id;
    if (userId) {
      db.insert(coverLetters).values({
        userId,
        coverLetter,
        jobDescription: jobDescription ?? null,
      }).catch(e => console.error("[cover-letter] DB insert error:", e));
    }

    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error("[cover-letter]", err);
    return NextResponse.json({ error: "Cover letter generation failed" }, { status: 500 });
  }
}
