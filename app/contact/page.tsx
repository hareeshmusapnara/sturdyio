import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Instagram, Twitter } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Sturdy AI",
  description: "Get in touch with the Sturdy AI team. We usually respond within 24–48 hours.",
};

export default function ContactPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text-1)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>

        <Link href="/" style={{ color: "#7c3aed", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Contact Us</h1>
        <p style={{ fontSize: 18, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 48 }}>
          Have a question, feedback, or just want to say hi? We'd love to hear from you.
        </p>

        {/* Email */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Email</h2>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#7c3aed20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={18} color="#7c3aed" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--text-1)", fontSize: 16 }}>harinhhdl143@gmail.com</p>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-3)", marginTop: 2 }}>We usually respond within 24–48 hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Social Media</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: Instagram, label: "Instagram", handle: "@sturdyai", href: "https://instagram.com/sturdyai", color: "#e1306c", svg: null },
              { icon: Twitter, label: "Twitter / X", handle: "@sturdyai", href: "https://twitter.com/sturdyai", color: "#1da1f2", svg: null },
              { icon: null, label: "LinkedIn", handle: "Sturdy AI", href: "https://linkedin.com/company/sturdyai", color: "#0a66c2", svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              ) },
            ].map(({ icon: Icon, label, handle, href, color, svg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {svg ?? <Icon size={18} color={color} />}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--text-1)", fontSize: 16 }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-3)", marginTop: 2 }}>{handle}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Response time note */}
        <div className="card" style={{ padding: 24, marginBottom: 48, borderLeft: "3px solid #7c3aed" }}>
          <p style={{ margin: 0, color: "var(--text-2)", fontSize: 15, lineHeight: 1.7 }}>
            ⏱ <strong style={{ color: "var(--text-1)" }}>Response Time:</strong> We usually respond within 24–48 hours on business days. For urgent issues, reach out via email.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ color: "#7c3aed", fontSize: 15, textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
