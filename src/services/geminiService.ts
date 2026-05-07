const API_BASE_URL = 'http://localhost:5001';

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

export async function uploadAtsTemplate(file: File): Promise<TemplateStatus> {
  const formData = new FormData();
  formData.append('template', file);

  const res = await fetch(`${API_BASE_URL}/admin/template`, {
    method: 'POST',
    body: formData,
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to upload ATS template.');
  }

  return data.template as TemplateStatus;
}

export async function compareResume(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('resume', file);

  const res = await fetch(`${API_BASE_URL}/compare-resume`, {
    method: 'POST',
    body: formData,
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to compare resume.');
  }

  return data as AnalysisResult;
}
