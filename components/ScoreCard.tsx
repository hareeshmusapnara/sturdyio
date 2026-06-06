"use client";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  score: number;
  icon: LucideIcon;
  color: string;
  issues?: string[];
  compact?: boolean;
}

export default function ScoreCard({ title, score, icon: Icon, color, issues = [], compact }: Props) {
  const label =
    score >= 80 ? "Great" :
    score >= 60 ? "Good" :
    score >= 40 ? "Fair" : "Poor";

  if (compact) {
    return (
      <div
        className="rounded-2xl px-5 py-4 transition-all"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--track-color)" }}
            >
              <Icon size={15} style={{ color: "var(--score-color)" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)", fontFamily: "var(--font-heading)" }}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--track-color)", color: "var(--score-color)" }}
            >
              {label}
            </span>
            <span
              className="text-xl font-bold tabular-nums"
              style={{ color: "var(--score-color)", fontFamily: "var(--font-heading)" }}
            >
              {score}
            </span>
          </div>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: "var(--track-color)" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: "var(--score-color)" }}
          />
        </div>
        {issues.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {issues.slice(0, 2).map((issue, i) => (
              <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-2)" }}>
                <span className="text-red-400 shrink-0 mt-px">•</span>
                {issue}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 transition-all"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--track-color)" }}>
            <Icon size={18} style={{ color: "var(--score-color)" }} />
          </div>
          <span className="font-semibold" style={{ color: "var(--text-1)" }}>{title}</span>
        </div>
        <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--score-color)", fontFamily: "var(--font-heading)" }}>
          {score}
        </span>
      </div>
      <div className="w-full rounded-full h-2 mb-3" style={{ background: "var(--bg-card2)" }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${score}%`, background: "var(--score-color)" }} />
      </div>
      {issues.length > 0 && (
        <ul className="space-y-1.5">
          {issues.slice(0, 2).map((issue, i) => (
            <li key={i} className="text-xs flex gap-1.5" style={{ color: "var(--text-2)" }}>
              <span className="text-red-500 shrink-0 mt-0.5">•</span>
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
