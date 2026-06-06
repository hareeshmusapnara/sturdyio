"use client";
import { useState } from "react";
import { FileText, Loader2, Copy, CheckCheck, Download, RefreshCw } from "lucide-react";

interface Props {
  resumeText: string;
  jobDescription?: string;
}

export default function CoverLetterGenerator({ resumeText, jobDescription }: Props) {
  const [jd, setJd] = useState(jobDescription || "");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription: jd }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLetter(data.coverLetter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cover-letter.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {!letter ? (
        <>
          <textarea
            className="w-full rounded-2xl resize-none outline-none transition-colors"
            style={{
              background: "var(--bg-card2)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
              padding: "18px 20px",
              fontSize: "14px",
              lineHeight: "1.75",
              height: "140px",
            }}
            placeholder="Paste job description for a more targeted cover letter (optional)..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {loading ? "Generating Cover Letter..." : "Generate Cover Letter"}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", padding: "28px 32px" }}>
            <p className="text-base whitespace-pre-wrap" style={{ color: "var(--text-1)", lineHeight: "1.85" }}>{letter}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copy}
              className="flex-1 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)", padding: "14px 16px" }}
            >
              {copied ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={download}
              className="flex-1 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)", padding: "14px 16px" }}
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={generate}
              disabled={loading}
              className="rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#7c3aed", padding: "14px 20px" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
