import React, { useState } from 'react';
import { CheckCircle2, Mail, ExternalLink, Copy, Check, ArrowLeft, Send } from 'lucide-react';
import { TARGET_EMAIL, type FeedbackData } from '../utils/emailHelper.ts';

interface SuccessViewProps {
  feedback: FeedbackData;
  messageId?: string;
  onReset: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  feedback,
  messageId,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Vexlora India Feedback Submission
To: ${TARGET_EMAIL}
From: ${feedback.name} <${feedback.email}>
Category: ${feedback.category}
Rating: ${feedback.rating}/5
Subject: ${feedback.subject}
Message:
${feedback.message}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10 max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Feedback Successfully Dispatched!
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Your feedback has been sent directly to the official mailbox{' '}
          <strong className="text-blue-600 font-semibold">{TARGET_EMAIL}</strong> using the Google Gmail API.
        </p>
      </div>

      {/* Delivery Receipt Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
            Delivery Receipt
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Delivered
          </span>
        </div>

        <div className="grid grid-cols-[100px_1fr] gap-2">
          <span className="text-slate-500">Destination:</span>
          <span className="font-medium text-slate-900 font-mono">{TARGET_EMAIL}</span>

          <span className="text-slate-500">Sender:</span>
          <span className="font-medium text-slate-900">{feedback.name} ({feedback.email})</span>

          <span className="text-slate-500">Category:</span>
          <span className="font-medium text-slate-900">{feedback.category}</span>

          <span className="text-slate-500">Subject:</span>
          <span className="font-medium text-slate-900 font-semibold">{feedback.subject}</span>

          {messageId && (
            <>
              <span className="text-slate-500">Gmail Msg ID:</span>
              <span className="font-mono text-slate-600 truncate">{messageId}</span>
            </>
          )}

          <span className="text-slate-500">Timestamp:</span>
          <span className="text-slate-700">{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Receipt' : 'Copy Submission Details'}</span>
        </button>

        <a
          href="https://mail.google.com/mail/u/0/#sent"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
        >
          <Mail className="w-4 h-4 text-slate-500" />
          <span>View in Gmail Sent Folder</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Submit Another Response</span>
        </button>
      </div>
    </div>
  );
};
