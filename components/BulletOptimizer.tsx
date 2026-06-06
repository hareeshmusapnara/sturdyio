"use client";
import { useState } from "react";
import { X, Loader2, Zap, Copy, CheckCheck } from "lucide-react";

interface Props {
  bullets: string[];
  jobTitle?: string;
  onClose: () => void;
}

export default function BulletOptimizer({ bullets, jobTitle, onClose }: Props) {
  const [optimized, setOptimized] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const optimize = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/optimize-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullets: bullets.slice(0, 10), jobTitle }),
      });
      if (res.status === 401) throw new Error("Please sign in to use the bullet optimizer");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOptimized(data.optimized || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(optimized.map((b) => `• ${b}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
              <Zap size={15} className="text-violet-500" />
            </div>
            <h2 className="font-semibold" style={{ color: "var(--text-1)", fontFamily: "var(--font-heading)" }}>AI Bullet Point Optimizer</h2>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-3)" }} className="hover:opacity-70 transition-opacity">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!optimized.length ? (
            <>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                {bullets.length} bullet points detected. AI will rewrite them with stronger action verbs and quantifiable metrics.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bullets.slice(0, 10).map((b, i) => (
                  <div key={i} className="card2 rounded-xl p-3 text-sm flex gap-2">
                    <span style={{ color: "var(--text-3)" }} className="shrink-0">{i + 1}.</span>
                    <span style={{ color: "var(--text-2)" }}>{b}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {optimized.map((b, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div className="card2 rounded-xl p-3 text-xs">
                    <p className="font-semibold mb-1.5" style={{ color: "var(--text-3)" }}>Before</p>
                    <span style={{ color: "var(--text-2)" }}>{bullets[i] || "—"}</span>
                  </div>
                  <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p className="font-semibold mb-1.5 text-emerald-500">After</p>
                    <span style={{ color: "var(--text-1)" }}>{b}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 flex gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          {!optimized.length ? (
            <button onClick={optimize} disabled={loading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-40">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              {loading ? "Optimizing..." : "Optimize with AI"}
            </button>
          ) : (
            <>
              <button onClick={copyAll} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85" style={{ background: "#10b981", color: "#fff" }}>
                {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy All Improved Bullets"}
              </button>
              <button onClick={() => setOptimized([])} className="px-4 py-2.5 rounded-xl text-sm transition-colors" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                Re-run
              </button>
            </>
          )}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm transition-colors" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
