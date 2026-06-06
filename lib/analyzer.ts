import type {
  ParsedResume, ATSScore, ContentScore, KeywordScore,
  FormatScore, SkillCategory, JobMatchResult
} from "./types";

const ACTION_VERBS = ["achieved","built","created","delivered","designed","developed","drove","engineered","established","executed","generated","implemented","improved","increased","launched","led","managed","optimized","produced","reduced","scaled","streamlined","transformed","architected","automated","collaborated","coordinated","deployed","enhanced","facilitated","grew","hired","influenced","integrated","mentored","negotiated","oversaw","pioneered","revamped","saved","shipped","spearheaded","supervised","trained"];

const WEAK_VERBS = ["responsible for", "worked on", "helped with", "assisted", "involved in", "participated in", "was part of"];

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  tech: ["agile","api","aws","azure","ci/cd","cloud","devops","docker","git","javascript","kubernetes","microservices","python","react","rest","sql","typescript","node.js","react.js","next.js","graphql","terraform","scrum"],
  finance: ["financial modeling","excel","bloomberg","risk management","valuation","portfolio","hedge fund","equity","derivatives","accounting","cfa","gaap","ifrs","budget","forecasting"],
  healthcare: ["hipaa","ehr","clinical","patient care","fda","icd","cpt","medical","nursing","diagnosis","treatment","healthcare","emr","patient","clinical trials"],
  marketing: ["seo","sem","google analytics","content marketing","social media","brand","campaign","conversion","roi","email marketing","ppc","cro","ab testing","hubspot","salesforce"],
  general: ["communication","leadership","teamwork","problem-solving","project management","analytical","strategic","cross-functional","stakeholder","data-driven"],
};

export function scoreATS(parsed: ParsedResume): ATSScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const hasEmail = !!parsed.email;
  const hasPhone = !!parsed.phone;
  const hasLinkedIn = !!parsed.linkedin;
  const noTables = !parsed.rawText.match(/\|\s*\w+\s*\|/);
  const noImages = true; // text-based
  const standardSections = parsed.sections.length >= 3;
  const cleanFormatting = !parsed.rawText.match(/[^\x00-\x7F]{5,}/);

  if (!hasEmail) { score -= 15; issues.push("Missing email address"); suggestions.push("Add a professional email address"); }
  if (!hasPhone) { score -= 10; issues.push("Missing phone number"); suggestions.push("Add your phone number"); }
  if (!hasLinkedIn) { score -= 5; suggestions.push("Add your LinkedIn profile URL"); }
  if (!noTables) { score -= 15; issues.push("Tables detected — ATS parsers often fail on tables"); suggestions.push("Replace tables with plain bullet-point lists"); }
  if (!standardSections) { score -= 10; issues.push("Few standard sections detected"); suggestions.push("Add clearly labeled sections: Experience, Education, Skills"); }
  if (!cleanFormatting) { score -= 10; issues.push("Special/non-ASCII characters detected"); suggestions.push("Remove special characters, symbols, and decorative elements"); }
  if (!parsed.name) { score -= 10; issues.push("Name not detected at top of resume"); suggestions.push("Place your full name prominently at the top"); }

  const wordCount = parsed.rawText.split(/\s+/).length;
  if (wordCount < 150) { score -= 10; issues.push("Resume appears too short"); suggestions.push("Expand resume to at least 400 words"); }

  return {
    score: Math.max(0, score),
    hasEmail, hasPhone, hasLinkedIn, noTables, noImages, standardSections, cleanFormatting,
    issues, suggestions,
  };
}

export function scoreContent(parsed: ParsedResume): ContentScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const text = parsed.rawText.toLowerCase();

  const allBullets = parsed.experience.flatMap((e) => e.bullets);
  const bulletsWithAction = allBullets.filter((b) =>
    ACTION_VERBS.some((v) => b.toLowerCase().startsWith(v))
  );
  const actionVerbScore = allBullets.length
    ? Math.round((bulletsWithAction.length / allBullets.length) * 100)
    : 50;

  const bulletsWithNumbers = allBullets.filter((b) => /\d+/.test(b));
  const quantificationScore = allBullets.length
    ? Math.round((bulletsWithNumbers.length / allBullets.length) * 100)
    : 30;

  const weakFound = WEAK_VERBS.filter((w) => text.includes(w));
  const accomplishmentScore = Math.max(0, 100 - weakFound.length * 20);

  const words = text.split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => { if (w.length > 4) wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const redundant = Object.entries(wordFreq).filter(([, c]) => c > 5).map(([w]) => w);
  const redundancyScore = Math.max(0, 100 - redundant.length * 10);

  if (actionVerbScore < 60) { issues.push("Too few strong action verbs"); suggestions.push("Start each bullet with a strong action verb (e.g., 'Engineered', 'Drove', 'Scaled')"); }
  if (quantificationScore < 40) { issues.push("Bullets lack measurable results"); suggestions.push("Add numbers and percentages to at least 50% of bullets"); }
  if (weakFound.length) { issues.push(`Weak phrases detected: ${weakFound.join(", ")}`); suggestions.push("Replace 'responsible for' and similar phrases with achievement-focused language"); }
  if (redundant.length > 3) { issues.push(`Redundant words: ${redundant.slice(0, 3).join(", ")}`); suggestions.push("Vary your language and remove repeated keywords"); }

  const score = Math.round((actionVerbScore * 0.35 + quantificationScore * 0.35 + accomplishmentScore * 0.2 + redundancyScore * 0.1));
  return { score, actionVerbScore, quantificationScore, accomplishmentScore, redundancyScore, issues, suggestions };
}

