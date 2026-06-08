"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Zap, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface Props {
  result: AnalysisResult;
  onOptimizeBullets?: () => void;
}

export default function RecommendationPanel({ result, onOptimizeBullets }: Props) {
  const [openSection, setOpenSection] = useState<string | null>("ats");

  const sections = [
    { id: "ats",      title: "ATS Compatibility", score: result.atsScore.score,     issues: result.atsScore.issues,     suggestions: result.atsScore.suggestions },
    { id: "content",  title: "Content Quality",   score: result.contentScore.score,  issues: result.contentScore.issues,  suggestions: result.contentScore.suggestions },
    { id: "keywords", title: "Keywords & Skills", score: result.keywordScore.score,  issues: result.keywordScore.issues,  suggestions: result.keywordScore.suggestions },
    { id: "format",   title: "Format & Structure",score: result.formatScore.score,   issues: result.formatScore.issues,   suggestions: result.formatScore.suggestions },
  ];

  const scoreColor = (s: number) =>
    s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : s >= 40 ? "#f97316" : "#ef4444";

  const allBullets = result.parsed.experience.flatMap((e) => e.bullets).filter(Boolean);

  return (
    <div className="space-y-3">

      {/* AI Suggestions banner */}
      {result.aiSuggestions && result.aiSuggestions.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
              <Sparkles size={14} className="text-violet-500" />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-1)", fontFamily: "var(--font-heading)" }}>
              AI-Powered Insights
            </span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full pulse-dot" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
              Live
            </span>
          </div>
          <ul className="space-y-2.5">
            {result.aiSuggestions.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text-2)" }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}
                >
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score sections accordion */}
      {sections.map((sec) => {
        const c = scoreColor(sec.score);
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setOpenSection(isOpen ? null : sec.id)}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors"
              style={{ background: isOpen ? "var(--bg-card2)" : "transparent" }}
            >
              <div className="flex items-center gap-3">
                {/* Score pill */}
                <div
                  className="w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums"
                  style={{ background: `${c}15`, color: c, fontFamily: "var(--font-heading)" }}
                >
                  {sec.score}
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{sec.title}</span>
                {/* Progress bar inline */}
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--border-md)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${sec.score}%`, background: c }} />
                  </div>
                </div>
                {sec.issues.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    {sec.issues.length} issue{sec.issues.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronUp size={15} style={{ color: "var(--text-3)" }} />
                : <ChevronDown size={15} style={{ color: "var(--text-3)" }} />}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-3 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                {sec.issues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Issues</p>
                    {sec.issues.map((issue, i) => (
                      <div key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                        <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
                {sec.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Recommendations</p>
                    {sec.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                        <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Bullet optimizer CTA */}
      {allBullets.length > 0 && onOptimizeBullets && (
        <button
          onClick={onOptimizeBullets}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
        >
          <Zap size={14} />
          AI Enhance All Bullet Points ({allBullets.length})
        </button>
      )}
    </div>
  );
}
