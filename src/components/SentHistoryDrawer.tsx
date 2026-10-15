import React from 'react';
import { X, Mail, Calendar, CheckCircle2, Star, Trash2 } from 'lucide-react';
import type { FeedbackData } from '../utils/emailHelper.ts';

export interface SentHistoryItem {
  id: string;
  feedback: FeedbackData;
  timestamp: string;
  messageId?: string;
}

interface SentHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SentHistoryItem[];
  onClear: () => void;
}

export const SentHistoryDrawer: React.FC<SentHistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <h2 id="history-drawer-title" className="text-base font-bold">
                Sent Feedback History
              </h2>
              <p className="text-xs text-slate-400">
                Messages sent to vexloraindia@gmail.com
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history drawer"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm">No feedback sent yet in this session.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {item.feedback.category}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.timestamp}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {item.feedback.subject}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded">
                  {item.feedback.message}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {item.feedback.rating}/5 rating
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Sent to vexloraindia@gmail.com
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
