/**
 * Resume Analyzer Engine
 * Keyword-based scoring and suggestion generation
 */

// ── Keyword banks ─────────────────────────────────────────────────────────────
const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring',
  'mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'sqlite',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'github', 'linux',
  'rest api', 'graphql', 'microservices', 'machine learning', 'deep learning', 'tensorflow',
  'html', 'css', 'tailwind', 'bootstrap', 'sass', 'webpack', 'vite',
];

const SOFT_KEYWORDS = [
  'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
  'project management', 'agile', 'scrum', 'collaboration', 'mentoring',
];

const SECTION_PATTERNS = {
  contact:    /\b(email|phone|linkedin|github|portfolio|contact)\b/i,
  education:  /\b(education|university|college|degree|bachelor|master|b\.tech|m\.tech|b\.sc|gpa)\b/i,
  experience: /\b(experience|work|internship|employment|job|position|company|organization)\b/i,
  skills:     /\b(skills|technologies|tools|languages|frameworks|proficient)\b/i,
  projects:   /\b(projects|built|developed|created|implemented|designed)\b/i,
  summary:    /\b(summary|objective|profile|about|overview)\b/i,
};

// ── Text extraction helpers ───────────────────────────────────────────────────
const extractEmails = (text) => {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  return matches ? [...new Set(matches)] : [];
};

const extractPhones = (text) => {
  const matches = text.match(/(\+?\d[\d\s\-().]{7,}\d)/g);
  return matches ? matches.slice(0, 2) : [];
};

const extractLinks = (text) => {
  const matches = text.match(/https?:\/\/[^\s]+|linkedin\.com\/[^\s]+|github\.com\/[^\s]+/gi);
  return matches ? [...new Set(matches)] : [];
};

const extractName = (text) => {
  // First non-empty line is usually the name
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    // Name: 2-4 words, no special chars, not an email/url
    if (/^[A-Z][a-z]+([\s][A-Z][a-z]+){1,3}$/.test(line)) return line;
  }
  return lines[0] || 'Unknown';
};

const extractSkills = (text) => {
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.filter((kw) => lower.includes(kw));
};

const extractProjects = (text) => {
  const projects = [];
  // Look for lines after "project" heading
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let inProjects = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(projects|personal projects|academic projects)/i.test(line)) {
      inProjects = true;
      continue;
    }
    if (inProjects && /^(experience|education|skills|certifications)/i.test(line)) {
      inProjects = false;
    }
    if (inProjects && line.length > 10 && line.length < 120) {
      // Likely a project title or description
      if (projects.length < 6) {
        projects.push({
          name: line.substring(0, 60),
          description: lines[i + 1] || 'No description provided.',
          techStack: extractSkills(line + ' ' + (lines[i + 1] || '')),
        });
        i++; // skip description line
      }
    }
  }

  // Fallback: find lines with "built", "developed", "created"
  if (projects.length === 0) {
    lines.forEach((line) => {
      if (/\b(built|developed|created|implemented|designed)\b/i.test(line) && projects.length < 4) {
        projects.push({
          name: line.substring(0, 60),
          description: line,
          techStack: extractSkills(line),
        });
      }
    });
  }

  return projects;
};

const extractEducation = (text) => {
  const education = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let inEdu = false;

  for (const line of lines) {
    if (/^education/i.test(line)) { inEdu = true; continue; }
    if (inEdu && /^(experience|skills|projects|certifications)/i.test(line)) inEdu = false;
    if (inEdu && line.length > 5) {
      education.push({ institution: line, degree: '', field: '', year: '' });
      if (education.length >= 3) break;
    }
  }
  return education;
};

const extractExperience = (text) => {
  const experience = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let inExp = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(experience|work experience|employment)/i.test(line)) { inExp = true; continue; }
    if (inExp && /^(education|skills|projects|certifications)/i.test(line)) inExp = false;
    if (inExp && line.length > 5 && experience.length < 4) {
      experience.push({
        company:    line,
        role:       lines[i + 1] || '',
        duration:   '',
        highlights: [],
      });
      i++;
    }
  }
  return experience;
};

// ── Extract certifications ────────────────────────────────────────────────────
const extractCertifications = (text) => {
  const certs = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let inCerts = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(certifications?|certificates?|licenses?|credentials?)/i.test(line)) {
      inCerts = true;
      continue;
    }
    if (inCerts && /^(experience|education|skills|projects|summary|contact)/i.test(line)) {
      inCerts = false;
    }
    if (inCerts && line.length > 5 && certs.length < 10) {
      certs.push(line);
    }
  }

  // Also detect inline certification mentions
  if (certs.length === 0) {
    const certPatterns = /\b(aws certified|google certified|azure|comptia|cisco|ccna|ccnp|pmp|scrum master|csm|cka|ckad|oracle certified|certified kubernetes|istqb|itil|rhce|rhcsa|salesforce|hubspot|meta certified|ibm certified|coursera|udemy|edx|certification in|certified)\b/gi;
    const matches = text.match(certPatterns);
    if (matches) {
      [...new Set(matches)].forEach((m) => certs.push(m));
    }
  }

  return certs;
};

