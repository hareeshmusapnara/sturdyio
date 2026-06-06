"use client";
import type { SkillCategory } from "@/lib/types";

interface Props {
  skills: SkillCategory;
  missingKeywords?: string[];
}

const CATS: { key: keyof SkillCategory; label: string; color: string }[] = [
  { key: "technical", label: "Technical",   color: "#3b82f6" },
  { key: "tools",     label: "Tools",       color: "#8b5cf6" },
  { key: "languages", label: "Languages",   color: "#10b981" },
  { key: "soft",      label: "Soft Skills", color: "#f59e0b" },
];

export default function SkillMap({ skills, missingKeywords = [] }: Props) {
  const total = Object.values(skills).reduce((s, a) => s + a.length, 0);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATS.map(({ key, label, color }) => (
          <div key={key} className="card p-4 text-center">
            <div className="text-2xl font-bold tabular-nums mb-0.5" style={{ color, fontFamily: "var(--font-heading)" }}>
              {skills[key].length}
            </div>
            <div className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Skill pills per category */}
      {CATS.map(({ key, label, color }) => {
        const items = skills[key];
        if (!items.length) return null;
        return (
          <div key={key} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{label}</p>
              </div>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>{items.length} skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-full font-medium border"
                  style={{ background: `${color}12`, color, borderColor: `${color}30` }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {/* Missing keywords */}
      {missingKeywords.length > 0 && (
        <div className="card p-5" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Suggested to Add ({missingKeywords.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.slice(0, 15).map((kw) => (
              <span key={kw} className="text-xs px-2.5 py-1 rounded-full border" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" }}>
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No skills detected. Ensure your resume has a clear Skills section.</p>
        </div>
      )}
    </div>
  );
}
