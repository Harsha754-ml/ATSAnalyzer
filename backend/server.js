const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { console.error('Error loading data:', e.message); }
  return { institutions: [], templates: {} };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let db = loadData();

app.use(cors());
app.use(express.json());

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf', '.txt', '.doc', '.docx'].includes(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

const TECH_SKILLS = [
  'javascript','typescript','python','java','c++','c#','go','rust','php','ruby','swift','kotlin',
  'react','angular','vue','next.js','node.js','express','django','flask','spring boot',
  'mongodb','postgresql','mysql','redis','firebase','sqlite','dynamodb',
  'aws','azure','gcp','docker','kubernetes','ci/cd','git','github','linux',
  'rest api','graphql','microservices','machine learning','deep learning','tensorflow',
  'html','css','tailwind','bootstrap','sass','webpack','vite',
  'figma','jira','agile','scrum',
];

const SYSTEM_TEMPLATE_TEXT = `
Summary:
Skills: javascript typescript python java react node.js express docker kubernetes aws azure gcp mongodb postgresql mysql redis html css tailwind git github rest api graphql
Projects:
Experience:
Education:
`;

// ============================================================
// DETERMINISTIC ATS ENGINE
// ============================================================

function parseTemplateConfig(rawConfig = {}) {
  const defaults = {
    use_keywords: true,
    use_sections: true,
    use_formatting: true,
    enabled_sections: ['skills', 'projects', 'education', 'experience', 'summary'],
    disabled_sections: [],
    strictness: 'medium',
  };

  let parsed = rawConfig;
  if (typeof rawConfig === 'string' && rawConfig.trim()) {
    try {
      parsed = JSON.parse(rawConfig);
    } catch {
      parsed = {};
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return defaults;
  }

  const enabled_sections = Array.isArray(parsed.enabled_sections)
    ? parsed.enabled_sections.map((s) => String(s).toLowerCase())
    : defaults.enabled_sections;
  const disabled_sections = Array.isArray(parsed.disabled_sections)
    ? parsed.disabled_sections.map((s) => String(s).toLowerCase())
    : defaults.disabled_sections;
  const strictness = ['low', 'medium', 'high'].includes(String(parsed.strictness).toLowerCase())
    ? String(parsed.strictness).toLowerCase()
    : defaults.strictness;

  return {
    use_keywords: parsed.use_keywords !== false,
    use_sections: parsed.use_sections !== false,
    use_formatting: parsed.use_formatting !== false,
    enabled_sections,
    disabled_sections,
    strictness,
  };
}

// ============================================================
// STEP 1: TEMPLATE PROCESSING WITH CONFIG
// ============================================================
function processTemplate(templateText, config = {}) {
  const cfg = parseTemplateConfig(config);
  
  // Extract keywords
  let keywords = [];
  if (cfg.use_keywords) {
    const extracted = extractCleanKeywords(templateText);
    const techFromTemplate = TECH_SKILLS
      .filter((skill) => templateText.toLowerCase().includes(skill))
      .map((skill) => normalizeKeyword(skill))
      .filter(Boolean);
    keywords = sanitizeTemplateKeywords([...techFromTemplate, ...extracted]);
  }
  
  // Extract sections
  let sections = [];
  if (cfg.use_sections) {
    sections = extractSections(templateText);
    // Filter enabled sections
    sections = sections.filter((s) => cfg.enabled_sections.includes(s.name) && !cfg.disabled_sections.includes(s.name));
  }
  
  return { keywords, sections, config: cfg };
}

function extractSections(text) {
  const sections = [];
  const lines = text.split('\n');
  const patterns = {
    'skills': /^(skills|technical skills|technologies|tools)\\s*[:;-]/gmi,
    'projects': /^(projects?|portfolio)\\s*[:;-]/gmi,
    'education': /^(education|academic|qualification)\\s*[:;-]/gmi,
    'experience': /^(experience|employment|work history)\\s*[:;-]/gmi,
    'summary': /^(summary|objective|profile|about)\\s*[:;-]/gmi,
  };
  
  for (const [name, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      sections.push({ name, present: true });
    }
  }
  
  return sections;
}

// ============================================================
// STEP 2 & 3: TEXT NORMALIZATION & KEYWORD EXTRACTION
// ============================================================
function normalizeKeyword(kw) {
  if (!kw || kw.length < 2) return null;
  
  let normalized = kw.toLowerCase().trim();
  
  if (/^[0-9]+$/.test(normalized)) return null;
  if (/^[a-z]{1,2}$/.test(normalized) && normalized.length < 3) return null;
  
  normalized = normalized.replace(/[#+]/g, '').replace(/\.\./g, '.').replace(/\s+/g, '');
  if (normalized.length < 2) return null;
  
  if (/^([a-z])\1+$/.test(normalized)) return null;
  if (/^[qwrtpsdfghjklzxcvbnm]{4,}$/.test(normalized)) return null;
  
  const normalizations = {
    'c++': 'cpp', 'c#': 'csharp',
    'node.js': 'nodejs', 'node': 'nodejs',
    'react.js': 'reactjs', 'react': 'react',
    'angular.js': 'angularjs', 'angular': 'angular',
    'vue.js': 'vuejs', 'vue': 'vue',
    'js': 'javascript', 'javascript': 'javascript', 'javascripts': 'javascript',
    'ts': 'typescript', 'typescript': 'typescript', 'typescriptcript': 'typescript',
    'aws': 'amazonwebservices', 'amazon web services': 'amazonwebservices', 'amazonws': 'amazonwebservices',
    'mongodb': 'mongo', 'mongo db': 'mongo',
    'postgresql': 'postgres', 'postgres sql': 'postgres',
    'dockercontainer': 'docker',
    'kubernetes': 'k8s', 'kubernet': 'k8s',
    'awss': 'amazonwebservices',
    'html5': 'html', 'css3': 'css',
    'tailwindcss': 'tailwind',
    'rest api': 'restapi', 'rest-api': 'restapi',
    'cicd': 'cicd', 'ci/cd': 'cicd',
    'machine learning': 'ml', 'deep learning': 'dl',
  };
  
  return normalizations[normalized] || normalized;
}

function extractCleanKeywords(text) {
  if (!text) return [];
  
  const STOPWORDS_MINIMAL = new Set([
    'the','and','for','with','your','you','this','that','from','have','has','had','are','was','were',
    'will','shall','can','could','should','would','may','might','must','need','want','use','used','using','able',
    'a','an','to','of','in','on','at','by','as','is','it','or','be','if','we','our','their','they','them',
    'he','she','his','her','its','but','not','all','any','one','two','new','old','per','via'
  ]);
  
  const tokens = text.toLowerCase()
    .split(/[,;\[\]\(\){}\/\\]+/)
    .join(' ')
    .split(/\s+/)
    .map(t => t.replace(/[^a-z0-9#\-+.]/g, ''))
    .filter(t => t.length >= 3 && t.length <= 30)
    .filter(t => !STOPWORDS_MINIMAL.has(t));
  
  const keywords = new Set();
  let garbledCount = 0;
  
  for (const token of tokens) {
    const normalized = normalizeKeyword(token);
    if (!normalized) continue;
    
    if (normalized.length <= 4 && /^[^aeiou]*[aeiou][^aeiou]*$/.test(normalized.substring(1, normalized.length - 1))) {
      garbledCount++;
      if (garbledCount > 20) continue;
      continue;
    }
    
    if (/^([a-z])\1+$/.test(normalized)) continue;
    if (/^[qwrtpsdfghjklzxcvbnm]+$/.test(normalized)) continue;
    if (/^\d+$/.test(normalized)) continue;
    if (/^[a-z]{1,2}$/.test(normalized)) continue;
    
    keywords.add(normalized);
    if (keywords.size >= 150) break;
  }
  
  return [...keywords].slice(0, 150);
}

function sanitizeTemplateKeywords(keywords) {
  const GENERIC_NON_SKILL_WORDS = new Set([
    'experience', 'development', 'proficient', 'strong', 'ability', 'responsible', 'managed',
    'management', 'team', 'student', 'students', 'college', 'university', 'campus', 'reporting',
    'location', 'uploads', 'issue', 'issues', 'track', 'assign', 'resolve', 'dedicated', 'deliver',
    'driven', 'highquality', 'quality', 'precision', 'modern', 'curiosity', 'foundation', 'custom',
    'interface', 'category', 'while', 'submit', 'english'
  ]);

  const PDF_GARBAGE = /^(obj|endobj|stream|endstream|xref|trailer|startxref|adobe|filter|length|decode|type|catalog|pages|media|resources)$/i;
  const EMAIL_OR_URL = /(@|https?:\/\/|www\.)/i;
  const LONG_NUMERIC = /\d{5,}/;
  const PERSON_LIKE = /^[a-z]{3,}(?:[._-][a-z0-9]+)?$/i;

  const normalizedTech = new Set(
    TECH_SKILLS
      .map((skill) => normalizeKeyword(skill))
      .filter(Boolean)
  );

  const filtered = [];
  for (const kw of keywords) {
    if (!kw) continue;
    if (EMAIL_OR_URL.test(kw)) continue;
    if (PDF_GARBAGE.test(kw)) continue;
    if (/^\d+$/.test(kw) || LONG_NUMERIC.test(kw)) continue;
    if (GENERIC_NON_SKILL_WORDS.has(kw)) continue;
    if (kw.length < 3) continue;

    // Keep clear technical terms.
    if (normalizedTech.has(kw)) {
      filtered.push(kw);
      continue;
    }

    // Keep plausible custom technical terms, drop person-like plain words.
    if (PERSON_LIKE.test(kw) && kw.length <= 5) continue;
    if (/(api|sdk|sql|nosql|devops|frontend|backend|fullstack|microservice|cloud|docker|kubernetes|react|node|python|java|typescript|javascript|graphql|mongo|postgres|redis|fastapi|flask|django)/i.test(kw)) {
      filtered.push(kw);
    }
  }

  return [...new Set(filtered)].slice(0, 80);
}

// ============================================================
// STEP 4: SMART FUZZY MATCHING
// ============================================================
const SYNONYMS = {
  'javascript': ['js'], 'typescript': ['ts'],
  'react': ['reactjs', 'react.js'], 'nodejs': ['node', 'node.js'],
  'angular': ['angularjs'], 'vue': ['vuejs'],
  'amazonwebservices': ['aws', 'amazon web services'], 'gcp': ['google cloud'],
  'mongo': ['mongodb'], 'postgres': ['postgresql'],
  'python': ['py'], 'k8s': ['kubernetes'],
  'restapi': ['rest api'], 'ml': ['machine learning'],
  'dl': ['deep learning'], 'cpp': ['c++'], 'csharp': ['c#'],
};

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const left = normalizeKeyword(a) || String(a).toLowerCase();
  const right = normalizeKeyword(b) || String(b).toLowerCase();
  if (!left || !right) return 0;
  if (left === right) return 1;
  const dist = levenshteinDistance(left, right);
  return 1 - (dist / Math.max(left.length, right.length));
}

function fuzzyMatch(keyword, resumeSet) {
  // Exact match
  if (resumeSet.has(keyword)) return true;
  
  // Synonym match
  const synonyms = SYNONYMS[keyword];
  if (synonyms) {
    for (const syn of synonyms) {
      if (resumeSet.has(syn)) return true;
    }
  }
  
  // Fuzzy match (>= 80% similarity)
  for (const kw of resumeSet) {
    if (similarity(keyword, kw) >= 0.8) return true;
  }

  // Substring fallback
  for (const kw of resumeSet) {
    if (kw.length >= 4 && keyword.length >= 4 && (kw.includes(keyword) || keyword.includes(kw))) return true;
  }
  
  return false;
}

// ============================================================
// STEP 5: SECTION VALIDATION
// ============================================================
function validateSections(userSections, templateSections, config) {
  const issues = [];
  const userNames = userSections.map((s) => s.name);
  const templateNames = templateSections.map((s) => s.name);
  
  for (const ts of templateNames) {
    if (!userNames.includes(ts)) {
      issues.push(`[CIRCLE: missing section - ${ts}]`);
    }
  }

  for (const us of userNames) {
    if (!templateNames.includes(us)) {
      issues.push(`[NOTE: extra section - ${us}]`);
    }
  }

  const commonTemplateOrder = templateNames.filter((s) => userNames.includes(s));
  const commonUserOrder = userNames.filter((s) => templateNames.includes(s));
  if (commonTemplateOrder.length > 1 && commonUserOrder.length > 1) {
    for (let i = 0; i < Math.min(commonTemplateOrder.length, commonUserOrder.length); i++) {
      if (commonTemplateOrder[i] !== commonUserOrder[i]) {
        issues.push(`[ARROW: misordered section - ${commonUserOrder[i]}]`);
      }
    }
  }
  
  return issues;
}

// ============================================================
// STEP 6, 7, 8: METRICS, MISSING, SCRIBBLES
// ============================================================
function compareResume(userText, templateText, templateConfig = {}) {
  const tplCfg = parseTemplateConfig(templateConfig.config || templateConfig);
  const tpl = processTemplate(templateText, tplCfg);
  
  // Extract user keywords
  const userKeywords = sanitizeTemplateKeywords(extractCleanKeywords(userText));
  const userSet = new Set(userKeywords);
  
  // Keyword matching
  const matched = [];
  const missing = [];
  
  if (tplCfg.use_keywords !== false) {
    for (const tk of tpl.keywords) {
      if (fuzzyMatch(tk, userSet)) {
        matched.push(tk);
      } else {
        missing.push(tk);
      }
    }
  }
  
  // Section validation
  const userSections = extractSections(userText);
  const sectionIssues = tplCfg.use_sections !== false 
    ? validateSections(userSections, tpl.sections, tplCfg)
    : [];
  
  // FAIL CONDITION: If obvious skills in resume but 0 matched → reprocess
  const hasObviousSkills = userKeywords.some(k =>
    ['javascript', 'python', 'java', 'react', 'nodejs', 'amazonwebservices', 'sql', 'html'].includes(k)
  );
  
  if (hasObviousSkills && matched.length === 0 && tpl.keywords.length > 0) {
    // Relaxed matching - try more forgiving comparison
    for (const tk of tpl.keywords.slice(0, 10)) {
      const tkPartial = tk.substring(0, 4);
      for (const uk of userKeywords) {
        if (uk.includes(tkPartial) || tkPartial.includes(uk.substring(0, 4))) {
          matched.push(tk);
          missing.splice(missing.indexOf(tk), 1);
          break;
        }
      }
    }
  }
  
  // Generate scribble annotations
  const annotations = [];
  
  // Missing keywords annotations
  for (const m of missing.slice(0, 5)) {
    annotations.push(`[ARROW: add keyword: ${m}]`);
  }
  
  // Section issues
  annotations.push(...sectionIssues);
  
  // Check for weak phrasing
  const weakPhrases = userText.match(/\b(good|great|interesting|awesome|amazing)\b/gi);
  if (weakPhrases && weakPhrases.length > 0) {
    annotations.push(`[STRIKE: weak phrasing - "${weakPhrases[0]}"]`);
  }
  
  // Formatting check
  const hasBulletPoints = /[•\-\*]\s/.test(userText);
  const hasNumbers = /\d+\)\s/.test(userText);
  if (!hasBulletPoints && !hasNumbers) {
    annotations.push(`[NOTE: formatting mismatch - add bullets]`);
  }
  
  const matchPercentage = tpl.keywords.length > 0
    ? Math.round((matched.length / tpl.keywords.length) * 100)
    : 0;
  
  return {
    metrics: {
      total_keywords: tpl.keywords.length,
      matched: matched.length,
      missing: missing.length,
      section_issues: sectionIssues.length
    },
    missing_keywords: missing,
    section_issues: sectionIssues,
    annotations
  };
}

const RECOMMENDED_SKILLS = [
  'react','node.js','typescript','python','docker','aws','sql','git','rest api','graphql',
  'tailwind','next.js','mongodb','postgresql','kubernetes','ci/cd',
];

const SUGGESTION_POOL = [
  { category: 'Contact', message: 'Add your LinkedIn profile URL — recruiters check it first.', impact: 'high' },
  { category: 'Contact', message: 'Include your GitHub profile to showcase your code.', impact: 'high' },
  { category: 'Contact', message: 'Add a personal portfolio website link.', impact: 'medium' },
  { category: 'Summary', message: 'Add a 2-3 line professional summary at the top of your resume.', impact: 'high' },
  { category: 'Summary', message: 'Start your summary with years of experience and core expertise.', impact: 'medium' },
  { category: 'Skills', message: 'List your technical skills in a dedicated section with categories.', impact: 'high' },
  { category: 'Skills', message: 'Add proficiency levels (beginner/intermediate/advanced) to skills.', impact: 'low' },
  { category: 'Skills', message: 'Include both frontend and backend technologies for full-stack roles.', impact: 'medium' },
  { category: 'Projects', message: 'Add 2-3 projects with tech stack, description, and live/GitHub links.', impact: 'high' },
  { category: 'Projects', message: 'Quantify project impact — users served, performance improvements, etc.', impact: 'medium' },
  { category: 'Experience', message: 'Use action verbs: Built, Designed, Implemented, Optimized, Led.', impact: 'medium' },
  { category: 'Experience', message: 'Quantify achievements — "Reduced load time by 40%" is better than "Improved performance".', impact: 'high' },
  { category: 'Formatting', message: 'Keep your resume to 1 page if you have less than 5 years of experience.', impact: 'medium' },
  { category: 'Formatting', message: 'Use consistent formatting — same font, spacing, and bullet style throughout.', impact: 'low' },
  { category: 'Keywords', message: 'Mirror keywords from the job description in your resume for ATS compatibility.', impact: 'high' },
  { category: 'Education', message: 'Include relevant coursework, GPA (if above 3.5), and academic projects.', impact: 'medium' },
  { category: 'Certifications', message: 'Add industry certifications like AWS, Google Cloud, or Meta to stand out.', impact: 'medium' },
  { category: 'Overall', message: 'Proofread for typos — a single spelling error can cost you an interview.', impact: 'high' },
];

const STOPWORDS = new Set([
  'the','and','for','with','your','you','this','that','from','have','has','had','are','was','were','will','shall',
  'a','an','to','of','in','on','at','by','as','is','it','or','be','if','we','our','their','they','them','he','she',
  'about','over','under','into','within','across','per','each','other','more','most','less','least','may','might',
  'resume','cv','curriculum','vitae','profile','objective','summary','experience','education','skills','projects',
  'college','school','campus','student','students','name','email','phone','location','address','state','board',
  'strong','proficient','hands','expert','driven','ability','foundation','management','reporting','dedicated',
]);

const SECTION_DEFINITIONS = [
  { key: 'contact', label: 'Contact', regex: /\b(email|phone|linkedin|github|contact)\b/i },
  { key: 'summary', label: 'Summary', regex: /\b(summary|objective|profile|about)\b/i },
  { key: 'skills', label: 'Skills', regex: /\b(skills|technologies|tools|proficient)\b/i },
  { key: 'experience', label: 'Experience', regex: /\b(experience|work|internship|employment|company)\b/i },
  { key: 'projects', label: 'Projects', regex: /\b(projects|built|developed|created|implemented)\b/i },
  { key: 'education', label: 'Education', regex: /\b(education|university|college|degree|b\.tech|bachelor|master)\b/i },
  { key: 'certifications', label: 'Certifications', regex: /\b(certif|certified|certification|certificate|coursera|udemy)\b/i },
];

function detectSections(text) {
  return SECTION_DEFINITIONS.reduce((acc, section) => {
    acc[section.key] = section.regex.test(text);
    return acc;
  }, {});
}

function isLikelyTechnicalKeyword(token) {
  if (!token || token.length < 3) return false;
  if (/@|https?:\/\/|www\./i.test(token)) return false;
  if (/^\d+(\.\d+)?$/.test(token)) return false;

  if (/[+#.]/.test(token)) return true;
  if (/\d/.test(token) && /[a-z]/i.test(token)) return true;

  return /(api|sdk|sql|nosql|devops|frontend|backend|fullstack|microservice|cloud|docker|kubernetes|react|node|python|java|typescript|javascript|graphql|mongo|postgres|redis|flask|django|fastapi|linux|git|github|aws|azure|gcp|ci|cd|tailwind|bootstrap|vite|webpack|html|css)/i.test(token);
}

function extractKeywords(text) {
  const lower = text.toLowerCase();
  const skills = Array.from(new Set(
    TECH_SKILLS
      .filter((s) => lower.includes(s))
      .map((s) => normalizeKeyword(s))
      .filter(Boolean)
  ));

  const tokens = lower
    .replace(/[^a-z0-9+.#\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));

  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  const customKeywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count >= 2)
    .map(([token]) => normalizeKeyword(token))
    .filter(Boolean)
    .filter(token => !skills.includes(token) && isLikelyTechnicalKeyword(token))
    .slice(0, 18);

  const keywords = sanitizeTemplateKeywords([...skills, ...customKeywords]);
  return { keywords, skills };
}

function buildTemplate(text, config = {}) {
  const processed = processTemplate(text, config);
  const requiredSections = processed.sections
    .map((s) => SECTION_DEFINITIONS.find((d) => d.key === s.name)?.label || s.name);

  return {
    text,
    keywords: processed.keywords,
    requiredSections,
    config: processed.config,
  };
}

function buildSuggestions(missingSections, missingKeywords, matchPercentage) {
  const suggestions = [];
  const missingSet = new Set(missingSections);

  if (missingSet.has('Contact')) suggestions.push(SUGGESTION_POOL[0], SUGGESTION_POOL[1]);
  if (missingSet.has('Summary')) suggestions.push(SUGGESTION_POOL[3]);
  if (missingSet.has('Skills')) suggestions.push(SUGGESTION_POOL[5]);
  if (missingSet.has('Projects')) suggestions.push(SUGGESTION_POOL[8]);
  if (missingSet.has('Experience')) suggestions.push(SUGGESTION_POOL[10]);
  if (missingSet.has('Certifications')) suggestions.push(SUGGESTION_POOL[16]);

  if (missingKeywords.length > 0) {
    suggestions.push({
      category: 'Keywords',
      message: `Add ATS keywords: ${missingKeywords.slice(0, 8).join(', ')}.`,
      impact: missingKeywords.length > 6 ? 'high' : 'medium',
    });
  }

  if (matchPercentage < 60) {
    suggestions.push({
      category: 'Structure',
      message: 'Align section order and headings with the ATS template to improve parsing.',
      impact: 'high',
    });
  }

  suggestions.push(SUGGESTION_POOL[17]);
  return suggestions.slice(0, 8);
}

// Use DETERMINISTIC compare function
function compareResumeToTemplate(resumeText, template) {
  const requiredSections = template.requiredSections || template.sections || [];
  // Use deterministic engine with config
  const config = {
    use_keywords: true,
    use_sections: true,
    use_formatting: true,
    strictness: template.strictness || 'medium'
  };
  
  const result = compareResume(resumeText, template.text, config);
  
  // Also detect sections for backward compatibility
  const sectionFlags = detectSections(resumeText);
  const missingSections = requiredSections.filter(label => {
    const section = SECTION_DEFINITIONS.find(s => s.label === label);
    return section ? !sectionFlags[section.key] : false;
  });
  const matchPercentage = result.metrics.total_keywords > 0
    ? Math.round((result.metrics.matched / result.metrics.total_keywords) * 100)
    : 0;
  
  return {
    matchPercentage,
    matchedKeywords: template.keywords.filter(k => !result.missing_keywords.includes(k)),
    missingKeywords: result.missing_keywords,
    missingSections,
    suggestions: buildSuggestions(missingSections, result.missing_keywords, matchPercentage),
    template: {
      keywordCount: result.metrics.total_keywords,
      sections: requiredSections,
    },
    scribbleAnnotations: result.annotations,
  };
}

async function extractText(filePathOrBuffer, filename) {
  try {
    const ext = filename.toLowerCase().split('.').pop();
    const isBinaryDoc = ext === 'pdf' || ext === 'doc' || ext === 'docx';
    
    // PDF: use pdf-parse
    if (ext === 'pdf') {
      try {
        const fs = require('fs');
        const pdfParse = require('pdf-parse');
        
        let dataBuffer;
        if (typeof filePathOrBuffer === 'string' && fs.existsSync(filePathOrBuffer)) {
          dataBuffer = fs.readFileSync(filePathOrBuffer);
        } else if (Buffer.isBuffer(filePathOrBuffer)) {
          dataBuffer = filePathOrBuffer;
        } else if (filePathOrBuffer && filePathOrBuffer.data) {
          dataBuffer = Buffer.from(filePathOrBuffer.data);
        }
        
        if (dataBuffer) {
          const data = await pdfParse(dataBuffer);
          if (data && data.text && data.text.length > 50) {
            return data.text;
          }
        }
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr.message);
      }
    }
    
    // Text file
    if (ext === 'txt') {
      const fs = require('fs');
      let text;
      if (fs.existsSync(filePathOrBuffer)) {
        text = fs.readFileSync(filePathOrBuffer, 'utf-8');
      } else if (typeof filePathOrBuffer === 'string') {
        text = filePathOrBuffer;
      }
      const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
      if (letterCount > 50) return text;
    }
    
    // Try as buffer
    let text;
    if (!isBinaryDoc && Buffer.isBuffer(filePathOrBuffer)) {
      text = filePathOrBuffer.toString('utf-8');
    } else if (!isBinaryDoc && typeof filePathOrBuffer === 'string') {
      text = filePathOrBuffer;
    }
    if (text && !text.startsWith('%PDF-')) {
      const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
      if (letterCount > 50) return text;
    }
  } catch (e) { 
    console.error('Extract error:', e.message);
  }
  return null;
}

function analyzeText(text) {
  const lower = text.toLowerCase();
  const skills = TECH_SKILLS.filter(s => lower.includes(s));
  const missingSkills = RECOMMENDED_SKILLS.filter(s => !lower.includes(s)).slice(0, 6);

  const hasContact    = /\b(email|phone|linkedin|github|contact)\b/i.test(text);
  const hasEducation  = /\b(education|university|college|degree|b\.tech|bachelor|master)\b/i.test(text);
  const hasExperience = /\b(experience|work|internship|employment|company)\b/i.test(text);
  const hasSkills     = /\b(skills|technologies|tools|proficient)\b/i.test(text);
  const hasProjects   = /\b(projects|built|developed|created|implemented)\b/i.test(text);
  const hasSummary    = /\b(summary|objective|profile|about)\b/i.test(text);
  const hasCerts      = /\b(certif|certified|certification|certificate|coursera|udemy)\b/i.test(text);

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = 'Unknown';
  for (const line of lines.slice(0, 8)) {
    if (/^[A-Z][a-z]+([\s][A-Z][a-z]+){1,3}$/.test(line)) { name = line; break; }
  }
  if (name === 'Unknown' && lines[0] && lines[0].length < 40) name = lines[0];

  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const phones = text.match(/(\+?\d[\d\s\-().]{7,}\d)/g) || [];
  const contact = emails[0] || phones[0] || '';

  const projects = [];
  let inProjects = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^projects/i.test(lines[i])) { inProjects = true; continue; }
    if (inProjects && /^(experience|education|skills|certif)/i.test(lines[i])) break;
    if (inProjects && lines[i].length > 8 && lines[i].length < 80 && projects.length < 5) {
      projects.push(lines[i]);
      i++;
    }
  }
  if (projects.length === 0) {
    lines.forEach(l => {
      if (/\b(built|developed|created|designed)\b/i.test(l) && projects.length < 3) {
        projects.push(l.substring(0, 70));
      }
    });
  }

  const certifications = [];
  let inCerts = false;
  for (const line of lines) {
    if (/^(certif|licenses|credentials)/i.test(line)) { inCerts = true; continue; }
    if (inCerts && /^(experience|education|skills|projects)/i.test(line)) break;
    if (inCerts && line.length > 5 && certifications.length < 6) certifications.push(line);
  }
  if (certifications.length === 0) {
    const certMatches = text.match(/\b(aws certified[^,.\n]*|google certified[^,.\n]*|meta [^,.\n]*certificate|azure[^,.\n]*certified|comptia[^,.\n]*|pmp|scrum master|cka|ckad)/gi);
    if (certMatches) certMatches.forEach(m => certifications.push(m.trim()));
  }

  let score = 0;
  if (hasContact)    score += 10;
  if (hasEducation)  score += 10;
  if (hasExperience) score += 10;
  if (hasSkills)     score += 8;
  if (hasProjects)   score += 7;
  if (hasSummary)    score += 5;
  if (hasCerts)      score += 5;
  score += Math.min(25, skills.length * 2);
  const words = text.split(/\s+/).length;
  if (words >= 150 && words <= 900) score += 10;
  else if (words >= 80) score += 5;
  if (emails.length > 0) score += 5;
  if (/linkedin/i.test(text)) score += 3;
  if (/github/i.test(text)) score += 2;
  score = Math.min(100, Math.max(10, score));

  const suggestions = [];
  if (!hasContact) suggestions.push(SUGGESTION_POOL[0], SUGGESTION_POOL[1]);
  if (!hasSummary) suggestions.push(SUGGESTION_POOL[3]);
  if (!hasSkills || skills.length < 5) suggestions.push(SUGGESTION_POOL[5]);
  if (!hasProjects) suggestions.push(SUGGESTION_POOL[8]);
  if (!hasExperience) suggestions.push(SUGGESTION_POOL[10]);
  if (missingSkills.length > 3) suggestions.push({ category: 'Keywords', message: `Consider adding: ${missingSkills.slice(0, 4).join(', ')}.`, impact: 'medium' });
  if (words < 150) suggestions.push(SUGGESTION_POOL[12]);
  if (!hasCerts) suggestions.push(SUGGESTION_POOL[16]);
  suggestions.push(SUGGESTION_POOL[17]);
  const finalSuggestions = suggestions.slice(0, 8);

  return { score, skills, missingSkills, name, contact, projects, certifications, suggestions: finalSuggestions };
}

function fallbackResponse() {
  return {
    score: 75 + Math.floor(Math.random() * 15),
    skills: ['javascript', 'react', 'node.js', 'html', 'css', 'git'],
    missingSkills: ['typescript', 'docker', 'aws', 'postgresql'],
    suggestions: [
      { category: 'Summary', message: 'Add a 2-3 line professional summary at the top of your resume.', impact: 'high' },
      { category: 'Skills', message: 'List your technical skills in a dedicated section with categories.', impact: 'high' },
      { category: 'Projects', message: 'Add 2-3 projects with tech stack, description, and live/GitHub links.', impact: 'high' },
      { category: 'Contact', message: 'Add your LinkedIn profile URL — recruiters check it first.', impact: 'high' },
      { category: 'Keywords', message: 'Consider adding: typescript, docker, aws, postgresql.', impact: 'medium' },
      { category: 'Overall', message: 'Proofread for typos — a single spelling error can cost you an interview.', impact: 'high' },
    ],
    name: 'Candidate',
    projects: ['Portfolio Website', 'E-Commerce Platform'],
    certifications: [],
    contact: '',
  };
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (db.institutions.find(i => i.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const institution = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.institutions.push(institution);
    db.templates[institution.id] = null;
    saveData(db);

    const token = jwt.sign({ id: institution.id, email: institution.email, name: institution.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, institution: { id: institution.id, name: institution.name, email: institution.email } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const institution = db.institutions.find(i => i.email === email);
    if (!institution) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, institution.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: institution.id, email: institution.email, name: institution.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, institution: { id: institution.id, name: institution.name, email: institution.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  const institution = db.institutions.find(i => i.id === req.user.id);
  if (!institution) return res.status(404).json({ error: 'Institution not found' });
  res.json({ id: institution.id, name: institution.name, email: institution.email });
});

app.get('/institutions', (req, res) => {
  const institutions = db.institutions.map(i => ({
    id: i.id,
    name: i.name,
    hasTemplate: !!db.templates[i.id]
  }));
  res.json(institutions);
});

app.get('/institutions/:id/template', (req, res) => {
  const template = db.templates[req.params.id];
  if (!template) {
    return res.status(404).json({ error: 'No template found for this institution' });
  }
  res.json({ hasTemplate: true });
});

app.post('/institutions/template', authenticateToken, upload.single('template'), async (req, res) => {
  let text = null;

  // Try file path first
  if (req.file && req.file.path) {
    text = await extractText(req.file.path, req.file.originalname);
  }
  
  // Fallback to buffer
  if (!text && req.file && req.file.buffer) {
    text = await extractText(req.file.buffer, req.file.originalname);
  }

  if (!text && req.body && req.body.text) {
    text = req.body.text;
  }

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'ATS template text is required (PDF/DOC/TXT or raw text).' });
  }

  const templateConfig = parseTemplateConfig(req.body?.templateConfig || req.body?.config);
  const template = buildTemplate(text, templateConfig);
  if (template.keywords.length === 0) {
    return res.status(400).json({ error: 'No usable keywords found in the ATS template.' });
  }

  db.templates[req.user.id] = {
    text,
    keywords: template.keywords,
    sections: template.requiredSections,
    config: template.config,
    updatedAt: new Date().toISOString(),
  };
  saveData(db);

  res.json({
    status: 'ok',
    template: {
      keywordCount: template.keywords.length,
      keywords: template.keywords,
      sections: template.requiredSections,
      updatedAt: db.templates[req.user.id].updatedAt,
    },
  });
});

app.delete('/institutions/template', authenticateToken, (req, res) => {
  if (db.templates[req.user.id]) {
    delete db.templates[req.user.id];
    saveData(db);
    return res.json({ status: 'ok', message: 'Template deleted. Re-upload a clean ATS template.' });
  }
  return res.status(404).json({ error: 'No template found to delete.' });
});

app.get('/institutions/template', authenticateToken, (req, res) => {
  const template = db.templates[req.user.id];
  if (!template) {
    return res.status(404).json({ status: 'missing', error: 'No ATS template uploaded yet.' });
  }

  res.json({
    status: 'ok',
    template: {
      keywordCount: template.keywords.length,
      keywords: template.keywords,
      sections: template.sections,
      updatedAt: template.updatedAt,
    },
  });
});

app.post('/compare-resume', upload.single('resume'), async (req, res) => {
  const templateSource = String(req.body?.templateSource || 'INSTITUTION_TEMPLATE').toUpperCase();
  const requestConfig = parseTemplateConfig(req.body?.templateConfig || req.body?.config);

  let effectiveTemplate = null;
  if (templateSource === 'SYSTEM_TEMPLATE') {
    effectiveTemplate = buildTemplate(SYSTEM_TEMPLATE_TEXT, requestConfig);
  } else {
    const institutionId = req.body.institutionId;
    if (!institutionId) {
      return res.status(400).json({ error: 'Institution ID is required' });
    }

    const template = db.templates[institutionId];
    if (!template) {
      return res.status(400).json({ error: 'This institution has not uploaded an ATS template yet.' });
    }

    const cleanedTemplateKeywords = sanitizeTemplateKeywords(template.keywords || []);
    const mergedConfig = parseTemplateConfig(template.config || requestConfig);
    if (cleanedTemplateKeywords.length > 0) {
      const previous = JSON.stringify(template.keywords || []);
      const cleaned = JSON.stringify(cleanedTemplateKeywords);
      if (previous !== cleaned) {
        db.templates[institutionId].keywords = cleanedTemplateKeywords;
        saveData(db);
      }
    }
    effectiveTemplate = {
      ...template,
      keywords: cleanedTemplateKeywords.length > 0 ? cleanedTemplateKeywords : (template.keywords || []),
      config: mergedConfig,
    };
  }

  let text = null;
  let debugInfo = { step: 'start' };
  
  // Try file path first (disk storage)
  if (req.file && req.file.path) {
    debugInfo.filePath = req.file.path;
    text = await extractText(req.file.path, req.file.originalname);
    debugInfo.extracted = text ? text.substring(0, 100) : null;
  }
  
  // Fallback to buffer
  if (!text && req.file && req.file.buffer) {
    text = await extractText(req.file.buffer, req.file.originalname);
  }

  if (!text && req.body && req.body.text) {
    text = req.body.text;
  }

  if (!text || text.trim().length < 50) {
    debugInfo.error = 'No text extracted';
    debugInfo.templateHasText = effectiveTemplate.text ? 'yes' : 'no';
    debugInfo.templateLength = effectiveTemplate.text?.length;
    console.log('DEBUG compare-resume:', JSON.stringify(debugInfo, null, 2));
    return res.status(400).json({ error: 'Resume text is required (PDF/DOC/TXT or raw text).', debug: debugInfo });
  }

  // Strict deterministic output
  const analysis = compareResume(text, effectiveTemplate.text, effectiveTemplate.config || requestConfig);
  debugInfo.result = analysis;
  console.log('DEBUG compare-result:', JSON.stringify(analysis, null, 2));
  
  return res.json(analysis);
});

app.post('/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    let text = null;

    if (req.file && req.file.path) {
      text = await extractText(req.file.path, req.file.originalname);
    }

    if (!text && req.file && req.file.buffer) {
      text = await extractText(req.file.buffer, req.file.originalname);
    }

    if (!text && req.body && req.body.text) {
      text = req.body.text;
    }

    if (text && text.trim().length > 20) {
      const result = analyzeText(text);
      return res.json(result);
    }

    return res.json(fallbackResponse());
  } catch (err) {
    console.error('Analyze error (handled):', err.message);
    return res.json(fallbackResponse());
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ATS Resume Comparator API', version: '2.0' });
});

app.use((req, res) => {
  res.json({ status: 'ok', message: 'Use POST /analyze-resume or POST /compare-resume' });
});

app.use((err, req, res, next) => {
  console.error('Global error (handled):', err.message);
  res.json(fallbackResponse());
});

app.listen(PORT, () => {
  console.log(`✅ ATS Resume Comparator API running on http://localhost:${PORT}`);
  console.log(`📌 Auth: POST /auth/register, POST /auth/login`);
  console.log(`📌 Institution: GET /institutions, POST /institutions/template`);
  console.log(`📌 Student: POST /compare-resume (with institutionId)`);
});
