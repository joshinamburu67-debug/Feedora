import React from 'react';
import type { User } from 'firebase/auth';
import { Mail, ShieldCheck, CheckCircle2, History, LogOut } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { TARGET_EMAIL } from '../utils/emailHelper.ts';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  sentCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  isSigningIn,
  sentCount,
  onOpenHistory,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-inner">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">Vexlora India</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                Official Feedback
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Direct dispatch to:</span>
              <strong className="text-blue-300 underline font-medium">{TARGET_EMAIL}</strong>
            </p>
          </div>
        </div>

        {/* Right actions & User auth */}
        <div className="flex items-center gap-3">
          {sentCount > 0 && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="View submissions history"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Sent Logs</span>
              <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {sentCount}
              </span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/80 pl-2.5 pr-2 py-1.5 rounded-lg border border-slate-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-blue-400/40 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <span>{user.displayName || 'Google Account'}</span>
                  <span title="Gmail API Connected" className="inline-flex">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[130px]">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Sign out"
                title="Disconnect Google Account"
                className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={onSignIn}
              isLoading={isSigningIn}
              text="Connect Gmail"
              className="py-1.5 text-xs shadow-none border-slate-600"
            />
          )}
        </div>
      </div>
    </header>
  );
};
