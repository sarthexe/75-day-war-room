import React from 'react';
import {
  BookOpen,
  Briefcase,
  Code2,
  Flame,
  LayoutDashboard,
  Settings,
  Timer,
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

interface NavigationProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  onOpenSettings: () => void;
  isOnline: boolean;
  daysToGate: number;
  timerRunning: boolean;
  timerRemainingSec: number;
}

export const DesktopSidebar: React.FC<NavigationProps> = ({
  activeView,
  onSelectView,
  onOpenSettings,
  isOnline,
  daysToGate,
  timerRunning,
  timerRemainingSec,
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

      <div className="border-t border-zinc-800/80 p-3 space-y-2">
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
              <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                {isOnline ? 'Local' : 'Offline'}
              </span>
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
