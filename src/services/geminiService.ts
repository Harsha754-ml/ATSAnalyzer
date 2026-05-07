const API_BASE_URL = 'http://localhost:5001';

const getToken = () => localStorage.getItem('authToken');

export interface Institution {
  id: string;
  name: string;
  hasTemplate: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AnalysisResult {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSections: string[];
  suggestions: {
    category: string;
    message: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  template: {
    keywordCount: number;
    sections: string[];
  };
  resumeText?: string;
  resumeSections?: {
    name: string;
    content: string;
    matchScore: number;
  }[];
}

interface StrictEngineResponse {
  metrics: {
    total_keywords: number;
    matched: number;
    missing: number;
    section_issues: number;
  };
  missing_keywords: string[];
  section_issues: string[];
  annotations: string[];
}

export interface TemplateStatus {
  keywordCount: number;
  keywords: string[];
  sections: string[];
  updatedAt?: string;
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function register(name: string, email: string, password: string): Promise<{ token: string; institution: AuthUser }> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Registration failed.');
  }

  localStorage.setItem('authToken', data.token);
  localStorage.setItem('authUser', JSON.stringify(data.institution));
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; institution: AuthUser }> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Login failed.');
  }

  localStorage.setItem('authToken', data.token);
  localStorage.setItem('authUser', JSON.stringify(data.institution));
  return data;
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

export function getCurrentUser(): AuthUser | null {
  const user = localStorage.getItem('authUser');
  return user ? JSON.parse(user) : null;
}

export async function getInstitutions(): Promise<Institution[]> {
  const res = await fetch(`${API_BASE_URL}/institutions`);
  const data = await parseJsonResponse(res);
  return data;
}

export async function uploadAtsTemplate(file: File): Promise<TemplateStatus> {
  const formData = new FormData();
  formData.append('template', file);

  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/institutions/template`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to upload ATS template. Please login first.');
  }

  return data.template as TemplateStatus;
}

export async function getMyTemplate(): Promise<TemplateStatus | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/institutions/template`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const data = await parseJsonResponse(res);
  return data.template;
}

export async function compareResume(file: File, institutionId: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('institutionId', institutionId);

  const res = await fetch(`${API_BASE_URL}/compare-resume`, {
    method: 'POST',
    body: formData,
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to compare resume.');
  }

  if (data?.metrics && Array.isArray(data?.missing_keywords)) {
    const strict = data as StrictEngineResponse;
    const totalKeywords = Number(strict.metrics.total_keywords || 0);
    const matched = Number(strict.metrics.matched || 0);
    const matchPercentage = totalKeywords > 0 ? Math.round((matched / totalKeywords) * 100) : 0;
    const missingSections = (strict.section_issues || [])
      .map((issue) => {
        const match = issue.match(/missing section - ([^\]]+)/i);
        return match?.[1] || '';
      })
      .filter(Boolean);

    const result: AnalysisResult = {
      matchPercentage,
      matchedKeywords: [],
      missingKeywords: strict.missing_keywords || [],
      missingSections,
      suggestions: [
        ...(strict.missing_keywords?.length
          ? [{
              category: 'Keywords',
              message: `Add ATS keywords: ${strict.missing_keywords.slice(0, 8).join(', ')}.`,
              impact: 'high' as const,
            }]
          : []),
        ...(missingSections.length
          ? [{
              category: 'Structure',
              message: `Add missing sections: ${missingSections.join(', ')}.`,
              impact: 'high' as const,
            }]
          : []),
      ],
      template: {
        keywordCount: totalKeywords,
        sections: [],
      },
    };
    (result as any).annotations = strict.annotations || [];
    return result;
  }

  return data as AnalysisResult;
}