export function scoreKeywords(parsed: ParsedResume, industry = "general"): KeywordScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const text = parsed.rawText.toLowerCase();

  const industryKeys = [
    ...(INDUSTRY_KEYWORDS[industry] || []),
    ...INDUSTRY_KEYWORDS.general,
  ];

  const foundKeywords = industryKeys.filter((k) => text.includes(k.toLowerCase()));
  const missingKeywords = industryKeys.filter((k) => !text.includes(k.toLowerCase())).slice(0, 15);

  const words = text.split(/\s+/);
  const keywordDensity = words.length ? Math.round((foundKeywords.length / words.length) * 1000) / 10 : 0;

  const score = Math.min(100, Math.round((foundKeywords.length / Math.max(industryKeys.length, 1)) * 100));

  if (score < 50) { issues.push("Low keyword coverage for selected industry"); suggestions.push(`Add industry keywords such as: ${missingKeywords.slice(0, 5).join(", ")}`); }
  if (keywordDensity < 1) { suggestions.push("Increase keyword presence throughout the resume"); }

  return { score, foundKeywords, missingKeywords, keywordDensity, issues, suggestions };
}

export function scoreFormat(parsed: ParsedResume): FormatScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const wordCount = parsed.rawText.split(/\s+/).length;

  const lengthScore = wordCount < 200 ? 40 : wordCount < 400 ? 70 : wordCount < 800 ? 100 : wordCount < 1200 ? 85 : 60;
  const sectionScore = Math.min(100, parsed.sections.length * 20);

  const dates = parsed.rawText.match(/\d{1,2}\/\d{4}|\w+ \d{4}|\d{4}/g) || [];
  const consistencyScore = dates.length > 1 ? 80 : 60;

  if (wordCount < 300) { issues.push("Resume is too short"); suggestions.push("Aim for 400–700 words for mid-level roles"); }
  if (wordCount > 1200) { issues.push("Resume may be too long"); suggestions.push("Condense to 1–2 pages; remove outdated or irrelevant experience"); }
  if (parsed.sections.length < 3) { issues.push("Missing key sections"); suggestions.push("Ensure you have: Summary, Experience, Education, Skills"); }

  const score = Math.round((lengthScore * 0.4 + sectionScore * 0.4 + consistencyScore * 0.2));
  return { score, lengthScore, sectionScore, consistencyScore, issues, suggestions };
}

