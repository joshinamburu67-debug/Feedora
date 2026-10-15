export interface EnhanceResponse {
  enhancedSubject: string;
  enhancedMessage: string;
  improvementsSummary: string;
}

export interface AnalyzeResponse {
  summary: string;
  tone: string;
  urgencyLevel: string;
  keyTopics: string[];
  recommendedAction: string;
}

export async function requestGeminiEnhance(
  subject: string,
  message: string,
  toneStyle: 'professional' | 'concise' | 'structured_bug' | 'business_formal' = 'professional'
): Promise<EnhanceResponse> {
  const response = await fetch('/api/gemini/enhance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject, message, toneStyle }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || 'Failed to enhance feedback with Gemini');
  }

  return response.json();
}

export async function requestGeminiAnalyze(
  subject: string,
  message: string,
  category: string,
  rating: number
): Promise<AnalyzeResponse> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject, message, category, rating }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || 'Failed to analyze feedback with Gemini');
  }

  return response.json();
}
