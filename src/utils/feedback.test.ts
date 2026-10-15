import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFeedback, base64UrlEncode, buildRfc2822Email, TARGET_EMAIL, type FeedbackData } from './emailHelper.ts';

test('validates correct feedback data', () => {
  const validData: FeedbackData = {
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    category: 'Product Improvement',
    priority: 'Normal',
    rating: 5,
    subject: 'Love the new dashboard UX',
    message: 'The performance has been outstanding and the layout is very intuitive.',
  };

  const result = validateFeedback(validData);
  assert.equal(result.isValid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});

test('rejects feedback with invalid email and empty fields', () => {
  const invalidData = {
    name: 'A',
    email: 'invalid-email',
    subject: 'Hi',
    message: 'Short',
  };

  const result = validateFeedback(invalidData);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.name, 'Name should have error');
  assert.ok(result.errors.email, 'Email should have error');
  assert.ok(result.errors.subject, 'Subject should have error');
  assert.ok(result.errors.message, 'Message should have error');
});

test('base64UrlEncode produces valid URL-safe string without padding', () => {
  const input = 'Hello Vexlora India!';
  const encoded = base64UrlEncode(input);
  assert.equal(encoded.includes('+'), false);
  assert.equal(encoded.includes('/'), false);
  assert.equal(encoded.endsWith('='), false);
  assert.ok(encoded.length > 0);
});

test('buildRfc2822Email generates target recipient and valid raw RFC message', () => {
  const data: FeedbackData = {
    name: 'Priya Patel',
    email: 'priya@example.com',
    category: 'Feature Request',
    priority: 'High',
    rating: 4,
    subject: 'Export to CSV feature request',
    message: 'It would be great to export all report tables directly to CSV for spreadsheet analysis.',
    aiSummary: 'User requesting direct CSV export functionality for reporting.',
    aiTone: 'Constructive / Enthusiastic',
  };

  const { raw, htmlBody } = buildRfc2822Email(data);
  assert.ok(raw.length > 50, 'Raw string should be populated');
  assert.equal(htmlBody.includes(TARGET_EMAIL), true, 'HTML should include destination mailbox vexloraindia@gmail.com');
  assert.equal(htmlBody.includes('Priya Patel'), true, 'HTML should include user name');
  assert.equal(htmlBody.includes('Export to CSV'), true, 'HTML should include subject');
  assert.equal(htmlBody.includes('Constructive / Enthusiastic'), true, 'HTML should include AI tone');
});
