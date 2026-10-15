import React from 'react';
import { Sparkles, Check, X, ArrowRight, Wand2 } from 'lucide-react';
import type { EnhanceResponse } from '../services/geminiClient.ts';

interface AiEnhancerModalProps {
  isOpen: boolean;
  originalSubject: string;
  originalMessage: string;
  enhancement: EnhanceResponse | null;
  onApply: (enhancedSubject: string, enhancedMessage: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const AiEnhancerModal: React.FC<AiEnhancerModalProps> = ({
  isOpen,
  originalSubject,
  originalMessage,
  enhancement,
  onApply,
  onClose,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <h2 id="ai-modal-title" className="text-lg font-bold flex items-center gap-2">
                <span>Gemini Feedback Refinement</span>
                <span className="text-[10px] font-semibold uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/40">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Polish clarity, tone, and impact for vexloraindia@gmail.com
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-600 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Enhancing feedback with Gemini...</p>
                <p className="text-xs text-slate-500 mt-1">Refining structure, tone, and actionability</p>
              </div>
            </div>
          ) : enhancement ? (
            <div className="space-y-4">
              {/* Summary of improvements */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                <Wand2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Key Enhancement: </strong>
                  {enhancement.improvementsSummary}
                </div>
              </div>

              {/* Subject Comparison */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Suggested Subject Line
                </label>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-900">
                  {enhancement.enhancedSubject}
                </div>
              </div>

              {/* Message Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Your Draft
                    </span>
                    <span className="text-[11px] text-slate-400">Original</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {originalMessage}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Enhanced Version
                    </span>
                    <span className="text-[11px] text-indigo-500 font-medium">Recommended</span>
                  </div>
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs text-slate-800 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                    {enhancement.enhancedMessage}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No enhancement data available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            Keep Original Draft
          </button>
          <button
            type="button"
            disabled={!enhancement || isLoading}
            onClick={() => {
              if (enhancement) {
                onApply(enhancement.enhancedSubject, enhancement.enhancedMessage);
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply AI Enhancements</span>
          </button>
        </div>
      </div>
    </div>
  );
};
