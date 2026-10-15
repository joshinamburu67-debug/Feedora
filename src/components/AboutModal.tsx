import React from 'react';
import { X, ShieldCheck, Mail, Clock, HelpCircle, Heart } from 'lucide-react';
import { TARGET_EMAIL } from '../utils/emailHelper.ts';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base">
              V
            </div>
            <div>
              <h2 id="about-dialog-title" className="text-base font-bold">
                About Vexlora India Feedback
              </h2>
              <p className="text-xs text-slate-400">Direct Communication Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Official Recipient Mailbox</span>
            </div>
            <p>
              Every response submitted here reaches <strong className="font-mono text-blue-800">{TARGET_EMAIL}</strong> without third-party intermediaries, directly into the Vexlora India product and leadership inbox.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" /> Response Timelines
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
              <li><strong>Urgent Issues:</strong> Reviewed within 4 to 12 hours.</li>
              <li><strong>Bug Reports &amp; Feature Requests:</strong> Triaged within 24 to 48 hours.</li>
              <li><strong>General Queries &amp; Feedback:</strong> Responded to within 2 business days.</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Data Privacy &amp; Gmail Permission
            </h3>
            <p>
              When you connect with Google, the app requests permission specifically to dispatch your feedback email directly to Vexlora India from your verified address. Your credentials and tokens are cached strictly in memory during your browser session and are never stored on external databases.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