export function categorizeSkills(skills: string[]): SkillCategory {
  const technical = new Set<string>();
  const tools = new Set<string>();
  const languages = new Set<string>();
  const soft = new Set<string>();

  const techPattern = /javascript|typescript|python|java\b|kotlin|swift|go\b|golang|rust|ruby|php|scala|perl|r\b|matlab|c#|c\+\+|\bc\b|react|angular|vue|next|nuxt|svelte|node|express|django|flask|fastapi|spring|rails|laravel|html|css|scss|sass|sql|mysql|postgres|mongodb|redis|firebase|supabase|graphql|rest|api|aws|gcp|azure|cloud|docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|github|gitlab|bitbucket|git\b|linux|bash|shell|powershell|machine.learning|deep.learning|nlp|tensorflow|pytorch|keras|pandas|numpy|scikit|spark|hadoop|kafka|elasticsearch|blockchain|web3|solidity|android|ios|flutter|react.native|unity|unreal/i;

  const toolPattern = /jira|confluence|trello|asana|notion|slack|teams|zoom|figma|sketch|adobe|photoshop|illustrator|xd|invision|zeplin|excel|word|powerpoint|outlook|sharepoint|salesforce|hubspot|zendesk|intercom|tableau|powerbi|looker|dbt|airflow|datadog|grafana|splunk|postman|insomnia|swagger|vscode|intellij|eclipse|xcode|android.studio|vim|emacs|webpack|vite|babel|npm|yarn|pnpm|pip|conda|virtualenv|heroku|netlify|vercel|cloudflare|nginx|apache/i;

  const langPattern = /english|spanish|french|german|mandarin|chinese|japanese|arabic|portuguese|hindi|italian|korean|russian|dutch|swedish|norwegian|danish|finnish|turkish|polish|vietnamese|thai|indonesian|malay|tagalog|urdu|bengali|tamil|telugu/i;

  const softPattern = /leadership|communication|teamwork|collaboration|problem.solving|problem.solving|analytical|creative|adaptable|organized|detail.oriented|strategic|critical.thinking|decision.making|time.management|project.management|agile|scrum|kanban|presentation|negotiation|mentoring|coaching|conflict.resolution|emotional.intelligence|customer.service|stakeholder|cross.functional|multitasking|prioritization|planning|research|writing|public.speaking/i;

  for (const skill of skills) {
    const s = skill.trim();
    if (!s || s.length < 2) continue;

    if (langPattern.test(s)) {
      languages.add(s);
    } else if (softPattern.test(s)) {
      soft.add(s);
    } else if (techPattern.test(s)) {
      technical.add(s);
    } else if (toolPattern.test(s)) {
      tools.add(s);
    } else {
      // Smart fallback: short ALL-CAPS or CamelCase tokens → likely technical
      if (/^[A-Z][A-Z0-9.+#-]{1,15}$/.test(s) || /^[A-Z][a-z]+[A-Z]/.test(s)) {
        technical.add(s);
      } else if (s.split(" ").length >= 2) {
        // Multi-word → likely soft skill or tool
        soft.add(s);
      } else {
        // Single word fallback → technical
        technical.add(s);
      }
    }
  }

  return {
    technical: [...technical],
    tools: [...tools],
    languages: [...languages],
    soft: [...soft],
  };
}

export function matchJobDescription(parsed: ParsedResume, jobDescription: string): JobMatchResult {
  const resumeText = parsed.rawText.toLowerCase();
  const jdWords = jobDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const uniqueJDWords = [...new Set(jdWords)];

  const matchedKeywords = uniqueJDWords.filter((w) => resumeText.includes(w));
  const missingKeywords = uniqueJDWords.filter((w) => !resumeText.includes(w)).slice(0, 20);

  const matchPercentage = Math.round((matchedKeywords.length / Math.max(uniqueJDWords.length, 1)) * 100);

  const techJDWords = matchedKeywords.filter((w) => INDUSTRY_KEYWORDS.tech.includes(w));
  const technicalMatch = Math.min(100, Math.round((techJDWords.length / Math.max(5, 1)) * 100));

  const softJDWords = matchedKeywords.filter((w) => INDUSTRY_KEYWORDS.general.includes(w));
  const softSkillMatch = Math.min(100, Math.round((softJDWords.length / Math.max(3, 1)) * 100));

  const transferableSkills = parsed.skills.filter((s) =>
    !jobDescription.toLowerCase().includes(s.toLowerCase()) &&
    INDUSTRY_KEYWORDS.general.some((g) => s.toLowerCase().includes(g))
  ).slice(0, 5);

  const suggestions = [
    `Add these keywords from the job description: ${missingKeywords.slice(0, 5).join(", ")}`,
    matchPercentage < 50 ? "Significantly tailor your resume to better match this role" : "Good match — focus on adding missing technical keywords",
  ];

  return { matchPercentage, technicalMatch, softSkillMatch, matchedKeywords, missingKeywords, transferableSkills, suggestions };
}

export function detectIndustry(text: string): string {
  const lower = text.toLowerCase();
  const counts: Record<string, number> = {};
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    counts[industry] = keywords.filter((k) => lower.includes(k)).length;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || "general";
}

export function detectExperienceLevel(text: string, experience: ParsedResume["experience"]): string {
  const yearMatches = text.match(/(\d+)\+?\s*years?/gi) || [];
  const maxYears = yearMatches.reduce((max, m) => {
    const n = parseInt(m);
    return n > max ? n : max;
  }, 0);

  if (maxYears >= 10 || experience.length >= 5) return "Executive";
  if (maxYears >= 6 || experience.length >= 4) return "Senior";
  if (maxYears >= 3 || experience.length >= 2) return "Mid-Level";
  return "Entry-Level";
}
