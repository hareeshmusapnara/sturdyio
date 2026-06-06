"use client";
import { User, Mail, Phone, MapPin, ExternalLink, Code2, Briefcase, GraduationCap, Award } from "lucide-react";
import type { ParsedResume } from "@/lib/types";

interface Props { parsed: ParsedResume; }

function Section({ icon: Icon, title, iconColor }: { icon: React.ElementType; title: string; iconColor: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} style={{ color: iconColor }} />
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{title}</p>
    </div>
  );
}

export default function ResumePreview({ parsed }: Props) {
  return (
    <div className="space-y-3 text-sm">

      {/* Contact */}
      <div className="card p-5">
        <Section icon={User} title="Contact Info" iconColor="#7c3aed" />
        <div className="space-y-2">
          {parsed.name && (
            <div className="flex items-center gap-2">
              <User size={13} style={{ color: "#7c3aed" }} className="shrink-0" />
              <span className="font-semibold" style={{ color: "var(--text-1)" }}>{parsed.name}</span>
            </div>
          )}
          {[
            { val: parsed.email,    Icon: Mail,         color: "#3b82f6" },
            { val: parsed.phone,    Icon: Phone,        color: "#10b981" },
            { val: parsed.location, Icon: MapPin,       color: "#f59e0b" },
            { val: parsed.linkedin, Icon: ExternalLink, color: "#3b82f6" },
            { val: parsed.github,   Icon: Code2,        color: "var(--text-3)" },
          ].filter(r => r.val).map(({ val, Icon: I, color }) => (
            <div key={val} className="flex items-center gap-2">
              <I size={13} style={{ color }} className="shrink-0" />
              <span style={{ color: "var(--text-2)" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      {parsed.experience.length > 0 && (
        <div className="card p-5">
          <Section icon={Briefcase} title={`Experience (${parsed.experience.length} roles)`} iconColor="#7c3aed" />
          <div className="space-y-4">
            {parsed.experience.slice(0, 3).map((exp, i) => (
              <div key={i} className="pl-3" style={{ borderLeft: "2px solid rgba(124,58,237,0.3)" }}>
                <p className="font-semibold" style={{ color: "var(--text-1)" }}>{exp.title || "Role"}</p>
                {exp.company  && <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{exp.company}</p>}
                {exp.duration && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{exp.duration}</p>}
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.slice(0, 2).map((b, j) => (
                      <li key={j} className="text-xs flex gap-1.5" style={{ color: "var(--text-2)" }}>
                        <span style={{ color: "var(--text-3)" }} className="shrink-0">•</span>
                        {b.slice(0, 120)}{b.length > 120 ? "..." : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {parsed.education.length > 0 && (
        <div className="card p-5">
          <Section icon={GraduationCap} title="Education" iconColor="#7c3aed" />
          <div className="space-y-3">
            {parsed.education.map((edu, i) => (
              <div key={i} className="pl-3" style={{ borderLeft: "2px solid rgba(124,58,237,0.3)" }}>
                <p className="font-semibold" style={{ color: "var(--text-1)" }}>{edu.degree || "Degree"}</p>
                {edu.institution && <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{edu.institution}</p>}
                {edu.year        && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{edu.year}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {parsed.certifications.length > 0 && (
        <div className="card p-5">
          <Section icon={Award} title="Certifications" iconColor="#7c3aed" />
          <ul className="space-y-1.5">
            {parsed.certifications.map((c, i) => (
              <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-2)" }}>
                <span style={{ color: "#7c3aed" }}>•</span>{c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
