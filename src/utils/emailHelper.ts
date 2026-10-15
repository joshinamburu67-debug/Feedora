export interface FeedbackData {
  name: string;
  email: string;
  category: 'General' | 'Bug Report' | 'Feature Request' | 'Product Improvement' | 'Customer Support' | 'Partnership';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  rating: number; // 1 to 5
  subject: string;
  message: string;
  aiSummary?: string;
  aiTone?: string;
  deviceInfo?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const TARGET_EMAIL = 'vexloraindia@gmail.com';

/**
 * Validates feedback input before submission
 */
export function validateFeedback(data: Partial<FeedbackData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please provide your full name (minimum 2 characters)';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!data.subject || data.subject.trim().length < 3) {
    errors.subject = 'Subject line is required (minimum 3 characters)';
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Please provide detailed feedback (minimum 10 characters)';
  }

  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    errors.rating = 'Rating must be between 1 and 5';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Converts a string to RFC 4648 URL-safe Base64 without padding
 */
export function base64UrlEncode(str: string): string {
  // UTF-8 safe base64 encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Constructs an RFC 2822 compliant email message ready for Gmail API raw submission
 */
export function buildRfc2822Email(data: FeedbackData, targetEmail = TARGET_EMAIL): { raw: string; htmlBody: string } {
  const dateStr = new Date().toUTCString();
  const fullSubject = `[Vexlora Feedback] [${data.category}] ${data.subject}`;

  // Encode subject in UTF-8 Base64 for RFC 2047 compliance
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(fullSubject)))}?=`;
  const encodedSenderName = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(data.name)))}?=`;

  const priorityColor =
    data.priority === 'Urgent'
      ? '#dc2626'
      : data.priority === 'High'
      ? '#ea580c'
      : data.priority === 'Normal'
      ? '#0284c7'
      : '#16a34a';

  const stars = '★'.repeat(Math.max(1, Math.min(5, data.rating))) + '☆'.repeat(Math.max(0, 5 - data.rating));

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 28px 24px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 0; font-size: 13px; color: #93c5fd; }
    .body { padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; padding: 14px; background: #f1f5f9; border-radius: 8px; font-size: 13px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
    .meta-val { color: #0f172a; font-weight: 600; }
    .message-box { background: #fafafa; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
    .message-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px; }
    .message-text { font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; margin: 0; }
    .ai-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .ai-header { color: #1d4ed8; font-size: 12px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Feedback for Vexlora India</h1>
      <p>Delivered directly to ${targetEmail} via Vexlora Feedback Portal</p>
    </div>
    <div class="body">
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">From User</span>
          <span class="meta-val">${escapeHtml(data.name)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Email Address</span>
          <span class="meta-val">${escapeHtml(data.email)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Category</span>
          <span class="meta-val">${escapeHtml(data.category)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Priority</span>
          <span class="meta-val" style="color: ${priorityColor};">${escapeHtml(data.priority)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Experience Rating</span>
          <span class="meta-val" style="color: #eab308; font-size: 15px;">${stars} (${data.rating}/5)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Submission Date</span>
          <span class="meta-val">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
        </div>
      </div>

      <div class="message-box">
        <div class="message-title">Feedback Subject: ${escapeHtml(data.subject)}</div>
        <p class="message-text">${escapeHtml(data.message)}</p>
      </div>

      ${
        data.aiSummary
          ? `<div class="ai-box">
        <div class="ai-header">&#10024; Gemini AI Feedback Analysis</div>
        <div style="font-size: 13px; color: #1e3a8a; line-height: 1.5;">${escapeHtml(data.aiSummary)}</div>
        ${data.aiTone ? `<div style="margin-top: 6px; font-size: 12px; color: #3b82f6;"><strong>Assessed Tone:</strong> ${escapeHtml(data.aiTone)}</div>` : ''}
      </div>`
          : ''
      }

      ${
        data.deviceInfo
          ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 12px;"><strong>Client Info:</strong> ${escapeHtml(data.deviceInfo)}</div>`
          : ''
      }
    </div>
    <div class="footer">
      This is an automated delivery from the official Vexlora India Feedback Portal.<br/>
      You can reply directly to this email to contact the user at <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>.
    </div>
  </div>
</body>
</html>`;

  const headers = [
    `To: ${targetEmail}`,
    `From: ${encodedSenderName} <${data.email}>`,
    `Reply-To: ${encodedSenderName} <${data.email}>`,
    `Subject: ${encodedSubject}`,
    `Date: ${dateStr}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ].join('\r\n');

  const rawMessage = `${headers}\r\n\r\n${htmlBody}`;

  return {
    raw: base64UrlEncode(rawMessage),
    htmlBody,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
