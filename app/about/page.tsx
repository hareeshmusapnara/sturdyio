import type { Metadata } from "next";
import Link from "next/link";
import { Brain, Target, Zap, Shield, FileText, MessageSquare, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "About Sturdy AI - Resume Analyzer & ATS Optimizer",
  description: "Learn about Sturdy AI and our mission to help job seekers pass ATS systems and land more interviews.",
};

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text-1)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>

        <Link href="/" style={{ color: "#7c3aed", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← Back to Home
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={20} color="#fff" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>About Sturdy AI</h1>
        </div>
        <p style={{ fontSize: 18, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 48 }}>
          Free AI-powered resume analysis to help you land more interviews.
        </p>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Our Mission</h2>
          <div className="card" style={{ padding: 28 }}>
            <p style={{ color: "var(--text-2)", lineHeight: 1.8, margin: 0, fontSize: 16 }}>
              Sturdy AI is a free AI-powered resume analyzer built to help job seekers pass applicant tracking systems (ATS) and land more interviews. We believe your resume shouldn't be rejected by robots. Our tool helps you understand exactly what ATS systems are looking for — and how to fix your resume so it gets through to human recruiters.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Who We Are</h2>
          <div className="card" style={{ padding: 28 }}>
            <p style={{ color: "var(--text-2)", lineHeight: 1.8, margin: 0, fontSize: 16 }}>
              Built by a Full-Stack Developer passionate about helping students and job seekers in India get better opportunities. I've seen too many talented people struggle because their resumes didn't pass ATS filters — not because they weren't qualified, but because of formatting, missing keywords, or weak bullet points. So I built Sturdy AI to fix that.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Why We Built This</h2>
          <div className="card" style={{ padding: 28 }}>
            <p style={{ color: "var(--text-2)", lineHeight: 1.8, marginBottom: 16, fontSize: 16 }}>
              Over 75% of resumes are automatically rejected before a human ever reads them. ATS systems filter candidates based on keywords, formatting, and structure — rules that most job seekers don't know about.
            </p>
            <p style={{ color: "var(--text-2)", lineHeight: 1.8, margin: 0, fontSize: 16 }}>
              Sturdy AI gives everyone access to the same insights that expensive career coaches provide — completely free. Upload your resume, get an instant ATS score, find keyword gaps, and optimize your bullet points with AI in under 30 seconds.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Our Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { icon: Shield, label: "ATS Compatibility Score", desc: "0–100 score with specific fixes for formatting issues.", color: "#10b981" },
              { icon: Brain, label: "AI Suggestions", desc: "5 personalized improvement tips powered by Gemini AI.", color: "#7c3aed" },
              { icon: Target, label: "Job Matching", desc: "Paste any job description and see your match %.", color: "#3b82f6" },
              { icon: Zap, label: "Bullet Optimizer", desc: "AI rewrites weak bullets with action verbs and metrics.", color: "#f59e0b" },
              { icon: FileText, label: "Cover Letter Generator", desc: "Tailored cover letters matched to any job description.", color: "#ef4444" },
              { icon: MessageSquare, label: "Interview Prep", desc: "Predicted interview questions from your resume.", color: "#8b5cf6" },
              { icon: Award, label: "Skill Mapping", desc: "Every skill extracted and categorized automatically.", color: "#06b6d4" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="card" style={{ padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon size={16} color={color} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "var(--text-1)" }}>{label}</p>
                <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            { href: "/", label: "Home" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/contact", label: "Contact Us" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: "#7c3aed", fontSize: 15, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
