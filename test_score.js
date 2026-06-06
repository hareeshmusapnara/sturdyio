const fs = require('fs');

const ACTION_VERBS = [
  "achieved","built","created","delivered","designed","developed","drove",
  "engineered","established","executed","generated","implemented","improved",
  "increased","launched","led","managed","optimized","produced","reduced",
  "scaled","streamlined","transformed","architected","automated","deployed",
  "enhanced","mentored","spearheaded","supervised","trained","collaborated",
];

const WEAK_PHRASES = [
  "responsible for","worked on","helped with","assisted with",
  "was part of","involved in","participated in","was responsible",
];

const WEAK_MAP = [
  [/\bresponsible for (managing|leading|handling|running|overseeing)\b/gi, "Led"],
  [/\bwas responsible for\b/gi, "Owned"],
  [/\bresponsible for\b/gi,     "Drove"],
  [/\bworked on\b/gi,           "Developed"],
  [/\bhelped to\b/gi,           "Enabled"],
  [/\bhelped with\b/gi,         "Accelerated"],
  [/\bhelped\b/gi,              "Supported"],
  [/\bassisted with\b/gi,       "Facilitated"],
  [/\bassisted in\b/gi,         "Contributed to"],
  [/\bassisted\b/gi,            "Supported"],
  [/\bwas involved in\b/gi,     "Drove"],
  [/\bwas part of\b/gi,         "Collaborated on"],
  [/\bworked with\b/gi,         "Partnered with"],
  [/\bwas tasked with\b/gi,     "Delivered"],
];

const VERB_UPGRADES = [
  ["created","engineered"],["made","built"],["fixed","resolved"],
  ["changed","optimized"],["used","leveraged"],["handled","managed"],
  ["wrote","authored"],["ran","directed"],["maintained","optimized"],
  ["tested","validated"],["updated","modernized"],["developed","engineered"],
];

const METRICS = [
  " by 30%"," by 25%"," across 3+ teams"," saving 8+ hours/week",
  " by 40%"," for 5+ stakeholders"," reducing errors by 35%"," within 2 sprints",
  " improving delivery by 20%"," cutting costs by 15%",
];

function scoreContent(text, jobDescription = "") {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 10);

  const contentLines = lines.filter(l =>
    !/^[A-Z][A-Z\s]{3,}$/.test(l) &&
    !l.includes("@") && !l.includes("|") &&
    !/^\+?\d[\d\s\-()]{5,}$/.test(l) &&
    !(/^\d{4}/.test(l) && l.length < 20)
  );

  if (contentLines.length === 0) return { overall: 50, actionVerb: 0, quant: 0, weak: 0, kw: 50 };

  const withVerb = contentLines.filter(l =>
    ACTION_VERBS.some(v => l.replace(/^[•\-*]\s*/, "").toLowerCase().startsWith(v))
  );
  const actionVerb = Math.round((withVerb.length / contentLines.length) * 100);

  const withNum = contentLines.filter(l => /\d/.test(l));
  const quant   = Math.round((withNum.length / contentLines.length) * 100);

  const lowerText = text.toLowerCase();
  const weak      = WEAK_PHRASES.filter(w => lowerText.includes(w)).length;
  const weakScore = Math.max(0, 100 - weak * 12);

  let kw = 50;
  if (jobDescription.trim()) {
    const stop = new Set(["the","and","for","are","with","you","will","this","that",
      "have","from","they","been","has","but","not","all","were","when","your"]);
    const jdWords = [...new Set(
      jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stop.has(w))
    )];
    const found = jdWords.filter(k => lowerText.includes(k));
    kw = jdWords.length
      ? Math.min(100, Math.round((found.length / Math.min(jdWords.length, 25)) * 100))
      : 50;
  }

  const overall = Math.round(
    actionVerb * 0.35 +
    quant      * 0.30 +
    weakScore  * 0.20 +
    kw         * 0.15
  );

  return { overall, actionVerb, quant, weak, kw };
}

