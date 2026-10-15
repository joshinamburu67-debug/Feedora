import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Sparkles,
  Send,
  Star,
  AlertCircle,
  HelpCircle,
  Wand2,
  Bug,
  Lightbulb,
  Rocket,
  Headphones,
  Briefcase,
  MessageSquare,
  Check,
  Flame,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  type FeedbackData,
  validateFeedback,
  TARGET_EMAIL,
} from '../utils/emailHelper.ts';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { requestGeminiAnalyze, type AnalyzeResponse } from '../services/geminiClient.ts';

interface FeedbackFormProps {
  user: User | null;
  onSignIn: () => void;
  isSigningIn: boolean;
  onRequestConfirm: (data: FeedbackData) => void;
  onOpenAiEnhance: (subject: string, message: string, style: 'professional' | 'structured_bug' | 'concise') => void;
  externalFeedbackUpdate?: { subject?: string; message?: string } | null;
}

const CATEGORIES: Array<{
  id: FeedbackData['category'];
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  { id: 'Product Improvement', label: 'Product Improvement', icon: <Rocket className="w-4 h-4" />, desc: 'UX, speed, or workflows' },
  { id: 'Bug Report', label: 'Bug Report', icon: <Bug className="w-4 h-4" />, desc: 'Errors or broken features' },
  { id: 'Feature Request', label: 'Feature Request', icon: <Lightbulb className="w-4 h-4" />, desc: 'New capabilities you need' },
  { id: 'Customer Support', label: 'Customer Support', icon: <Headphones className="w-4 h-4" />, desc: 'Assistance with account/usage' },
  { id: 'Partnership', label: 'Partnership', icon: <Briefcase className="w-4 h-4" />, desc: 'Business or enterprise inquiry' },
  { id: 'General', label: 'General Feedback', icon: <MessageSquare className="w-4 h-4" />, desc: 'Thoughts, questions, or praise' },
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  user,
  onSignIn,
  isSigningIn,
  onRequestConfirm,
  onOpenAiEnhance,
  externalFeedbackUpdate,
}) => {
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<FeedbackData['category']>('Product Improvement');
  const [priority, setPriority] = useState<FeedbackData['priority']>('Normal');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeResponse | null>(null);

  // Sync when user changes or external AI enhancement applies
  React.useEffect(() => {
    if (user) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  React.useEffect(() => {
    if (externalFeedbackUpdate) {
      if (externalFeedbackUpdate.subject !== undefined) setSubject(externalFeedbackUpdate.subject);
      if (externalFeedbackUpdate.message !== undefined) setMessage(externalFeedbackUpdate.message);
    }
  }, [externalFeedbackUpdate]);

  const handleRatingClick = (r: number) => {
    setRating(r);
  };


  const handleAnalyzeWithGemini = async () => {
    if (!message || message.trim().length < 10) {
      setErrors((prev) => ({
        ...prev,
        message: 'Please write at least 10 characters before analyzing with AI.',
      }));
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await requestGeminiAnalyze(subject, message, category, rating);
      setAiAnalysis(result);
      if (result.urgencyLevel && ['Low', 'Normal', 'High', 'Urgent'].includes(result.urgencyLevel)) {
        setPriority(result.urgencyLevel as FeedbackData['priority']);
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentData: FeedbackData = {
      name: name.trim(),
      email: email.trim(),
      category,
      priority,
      rating,
      subject: subject.trim(),
      message: message.trim(),
      aiSummary: aiAnalysis?.summary,
      aiTone: aiAnalysis?.tone,
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent} (${window.innerWidth}x${window.innerHeight})` : undefined,
    };

    const validation = validateFeedback(currentData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    // Check if user is authenticated with Google (required to send via Gmail API)
    if (!user) {
      // Highlight sign-in necessity
      setErrors({
        auth: 'Please connect your Google account below so your feedback can be dispatched directly to vexloraindia@gmail.com via Gmail.',
      });
      return;
    }

    // Trigger confirmation modal (MANDATORY per Workspace guidelines)
    onRequestConfirm(currentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Banner: Recipient Information */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Recipient Verified
              </span>
              <span className="text-xs text-blue-300">Vexlora India Feedback Channel</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Share Your Insights with Vexlora India
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              All responses submitted through this form are formatted and dispatched directly to{' '}
              <span className="font-mono font-semibold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700/50">
                {TARGET_EMAIL}
              </span>{' '}
              via the Google Gmail integration.
            </p>
          </div>

          {!user && (
            <div className="flex-shrink-0 bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 max-w-xs space-y-2">
              <p className="text-xs text-slate-300">
                Connect your Google account to authorize instant delivery to Vexlora India:
              </p>
              <GoogleSignInButton
                onClick={onSignIn}
                isLoading={isSigningIn}
                text="Sign in to Send"
                className="w-full text-xs py-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Auth Error Banner if needed */}
      {errors.auth && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{errors.auth}</span>
          </div>
          <GoogleSignInButton
            onClick={onSignIn}
            isLoading={isSigningIn}
            text="Connect Google"
            className="text-xs py-1.5 px-3 flex-shrink-0"
          />
        </div>
      )}

      {/* Main Feedback Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">

        {/* Sender details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="feedback-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Your Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Ramesh Patel"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition ${
                errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="feedback-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Your Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="e.g. ramesh@gmail.com"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition ${
                errors.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Category Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Feedback Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority & Star Rating row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Urgency / Priority
            </label>
            <div className="flex gap-2">
              {(['Low', 'Normal', 'High', 'Urgent'] as const).map((p) => {
                const isSelected = priority === p;
                const colors = {
                  Low: 'hover:bg-slate-200 text-slate-700',
                  Normal: 'hover:bg-blue-100 text-blue-700',
                  High: 'hover:bg-amber-100 text-amber-700',
                  Urgent: 'hover:bg-rose-100 text-rose-700',
                };
                const activeColors = {
                  Low: 'bg-slate-600 text-white border-slate-600',
                  Normal: 'bg-blue-600 text-white border-blue-600',
                  High: 'bg-amber-600 text-white border-amber-600',
                  Urgent: 'bg-rose-600 text-white border-rose-600',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                      isSelected
                        ? activeColors[p]
                        : `border-slate-300 bg-white ${colors[p]}`
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Overall Experience Rating: <span className="text-amber-600 font-bold">{rating}/5 Stars</span>
            </label>
            <div className="flex items-center gap-1.5" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    aria-label={`Rate ${star} stars`}
                    className="p-1 hover:scale-110 transition cursor-pointer text-amber-400 hover:text-amber-500"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-slate-500 ml-2">
                {rating === 5
                  ? 'Exceptional'
                  : rating === 4
                  ? 'Very Good'
                  : rating === 3
                  ? 'Satisfactory'
                  : rating === 2
                  ? 'Needs Work'
                  : 'Needs Urgent Attention'}
              </span>
            </div>
          </div>
        </div>

        {/* Subject input with AI Generator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="feedback-subject" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => onOpenAiEnhance(subject, message, 'concise')}
              disabled={!message || message.length < 10}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-40 transition cursor-pointer"
              title="Generate a crisp subject line with Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Subject Suggestion</span>
            </button>
          </div>
          <input
            id="feedback-subject"
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
            }}
            placeholder="e.g. Navigation lag in dashboard reports table"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition ${
              errors.subject ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.subject && <p className="text-xs text-rose-600 mt-1">{errors.subject}</p>}
        </div>

        {/* Message Textarea & Gemini Toolbar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="feedback-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Feedback Message <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {message.length} characters (min 10)
            </span>
          </div>

          <textarea
            id="feedback-message"
            rows={6}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
            }}
            placeholder="Describe your feedback, thoughts, or experience in detail. What works well? What should Vexlora India improve or build next?"
            className={`w-full p-3.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans transition ${
              errors.message ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
            }`}
          />
          {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message}</p>}

          {/* AI Refinement & Analysis Toolbar */}
          <div className="mt-2.5 p-3 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Gemini Intelligence:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAiEnhance(subject, message, 'professional')}
                disabled={!message || message.length < 10}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-medium border border-indigo-200 shadow-2xs transition disabled:opacity-40 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Refine &amp; Polish</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAiEnhance(subject, message, 'structured_bug')}
                disabled={!message || message.length < 10}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-medium border border-indigo-200 shadow-2xs transition disabled:opacity-40 cursor-pointer"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Format as Bug/Request</span>
              </button>

              <button
                type="button"
                onClick={handleAnalyzeWithGemini}
                disabled={isAnalyzing || !message || message.length < 10}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-2xs transition disabled:opacity-40 cursor-pointer"
              >
                {isAnalyzing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Analyze Tone &amp; Urgency</span>
              </button>
            </div>
          </div>

          {/* AI Analysis Preview if analyzed */}
          {aiAnalysis && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Gemini Assessment for Vexlora Team
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-200/70 text-blue-800">
                  Tone: {aiAnalysis.tone}
                </span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">{aiAnalysis.summary}</p>
              {aiAnalysis.keyTopics?.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Keywords:</span>
                  {aiAnalysis.keyTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-200"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target Mailbox: <strong className="text-slate-800">{TARGET_EMAIL}</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user ? (
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-md transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit to vexloraindia@gmail.com</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Review &amp; Send Feedback</span>
                </button>
                <GoogleSignInButton
                  onClick={onSignIn}
                  isLoading={isSigningIn}
                  text="Connect Gmail First"
                  className="text-xs py-2 px-3 w-full sm:w-auto"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