// ── Scoring engine ────────────────────────────────────────────────────────────
const calculateScore = (text, sections, foundKeywords) => {
  let score = 0;

  // Section presence (40 points)
  if (sections.hasContact)    score += 8;
  if (sections.hasEducation)  score += 8;
  if (sections.hasExperience) score += 8;
  if (sections.hasSkills)     score += 8;
  if (sections.hasProjects)   score += 5;
  if (sections.hasSummary)    score += 3;

  // Keyword density (30 points)
  const keywordScore = Math.min(30, foundKeywords.length * 2);
  score += keywordScore;

  // Length check (15 points)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 200 && wordCount <= 800) score += 15;
  else if (wordCount >= 100)                score += 8;

  // Formatting signals (15 points)
  const hasEmail  = /\S+@\S+\.\S+/.test(text);
  const hasPhone  = /\d{10}|\+\d{10,}/.test(text);
  const hasLinked = /linkedin/i.test(text);
  const hasGithub = /github/i.test(text);
  if (hasEmail)  score += 4;
  if (hasPhone)  score += 3;
  if (hasLinked) score += 4;
  if (hasGithub) score += 4;

  return Math.min(100, Math.round(score));
};

// ── Suggestion generator ──────────────────────────────────────────────────────
const generateSuggestions = (text, sections, foundKeywords, score) => {
  const suggestions = [];
  const lower = text.toLowerCase();

  // Contact
  if (!sections.hasContact) {
    suggestions.push({ category: 'Contact', message: 'Add your email, phone, LinkedIn, and GitHub links.', impact: 'high' });
  }
  if (!/linkedin/i.test(text)) {
    suggestions.push({ category: 'Contact', message: 'Add your LinkedIn profile URL to increase visibility.', impact: 'high' });
  }
  if (!/github/i.test(text)) {
    suggestions.push({ category: 'Contact', message: 'Add your GitHub profile to showcase your code.', impact: 'medium' });
  }

  // Summary
  if (!sections.hasSummary) {
    suggestions.push({ category: 'Summary', message: 'Add a 2-3 line professional summary at the top.', impact: 'high' });
  }

  // Skills
  if (foundKeywords.length < 5) {
    suggestions.push({ category: 'Skills', message: 'Add more technical skills. Include frameworks, databases, and tools.', impact: 'high' });
  }
  if (!lower.includes('git')) {
    suggestions.push({ category: 'Skills', message: 'Mention Git/version control experience.', impact: 'medium' });
  }

  // Projects
  if (!sections.hasProjects) {
    suggestions.push({ category: 'Projects', message: 'Add 2-3 projects with descriptions and tech stack used.', impact: 'high' });
  }

  // Experience
  if (!sections.hasExperience) {
    suggestions.push({ category: 'Experience', message: 'Add internships or work experience. Even personal projects count.', impact: 'medium' });
  }

  // Formatting
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 200) {
    suggestions.push({ category: 'Formatting', message: 'Resume is too short. Aim for 400-600 words.', impact: 'high' });
  }
  if (wordCount > 1000) {
    suggestions.push({ category: 'Formatting', message: 'Resume is too long. Keep it to 1 page (400-700 words).', impact: 'medium' });
  }

  // Missing popular keywords
  const popular = ['react', 'node.js', 'python', 'sql', 'aws', 'docker'];
  const missing = popular.filter((kw) => !lower.includes(kw));
  if (missing.length > 0) {
    suggestions.push({
      category: 'Keywords',
      message:  `Consider adding relevant skills: ${missing.slice(0, 4).join(', ')}.`,
      impact:   'medium',
    });
  }

  // Score-based
  if (score < 50) {
    suggestions.push({ category: 'Overall', message: 'Your resume needs significant improvement. Focus on adding all key sections.', impact: 'high' });
  } else if (score < 75) {
    suggestions.push({ category: 'Overall', message: 'Good start! Add more keywords and quantify your achievements.', impact: 'medium' });
  } else {
    suggestions.push({ category: 'Overall', message: 'Strong resume! Consider adding certifications or open source contributions.', impact: 'low' });
  }

  return suggestions;
};

// ── Main analyzer function ────────────────────────────────────────────────────
const analyzeResume = (rawText) => {
  const text = rawText || '';

  // Detect sections
  const sections = {
    hasContact:    SECTION_PATTERNS.contact.test(text),
    hasEducation:  SECTION_PATTERNS.education.test(text),
    hasExperience: SECTION_PATTERNS.experience.test(text),
    hasSkills:     SECTION_PATTERNS.skills.test(text),
    hasProjects:   SECTION_PATTERNS.projects.test(text),
    hasSummary:    SECTION_PATTERNS.summary.test(text),
  };

  // Extract data
  const foundKeywords   = extractSkills(text);
  const missingKeywords = TECH_KEYWORDS.filter((kw) => !text.toLowerCase().includes(kw)).slice(0, 10);
  const score           = calculateScore(text, sections, foundKeywords);
  const suggestions     = generateSuggestions(text, sections, foundKeywords, score);

  // Portfolio data
  const portfolioData = {
    name:           extractName(text),
    email:          extractEmails(text)[0]  || '',
    phone:          extractPhones(text)[0]  || '',
    links:          extractLinks(text),
    skills:         foundKeywords,
    projects:       extractProjects(text),
    education:      extractEducation(text),
    experience:     extractExperience(text),
    certifications: extractCertifications(text),
    summary:        '',
  };

  // Extract summary if present
  const summaryMatch = text.match(/(?:summary|objective|profile)[:\s\n]+([^\n]{30,300})/i);
  if (summaryMatch) portfolioData.summary = summaryMatch[1].trim();

  return {
    score,
    suggestions,
    sections,
    keywords: { found: foundKeywords, missing: missingKeywords },
    portfolioData,
  };
};

module.exports = { analyzeResume };
