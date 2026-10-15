/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth.ts';
import { sendGmailMessage } from './services/gmailApi.ts';
import { requestGeminiEnhance, type EnhanceResponse } from './services/geminiClient.ts';
import {
  type FeedbackData,
  buildRfc2822Email,
  TARGET_EMAIL,
} from './utils/emailHelper.ts';
import { Header } from './components/Header.tsx';
import { FeedbackForm } from './components/FeedbackForm.tsx';
import { ConfirmationModal } from './components/ConfirmationModal.tsx';
import { SuccessView } from './components/SuccessView.tsx';
import { AiEnhancerModal } from './components/AiEnhancerModal.tsx';
import { SentHistoryDrawer, type SentHistoryItem } from './components/SentHistoryDrawer.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { AlertCircle, HelpCircle, Mail, Sparkles, Shield, Heart } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal & view states
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackData | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackData | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | undefined>();
  const [feedbackUpdate, setFeedbackUpdate] = useState<{ subject?: string; message?: string } | null>(null);

  // AI Refinement modal state
  const [aiModal, setAiModal] = useState<{
    isOpen: boolean;
    subject: string;
    message: string;
    style: 'professional' | 'structured_bug' | 'concise';
    enhancement: EnhanceResponse | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    subject: '',
    message: '',
    style: 'professional',
    enhancement: null,
    isLoading: false,
  });

  // History & About drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [sentHistory, setSentHistory] = useState<SentHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('vexlora_sent_feedback');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vexlora_sent_feedback', JSON.stringify(sentHistory));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [sentHistory]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(
        err.message || 'Google sign-in could not be completed. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  // Triggered when user submits valid form
  const handleRequestConfirm = (data: FeedbackData) => {
    setPendingFeedback(data);
    setErrorMessage(null);
  };

  // User confirmed send in the modal
  const handleConfirmSend = async () => {
    if (!pendingFeedback) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      // 1. Dispatch feedback to server endpoint
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingFeedback),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server failed to process feedback submission.');
      }

      const result = await response.json();
      const messageId = result.messageId || `VEX-${Date.now().toString(36).toUpperCase()}`;

      // 2. Save to session history
      const historyRecord: SentHistoryItem = {
        id: messageId,
        feedback: pendingFeedback,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        messageId: messageId,
      };
      setSentHistory((prev) => [historyRecord, ...prev]);

      // 3. Update UI to success screen
      setLastMessageId(messageId);
      setSubmittedFeedback(pendingFeedback);
      setPendingFeedback(null);
    } catch (err: any) {
      console.error('Failed to dispatch feedback:', err);
      setErrorMessage(
        err.message ||
          'Failed to submit feedback to vexloraindia@gmail.com. Please check your network connection.'
      );
    } finally {
      setIsSending(false);
    }
  };

  // AI Refinement handler
  const handleOpenAiEnhance = async (
    subj: string,
    msg: string,
    style: 'professional' | 'structured_bug' | 'concise'
  ) => {
    setAiModal({
      isOpen: true,
      subject: subj,
      message: msg,
      style,
      enhancement: null,
      isLoading: true,
    });

    try {
      const response = await requestGeminiEnhance(subj, msg, style);
      setAiModal((prev) => ({
        ...prev,
        enhancement: response,
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Enhance failed:', err);
      setAiModal((prev) => ({
        ...prev,
        isLoading: false,
      }));
      setErrorMessage('Gemini AI enhancement could not be generated at this time.');
    }
  };

  const handleApplyAiEnhancement = (enhancedSubject: string, enhancedMessage: string) => {
    setFeedbackUpdate({
      subject: enhancedSubject,
      message: enhancedMessage,
    });
    setAiModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleResetForm = () => {
    setSubmittedFeedback(null);
    setPendingFeedback(null);
    setFeedbackUpdate({ subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        sentCount={sentHistory.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Error Toast Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Notice</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-100 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switch: Success Screen vs Feedback Form */}
        {submittedFeedback ? (
          <SuccessView
            feedback={submittedFeedback}
            messageId={lastMessageId}
            onReset={handleResetForm}
          />
        ) : (
          <FeedbackForm
            user={user}
            onSignIn={handleSignIn}
            isSigningIn={isSigningIn}
            onRequestConfirm={handleRequestConfirm}
            onOpenAiEnhance={handleOpenAiEnhance}
            externalFeedbackUpdate={feedbackUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-blue-600 font-medium transition cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>About Vexlora India Feedback</span>
            </button>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              Direct to: <strong className="text-slate-700">{TARGET_EMAIL}</strong>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Powered by Gemini 3.8 Flash &amp; Google Workspace Gmail API
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} Vexlora India. All feedback submissions are transmitted with end-user authorization.
          </p>
        </div>
      </footer>

      {/* Confirmation Modal (MANDATORY per Google Workspace Skill) */}
      {pendingFeedback && (
        <ConfirmationModal
          isOpen={!!pendingFeedback}
          feedback={pendingFeedback}
          onConfirm={handleConfirmSend}
          onCancel={() => setPendingFeedback(null)}
          isSending={isSending}
        />
      )}

      {/* AI Refinement Modal */}
      <AiEnhancerModal
        isOpen={aiModal.isOpen}
        originalSubject={aiModal.subject}
        originalMessage={aiModal.message}
        enhancement={aiModal.enhancement}
        onApply={handleApplyAiEnhancement}
        onClose={() => setAiModal((prev) => ({ ...prev, isOpen: false }))}
        isLoading={aiModal.isLoading}
      />

      {/* Sent History Drawer */}
      <SentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={sentHistory}
        onClear={() => setSentHistory([])}
      />

      {/* About & SLA Information Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
