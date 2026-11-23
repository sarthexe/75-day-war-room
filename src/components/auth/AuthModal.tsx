import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  Loader2,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import type { AuthApi } from '../../hooks/useAuth';
import type { CloudSyncStatus } from '../../hooks/useCloudSync';
import { describeSync } from '../../hooks/useCloudSync';
import { hasSupabaseKey, hasSupabaseUrl, supabase } from '../../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  auth: AuthApi;
  status: CloudSyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  onSyncNow: () => void;
}

const SETUP_SQL = `create table if not exists public.war_room_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  device_label text
);

alter table public.war_room_states enable row level security;

create policy "own state read"   on public.war_room_states for select using (auth.uid() = user_id);
create policy "own state insert" on public.war_room_states for insert with check (auth.uid() = user_id);
create policy "own state update" on public.war_room_states for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own state delete" on public.war_room_states for delete using (auth.uid() = user_id);`;

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  auth,
  status,
  lastSyncedAt,
  syncError,
  onSyncNow,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setInfo(null);
      setPassword('');
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.');
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);

    if (mode === 'signin') {
      const result = await auth.signIn(email, password);
      setBusy(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    } else {
      const result = await auth.signUp(email, password);
      setBusy(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setInfo(
          `Account created. Check ${email.trim()} for the confirmation link, then sign in here.`
        );
        setMode('signin');
      } else {
        onClose();
      }
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    await auth.signOut();
    setBusy(false);
    setInfo('Signed out. This device keeps its local data.');
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_SQL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy to clipboard — select the SQL manually.');
    }
  };

  const statusTone =
    status === 'synced'
      ? 'text-emerald-400'
      : status === 'error'
        ? 'text-rose-400'
        : status === 'syncing'
          ? 'text-sky-400'
          : 'text-zinc-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <Cloud className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {auth.email ? 'Cloud Sync' : 'Sign in to sync'}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Same war room on your laptop and phone. Local-first: the app keeps working offline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Not configured → setup guide */}
        {!auth.configured && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-200">
              <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <strong className="font-semibold">Cloud sync is not configured in this build.</strong>
                <p className="mt-1 text-amber-200/80">
                  Add two environment variables in Vercel (and locally), then redeploy.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 font-mono text-[11px] text-zinc-300 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span>VITE_SUPABASE_URL</span>
                <span className={hasSupabaseUrl ? 'text-emerald-400' : 'text-rose-400'}>
                  {hasSupabaseUrl ? 'Detected' : 'Missing in build'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>VITE_SUPABASE_ANON_KEY</span>
                <span className={hasSupabaseKey ? 'text-emerald-400' : 'text-rose-400'}>
                  {hasSupabaseKey ? 'Detected' : 'Missing in build'}
                </span>
              </div>
              <div className="pt-1 text-[10px] text-zinc-500">
                Also accepts VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.
                After saving env vars in Vercel, trigger a fresh Redeploy.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSetup((prev) => !prev)}
              className="text-xs font-medium text-emerald-400 hover:underline"
            >
              {showSetup ? 'Hide database setup SQL' : 'Show database setup SQL'}
            </button>

            {showSetup && (
              <div className="space-y-2">
                <pre className="max-h-56 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-[10px] leading-relaxed text-zinc-300">
                  {SETUP_SQL}
                </pre>
                <button type="button" onClick={copySql} className="war-btn-secondary text-xs">
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy SQL
                    </>
                  )}
                </button>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Run this in the Supabase SQL editor. Then in Authentication → URL Configuration set
                  your Vercel domain as the Site URL so confirmation links resolve.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Signed in → account panel */}
        {auth.configured && auth.email && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Signed in as</div>
              <div className="mt-0.5 truncate font-mono text-sm text-zinc-100">{auth.email}</div>
              <div className={`mt-1.5 flex items-center gap-1.5 font-mono text-[11px] ${statusTone}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {describeSync(status, lastSyncedAt)}
              </div>
              {syncError && (
                <p className="mt-1.5 text-[11px] text-rose-400">{syncError}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onSyncNow}
                disabled={status === 'syncing'}
                className="war-btn-primary flex-1 text-xs"
              >
                {status === 'syncing' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sync now
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={busy}
                className="war-btn-secondary flex-1 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-500">
              Changes push automatically ~2s after you edit. When you open the app on the other
              device, the newest version wins. Signing out keeps this device&apos;s local copy.
            </p>
          </div>
        )}

        {/* Signed out → login / signup form */}
        {auth.configured && !auth.email && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="inline-flex w-full rounded-lg border border-zinc-800 bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'signin'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'signup'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create account
              </button>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="war-input text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="war-input text-sm"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {info && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="war-btn-primary w-full text-xs">
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'signin' ? (
                'Sign in & sync'
              ) : (
                'Create account'
              )}
            </button>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-[11px] leading-relaxed text-zinc-400">
              <strong className="text-zinc-200">First sync on a new device:</strong> sign in and the
              app pulls your cloud snapshot. If this device already has newer local work, that local
              data is pushed instead — so export a JSON backup first if you are unsure.
            </div>
          </form>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-zinc-300"
          >
            Continue without syncing →
          </button>
          {supabase && (
            <span className="font-mono text-[10px] text-zinc-600">Supabase · RLS protected</span>
          )}
        </div>
      </div>
    </div>
  );
};
