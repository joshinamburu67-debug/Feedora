import React from 'react';
import { Mail, AlertCircle, Send, X, ShieldAlert } from 'lucide-react';
import { TARGET_EMAIL, type FeedbackData } from '../utils/emailHelper.ts';

interface ConfirmationModalProps {
  isOpen: boolean;
  feedback: FeedbackData;
  onConfirm: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  feedback,
  onConfirm,
  onCancel,
  isSending,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-800/80 rounded-xl border border-blue-700/50">
              <Mail className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 id="confirm-dialog-title" className="text-lg font-bold">
                Confirm Feedback Dispatch
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Review email details before sending via Gmail API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            aria-label="Close modal"
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>End-User Authorization Notice:</strong> With your permission, this action will immediately send an email message on your behalf from your authenticated Gmail address to{' '}
              <span className="font-semibold text-amber-950">{TARGET_EMAIL}</span>.
            </div>
          </div>

          {/* Email Preview Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-700">
            <div className="grid grid-cols-[80px_1fr] gap-2 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-500">To:</span>
              <span className="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
                {TARGET_EMAIL}
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-500">From:</span>
              <span className="font-medium text-slate-900">
                {feedback.name} &lt;{feedback.email}&gt;
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-500">Category:</span>
              <span className="font-medium text-slate-800">
                {feedback.category} &bull; Priority: {feedback.priority} &bull; Rating: {feedback.rating}/5 ★
              </span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-500">Subject:</span>
              <span className="font-semibold text-slate-900">
                [Vexlora Feedback] [{feedback.category}] {feedback.subject}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block mb-1">Message Preview:</span>
              <div className="max-h-36 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200 text-slate-800 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                {feedback.message}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Dispatching Email...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm &amp; Send to Vexlora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