function isProtected(line) {
  const t = line.trim();
  if (!t || t.length < 6) return true;
  if (/^[A-Z][A-Z\s]{3,}$/.test(t) && t.length < 42) return true;
  if (line.includes("@") || line.includes("|")) return true;
  if (/linkedin\.com|github\.com/i.test(line)) return true;
  if (/^\+?\d[\d\s\-().]{5,}$/.test(t)) return true;
  if (/^\d{4}/.test(t) && t.length < 20) return true;
  return false;
}

function rewriteOneLine(line, idx, jdKeywords) {
  if (isProtected(line)) return line;

  let result = line;

  for (const [re, rep] of WEAK_MAP) {
    result = result.replace(re, rep);
  }

  const pfx  = result.match(/^(\s*[•\-*›▪▸]\s*)/)?.[1] ?? "";
  let   body = result.slice(pfx.length);

  for (const [weak, strong] of VERB_UPGRADES) {
    if (new RegExp(`^${weak}\\b`, "i").test(body)) {
      const rest = body.slice(weak.length);
      body = `${strong} ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`.trimEnd();
      break;
    }
  }

  if (/^(responsible|worked|helped|assisted|involved|was|been|did)\b/i.test(body)) {
    const verb    = ACTION_VERBS[idx % ACTION_VERBS.length];
    const cleaned = body
      .replace(/^(responsible for|worked on|helped\s*(with|to)?|assisted\s*(with|in)?|was part of|involved in|was\b|been\b|did\b)\s*/i, "")
      .trim();
    body = `${verb} ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`.trimEnd();
  }

  result = pfx ? `${pfx}${body}` : body;

  if (!/\d/.test(result) && result.trim().length > 20) {
    result = result.trimEnd() + METRICS[idx % METRICS.length];
  }

  const lower = result.toLowerCase();
  const kw    = jdKeywords.find(k => k.length > 4 && !lower.includes(k));
  if (kw && result.trim().length > 30 && result.trim().length < 180) {
    if (ACTION_VERBS.some(v => lower.replace(/^[•\-*]\s*/, "").startsWith(v))) {
      result = result.trimEnd() + `, leveraging ${kw}`;
    }
  }

  return result;
}

function splitIntoBullets(line) {
  const t = line.trim();
  if (isProtected(line) || t.length < 40) return [line];
  const sentences = t
    .replace(/^[•\-*›▪▸]\s*/, "")
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length <= 1) return [line];
  return sentences.map(s => {
    const clean = s.replace(/\.\s*$/, "").trim();
    return `• ${clean}`;
  });
}

function rewriteResume(resumeText, jobDescription) {
  const stop = new Set(["the","and","for","are","with","you","will","this","that",
    "have","from","they","been","has","their","but","not","all","were","when","your",
    "must","should","team","work","role","position","company","strong","good"]);

  const jdKeywords = [...new Set(
    jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stop.has(w))
  )].slice(0, 15);

  let idx = 0;
  const outputLines = [];

  for (const line of resumeText.split("\n")) {
    if (isProtected(line)) {
      outputLines.push(line);
      continue;
    }
    const bullets = splitIntoBullets(line);
    for (const bullet of bullets) {
      const rw = rewriteOneLine(bullet, idx, jdKeywords);
      outputLines.push(rw);
      idx++;
    }
  }

  return outputLines.join("\n");
}

const resume = `John Doe
Software Engineer
john@example.com | 123-456-7890 | linkedin.com/in/johndoe

SUMMARY
Experienced React Developer with 5 years of experience building web applications.

EXPERIENCE
Software Developer at Acme Corp (2021 - Present)
• Responsible for building front-end components.
• Worked on typescript optimization.
• Helped with team deployment using docker.
• Assisted with database migration to PostgreSQL.

EDUCATION
BS in Computer Science, State University (2017 - 2021)
`;

const jd = "We are looking for a Senior React Developer with experience in TypeScript, Docker, PostgreSQL, AWS, and Next.js. Must have strong leadership skills.";

const before = scoreContent(resume, jd);
const optimized = rewriteResume(resume, jd);
const after = scoreContent(optimized, jd);

console.log("BEFORE:", before);
console.log("\nOPTIMIZED RESUME:\n", optimized);
console.log("\nAFTER:", after);
