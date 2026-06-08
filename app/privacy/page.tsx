import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Sturdy AI",
  description: "Privacy Policy for Sturdy AI — learn how we handle your resume data and personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: "We collect resume files (PDF, DOCX, TXT) that you upload for analysis. Your Google account information (name, email, profile picture) is used for authentication only and is not shared with third parties.",
  },
  {
    title: "2. How We Use Your Data",
    content: null,
    bullets: [
      "Resume text is analyzed by our AI model to generate suggestions",
      "No resume data is stored in our database",
      "Data lives only in your browser session",
      "We don't sell or share your data with any third parties",
    ],
  },
  {
    title: "3. Data Security",
    content: "All data transmission is encrypted via HTTPS. Resumes are processed in real-time but never permanently stored on our servers. Your resume content is sent to our AI model for analysis and is not retained after the session ends.",
  },
  {
    title: "4. Third-Party Services",
    content: null,
    bullets: [
      "Google Authentication via NextAuth.js",
      "Google Gemini AI for resume suggestions",
      "Vercel for hosting and deployment",
      "Google AdSense for advertising",
    ],
  },
  {
    title: "5. Your Rights",
    content: "You can delete your data anytime. Simply don't upload any resumes or clear your browser data. Since we don't store resume content in a database, clearing your session removes all associated data.",
  },
  {
    title: "6. Contact Us",
    content: "If you have privacy questions, email us at: harinhhdl143@gmail.com",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text-1)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>

        <Link href="/" style={{ color: "#7c3aed", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 48 }}>Last updated: June 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sections.map(({ title, content, bullets }) => (
            <section key={title}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "var(--text-1)" }}>{title}</h2>
              <div className="card" style={{ padding: 24 }}>
                {content && (
                  <p style={{ color: "var(--text-2)", lineHeight: 1.8, margin: 0, fontSize: 16 }}>{content}</p>
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
