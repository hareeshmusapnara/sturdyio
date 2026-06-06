"use client";
import { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Upload, FileText, Briefcase, Sparkles, Download, RefreshCw,
  CheckCircle, ArrowRight, Loader2, Brain, ChevronRight, X, AlertCircle
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScoreSet {
  ats: number;
  content: number;
  keywords: number;
  format: number;
  overall: number;
}

interface OptimizeResult {
  optimizedResume: string;
  keywordsFound: string[];
  keywordMatchPercent: number;
  impactBulletScore: number;
  formattingScore: number;
  improvements: string[];
  before: ScoreSet;
  after: ScoreSet;
}

type Step = "upload" | "jobdesc" | "result";

// ── Score color ───────────────────────────────────────────────────────────────
function scoreColor(n: number) {
  if (n >= 80) return "#10b981";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full rounded-full h-2" style={{ background: "var(--bg-card2)" }}>
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

// ── Big score circle ──────────────────────────────────────────────────────────
function ScoreCircle({ score, label, size = 96 }: { score: number; label: string; size?: number }) {
  const color = scoreColor(score);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-card2)" strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fontSize={size < 80 ? 14 : 20} fontWeight="800" fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}

// ── PDF download (client-side via jsPDF) ──────────────────────────────────────
async function downloadPDF(text: string, filename: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mL = 52, mR = 52, mT = 52, mB = 52, cW = W - mL - mR;
  let y = mT;

  const next = () => { doc.addPage(); y = mT; };
  const fit = (h: number) => { if (y + h > H - mB) next(); };

  const isHdr = (l: string) => /^[A-Z][A-Z\s]{3,}$/.test(l) && l.length < 42;
  const isBlt = (l: string) => /^[•\-*›▪▸]\s/.test(l);
  const isCon = (l: string) => l.includes("|") || l.includes("@") || /\+?\d[\d\s\-()]{7,}/.test(l);

  let nameWritten = false;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) { y += 7; continue; }

    if (!nameWritten && !isCon(line) && line.split(" ").length <= 6 && !/\d{4}/.test(line)) {
      fit(28); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(15, 15, 25);
      doc.text(line, W / 2, y, { align: "center" }); y += 26; nameWritten = true; continue;
    }
    if (isCon(line)) {
      fit(15); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 115);
      doc.text(line, W / 2, y, { align: "center" }); y += 14; continue;
    }
    if (isHdr(line)) {
      fit(24); y += 4; doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(75, 55, 175);
      doc.text(line, mL, y); y += 3;
      doc.setDrawColor(175, 155, 235); doc.setLineWidth(0.6); doc.line(mL, y, W - mR, y); y += 11; continue;
    }
    if (isBlt(line)) {
      const content = line.replace(/^[•\-*›▪▸]\s*/, "").trim();
      const wrapped = doc.splitTextToSize(content, cW - 18);
      fit(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(45, 45, 58);
      doc.setFillColor(110, 85, 195); doc.circle(mL + 4, y - 3, 1.6, "F");
      wrapped.forEach((wl: string, wi: number) => { if (wi > 0) fit(13); doc.text(wl, mL + 13, y); y += 13; });
      y += 3; continue;
    }
    if (/\d{4}/.test(line) && line.length < 60) {
      fit(13); doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(110, 110, 125);
      doc.text(line, mL, y); y += 13; continue;
    }
    if (line.length < 90 && line.split(" ").length <= 10) {
      fit(15); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(25, 25, 38);
      doc.text(line, mL, y); y += 14; continue;
    }
    fit(13); doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(45, 45, 58);
    const wrapped = doc.splitTextToSize(line, cW);
    wrapped.forEach((wl: string) => { fit(13); doc.text(wl, mL, y); y += 13; }); y += 3;
  }
  doc.save(`${filename}.pdf`);
}

