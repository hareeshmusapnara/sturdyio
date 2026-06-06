"use client";
import { useState } from "react";
import { Download, FileText, Loader2, ChevronDown } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface Props { result: AnalysisResult; filename: string; }

// ── PDF helpers ───────────────────────────────────────────────────────────────

async function downloadResumePDF(result: AnalysisResult, filename: string) {
  const { jsPDF } = await import("jspdf");
  const text = result.parsed.rawText;
  const baseName = filename.replace(/\.[^.]+$/, "");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mL = 52, mR = 52, mT = 52, mB = 52;
  const cW = W - mL - mR;
  let y = mT;

  const newPage = () => { doc.addPage(); y = mT; };
  const checkY = (h: number) => { if (y + h > H - mB) newPage(); };

  const isHeader = (l: string) => /^[A-Z][A-Z\s]{3,}$/.test(l.trim()) && l.trim().length < 42;
  const isBullet = (l: string) => /^[•\-*›▪▸]\s/.test(l.trim());
  const isContact = (l: string) => l.includes("|") || l.includes("@") || /\+?\d[\d\s\-()]{7,}/.test(l);
  const isDate = (l: string) => /\d{4}/.test(l) && l.trim().length < 60;

  let nameWritten = false;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) { y += 6; continue; }

    // ── Name (first non-contact short line) ──
    if (!nameWritten && !isContact(line) && line.split(" ").length <= 6 && !isDate(line)) {
      checkY(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 15, 25);
      doc.text(line, W / 2, y, { align: "center" });
      y += 28;
      nameWritten = true;
      continue;
    }

    // ── Contact line ──
    if (isContact(line)) {
      checkY(15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 115);
      doc.text(line, W / 2, y, { align: "center" });
      y += 14;
      continue;
    }

    // ── Section header ──
    if (isHeader(line)) {
      y += 6;
      checkY(26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(75, 55, 175);
      doc.text(line, mL, y);
      y += 4;
      doc.setDrawColor(175, 155, 235);
      doc.setLineWidth(0.7);
      doc.line(mL, y, W - mR, y);
      y += 12;
      continue;
    }

    // ── Bullet point ──
    if (isBullet(line)) {
      const content = line.replace(/^[•\-*›▪▸]\s*/, "").trim();
      const wrapped = doc.splitTextToSize(content, cW - 16);
      checkY(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(45, 45, 58);
      doc.setFillColor(110, 85, 195);
      doc.circle(mL + 3.5, y - 3, 1.8, "F");
      wrapped.forEach((wl: string, wi: number) => {
        if (wi > 0) checkY(13);
        doc.text(wl, mL + 13, y);
        y += 13;
      });
      y += 3;
      continue;
    }

    // ── Date / duration line ──
    if (isDate(line) && line.length < 60) {
      checkY(14);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 125);
      doc.text(line, mL, y);
      y += 14;
      continue;
    }

    // ── Job title / sub-heading (short bold line) ──
    if (line.length < 90 && line.split(" ").length <= 10 && !line.endsWith(".")) {
      checkY(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(25, 25, 38);
      doc.text(line, mL, y);
      y += 15;
      continue;
    }

    // ── Regular paragraph text ──
    checkY(13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 58);
    const wrapped = doc.splitTextToSize(line, cW);
    wrapped.forEach((wl: string) => { checkY(13); doc.text(wl, mL, y); y += 13; });
    y += 3;
  }

  doc.save(`${baseName}_resume.pdf`);
}

