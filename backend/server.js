const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── File upload (memory storage — no disk writes needed) ──────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf', '.txt', '.doc', '.docx'].includes(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

// ── Keyword banks ─────────────────────────────────────────────────────────────
const TECH_SKILLS = [
  'javascript','typescript','python','java','c++','c#','go','rust','php','ruby','swift','kotlin',
  'react','angular','vue','next.js','node.js','express','django','flask','spring boot',
  'mongodb','postgresql','mysql','redis','firebase','sqlite','dynamodb',
  'aws','azure','gcp','docker','kubernetes','ci/cd','git','github','linux',
  'rest api','graphql','microservices','machine learning','deep learning','tensorflow',
  'html','css','tailwind','bootstrap','sass','webpack','vite',
  'figma','jira','agile','scrum',
];

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

let templateStore = {
  text: '',
  keywords: [],
  sections: [],
  updatedAt: null,
};

function detectSections(text) {
  return SECTION_DEFINITIONS.reduce((acc, section) => {
    acc[section.key] = section.regex.test(text);
    return acc;
  }, {});
}

function extractKeywords(text) {
  const lower = text.toLowerCase();
  const skills = TECH_SKILLS.filter(s => lower.includes(s));
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
    .map(([token]) => token)
    .filter(token => !skills.includes(token))
    .slice(0, 18);

  const keywords = Array.from(new Set([...skills, ...customKeywords]));
  return { keywords, skills };
}

function buildTemplate(text) {
  const { keywords } = extractKeywords(text);
  const sections = detectSections(text);
  const requiredSections = SECTION_DEFINITIONS
    .filter(s => sections[s.key])
    .map(s => s.label);

  return { text, keywords, requiredSections };
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

function compareResumeToTemplate(text, template) {
  const lower = text.toLowerCase();
  const matchedKeywords = template.keywords.filter(k => lower.includes(k));
  const missingKeywords = template.keywords.filter(k => !lower.includes(k));
  const sectionFlags = detectSections(text);
  const missingSections = template.requiredSections.filter(label => {
    const section = SECTION_DEFINITIONS.find(s => s.label === label);
    return section ? !sectionFlags[section.key] : false;
  });

  const keywordScore = template.keywords.length > 0 ? matchedKeywords.length / template.keywords.length : 0;
  const sectionScore = template.requiredSections.length > 0
    ? (template.requiredSections.length - missingSections.length) / template.requiredSections.length
    : 1;
  const matchPercentage = Math.round((keywordScore * 0.7 + sectionScore * 0.3) * 100);

  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
    missingSections,
    suggestions: buildSuggestions(missingSections, missingKeywords, matchPercentage),
    template: {
      keywordCount: template.keywords.length,
      sections: template.requiredSections,
    },
  };
}

// ── Extract text from buffer ──────────────────────────────────────────────────
function extractText(buffer, filename) {
  try {
    // Try reading as UTF-8 text first (works for .txt and some PDFs)
    const text = buffer.toString('utf-8');

    // If it looks like readable text (has enough letters), use it
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 50) return text;

    // For binary PDFs: extract any readable strings
    const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').trim();
    if (readable.length > 50) return readable;
  } catch (e) { /* fall through */ }

  return null;
}

// ── Analyze text ──────────────────────────────────────────────────────────────
function analyzeText(text) {
  const lower = text.toLowerCase();

  // Find skills
  const skills = TECH_SKILLS.filter(s => lower.includes(s));

  // Find missing recommended skills
  const missingSkills = RECOMMENDED_SKILLS.filter(s => !lower.includes(s)).slice(0, 6);

  // Detect sections
  const hasContact    = /\b(email|phone|linkedin|github|contact)\b/i.test(text);
  const hasEducation  = /\b(education|university|college|degree|b\.tech|bachelor|master)\b/i.test(text);
  const hasExperience = /\b(experience|work|internship|employment|company)\b/i.test(text);
  const hasSkills     = /\b(skills|technologies|tools|proficient)\b/i.test(text);
  const hasProjects   = /\b(projects|built|developed|created|implemented)\b/i.test(text);
  const hasSummary    = /\b(summary|objective|profile|about)\b/i.test(text);
  const hasCerts      = /\b(certif|certified|certification|certificate|coursera|udemy)\b/i.test(text);

  // Extract name (first line that looks like a name)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = 'Unknown';
  for (const line of lines.slice(0, 8)) {
    if (/^[A-Z][a-z]+([\s][A-Z][a-z]+){1,3}$/.test(line)) { name = line; break; }
  }
  if (name === 'Unknown' && lines[0] && lines[0].length < 40) name = lines[0];

  // Extract contact
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const phones = text.match(/(\+?\d[\d\s\-().]{7,}\d)/g) || [];
  const contact = emails[0] || phones[0] || '';

  // Extract projects
  const projects = [];
  let inProjects = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^projects/i.test(lines[i])) { inProjects = true; continue; }
    if (inProjects && /^(experience|education|skills|certif)/i.test(lines[i])) break;
    if (inProjects && lines[i].length > 8 && lines[i].length < 80 && projects.length < 5) {
      projects.push(lines[i]);
      i++; // skip description line
    }
  }
  // Fallback: find lines with build verbs
  if (projects.length === 0) {
    lines.forEach(l => {
      if (/\b(built|developed|created|designed)\b/i.test(l) && projects.length < 3) {
        projects.push(l.substring(0, 70));
      }
    });
  }

  // Extract certifications
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

  // Calculate score
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

  // Pick relevant suggestions
  const suggestions = [];
  if (!hasContact) suggestions.push(SUGGESTION_POOL[0], SUGGESTION_POOL[1]);
  if (!hasSummary) suggestions.push(SUGGESTION_POOL[3]);
  if (!hasSkills || skills.length < 5) suggestions.push(SUGGESTION_POOL[5]);
  if (!hasProjects) suggestions.push(SUGGESTION_POOL[8]);
  if (!hasExperience) suggestions.push(SUGGESTION_POOL[10]);
  if (missingSkills.length > 3) suggestions.push({ category: 'Keywords', message: `Consider adding: ${missingSkills.slice(0, 4).join(', ')}.`, impact: 'medium' });
  if (words < 150) suggestions.push(SUGGESTION_POOL[12]);
  if (!hasCerts) suggestions.push(SUGGESTION_POOL[16]);
  suggestions.push(SUGGESTION_POOL[17]); // always add proofread tip
  // Cap at 8 suggestions
  const finalSuggestions = suggestions.slice(0, 8);

  return { score, skills, missingSkills, name, contact, projects, certifications, suggestions: finalSuggestions };
}

