"use client";
import { useState } from "react";
import { Target, ArrowUpRight, Loader2 } from "lucide-react";
import type { JobMatchResult } from "@/lib/types";

interface Props {
  onMatch: (jd: string) => void;
  matchResult?: JobMatchResult;
  loading?: boolean;
}

export default function JobDescriptionInput({ onMatch, matchResult, loading }: Props) {
  const [jd, setJd] = useState("");

  const matchColor = matchResult
    ? matchResult.matchPercentage >= 70 ? "#10b981"
    : matchResult.matchPercentage >= 50 ? "#f59e0b" : "#ef4444"
    : "#10b981";

  return (
    <div className="flex flex-col gap-5">
      <textarea
        className="w-full rounded-2xl resize-none outline-none transition-colors"
        style={{
          background: "var(--bg-card2)",
          border: "1px solid var(--border)",
          color: "var(--text-1)",
          padding: "18px 20px",
          fontSize: "14px",
          lineHeight: "1.75",
          height: "160px",
        }}
        placeholder="Paste the job description here to get a match score and targeted recommendations..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
      <button
        onClick={() => jd.trim() && onMatch(jd)}
        disabled={loading || !jd.trim()}
        className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
        {loading ? "Analyzing Match..." : "Analyze Job Match"}
      </button>

      {matchResult && (
        <div className="flex flex-col gap-4">

          {/* Overall match */}
          <div className="card" style={{ padding: "28px 32px" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-base" style={{ color: "var(--text-1)" }}>Overall Match</span>
              <span className="text-4xl font-black tabular-nums" style={{ color: matchColor, fontFamily: "var(--font-heading)" }}>
                {matchResult.matchPercentage}%
              </span>
            </div>
            <div className="w-full rounded-full h-2.5 mb-6" style={{ background: "var(--bg-card2)" }}>
              <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${matchResult.matchPercentage}%`, background: matchColor }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl text-center" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", padding: "16px 12px" }}>
                <div className="text-2xl font-black tabular-nums mb-1" style={{ color: "#3b82f6", fontFamily: "var(--font-heading)" }}>{matchResult.technicalMatch}%</div>
                <div className="text-xs" style={{ color: "var(--text-3)" }}>Technical Match</div>
              </div>
              <div className="rounded-2xl text-center" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", padding: "16px 12px" }}>
                <div className="text-2xl font-black tabular-nums mb-1" style={{ color: "#8b5cf6", fontFamily: "var(--font-heading)" }}>{matchResult.softSkillMatch}%</div>
                <div className="text-xs" style={{ color: "var(--text-3)" }}>Soft Skills</div>
              </div>
            </div>
          </div>

          {matchResult.matchedKeywords.length > 0 && (
            <div className="card" style={{ padding: "24px 28px" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>✓ Matching Keywords</p>
              <div className="flex flex-wrap gap-2">
                {matchResult.matchedKeywords.slice(0, 20).map((kw) => (
                  <span key={kw} className="text-xs px-3 py-1.5 rounded-full border" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.25)" }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {matchResult.missingKeywords.length > 0 && (
            <div className="card" style={{ padding: "24px 28px" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>✗ Missing Keywords</p>
              <div className="flex flex-wrap gap-2">
                {matchResult.missingKeywords.slice(0, 20).map((kw) => (
                  <span key={kw} className="text-xs px-3 py-1.5 rounded-full border" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {matchResult.transferableSkills.length > 0 && (
            <div className="card" style={{ padding: "24px 28px" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>↗ Transferable Skills</p>
              <div className="flex flex-wrap gap-2">
                {matchResult.transferableSkills.map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 rounded-full border" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", borderColor: "rgba(59,130,246,0.25)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {matchResult.suggestions.length > 0 && (
            <div className="card" style={{ padding: "24px 28px" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-3)" }}>Recommendations</p>
              <div className="flex flex-col gap-4">
                {matchResult.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-3" style={{ color: "var(--text-2)" }}>
                    <ArrowUpRight size={16} className="text-violet-500 shrink-0 mt-0.5" />
                    <span className="text-base" style={{ lineHeight: "1.75" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
