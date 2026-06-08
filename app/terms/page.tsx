import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Sturdy AI",
  description: "Terms of Service for Sturdy AI — rules and guidelines for using our free resume analyzer.",
};

const sections = [
  {
    title: "1. Use License",
    content: "Sturdy AI is provided as-is for educational and personal career development purposes. You may use this service to analyze and improve your own resume. Redistribution or resale of the service or its outputs is not permitted without written permission.",
  },
  {
    title: "2. Disclaimer",
    content: "Sturdy AI provides resume analysis and suggestions based on common ATS patterns. ATS compatibility is not guaranteed. Results depend on the specific ATS systems used by individual employers, which may vary. Our scores and suggestions are advisory only.",
  },
  {
    title: "3. Limitations",
    content: null,
    bullets: [
      "Maximum 5MB file size per upload",
      "Free tier: 5 analyses per month",
      "No commercial use without written permission",
      "Service availability is not guaranteed and may be interrupted for maintenance",
    ],
  },
  {
    title: "4. User Responsibilities",
    content: "You are solely responsible for the content you upload. Do not upload:",
    bullets: [
      "Other people's personal data without consent",
      "Confidential or proprietary business information",
      "Illegal or harmful content of any kind",
    ],
  },
  {
    title: "5. Limitation of Liability",
    content: "Sturdy AI is not liable for job application results, hiring decisions made by employers, or any outcomes related to using our service. We provide tools and suggestions — the results of your job search depend on many factors beyond our control.",
  },
  {
    title: "6. Changes to Terms",
    content: "We may update these terms at any time without prior notice. Continued use of Sturdy AI after changes are posted means you accept the updated terms. We recommend checking this page periodically.",
  },
];

export default function TermsPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text-1)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>

        <Link href="/" style={{ color: "#7c3aed", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 48 }}>Last updated: June 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sections.map(({ title, content, bullets }) => (
            <section key={title}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--text-1)" }}>{title}</h2>
              <div className="card" style={{ padding: 24 }}>
                {content && (
                  <p style={{ color: "var(--text-2)", lineHeight: 1.8, margin: bullets ? "0 0 12px" : 0, fontSize: 16 }}>{content}</p>
                )}
                {bullets && (
                  <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {bullets.map((b) => (
                      <li key={b} style={{ color: "var(--text-2)", fontSize: 16, lineHeight: 1.7 }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32, marginTop: 48, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/contact", label: "Contact Us" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: "#7c3aed", fontSize: 15, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