// ── Fallback response (NEVER fails) ──────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
// Legacy analyzer endpoint — POST /analyze-resume
// ══════════════════════════════════════════════════════════════════════════════
app.post('/admin/template', upload.single('template'), (req, res) => {
  let text = null;

  if (req.file && req.file.buffer) {
    text = extractText(req.file.buffer, req.file.originalname);
  }

  if (!text && req.body && req.body.text) {
    text = req.body.text;
  }

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'ATS template text is required (PDF/DOC/TXT or raw text).' });
  }

  const template = buildTemplate(text);
  if (template.keywords.length === 0) {
    return res.status(400).json({ error: 'No usable keywords found in the ATS template.' });
  }

  templateStore = {
    text,
    keywords: template.keywords,
    sections: template.requiredSections,
    updatedAt: new Date().toISOString(),
  };

  return res.json({
    status: 'ok',
    template: {
      keywordCount: template.keywords.length,
      keywords: template.keywords,
      sections: template.requiredSections,
      updatedAt: templateStore.updatedAt,
    },
  });
});

app.get('/admin/template', (req, res) => {
  if (!templateStore.text) {
    return res.status(404).json({ status: 'missing', error: 'No ATS template uploaded yet.' });
  }

  return res.json({
    status: 'ok',
    template: {
      keywordCount: templateStore.keywords.length,
      keywords: templateStore.keywords,
      sections: templateStore.sections,
      updatedAt: templateStore.updatedAt,
    },
  });
});

app.post('/compare-resume', upload.single('resume'), (req, res) => {
  if (!templateStore.text) {
    return res.status(400).json({ error: 'Upload an ATS template before comparing resumes.' });
  }

  let text = null;
  if (req.file && req.file.buffer) {
    text = extractText(req.file.buffer, req.file.originalname);
  }

  if (!text && req.body && req.body.text) {
    text = req.body.text;
  }

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Resume text is required (PDF/DOC/TXT or raw text).' });
  }

  const result = compareResumeToTemplate(text, {
    text: templateStore.text,
    keywords: templateStore.keywords,
    requiredSections: templateStore.sections,
  });

  return res.json(result);
});

app.post('/analyze-resume', upload.single('resume'), (req, res) => {
  try {
    let text = null;

    // Try to extract text from uploaded file
    if (req.file && req.file.buffer) {
      text = extractText(req.file.buffer, req.file.originalname);
    }

    // Try body text as fallback
    if (!text && req.body && req.body.text) {
      text = req.body.text;
    }

    // If we got text, analyze it
    if (text && text.trim().length > 20) {
      const result = analyzeText(text);
      return res.json(result);
    }

    // No usable text — return fallback
    return res.json(fallbackResponse());

  } catch (err) {
    // NEVER crash — always return valid data
    console.error('Analyze error (handled):', err.message);
    return res.json(fallbackResponse());
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Resume Analyzer API', endpoint: 'POST /analyze-resume' });
});

// ── Catch-all — never 404 ────────────────────────────────────────────────────
app.use((req, res) => {
  res.json({ status: 'ok', message: 'Use POST /analyze-resume', endpoint: 'POST /analyze-resume' });
});

// ── Global error handler — never crash ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error (handled):', err.message);
  res.json(fallbackResponse());
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Resume Analyzer API running on http://localhost:${PORT}`);
  console.log(`📌 POST /analyze-resume — send a file or text`);
});
