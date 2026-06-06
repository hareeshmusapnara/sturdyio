"use client";

interface Props {
  score: number;
  label?: string;
  size?: number;
}

export default function ScoreRing({ score, label = "Overall Score", size = 180 }: Props) {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const grade =
    score >= 85 ? "Excellent" :
    score >= 70 ? "Good" :
    score >= 55 ? "Fair" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <svg width={size} height={size} viewBox="0 0 160 160">
        {/* Track */}
        <circle cx="80" cy="80" r={r} fill="none" style={{ stroke: "var(--track-color)" }} strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="80" cy="80" r={r} fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ stroke: "var(--score-color)", transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x="80" y="73" textAnchor="middle" fontSize="38" fontWeight="700"
          fontFamily="var(--font-heading), 'Space Grotesk', sans-serif" dominantBaseline="middle"
          style={{ fill: "var(--score-color)" }}>
          {score}
        </text>
        <text x="80" y="100" textAnchor="middle" fill="#71717a" fontSize="12"
          fontFamily="var(--font-body), Inter, sans-serif" dominantBaseline="middle">
          out of 100
        </text>
      </svg>
      <div className="text-center space-y-2">
        <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</p>
        <span
          className="inline-block text-xs px-3 py-1 rounded-full font-semibold tracking-wide"
          style={{ backgroundColor: "var(--track-color)", color: "var(--score-color)" }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}
