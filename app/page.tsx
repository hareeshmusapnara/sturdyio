"use client";
import { useState, useCallback, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Brain, Shield, Zap, Target, BarChart3, FileText,
  MessageSquare, Settings, ChevronRight, Loader2,
  RefreshCw, TrendingUp, Award, BookOpen, LogOut,
  CheckCircle, X, Sparkles, ArrowRight, Star, Sun, Moon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/types";
import UploadZone from "@/components/UploadZone";
import ScoreRing from "@/components/ScoreRing";
import ScoreCard from "@/components/ScoreCard";
import RecommendationPanel from "@/components/RecommendationPanel";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import SkillMap from "@/components/SkillMap";
import BulletOptimizer from "@/components/BulletOptimizer";
import CoverLetterGenerator from "@/components/CoverLetterGenerator";
import InterviewPrep from "@/components/InterviewPrep";
import ExportOptions from "@/components/ExportOptions";

type Tab = "dashboard" | "skills" | "jobmatch" | "ai" | "coverletter" | "interview";

// Reusable border style
const B = "border border-[var(--border)]";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session;

  const [resumeText, setResumeText] = useState("");
  const [filename, setFilename] = useState("resume.txt");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showBulletOptimizer, setShowBulletOptimizer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [jobMatchLoading, setJobMatchLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ text: string; name: string } | null>(null);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    if (isLoggedIn && pendingUpload) {
      const { text, name } = pendingUpload;
      setPendingUpload(null);
      setShowLoginModal(false);
      setResumeText(text);
      setFilename(name);
      analyze(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, pendingUpload]);

  const analyze = useCallback(async (text: string, jd?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, jobDescription: jd }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setTab("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = (text: string, name: string) => {
    if (!isLoggedIn) {
      setPendingUpload({ text, name });
      setShowLoginModal(true);
      return;
    }
    setResumeText(text);
    setFilename(name);
    analyze(text);
  };

  const handleJobMatch = async (jd: string) => {
    if (!result) return;
    setJobMatchLoading(true);
    await analyze(resumeText, jd);
    setJobMatchLoading(false);
    setTab("jobmatch");
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "skills", label: "Skills", icon: Award },
    { id: "jobmatch", label: "Job Match", icon: Target },
    { id: "ai", label: "AI Tips", icon: Brain },
    { id: "coverletter", label: "Cover Letter", icon: FileText },
    { id: "interview", label: "Interview Prep", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      {/* ── Header ── */}
      <header className="site-header sticky top-0 z-40 w-full">
        <div className="w-full px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setResult(null); setResumeText(""); setTab("dashboard"); }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-lg" style={{ color: "var(--text-1)" }}>Sturdy AI</span>
            </button>
            <span className="text-xs hidden sm:inline" style={{ color: "var(--text-3)" }}>Resume Analyzer</span>
          </div>

          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={() => { setResult(null); setResumeText(""); setTab("dashboard"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${B}`}
                style={{ color: "var(--text-2)", background: "var(--bg-card)" }}
              >
                <RefreshCw size={11} /> New Analysis
              </button>
            )}

            <Link
              href="/optimizer"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${B}`}
              style={{ color: "var(--text-2)", background: "var(--bg-card)" }}
            >
              <Zap size={11} className="text-violet-500" /> Optimizer
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${B}`}
              style={{ background: "var(--bg-card)", color: "var(--text-2)" }}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {status === "loading" ? (
              <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--bg-card2)" }} />
            ) : isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-colors ${B}`}
                  style={{ background: "var(--bg-card)" }}
                >
                  {session.user?.image ? (
                    <Image src={session.user.image} alt={session.user.name ?? "User"} width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                      {session.user?.name?.[0] ?? "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate" style={{ color: "var(--text-1)" }}>
                    {session.user?.name}
                  </span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className={`absolute right-0 mt-2 z-20 rounded-xl shadow-xl p-2 min-w-[200px] ${B}`} style={{ background: "var(--bg-card)" }}>
                      <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{session.user?.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{session.user?.email}</p>
                      </div>
                      <button
                        onClick={() => { signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut size={13} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn-primary px-5 py-2 text-sm"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 py-10">
        {!result ? (
          <div className="space-y-20">

            {/* ── Hero ── */}
            <div className="max-w-4xl mx-auto text-center space-y-7 pt-10">
              <div className="fade-up fade-up-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-violet-500/30 text-violet-400">
                <Sparkles size={11} />
                AI-Powered Resume Intelligence
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <h1 className="fade-up fade-up-2 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight" style={{ color: "var(--text-1)" }}>
                Land Your <span className="grad-text">Dream Job</span> with AI Precision
              </h1>

              <p className="fade-up fade-up-3 text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-2)" }}>
                ATS scoring, keyword gap analysis, AI-powered suggestions, job matching, and cover letter generation — all in seconds.
              </p>

              <div className="fade-up fade-up-4 flex flex-wrap items-center justify-center gap-4">
                {["ATS Score", "Keyword Analysis", "Job Matching", "AI Suggestions", "Cover Letter", "Interview Prep"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-2)" }}>
                    <CheckCircle size={13} className="text-emerald-500" />{f}
                  </span>
                ))}
              </div>

              <div className="fade-up fade-up-4 flex items-center justify-center gap-2">
                <div className="flex -space-x-2">
                  {["#7c3aed", "#4f46e5", "#0ea5e9", "#10b981"].map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: "var(--bg)" }} />
                  ))}
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
                </div>
                <span className="text-sm" style={{ color: "var(--text-2)" }}>
                  Trusted by <strong style={{ color: "var(--text-1)" }}>10,000+</strong> job seekers
                </span>
              </div>
            </div>

            {/* ── Upload ── */}
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="card" style={{ padding: "48px 52px" }}>
                <UploadZone onTextExtracted={handleUpload} />
              </div>
              {loading && (
                <div className="card px-8 py-8 flex flex-col items-center gap-4">
                  <Loader2 size={28} className="text-violet-500 animate-spin" />
                  <p className="font-semibold" style={{ color: "var(--text-1)" }}>Analyzing your resume with AI...</p>
                  <div className="flex flex-wrap justify-center gap-4 text-xs" style={{ color: "var(--text-3)" }}>
                    {["Parsing structure", "ATS scoring", "Extracting skills", "AI insights"].map(s => (
                      <span key={s} className="animate-pulse">✦ {s}</span>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div className="card px-6 py-5 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            {/* ── Feature Grid ── */}
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">Features</p>
                <h2 className="text-3xl font-black mb-3" style={{ color: "var(--text-1)" }}>Everything to land the job</h2>
                <p className="text-base" style={{ color: "var(--text-2)" }}>Six powerful tools in one dashboard</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Shield, label: "ATS Compatibility", desc: "Detect every formatting issue causing automated rejection. Get a 0–100 score with specific actionable fixes.", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "hover:border-emerald-500/40", accent: "#10b981" },
                  { icon: Brain, label: "AI Analysis", desc: "AI-powered suggestions for content improvements, weak language patterns, and impact quantification.", color: "text-violet-500", bg: "bg-violet-500/10", border: "hover:border-violet-500/40", accent: "#7c3aed" },
                  { icon: Target, label: "Job Matching", desc: "Paste any job description for an instant match %, with missing keywords highlighted in real-time.", color: "text-blue-500", bg: "bg-blue-500/10", border: "hover:border-blue-500/40", accent: "#3b82f6" },
                  { icon: Zap, label: "Bullet Optimizer", desc: "AI rewrites weak bullet points with powerful action verbs and measurable, quantified results.", color: "text-amber-500", bg: "bg-amber-500/10", border: "hover:border-amber-500/40", accent: "#f59e0b" },
                  { icon: FileText, label: "Cover Letter", desc: "Generate a tailored, professional cover letter matched to any job description instantly.", color: "text-rose-500", bg: "bg-rose-500/10", border: "hover:border-rose-500/40", accent: "#f43f5e" },
                  { icon: MessageSquare, label: "Interview Prep", desc: "Get predicted interview questions from your resume with expert answer frameworks and coaching tips.", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/40", accent: "#06b6d4" },
                ].map(({ icon: Icon, label, desc, color, bg, border, accent }) => (
                  <div key={label} className={`card flex flex-col transition-all duration-200 hover:-translate-y-1 ${border}`} style={{ padding: "36px 32px 32px 32px" }}>
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0 mb-7`}>
                      <Icon size={26} className={color} />
                    </div>
                    {/* Title */}
                    <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-1)" }}>{label}</h3>
                    {/* Desc */}
                    <p className="text-base mb-8" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>{desc}</p>
                    {/* Footer */}
                    <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold" style={{ color: accent }}>
                      <span>Explore</span><ChevronRight size={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── How It Works ── */}
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">Process</p>
                <h2 className="text-3xl font-black" style={{ color: "var(--text-1)" }}>Three steps to a better resume</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "01", icon: BookOpen, title: "Upload Resume", desc: "Drop your PDF, DOCX, or TXT. Our parser extracts name, contact info, experience, education, and skills in seconds.", color: "text-violet-500", bg: "bg-violet-500/10" },
                  { step: "02", icon: Brain, title: "AI Analysis", desc: "Scores ATS compatibility, content quality, keyword density, and formatting. AI generates tailored improvement suggestions.", color: "text-blue-500", bg: "bg-blue-500/10" },
                  { step: "03", icon: Award, title: "Optimize & Apply", desc: "Use the bullet optimizer, job match tool, and cover letter generator to tailor your resume for each role.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                ].map(({ step, icon: Icon, title, desc, color, bg }, idx) => (
                  <div key={step} className="card relative overflow-hidden flex flex-col" style={{ padding: "40px 36px 40px 36px" }}>
                    <div className="text-[7rem] font-black absolute -top-4 -right-2 select-none pointer-events-none leading-none" style={{ color: "var(--border)" }}>{step}</div>
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center relative z-10 shrink-0 mb-7`}>
                      <Icon size={26} className={color} />
                    </div>
                    {/* Title */}
                    <h3 className="font-bold text-xl relative z-10 mb-4" style={{ color: "var(--text-1)" }}>{title}</h3>
                    {/* Desc */}
                    <p className="text-base relative z-10" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>{desc}</p>
                    {idx < 2 && (
                      <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full items-center justify-center shadow-lg" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}>
                        <ChevronRight size={13} style={{ color: "var(--text-3)" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="max-w-5xl mx-auto w-full">
              <div className="card overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: "var(--border)" }}>
                  {[
                    { val: "10K+", label: "Resumes Analyzed", color: "text-violet-500", bg: "" },
                    { val: "94%", label: "ATS Pass Rate", color: "text-emerald-500", bg: "" },
                    { val: "3×", label: "More Interviews", color: "text-amber-500", bg: "" },
                    { val: "< 30s", label: "Full Analysis", color: "text-blue-500", bg: "" },
                  ].map(({ val, label, color }) => (
                    <div key={label} className="py-10 px-6 text-center flex flex-col gap-2">
                      <div className={`text-4xl font-black ${color}`}>{val}</div>
                      <div className="text-xs font-medium tracking-wide" style={{ color: "var(--text-3)" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Deep Dive ── */}
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">Deep Dive</p>
                <h2 className="text-3xl font-black" style={{ color: "var(--text-1)" }}>What Sturdy AI actually does</h2>
              </div>
              <div className="space-y-6">

                {/* ATS */}
                <div className="card grid md:grid-cols-2 gap-14 items-start" style={{ padding: "44px 44px" }}>
                  <div className="flex flex-col">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 self-start mb-8">
                      <Shield size={13} className="text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">ATS Checker</span>
                    </div>
                    <h3 className="text-2xl font-black mb-5" style={{ color: "var(--text-1)" }}>Beat every ATS filter</h3>
                    <p className="text-base mb-8" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>Over 75% of resumes are rejected before a human sees them. We scan every known ATS failure point and tell you exactly what to fix.</p>
                    <ul className="flex flex-col gap-5">
                      {["Detects tables & multi-column layouts", "Flags special characters & symbols", "Verifies contact info is machine-readable", "Checks standard section headers", "Scores formatting cleanliness 0–100"].map(item => (
                        <li key={item} className="flex items-center gap-4" style={{ color: "var(--text-2)" }}>
                          <span className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <CheckCircle size={14} className="text-emerald-500" />
                          </span>
                          <span className="text-base" style={{ lineHeight: "1.7" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl flex flex-col" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", padding: "28px 28px" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--text-3)" }}>Live Score Breakdown</p>
                    {([["Email Detected", true], ["Phone Detected", true], ["No Tables Found", true], ["Standard Sections", true], ["Clean Formatting", false], ["LinkedIn Present", false]] as [string, boolean][]).map(([label, pass]) => (
                      <div key={label} className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="text-sm" style={{ color: "var(--text-2)" }}>{label}</span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${pass ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>{pass ? "✓ Pass" : "✗ Fix"}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-6">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>ATS Score</span>
                      <span className="text-3xl font-black text-emerald-500">72<span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>/100</span></span>
                    </div>
                  </div>
                </div>

                {/* Bullet before/after */}
                <div className="card grid md:grid-cols-2 gap-14 items-start" style={{ padding: "44px 44px" }}>
                  <div className="flex flex-col">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 self-start mb-8">
                      <Zap size={13} className="text-amber-500" />
                      <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Bullet Optimizer</span>
                    </div>
                    <h3 className="text-2xl font-black mb-5" style={{ color: "var(--text-1)" }}>Turn weak bullets into wins</h3>
                    <p className="text-base" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>Weak bullets kill applications. Our AI rewrites every bullet with stronger action verbs, quantified impact, and recruiter-friendly language that gets callbacks.</p>
                  </div>
                  <div className="flex flex-col gap-5">
                    <div className="rounded-2xl" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderLeft: "3px solid #ef4444", padding: "24px 28px" }}>
                      <p className="text-xs font-semibold mb-4 text-red-400 uppercase tracking-widest">Before</p>
                      <p className="text-base" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>Responsible for managing the development team and helping with projects</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                      <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                        <ArrowRight size={14} className="text-amber-500" />
                      </div>
                      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                    </div>
                    <div className="rounded-2xl" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderLeft: "3px solid #10b981", padding: "24px 28px" }}>
                      <p className="text-xs font-semibold mb-4 text-emerald-400 uppercase tracking-widest">After</p>
                      <p className="text-base" style={{ color: "var(--text-1)", lineHeight: "1.85" }}>Led a 6-engineer team delivering 12 product features, reducing release cycle by 40% through agile restructuring</p>
                    </div>
                  </div>
                </div>

                {/* Skills + Interview */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card flex flex-col" style={{ padding: "40px 36px" }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 self-start mb-8">
                      <Award size={13} className="text-purple-500" />
                      <span className="text-xs font-semibold text-purple-500 uppercase tracking-widest">Skill Mapping</span>
                    </div>
                    <h3 className="text-xl font-black mb-4" style={{ color: "var(--text-1)" }}>Skill Extraction & Mapping</h3>
                    <p className="text-base mb-8" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>Every skill categorized automatically against industry standards.</p>
                    <div className="flex flex-col gap-3">
                      {([["Technical", "React, TypeScript, Python", "text-blue-500", "bg-blue-500/10"], ["Tools", "Jira, Figma, GitHub", "text-purple-500", "bg-purple-500/10"], ["Soft Skills", "Leadership, Agile", "text-orange-500", "bg-orange-500/10"], ["Languages", "English, Spanish", "text-emerald-500", "bg-emerald-500/10"]] as string[][]).map(([cat, ex, tc, tbg]) => (
                        <div key={cat} className={`flex justify-between items-center ${tbg} rounded-xl`} style={{ padding: "14px 18px" }}>
                          <span className={`text-sm font-bold ${tc}`}>{cat}</span>
                          <span className="text-sm" style={{ color: "var(--text-3)" }}>{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card flex flex-col" style={{ padding: "40px 36px" }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 self-start mb-8">
                      <MessageSquare size={13} className="text-cyan-500" />
                      <span className="text-xs font-semibold text-cyan-500 uppercase tracking-widest">Interview Prep</span>
                    </div>
                    <h3 className="text-xl font-black mb-4" style={{ color: "var(--text-1)" }}>Predicted Questions</h3>
                    <p className="text-base mb-8" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>AI predicts questions from your specific resume with coaching tips.</p>
                    <div className="flex flex-col gap-4">
                      {["Tell me about your experience with React and TypeScript.", "Describe a project where you improved performance.", "How do you handle competing priorities?"].map((q, i) => (
                        <div key={i} className="rounded-2xl flex gap-4 items-start" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                          <span className="w-7 h-7 rounded-full bg-violet-600/15 text-violet-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-base" style={{ color: "var(--text-2)", lineHeight: "1.75" }}>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── FAQ ── */}
            <div className="max-w-3xl mx-auto w-full">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">FAQ</p>
                <h2 className="text-3xl font-black" style={{ color: "var(--text-1)" }}>Questions answered</h2>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { q: "What file formats are supported?", a: "PDF, DOCX, and TXT. You can also paste resume text directly. PDF parsing uses pdf.js client-side, DOCX uses mammoth.js — no data sent to third-party file services.", icon: FileText },
                  { q: "Is my resume data private?", a: "Yes. Resume text is only sent to our API routes and to the AI model for suggestions. Nothing is stored in a database — all data lives in your browser session only.", icon: Shield },
                  { q: "How is the ATS score calculated?", a: "Weighted composite: contact info presence (25%), section structure (20%), formatting cleanliness (20%), keyword coverage (25%), and resume length (10%).", icon: BarChart3 },
                  { q: "Can I use this for any industry?", a: "Yes. Sturdy AI auto-detects your industry (Tech, Finance, Healthcare, Marketing) and benchmarks against industry-specific keyword databases.", icon: Target },
                  { q: "Do I need to sign in?", a: "Google sign-in is required to access the full dashboard. Authentication uses NextAuth.js — no passwords stored.", icon: CheckCircle },
                ].map(({ q, a, icon: Icon }) => (
                  <div key={q} className="card flex gap-6 items-start hover:border-[var(--border-md)] transition-all duration-200" style={{ padding: "28px 32px" }}>
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="font-bold text-base mb-3" style={{ color: "var(--text-1)" }}>{q}</p>
                      <p className="text-base" style={{ color: "var(--text-2)", lineHeight: "1.85" }}>{a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="max-w-2xl mx-auto w-full pb-8">
              <div className="card px-12 py-14 text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 70%)" }} />
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center">
                    <Brain size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-3" style={{ color: "var(--text-1)" }}>Ready to get hired faster?</h3>
                    <p className="text-base leading-7 max-w-sm mx-auto" style={{ color: "var(--text-2)" }}>Join thousands of job seekers who used Sturdy AI to land interviews at top companies.</p>
                  </div>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base"
                  >
                    <Sparkles size={17} />
                    Get Started Free
                  </button>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>No credit card &middot; No password &middot; Google sign-in only</p>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <footer className="border-t pt-6 pb-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: "var(--text-3)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
                    <Brain size={11} className="text-white" />
                  </div>
                  <span className="font-semibold" style={{ color: "var(--text-2)" }}>Sturdy AI</span>
                  <span>— Resume Analyzer & Optimizer</span>
                </div>
                <span>Built with Next.js · Gemini AI · NextAuth · © {new Date().getFullYear()}</span>
              </div>
            </footer>
          </div>

        ) : (
          /* ── Results Dashboard ── */
          <div className="space-y-5 fade-up">
            {/* Top bar */}
            <div className={`card flex flex-wrap items-center justify-between gap-4 px-5 py-4`}>
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-violet-500" />
                  <h2 className="font-bold" style={{ color: "var(--text-1)" }}>{filename}</h2>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1 ml-6" style={{ color: "var(--text-3)" }}>
                  {result.industry && <span className="card2 px-2 py-0.5 rounded-full capitalize" style={{ color: "var(--text-2)" }}>{result.industry}</span>}
                  {result.experienceLevel && <span className="card2 px-2 py-0.5 rounded-full" style={{ color: "var(--text-2)" }}>{result.experienceLevel}</span>}
                  <span>{result.parsed.rawText.split(/\s+/).length} words</span>
                </div>
              </div>
              <ExportOptions result={result} filename={filename} />
            </div>

            {/* Tabs */}
            <div className="card overflow-x-auto">
              <nav className="flex min-w-max px-2">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab === id ? "tab-active" : ""
                      }`}
                    style={{ color: tab === id ? "var(--text-1)" : "var(--text-3)" }}
                  >
                    <Icon size={13} />
                    {label}
                    {id === "jobmatch" && result.jobMatch && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${result.jobMatch.matchPercentage >= 70 ? "bg-emerald-500/15 text-emerald-500" :
                        result.jobMatch.matchPercentage >= 50 ? "bg-amber-500/15 text-amber-500" :
                          "bg-red-500/15 text-red-500"
                        }`}>
                        {result.jobMatch.matchPercentage}%
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 dashboard-content">

              {tab === "dashboard" && (
                <>
                  <div className="lg:col-span-1 space-y-4">
                    <div className="card p-6 flex flex-col items-center gap-4">
                      <ScoreRing score={result.overallScore} />
                      {isLoggedIn && (
                        <div className="flex items-center gap-2 text-xs border-t pt-3 w-full justify-center" style={{ borderColor: "var(--border)", color: "var(--text-2)" }}>
                          {session.user?.image && <Image src={session.user.image} alt="" width={16} height={16} className="rounded-full" />}
                          <span className="truncate max-w-[160px]">{session.user?.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: result.parsed.experience.length, label: "Roles", hex: "#7c3aed" },
                        { val: result.parsed.skills.length, label: "Skills", hex: "#3b82f6" },
                        { val: result.parsed.education.length, label: "Education", hex: "#10b981" },
                        { val: result.keywordScore.foundKeywords.length, label: "Keywords", hex: "#f59e0b" },
                      ].map(({ val, label, hex }) => (
                        <div key={label} className="card p-4 text-center hover:border-[var(--border-md)] transition-colors">
                          <div className="text-2xl font-black tabular-nums mb-0.5" style={{ color: hex, fontFamily: "var(--font-heading)" }}>{val}</div>
                          <div className="text-xs font-medium" style={{ color: "var(--text-3)" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <ScoreCard title="ATS Compatibility" score={result.atsScore.score} icon={Shield} color="text-emerald-500" issues={result.atsScore.issues} compact />
                      <ScoreCard title="Content Quality" score={result.contentScore.score} icon={TrendingUp} color="text-blue-500" issues={result.contentScore.issues} compact />
                      <ScoreCard title="Keywords & Skills" score={result.keywordScore.score} icon={Zap} color="text-amber-500" issues={result.keywordScore.issues} compact />
                      <ScoreCard title="Format & Structure" score={result.formatScore.score} icon={Settings} color="text-purple-500" issues={result.formatScore.issues} compact />
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <RecommendationPanel result={result} onOptimizeBullets={() => setShowBulletOptimizer(true)} />
                    {result.keywordScore.missingKeywords.length > 0 && (
                      <div className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            Missing Keywords
                          </p>
                          <button onClick={() => setTab("skills")} className="text-xs text-violet-500 flex items-center gap-1 hover:underline">
                            View all <ChevronRight size={11} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.keywordScore.missingKeywords.slice(0, 12).map((kw) => (
                            <span key={kw} className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {tab === "skills" && (
                <div className="lg:col-span-3">
                  <SkillMap skills={result.skills} missingKeywords={result.keywordScore.missingKeywords} />
                </div>
              )}

              {tab === "jobmatch" && (
                <div className="lg:col-span-3 max-w-2xl mx-auto w-full">
                  <div className="card" style={{ padding: "36px 40px" }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Target size={18} className="text-blue-500" />
                      </div>
                      <h3 className="font-bold text-lg" style={{ color: "var(--text-1)" }}>Job Description Matching</h3>
                    </div>
                    <JobDescriptionInput onMatch={handleJobMatch} matchResult={result.jobMatch} loading={jobMatchLoading} />
                  </div>
                </div>
              )}

              {tab === "ai" && (
                <div className="lg:col-span-3 max-w-2xl mx-auto w-full space-y-4">
                  {result.aiSuggestions && result.aiSuggestions.length > 0 ? (
                    <div className="card p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain size={16} className="text-violet-500" />
                        <h3 className="font-bold" style={{ color: "var(--text-1)" }}>AI Recommendations</h3>
                        <span className="ml-auto text-xs bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded-full pulse-dot">Live</span>
                      </div>
                      <ul className="space-y-2">
                        {result.aiSuggestions.map((s, i) => (
                          <li key={i} className="card2 flex gap-3 text-sm p-4">
                            <span className="w-6 h-6 rounded-full bg-violet-600/15 text-violet-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <span style={{ color: "var(--text-2)" }}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="card p-10 text-center">
                      <Brain size={36} className="mx-auto mb-3" style={{ color: "var(--text-3)" }} />
                      <p className="font-medium" style={{ color: "var(--text-2)" }}>No AI suggestions yet</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Re-analyze your resume to get AI insights</p>
                    </div>
                  )}
                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={15} className="text-amber-500" />
                      <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Bullet Point Optimizer</p>
                    </div>
                    <p className="text-sm mb-4 ml-6" style={{ color: "var(--text-2)" }}>
                      {result.parsed.experience.flatMap((e) => e.bullets).length} bullets detected. AI rewrites with action verbs and metrics.
                    </p>
                    <button
                      onClick={() => setShowBulletOptimizer(true)}
                      className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Zap size={14} /> Optimize Bullets with AI
                    </button>
                  </div>
                </div>
              )}

              {tab === "coverletter" && (
                <div className="lg:col-span-3 max-w-2xl mx-auto w-full">
                  <div className="card" style={{ padding: "36px 40px" }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                        <FileText size={18} className="text-rose-500" />
                      </div>
                      <h3 className="font-bold text-lg" style={{ color: "var(--text-1)" }}>AI Cover Letter Generator</h3>
                    </div>
                    <CoverLetterGenerator resumeText={resumeText} />
                  </div>
                </div>
              )}

              {tab === "interview" && (
                <div className="lg:col-span-3 max-w-2xl mx-auto w-full">
                  <div className="card" style={{ padding: "36px 40px" }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                        <MessageSquare size={18} className="text-purple-500" />
                      </div>
                      <h3 className="font-bold text-lg" style={{ color: "var(--text-1)" }}>Interview Preparation</h3>
                    </div>
                    <InterviewPrep questions={result.interviewQuestions || []} experienceLevel={result.experienceLevel} industry={result.industry} />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* ── Google Login Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card w-full max-w-sm p-8" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Brain size={15} className="text-white" />
                </div>
                <span className="font-bold" style={{ color: "var(--text-1)" }}>Sturdy AI</span>
              </div>
              <button onClick={() => { setShowLoginModal(false); setPendingUpload(null); }} style={{ color: "var(--text-3)" }}>
                <X size={17} />
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-black mb-1" style={{ color: "var(--text-1)" }}>One last step</h2>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                {pendingUpload ? "Your resume is ready — sign in to launch the analysis." : "Sign in to access your AI-powered dashboard."}
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 ${B}`}
              style={{ background: "var(--bg-card2)", color: "var(--text-1)" }}
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

            <p className="text-xs text-center mt-4" style={{ color: "var(--text-3)" }}>Your data is private and never shared.</p>
          </div>
        </div>
      )}

      {/* ── Bullet Optimizer Modal ── */}
      {showBulletOptimizer && result && (
        <BulletOptimizer
          bullets={result.parsed.experience.flatMap((e) => e.bullets).filter(Boolean)}
          jobTitle={result.parsed.experience[0]?.title}
          onClose={() => setShowBulletOptimizer(false)}
        />
      )}
    </div>
  );
}