async function downloadReportPDF(result: AnalysisResult, filename: string) {
  const { jsPDF } = await import("jspdf");
  const baseName = filename.replace(/\.[^.]+$/, "");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mL = 52, mR = 52, mT = 52, mB = 52;
  const cW = W - mL - mR;
  let y = mT;

  const newPage = () => { doc.addPage(); y = mT; };
  const checkY = (h: number) => { if (y + h > H - mB) newPage(); };

  const scoreColor = (n: number): [number, number, number] =>
    n >= 80 ? [16, 185, 129] : n >= 60 ? [245, 158, 11] : [239, 68, 68];

  // ── Title ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 25);
  doc.text("Resume Analysis Report", W / 2, y, { align: "center" });
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 125);
  doc.text(`${filename}  ·  Generated ${new Date().toLocaleDateString()}`, W / 2, y, { align: "center" });
  y += 6;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.5);
  doc.line(mL, y, W - mR, y);
  y += 20;

  // ── Section helper ──
  const sectionHeader = (title: string) => {
    checkY(30);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(75, 55, 175);
    doc.text(title.toUpperCase(), mL, y);
    y += 4;
    doc.setDrawColor(175, 155, 235);
    doc.setLineWidth(0.6);
    doc.line(mL, y, W - mR, y);
    y += 14;
  };

  // ── Overall score pill ──
  checkY(70);
  const sc = result.overallScore;
  const [r, g, b] = scoreColor(sc);
  doc.setFillColor(r, g, b);
  doc.roundedRect(mL, y, 120, 54, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text(String(sc), mL + 60, y + 32, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Overall Score", mL + 60, y + 46, { align: "center" });

  // four score boxes
  const boxes = [
    { label: "ATS", val: result.atsScore.score },
    { label: "Content", val: result.contentScore.score },
    { label: "Keywords", val: result.keywordScore.score },
    { label: "Format", val: result.formatScore.score },
  ];
  const bW = (cW - 130 - 16) / 4;
  let bx = mL + 130 + 16;
  for (const box of boxes) {
    const [br, bg, bb] = scoreColor(box.val);
    doc.setFillColor(br, bg, bb);
    doc.setGState(doc.GState({ opacity: 0.12 }));
    doc.roundedRect(bx, y, bW, 54, 6, 6, "F");
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setDrawColor(br, bg, bb);
    doc.setLineWidth(0.8);
    doc.roundedRect(bx, y, bW, 54, 6, 6, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(br, bg, bb);
    doc.text(String(box.val), bx + bW / 2, y + 28, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 125);
    doc.text(box.label, bx + bW / 2, y + 42, { align: "center" });
    bx += bW + 4;
  }
  y += 70;

  // ── Candidate info ──
  sectionHeader("Candidate Info");
  const info = [
    ["Name", result.parsed.name || "—"],
    ["Email", result.parsed.email || "—"],
    ["Phone", result.parsed.phone || "—"],
    ["Industry", result.industry || "General"],
    ["Level", result.experienceLevel || "—"],
    ["Skills", String(result.parsed.skills.length)],
  ];
  for (const [label, val] of info) {
    checkY(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 58);
    doc.text(label + ":", mL, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 95);
    doc.text(val, mL + 90, y);
    y += 16;
  }
  y += 6;

  // ── Recommendations ──
  const allSuggestions = [
    ...result.atsScore.suggestions,
    ...result.contentScore.suggestions,
    ...result.keywordScore.suggestions,
    ...result.formatScore.suggestions,
    ...(result.aiSuggestions ?? []),
  ].filter((s, i, a) => a.indexOf(s) === i).slice(0, 10);

  if (allSuggestions.length) {
    sectionHeader("Recommendations");
    allSuggestions.forEach((s, i) => {
      const wrapped = doc.splitTextToSize(`${i + 1}. ${s}`, cW - 10);
      checkY(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(45, 45, 58);
      wrapped.forEach((wl: string) => { doc.text(wl, mL, y); y += 13; });
      y += 3;
    });
  }

  // ── Job match ──
  if (result.jobMatch) {
    sectionHeader("Job Match");
    const jm = result.jobMatch;
    checkY(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 58);
    doc.text(`Match Score: `, mL, y);
    const [mr2, mg2, mb2] = scoreColor(jm.matchPercentage);
    doc.setTextColor(mr2, mg2, mb2);
    doc.text(`${jm.matchPercentage}%`, mL + 80, y);
    y += 18;

    if (jm.missingKeywords.length) {
      const missingText = "Missing keywords: " + jm.missingKeywords.slice(0, 10).join(", ");
      const wrapped = doc.splitTextToSize(missingText, cW);
      checkY(wrapped.length * 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 95);
      wrapped.forEach((wl: string) => { doc.text(wl, mL, y); y += 13; });
    }
    y += 6;
  }

  // ── Interview questions ──
  if (result.interviewQuestions?.length) {
    sectionHeader("Interview Questions");
    result.interviewQuestions.slice(0, 5).forEach((q, i) => {
      const wrapped = doc.splitTextToSize(`${i + 1}. ${q}`, cW - 10);
      checkY(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(45, 45, 58);
      wrapped.forEach((wl: string) => { doc.text(wl, mL, y); y += 13; });
      y += 3;
    });
  }

  // ── Footer on every page ──
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 175);
    doc.text(
      `Generated by Sturdy AI  ·  Page ${p} of ${totalPages}`,
      W / 2, H - 24,
      { align: "center" }
    );
  }

  doc.save(`${baseName}_analysis_report.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExportOptions({ result, filename }: Props) {
  const [resumeLoading, setResumeLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleResumePDF = async () => {
    setResumeLoading(true);
    try { await downloadResumePDF(result, filename); } finally { setResumeLoading(false); }
  };

  const handleReportPDF = async () => {
    setReportLoading(true);
    setOpen(false);
    try { await downloadReportPDF(result, filename); } finally { setReportLoading(false); }
  };

  const handleResumeTXT = () => {
    const blob = new Blob([result.parsed.rawText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename.replace(/\.[^.]+$/, "") + "_resume.txt"; a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">

      {/* ── Download Resume PDF (primary CTA) ── */}
      <button
        onClick={handleResumePDF}
        disabled={resumeLoading}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
      >
        {resumeLoading
          ? <Loader2 size={13} className="animate-spin" />
          : <Download size={13} />}
        {resumeLoading ? "Generating…" : "Download Resume PDF"}
      </button>

      {/* ── Export dropdown ── */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
        >
          <FileText size={13} />
          Export
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 mt-2 z-20 rounded-xl shadow-xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                minWidth: "200px",
              }}
            >
              <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                  Export Options
                </p>
              </div>

              <button
                onClick={handleReportPDF}
                disabled={reportLoading}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:opacity-80 transition-opacity disabled:opacity-40"
                style={{ color: "var(--text-1)" }}
              >
                {reportLoading
                  ? <Loader2 size={14} className="animate-spin text-violet-500" />
                  : <Download size={14} className="text-violet-500" />}
                <div>
                  <p className="font-semibold">Analysis Report PDF</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Scores, tips, job match</p>
                </div>
              </button>

              <button
                onClick={handleResumeTXT}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:opacity-80 transition-opacity"
                style={{ borderTop: "1px solid var(--border)", color: "var(--text-1)" }}
              >
                <FileText size={14} className="text-emerald-500" />
                <div>
                  <p className="font-semibold">Resume Plain Text</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Copy-paste friendly .txt</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
