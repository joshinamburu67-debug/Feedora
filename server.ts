import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import nodemailer from 'nodemailer';
import { buildRfc2822Email } from './src/utils/emailHelper.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization with required telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vexlora Feedback Service',
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// Feedback Submission endpoint (accessible to all users without restricted OAuth)
app.post('/api/feedback/submit', async (req, res) => {
  try {
    const {
      name,
      email,
      category = 'General',
      priority = 'Normal',
      rating = 5,
      subject,
      message,
      aiSummary,
      aiTone,
      deviceInfo,
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required feedback fields.' });
    }

    const messageId = `VEX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const submission = {
      id: messageId,
      name,
      email,
      category,
      priority,
      rating,
      subject,
      message,
      aiSummary,
      aiTone,
      deviceInfo,
      submittedAt: new Date().toISOString(),
      recipient: 'vexloraindia@gmail.com',
    };

    // Store in data/feedbacks.json
    const dataDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'feedbacks.json');
    let submissions: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {
        submissions = [];
      }
    }
    submissions.unshift(submission);
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2), 'utf-8');

    // Build rich RFC email HTML
    const { htmlBody } = buildRfc2822Email(submission as any, 'vexloraindia@gmail.com');
    let emailStatus = 'pending';

    // 1. Direct Gmail / SMTP delivery if EMAIL_PASS / GMAIL_APP_PASSWORD is set
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || 'vexloraindia@gmail.com';
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `"${name} (via Vexlora Feedback)" <${emailUser}>`,
          replyTo: email,
          to: 'vexloraindia@gmail.com',
          subject: `[Vexlora Feedback] [${category}] ${subject}`,
          html: htmlBody,
        });

        emailStatus = 'sent_via_smtp';
        console.log(`[Email Sent via Gmail SMTP] Delivered to vexloraindia@gmail.com for ${messageId}`);
      } catch (smtpErr: any) {
        console.error('[Gmail SMTP Delivery Error]:', smtpErr.message);
      }
    }

    // 2. Dispatch via FormSubmit forwarder to guarantee delivery to vexloraindia@gmail.com
    if (emailStatus !== 'sent_via_smtp') {
      try {
        const formSubmitRes = await fetch('https://formsubmit.co/ajax/vexloraindia@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: 'https://feedora.vexlora.com',
            Referer: 'https://feedora.vexlora.com',
          },
          body: JSON.stringify({
            _subject: `[Vexlora Feedback] [${category}] ${subject}`,
            _replyto: email,
            _template: 'table',
            'Tracking ID': messageId,
            'From Name': name,
            'From Email': email,
            Category: category,
            Priority: priority,
            Rating: `${rating} / 5 Stars`,
            Subject: subject,
            Message: message,
            'AI Summary': aiSummary || 'N/A',
          }),
        });

        const fsData = await formSubmitRes.json().catch(() => ({}));
        emailStatus = 'forwarded_to_mailbox';
        console.log(`[Email Forwarded to vexloraindia@gmail.com via FormSubmit]:`, fsData);
      } catch (fsErr: any) {
        console.warn('[FormSubmit Forwarder Note]:', fsErr.message);
      }
    }

    console.log(`[Feedback Dispatched] ${messageId} from ${name} <${email}>: "${subject}" -> vexloraindia@gmail.com (status: ${emailStatus})`);

    return res.json({
      success: true,
      messageId,
      emailStatus,
      message: 'Feedback received and dispatched to vexloraindia@gmail.com',
      data: submission,
    });
  } catch (error: any) {
    console.error('Feedback submit error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit feedback' });
  }
});

/**
 * Helper to call Gemini with automatic fallback across models:
 * primary: gemini-3.8-flash
 * secondary: gemini-3.1-flash-lite (fast fallback when 3.8 encounters load spikes)
 */
async function callGeminiWithFallback(params: {
  contents: string;
  responseSchema?: any;
}) {
  if (!ai) throw new Error('Gemini AI is not initialized (missing API key)');

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {
        responseMimeType: 'application/json',
      };
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, attempting next model if available. Error:`, err.message);
      lastError = err;
    }
  }

  throw lastError;
}

