"use client";
import { useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  questions: string[];
  experienceLevel?: string;
  industry?: string;
}

const FALLBACK_QUESTIONS = [
  "Tell me about yourself and your most relevant experience.",
  "What's your greatest professional achievement and how did you measure its impact?",
  "Describe a challenging project you led — what obstacles did you face?",
  "How do you prioritize tasks when managing multiple deadlines?",
  "Where do you see yourself in 3–5 years, and how does this role align?",
];

const TIPS: Record<number, string> = {
  0: "Use the STAR method: Situation, Task, Action, Result. Keep it to 2 minutes.",
  1: "Quantify your impact with specific numbers — revenue, time saved, or team size.",
  2: "Focus on your decision-making process. Interviewers want to see how you think.",
  3: "Mention specific tools or frameworks you use (e.g., sprint planning, prioritization matrix).",
  4: "Research the company's growth trajectory and align your answer to their roadmap.",
};

export default function InterviewPrep({ questions, experienceLevel, industry }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const displayQuestions = questions.length ? questions : FALLBACK_QUESTIONS;

  return (
    <div className="flex flex-col gap-4">

      {/* Meta info */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
        <MessageSquare size={12} className="text-violet-500" />
        <span>
          {displayQuestions.length} Questions
          {experienceLevel && ` · ${experienceLevel}`}
          {industry && ` · ${industry}`}
        </span>
      </div>

      {/* Questions */}
      {displayQuestions.map((q, i) => (
        <div key={i} className="card overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-start justify-between text-left gap-4 transition-colors"
            style={{
              padding: "22px 26px",
              background: expanded === i ? "var(--bg-card2)" : "transparent",
            }}
          >
            <div className="flex gap-4 items-start">
              <span
                className="w-8 h-8 rounded-full text-sm font-black flex items-center justify-center shrink-0"
                style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}
              >
                {i + 1}
              </span>
              <span className="text-base" style={{ color: "var(--text-1)", lineHeight: "1.75" }}>{q}</span>
            </div>
            {expanded === i
              ? <ChevronUp size={16} style={{ color: "var(--text-3)" }} className="shrink-0 mt-1" />
              : <ChevronDown size={16} style={{ color: "var(--text-3)" }} className="shrink-0 mt-1" />}
          </button>

          {expanded === i && TIPS[i] && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "20px 26px" }}>
              <div className="rounded-2xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", padding: "18px 20px" }}>
                <p className="text-sm font-bold mb-2" style={{ color: "#7c3aed" }}>💡 Answer Tip</p>
                <p className="text-base" style={{ color: "var(--text-2)", lineHeight: "1.75" }}>{TIPS[i]}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Pro tips */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-3)" }}>Pro Tips</p>
        <div className="flex flex-col gap-4">
          {[
            "Research the company's latest news before the interview",
            "Prepare 2–3 questions to ask the interviewer",
            "Practice answers out loud, not just in your head",
          ].map((tip, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-emerald-500 shrink-0 font-bold">→</span>
              <span className="text-base" style={{ color: "var(--text-2)", lineHeight: "1.75" }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
