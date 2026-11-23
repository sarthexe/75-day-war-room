import React from 'react';
import {
  BookOpen,
  Briefcase,
  Cloud,
  CloudOff,
  Code2,
  Flame,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
  UserRound,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ViewId } from '../../types';
import { formatMmSs } from '../../hooks/useProtocolTimer';

interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Command Center', shortLabel: 'Today', shortcut: '1', icon: LayoutDashboard },
  { id: 'gate', label: 'GATE CSE 2027', shortLabel: 'GATE', shortcut: '2', icon: BookOpen },
  { id: 'dsa', label: 'C++ DSA', shortLabel: 'DSA', shortcut: '3', icon: Code2 },
  { id: 'habits', label: 'Run & Sleep', shortLabel: 'Habits', shortcut: '4', icon: Flame },
  { id: 'career', label: 'Jobs & Projects', shortLabel: 'Career', shortcut: '5', icon: Briefcase },
];

export type SyncTone = 'ok' | 'warn' | 'off' | 'busy';

interface NavigationProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  onOpenSettings: () => void;
  isOnline: boolean;
  daysToGate: number;
  timerRunning: boolean;
  timerRemainingSec: number;
  accountEmail: string | null;
  syncLabel: string;
  syncTone: SyncTone;
  onAccountClick: () => void;
  onSignOut: () => void;
}

const TONE_DOT: Record<SyncTone, string> = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
  off: 'bg-zinc-500',
  busy: 'bg-sky-400 animate-pulse',
};

const TONE_TEXT: Record<SyncTone, string> = {
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  off: 'text-zinc-500',
  busy: 'text-sky-400',
};

export const DesktopSidebar: React.FC<NavigationProps> = ({
  activeView,
  onSelectView,
  onOpenSettings,
  isOnline,
  daysToGate,
  timerRunning,
  timerRemainingSec,
  accountEmail,
  syncLabel,
  syncTone,
  onAccountClick,
  onSignOut,
}) => {
  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-zinc-800 md:bg-[#09090b]">
      <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400">
            75
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-100">75-Day War Room</div>
            <div className="font-mono text-[10px] text-zinc-500">
              GATE T-{Math.max(0, daysToGate)}D
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'border border-zinc-800 bg-[#18181b] text-zinc-100 shadow-sm'
                  : 'border border-transparent text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span>{item.label}</span>
              </span>
              <span className="flex items-center gap-1.5">
                {item.id === 'dsa' && timerRunning && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                    <Timer className="h-2.5 w-2.5 animate-pulse" />
                    {formatMmSs(timerRemainingSec)}
                  </span>
                )}
                <kbd
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                    active
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-300'
                      : 'border-zinc-800/80 bg-zinc-950 text-zinc-600'
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-zinc-800/80 p-3">
        {/* Account / sync */}
        <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-2.5">
          {accountEmail ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onAccountClick}
                className="min-w-0 flex-1 text-left"
                title="Cloud sync settings"
              >
                <div className="truncate font-mono text-[11px] text-zinc-200">{accountEmail}</div>
                <div className={`mt-0.5 flex items-center gap-1.5 text-[10px] ${TONE_TEXT[syncTone]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[syncTone]}`} />
                  <span className="truncate">{syncLabel}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-rose-400"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAccountClick}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-300">
                <Cloud className="h-3.5 w-3.5 text-zinc-400" />
                Sign in to sync
              </span>
              <span className="font-mono text-[10px] text-zinc-500">phone ↔ laptop</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-400">
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>{isOnline ? 'Local-First' : 'Offline Mode'}</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-500">PWA</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            Backup / Import / Reset
          </span>
        </button>
      </div>
    </aside>
  );
};

export const MobileHeaderAndTabs: React.FC<NavigationProps> = ({
  activeView,
  onSelectView,
  onOpenSettings,
  isOnline,
  daysToGate,
  timerRunning,
  timerRemainingSec,
  accountEmail,
  syncLabel,
  syncTone,
  onAccountClick,
}) => {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-[#09090b]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400">
            75
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">War Room</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
              <span>GATE T-{Math.max(0, daysToGate)}D</span>
              <span>·</span>
              {accountEmail ? (
                <span className={`flex items-center gap-1 ${TONE_TEXT[syncTone]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[syncTone]}`} />
                  {syncLabel}
                </span>
              ) : (
                <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                  {isOnline ? 'Local' : 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timerRunning && (
            <button
              type="button"
              onClick={() => onSelectView('dsa')}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-400"
            >
              <Timer className="h-3 w-3 animate-pulse" />
              {formatMmSs(timerRemainingSec)}
            </button>
          )}
          <button
            type="button"
            onClick={onAccountClick}
            className={`rounded-lg border bg-[#18181b] p-2 ${
              accountEmail
                ? 'border-emerald-500/30 text-emerald-400'
                : 'border-zinc-800 text-zinc-300'
            }`}
            aria-label={accountEmail ? 'Cloud sync' : 'Sign in to sync'}
          >
            {accountEmail ? <Cloud className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-lg border border-zinc-800 bg-[#18181b] p-2 text-zinc-300"
            aria-label="Open Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-[#09090b]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export const SyncOfflineBadge: React.FC<{ tone: SyncTone; label: string }> = ({ tone, label }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] ${TONE_TEXT[tone]}`}>
    <CloudOff className="h-3 w-3" />
    {label}
  </span>
);