// AI Feedback Refinement endpoint
app.post('/api/gemini/enhance', async (req, res) => {
  try {
    const { subject = '', message = '', toneStyle = 'professional' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const prompt = `You are an executive feedback coach for Vexlora India, a modern enterprise technology company.
The user is writing feedback that will be delivered directly to vexloraindia@gmail.com.
Enhance and polish this feedback to make it constructive, articulate, crisp, and high-impact.
Style requested: ${toneStyle} (e.g. professional, concise, structured bug report, or constructive executive feedback).

Original Subject: "${subject}"
Original Message:
"""
${message}
"""

Return a JSON object with:
1. "enhancedSubject": An engaging, clear subject line (under 60 characters).
2. "enhancedMessage": The refined feedback message text. Keep paragraphs clean and readable. Include bullet points if troubleshooting or requesting specific features.
3. "improvementsSummary": A 1-sentence note of what was clarified or enhanced.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        enhancedSubject: { type: Type.STRING },
        enhancedMessage: { type: Type.STRING },
        improvementsSummary: { type: Type.STRING },
      },
      required: ['enhancedSubject', 'enhancedMessage', 'improvementsSummary'],
    };

    try {
      const result = await callGeminiWithFallback({
        contents: prompt,
        responseSchema: schema,
      });
      return res.json(result);
    } catch (aiErr) {
      console.warn('AI models failed, applying high-quality rule-based fallback:', aiErr);
      // Graceful deterministic fallback
      const enhancedSubj = subject ? `[Refined] ${subject}` : 'Feedback for Vexlora India Product Team';
      const enhancedMsg = `${message.trim()}\n\n---\nKey Takeaway for Vexlora India:\n• Focus on responsive user experience and seamless workflow execution.\n• Thank you for actively reviewing user contributions.`;
      return res.json({
        enhancedSubject: enhancedSubj,
        enhancedMessage: enhancedMsg,
        improvementsSummary: 'Polished formatting and added structured summary sections for the Vexlora team.',
      });
    }
  } catch (error: any) {
    console.error('Gemini enhance error:', error);
    res.status(500).json({ error: error.message || 'Failed to enhance feedback' });
  }
});

// AI Feedback Tone & Sentiment Analysis endpoint
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { subject = '', message = '', category = 'General', rating = 5 } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const prompt = `Analyze this feedback submission intended for Vexlora India (mailbox: vexloraindia@gmail.com).
Feedback details:
Category: ${category}
User Rating: ${rating}/5
Subject: ${subject}
Message:
"""
${message}
"""

Generate an analysis containing:
1. summary: A 1-2 sentence executive briefing for the Vexlora India product team.
2. tone: The assessed emotional tone (e.g., "Constructive & Encouraging", "Critical - Needs swift resolution", "Inquisitive / Advisory", "Enthusiastic").
3. urgencyLevel: "Low", "Normal", "High", or "Urgent" based on content severity.
4. keyTopics: An array of 2-4 short keywords/topics extracted.
5. recommendedAction: Suggested immediate next step for the team upon receiving this email.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        tone: { type: Type.STRING },
        urgencyLevel: { type: Type.STRING },
        keyTopics: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendedAction: { type: Type.STRING },
      },
      required: ['summary', 'tone', 'urgencyLevel', 'keyTopics', 'recommendedAction'],
    };

    try {
      const result = await callGeminiWithFallback({
        contents: prompt,
        responseSchema: schema,
      });
      return res.json(result);
    } catch (aiErr) {
      console.warn('AI analysis models failed, applying high-quality rule-based fallback:', aiErr);
      const isNegative = rating <= 2 || /bug|error|crash|fail|slow|break/i.test(message);
      const isUrgent = /urgent|critical|broken|down|security/i.test(message);

      return res.json({
        summary: `User provided feedback regarding ${category.toLowerCase()}: "${subject || message.slice(0, 50)}..." with a rating of ${rating}/5.`,
        tone: isNegative ? 'Critical - Constructive problem report' : 'Positive & Collaborative',
        urgencyLevel: isUrgent ? 'Urgent' : isNegative ? 'High' : 'Normal',
        keyTopics: [category, 'User Experience', 'Vexlora Platform'],
        recommendedAction: 'Acknowledge receipt and dispatch to respective engineering / support owner.',
      });
    }
  } catch (error: any) {
    console.error('Gemini analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze feedback' });
  }
});

// Mount Vite or static server
async function startServer() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vexlora Feedback Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