// ── STEP 1: Resume Uploader ───────────────────────────────────────────────────
function ResumeUploader({ onDone }: { onDone: (text: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractPDF = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");
      if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) throw new Error("PDF files only");

      // Use pdf.js loaded from CDN (already in page.tsx)
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF parser not available — paste text instead");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      if (fullText.trim().length < 30) throw new Error("Could not extract text from PDF — try pasting text instead");
      setText(fullText.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setTab("upload"); extractPDF(file); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractPDF(file);
  };

  const handleSubmit = () => {
    if (text.trim().length < 50) { setError("Resume text is too short"); return; }
    onDone(text.trim());
  };

  return (
    <div className="card max-w-2xl mx-auto w-full" style={{ padding: "40px 44px" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <FileText size={18} className="text-violet-500" />
        </div>
        <div>
          <h2 className="font-black text-lg" style={{ color: "var(--text-1)" }}>Upload Your Resume</h2>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Paste text or upload a PDF (max 5MB)</p>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-card2)" }}>
        {(["paste", "upload"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "var(--bg-card)" : "transparent",
              color: tab === t ? "var(--text-1)" : "var(--text-3)",
              border: tab === t ? "1px solid var(--border)" : "1px solid transparent",
            }}>
            {t === "paste" ? "Paste Text" : "Upload PDF"}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(""); }}
          placeholder="Paste your full resume text here..."
          className="w-full rounded-2xl resize-none outline-none text-sm"
          style={{
            background: "var(--bg-card2)", border: "1px solid var(--border)",
            color: "var(--text-1)", padding: "16px 18px",
            lineHeight: "1.75", height: "240px",
          }}
          onFocus={e => (e.target.style.borderColor = "#7c3aed")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-3 transition-all"
          style={{
            border: `2px dashed ${dragging ? "#7c3aed" : "var(--border)"}`,
            background: dragging ? "rgba(124,58,237,0.05)" : "var(--bg-card2)",
            padding: "48px 24px", minHeight: "180px",
          }}
        >
          {uploading ? (
            <><Loader2 size={28} className="text-violet-500 animate-spin" /><p className="text-sm" style={{ color: "var(--text-2)" }}>Extracting text...</p></>
          ) : (
            <>
              <Upload size={28} style={{ color: "var(--text-3)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Drop PDF here or click to browse</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>PDF only · max 5MB</p>
            </>
          )}
          {text && !uploading && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
              <CheckCircle size={13} className="text-emerald-500" />
              <span className="text-xs text-emerald-500 font-semibold">Text extracted — {text.split(/\s+/).length} words</span>
            </div>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-red-400">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {text.trim().length > 50 && (
        <div className="mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
          ✓ {text.split(/\s+/).length} words ready
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={text.trim().length < 50}
        className="btn-primary w-full mt-5 flex items-center justify-center gap-2 font-semibold disabled:opacity-40"
        style={{ padding: "14px", fontSize: "14px" }}
      >
        Continue <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ── STEP 2: Job Description Input ─────────────────────────────────────────────
function JobDescriptionInput({
  onSubmit, onBack, loading,
}: {
  onSubmit: (jd: string) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [jd, setJd] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (jd.trim().length < 20) { setError("Please enter a more complete job description"); return; }
    onSubmit(jd.trim());
  };

  return (
    <div className="card max-w-2xl mx-auto w-full" style={{ padding: "40px 44px" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Briefcase size={18} className="text-blue-500" />
        </div>
        <div>
          <h2 className="font-black text-lg" style={{ color: "var(--text-1)" }}>Job Description</h2>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Paste the job posting to tailor your resume</p>
        </div>
      </div>

      <textarea
        value={jd}
        onChange={e => { setJd(e.target.value); setError(""); }}
        placeholder="Paste the full job description here — the more detail, the better the optimization..."
        className="w-full rounded-2xl resize-none outline-none text-sm"
        style={{
          background: "var(--bg-card2)", border: "1px solid var(--border)",
          color: "var(--text-1)", padding: "16px 18px",
          lineHeight: "1.75", height: "280px",
        }}
        onFocus={e => (e.target.style.borderColor = "#3b82f6")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
      />

      {error && <p className="text-sm text-red-400 mt-2 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}

      <div className="flex gap-3 mt-5">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40"
          style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || jd.trim().length < 20}
          className="btn-primary flex-1 flex items-center justify-center gap-2 font-semibold disabled:opacity-40"
          style={{ padding: "14px", fontSize: "14px" }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Optimizing your resume...</>
            : <><Sparkles size={16} /> Optimize Resume</>}
        </button>
      </div>
    </div>
  );
}

// ── STEP 3: Results ───────────────────────────────────────────────────────────
function Results({
  result, resumeText, onReset,
}: {
  result: OptimizeResult;
  resumeText: string;
  onReset: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"original" | "optimized">("optimized");
  const [downloading, setDownloading] = useState(false);

  const atsScore = result.after.overall;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    await downloadPDF(result.optimizedResume, "optimized_resume");
    setDownloading(false);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([result.optimizedResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "optimized_resume.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 w-full max-w-5xl mx-auto">

      {/* ATS Score header */}
      <div className="card" style={{ padding: "28px 32px" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-xl" style={{ color: "var(--text-1)" }}>Optimization Complete</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
              Your resume is now optimized for ATS systems
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              <RefreshCw size={13} /> Start Over
            </button>
          </div>
        </div>

        {/* Before / After ATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Before ATS", val: result.before.overall, sub: "original score" },
            { label: "After ATS", val: result.after.overall, sub: "optimized score" },
            { label: "Keywords", val: result.after.keywords, sub: "JD match %" },
            { label: "Impact", val: result.impactBulletScore, sub: "action verb score" },
          ].map(({ label, val, sub }) => (
            <div key={label} className="rounded-2xl text-center" style={{ background: "var(--bg-card2)", padding: "20px 12px" }}>
              <div className="text-3xl font-black mb-1" style={{ color: scoreColor(val) }}>{val}</div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Score details */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <h3 className="font-black text-sm mb-5" style={{ color: "var(--text-1)" }}>Score Breakdown</h3>

          <div className="flex justify-around mb-6">
            <ScoreCircle score={result.after.keywords} label="Keywords" />
            <ScoreCircle score={result.impactBulletScore} label="Impact" />
            <ScoreCircle score={result.after.format} label="Format" />
          </div>

          <div className="space-y-4">
            {[
              { label: "Keyword Match", val: result.after.keywords, weight: "40%", color: "#f59e0b" },
              { label: "Impact Bullets", val: result.impactBulletScore, weight: "40%", color: "#3b82f6" },
              { label: "Formatting", val: result.after.format, weight: "20%", color: "#8b5cf6" },
            ].map(({ label, val, weight, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-2)" }}>{label} <span style={{ color: "var(--text-3)" }}>({weight})</span></span>
                  <span className="font-bold" style={{ color }}>{val}</span>
                </div>
                <ProgressBar value={val} color={color} />
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 flex justify-between items-center" style={{ borderTop: "1px solid var(--border)" }}>
            <div>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Before</span>
              <span className="text-lg font-black ml-2" style={{ color: scoreColor(result.before.overall) }}>{result.before.overall}</span>
              <span className="mx-2 text-sm" style={{ color: "var(--text-3)" }}>→</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>After</span>
              <span className="text-2xl font-black ml-2" style={{ color: scoreColor(atsScore) }}>{atsScore}</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-bold"
              style={{
                background: atsScore > result.before.overall ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                color: atsScore > result.before.overall ? "#10b981" : "#ef4444"
              }}>
              {atsScore > result.before.overall ? `+${atsScore - result.before.overall}` : atsScore - result.before.overall}
            </span>
          </div>
        </div>

        {/* Improvements + keywords */}
        <div className="flex flex-col gap-4">

          {/* Keywords found */}
          {result.keywordsFound.length > 0 && (
            <div className="card" style={{ padding: "20px 24px" }}>
              <h3 className="font-black text-sm mb-3" style={{ color: "var(--text-1)" }}>
                Keywords Matched <span className="font-normal text-xs ml-1" style={{ color: "var(--text-3)" }}>({result.keywordsFound.length})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.keywordsFound.map(kw => (
                  <span key={kw} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          <div className="card flex-1" style={{ padding: "20px 24px" }}>
            <h3 className="font-black text-sm mb-3" style={{ color: "var(--text-1)" }}>Improvements Made</h3>
            <div className="space-y-2">
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs" style={{ color: "var(--text-2)", lineHeight: "1.6" }}>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resume comparison */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm" style={{ color: "var(--text-1)" }}>Resume Comparison</h3>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-card2)" }}>
            {(["original", "optimized"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={{
                  background: activeTab === t ? "var(--bg-card)" : "transparent",
                  color: activeTab === t ? "var(--text-1)" : "var(--text-3)",
                  border: activeTab === t ? "1px solid var(--border)" : "1px solid transparent",
                }}>
                {t === "original" ? "Original" : "✓ Optimized"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "original" ? (
          <pre style={{
            color: "var(--text-2)", lineHeight: "1.8", fontFamily: "inherit",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontSize: "12.5px", maxHeight: "500px", overflowY: "auto",
          }}>{resumeText}</pre>
        ) : (
          <div style={{ maxHeight: "500px", overflowY: "auto", fontSize: "12.5px", lineHeight: "1.8" }}>
            {result.optimizedResume.split("\n").map((line, i) => {
              const origLine = resumeText.split("\n")[i] ?? "";
              const changed = line.trim() !== origLine.trim() && line.trim().length > 0;
              return (
                <div key={i} style={{
                  background: changed ? "rgba(16,185,129,0.07)" : "transparent",
                  borderLeft: changed ? "2px solid #10b981" : "2px solid transparent",
                  paddingLeft: "8px", marginLeft: "-8px",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  color: changed ? "var(--text-1)" : "var(--text-2)",
                  fontWeight: changed ? 500 : 400,
                }}>
                  {line || "\u00A0"}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Download buttons */}
      <div className="card" style={{ padding: "22px 28px" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Download size={16} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="font-black text-sm" style={{ color: "var(--text-1)" }}>Download Optimized Resume</h3>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Choose your format</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          >
            <FileText size={14} /> Download TXT
          </button>
        </div>
      </div>

    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function OptimizerPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session;

  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    await signIn("google", { callbackUrl: "/optimizer" });
  };

  const handleResumeReady = (text: string) => {
    setResumeText(text);
    setStep("jobdesc");
  };

  const handleOptimize = async (jd: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription: jd }),
      });
      if (res.status === 401) throw new Error("Session expired. Please sign in again.");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setResumeText("");
    setResult(null);
    setError("");
  };

  // Step indicator
  const steps = [
    { id: "upload", label: "Upload Resume", icon: FileText },
    { id: "jobdesc", label: "Job Description", icon: Briefcase },
    { id: "result", label: "Optimized Resume", icon: Sparkles },
  ];

  // ── Loading state ──
  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={32} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  // ── Unauthenticated gate ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
        <div className="card w-full max-w-md p-10 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2" style={{ color: "var(--text-1)" }}>Sign in to use the Optimizer</h2>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              The Resume Optimizer is available to signed-in users only. Sign in with Google to get started.
            </p>
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          >
            {signingIn ? (
              <Loader2 size={17} className="animate-spin text-violet-500" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {signingIn ? "Signing in..." : "Continue with Google"}
          </button>
          <Link href="/" className="text-xs text-violet-500 hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      {/* Header */}
      <header className="site-header sticky top-0 z-40 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Brain size={13} className="text-white" />
              </div>
              <span className="font-bold text-base" style={{ color: "var(--text-1)" }}>Sturdy AI</span>
            </Link>
            <span style={{ color: "var(--border)" }}>·</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Resume Optimizer</span>
          </div>
          {step !== "upload" && (
            <button onClick={handleReset} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <X size={11} /> Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const active = s.id === step;
            const done = steps.findIndex(x => x.id === step) > i;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: done ? "rgba(16,185,129,0.15)" : active ? "rgba(124,58,237,0.15)" : "var(--bg-card2)",
                      border: `1px solid ${done ? "#10b981" : active ? "#7c3aed" : "var(--border)"}`,
                      color: done ? "#10b981" : active ? "#7c3aed" : "var(--text-3)",
                    }}>
                    {done ? <CheckCircle size={13} /> : <Icon size={12} />}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block"
                    style={{ color: active ? "var(--text-1)" : "var(--text-3)" }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight size={12} style={{ color: "var(--text-3)" }} className="mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={14} /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X size={13} /></button>
          </div>
        )}

        {step === "upload" && <ResumeUploader onDone={handleResumeReady} />}
        {step === "jobdesc" && (
          <JobDescriptionInput onSubmit={handleOptimize} onBack={() => setStep("upload")} loading={loading} />
        )}
        {step === "result" && result && (
          <Results result={result} resumeText={resumeText} onReset={handleReset} />
        )}

        {loading && step === "jobdesc" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="card flex flex-col items-center gap-4" style={{ padding: "40px 52px" }}>
              <Loader2 size={36} className="text-violet-500 animate-spin" />
              <p className="font-black text-lg" style={{ color: "var(--text-1)" }}>Optimizing your resume...</p>
              <div className="flex flex-col gap-1.5 text-center">
                {["Analyzing job requirements", "Matching keywords", "Rewriting bullet points", "Scoring ATS compatibility"].map(s => (
                  <span key={s} className="text-xs animate-pulse" style={{ color: "var(--text-3)" }}>✦ {s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
