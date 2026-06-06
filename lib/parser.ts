import type { ParsedResume, ExperienceItem, EducationItem } from "./types";

export function parseResumeText(text: string): ParsedResume {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
  const phone = text.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/)?.[0];
  const linkedin = text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0];
  const github = text.match(/github\.com\/[\w-]+/i)?.[0];

  const name = extractName(lines, email);
  const location = extractLocation(text);
  const summary = extractSection(text, ["summary", "objective", "profile", "about"]);
  const experience = extractExperience(text);
  const education = extractEducation(text);
  const skills = extractSkills(text);
  const certifications = extractCertifications(text);
  const sections = detectSections(lines);

  return {
    rawText: text,
    name,
    email,
    phone,
    location,
    linkedin,
    github,
    summary,
    experience,
    education,
    skills,
    certifications,
    sections,
  };
}

function extractName(lines: string[], email?: string): string | undefined {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!line.includes("@") && !line.match(/\d{3}/) && line.length < 50 && line.length > 3) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        if (words.every((w) => /^[A-Z][a-zA-Z'-]+$/.test(w) || /^[A-Z]+$/.test(w))) {
          return line;
        }
      }
    }
  }
  return undefined;
}

function extractLocation(text: string): string | undefined {
  const match = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(\s+\d{5})?)/);
  return match?.[0];
}

function extractSection(text: string, headings: string[]): string | undefined {
  const pattern = new RegExp(
    `(${headings.join("|")})\\s*[:\\n]([\\s\\S]{10,500}?)(?=\\n[A-Z][A-Z\\s]{3,}\\n|$)`,
    "i"
  );
  return text.match(pattern)?.[2]?.trim();
}

function extractExperience(text: string): ExperienceItem[] {
  const expSection = extractSection(text, ["experience", "work history", "employment", "work experience"]);
  if (!expSection) return [];

  const items: ExperienceItem[] = [];
  const blocks = expSection.split(/\n(?=[A-Z])/);

  for (const block of blocks) {
    const blines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (blines.length < 2) continue;
    const bullets = blines
      .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*") || /^\d+\./.test(l))
      .map((l) => l.replace(/^[•\-*\d.]\s*/, "").trim());
    const duration = blines.find((l) =>
      /\d{4}/.test(l) && /(present|current|\d{4})/i.test(l)
    );
    items.push({
      title: blines[0],
      company: blines[1],
      duration,
      bullets: bullets.length ? bullets : blines.slice(2),
    });
  }
  return items;
}

function extractEducation(text: string): EducationItem[] {
  const eduSection = extractSection(text, ["education", "academic", "qualifications"]);
  if (!eduSection) return [];

  const items: EducationItem[] = [];
  const blocks = eduSection.split(/\n(?=[A-Z])/);

  for (const block of blocks) {
    const blines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!blines.length) continue;
    const year = blines.find((l) => /\d{4}/.test(l));
    const gpa = blines.find((l) => /gpa|grade/i.test(l));
    items.push({
      degree: blines[0],
      institution: blines[1],
      year,
      gpa,
    });
  }
  return items;
}

function extractSkills(text: string): string[] {
  const skillSection = extractSection(text, [
    "skills", "technical skills", "core competencies", "technologies",
    "proficiencies", "expertise", "tools", "stack", "languages"
  ]);

  // If we found a dedicated skills section, parse it carefully
  if (skillSection) {
    // Split by common delimiters: comma, pipe, bullet, newline, semicolon
    const tokens = skillSection
      .split(/[,|•\n;\t]+/)
      .map((s) => s.replace(/^[-*·▪➢➤>\s]+/, "").trim())
      .filter((s) => s.length > 1 && s.length < 50);
    if (tokens.length > 3) {
      return [...new Set(tokens)].slice(0, 80);
    }
  }

  // Fallback: extract from full text using known skill patterns
  const stopwords = new Set([
    "and","or","the","with","for","in","of","to","a","an","is","are","was",
    "were","at","by","on","as","that","this","from","have","has","had",
    "be","been","will","would","could","should","may","might","use","used",
    "using","work","worked","working","experience","years","year","also",
    "including","such","well","ability","strong","good","excellent","various"
  ]);

  const chunk = text.replace(/\n/g, " ");
  const found = chunk.match(/\b[A-Za-z][A-Za-z0-9#+.\-/+]{1,30}\b/g) || [];
  return [...new Set(
    found.filter((w) => !stopwords.has(w.toLowerCase()) && w.length > 2)
  )].slice(0, 80);
}

function extractCertifications(text: string): string[] {
  const certSection = extractSection(text, ["certifications", "certificates", "credentials", "licenses"]);
  if (!certSection) return [];
  return certSection.split("\n").map((l) => l.trim()).filter((l) => l.length > 5);
}

function detectSections(lines: string[]): string[] {
  const sectionHeaders = [
    "summary", "objective", "experience", "education", "skills", "certifications",
    "projects", "awards", "publications", "volunteer", "languages", "interests", "references"
  ];
  return lines.filter((l) =>
    sectionHeaders.some((s) => l.toLowerCase().includes(s)) && l.length < 40
  );
}
