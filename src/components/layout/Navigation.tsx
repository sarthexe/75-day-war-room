import React from 'react';
import {
  BookOpen,
  Briefcase,
  Cloud,
  Code2,
  ExternalLink,
  Flame,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  WifiOff,
} from 'lucide-react';
import { ALGOHUNT_URL } from '../../data/seedData';
import { ViewId } from '../../types';

interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Today', shortLabel: 'Today', shortcut: '1', icon: LayoutDashboard },
  { id: 'gate', label: 'GATE CSE', shortLabel: 'GATE', shortcut: '2', icon: BookOpen },
  { id: 'habits', label: 'Run & Sleep', shortLabel: 'Habits', shortcut: '3', icon: Flame },
  { id: 'career', label: 'Career', shortLabel: 'Career', shortcut: '4', icon: Briefcase },
];

export type SyncTone = 'ok' | 'warn' | 'off' | 'busy';

interface NavigationProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  onOpenSettings: () => void;
  isOnline: boolean;
  daysToGate: number;
  accountEmail: string | null;
  syncLabel: string;
  syncTone: SyncTone;
  onAccountClick: () => void;
  onSignOut: () => void;
}

const TONE_DOT: Record<SyncTone, string> = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
  off: 'bg-zinc-600',
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
  accountEmail,
  syncLabel,
  syncTone,
  onAccountClick,
  onSignOut,
}) => {
  return (
    <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-zinc-800/80 md:bg-[#09090b]">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] font-bold text-emerald-400">
            75
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-100">War Room</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
              <span>GATE T-{Math.max(0, daysToGate)}D</span>
              {!isOnline && (
                <span className="inline-flex items-center gap-0.5 text-amber-400">
                  · <WifiOff className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2.5 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
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
              <kbd
                className={`font-mono text-[10px] ${
                  active ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                {item.shortcut}
              </kbd>
            </button>
          );
        })}

        <div className="my-3 border-t border-zinc-800/70" />

        <a
          href={ALGOHUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-amber-300"
        >
          <span className="flex items-center gap-2.5">
            <Code2 className="h-4 w-4 text-amber-400/80 transition-colors group-hover:text-amber-300" />
            <span>AlgoHunt DSA</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover:text-amber-300" />
        </a>
      </nav>

      <div className="space-y-1.5 border-t border-zinc-800/80 p-2.5">
        {accountEmail ? (
          <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-zinc-900/60">
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
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-rose-400"
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
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-zinc-200"
          >
            <Cloud className="h-3.5 w-3.5 text-zinc-500" />
            <span>Sign in to sync</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-zinc-200"
        >
          <Settings className="h-3.5 w-3.5 text-zinc-500" />
          <span>Data & Settings</span>
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
  accountEmail,
  syncLabel,
  syncTone,
  onAccountClick,
}) => {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/95 px-4 py-2.5 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] font-bold text-emerald-400">
            75
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">War Room</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
              <span>GATE T-{Math.max(0, daysToGate)}D</span>
              {accountEmail ? (
                <>
                  <span>·</span>
                  <span className={`flex items-center gap-1 ${TONE_TEXT[syncTone]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[syncTone]}`} />
                    {syncLabel}
                  </span>
                </>
              ) : !isOnline ? (
                <>
                  <span>·</span>
                  <span className="text-amber-400">Offline</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-[#09090b]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
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

          <a
            href={ALGOHUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-amber-400/90 transition-colors hover:text-amber-300"
          >
            <span className="relative">
              <Code2 className="h-4 w-4" />
              <ExternalLink className="absolute -right-2 -top-1 h-2.5 w-2.5" />
            </span>
            <span>DSA</span>
          </a>
        </div>
      </nav>
    </>
  );
};
