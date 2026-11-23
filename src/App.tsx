import React, { useEffect, useMemo, useState } from 'react';
import { AuthModal } from './components/auth/AuthModal';
import { CareerView } from './components/career/CareerView';
import { CommandCenterView } from './components/dashboard/CommandCenterView';
import { GateTrackerView } from './components/gate/GateTrackerView';
import { HabitsView } from './components/habits/HabitsView';
import {
  DesktopSidebar,
  MobileHeaderAndTabs,
  NAV_ITEMS,
  SyncTone,
} from './components/layout/Navigation';
import { SettingsModal } from './components/layout/SettingsModal';
import {
  createInitialTodayState,
  NON_NEGOTIABLES,
  SEED_DAILY_HISTORY,
  SEED_GATE_SUBJECTS,
  SEED_JOB_APPLICATIONS,
  SEED_MISTAKES,
  SEED_MOCK_TESTS,
  SEED_RUN_CHECKLIST,
  SEED_RUN_LOGS,
  SEED_SCHEDULES,
  SEED_SLEEP_LOGS,
  SEED_WEEKEND_PROJECTS,
} from './data/seedData';
import { useAuth } from './hooks/useAuth';
import { describeSync, useCloudSync } from './hooks/useCloudSync';
import { STORAGE_KEYS, usePersistedState } from './hooks/usePersistedState';
import type {
  DailyHistoryEntry,
  GateSubject,
  JobApplication,
  MistakeEntry,
  MockTestEntry,
  RunChecklistItem,
  RunLogEntry,
  ScheduleMap,
  SleepLogEntry,
  TodayState,
  ViewId,
  WarRoomBackup,
  WeekendProject,
} from './types';
import {
  daysUntil,
  GATE_TARGET_DATE,
  getScheduleKey,
  getTodayISO,
} from './utils/date';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  // Persisted application state
  const [schedules, setSchedules] = usePersistedState<ScheduleMap>(
    STORAGE_KEYS.schedules,
    SEED_SCHEDULES
  );
  const [todayState, setTodayState] = usePersistedState<TodayState>(
    STORAGE_KEYS.todayState,
    createInitialTodayState
  );
  const [dailyHistory, setDailyHistory] = usePersistedState<Record<string, DailyHistoryEntry>>(
    STORAGE_KEYS.dailyHistory,
    SEED_DAILY_HISTORY
  );
  const [gateSubjects, setGateSubjects] = usePersistedState<GateSubject[]>(
    STORAGE_KEYS.gateSubjects,
    SEED_GATE_SUBJECTS
  );
  const [mockTests, setMockTests] = usePersistedState<MockTestEntry[]>(
    STORAGE_KEYS.mockTests,
    SEED_MOCK_TESTS
  );
  const [mistakes, setMistakes] = usePersistedState<MistakeEntry[]>(
    STORAGE_KEYS.mistakes,
    SEED_MISTAKES
  );
  const [sleepLogs, setSleepLogs] = usePersistedState<SleepLogEntry[]>(
    STORAGE_KEYS.sleepLogs,
    SEED_SLEEP_LOGS
  );
  const [runLogs, setRunLogs] = usePersistedState<RunLogEntry[]>(
    STORAGE_KEYS.runLogs,
    SEED_RUN_LOGS
  );
  const [runChecklist, setRunChecklist] = usePersistedState<RunChecklistItem[]>(
    STORAGE_KEYS.runChecklist,
    SEED_RUN_CHECKLIST
  );
  const [jobApplications, setJobApplications] = usePersistedState<JobApplication[]>(
    STORAGE_KEYS.jobApplications,
    SEED_JOB_APPLICATIONS
  );
  const [weekendProjects, setWeekendProjects] = usePersistedState<WeekendProject[]>(
    STORAGE_KEYS.weekendProjects,
    SEED_WEEKEND_PROJECTS
  );

  // Cloud sync (Supabase)
  const auth = useAuth();

  const cloudPayload = useMemo<WarRoomBackup['data']>(
    () => ({
      schedules,
      todayState,
      dailyHistory,
      gateSubjects,
      mockTests,
      mistakes,
      sleepLogs,
      runLogs,
      runChecklist,
      jobApplications,
      weekendProjects,
    }),
    [
      schedules,
      todayState,
      dailyHistory,
      gateSubjects,
      mockTests,
      mistakes,
      sleepLogs,
      runLogs,
      runChecklist,
      jobApplications,
      weekendProjects,
    ]
  );

  const cloud = useCloudSync(auth.user, cloudPayload);

  const syncTone: SyncTone =
    cloud.status === 'synced'
      ? 'ok'
      : cloud.status === 'syncing'
        ? 'busy'
        : cloud.status === 'error'
          ? 'warn'
          : cloud.status === 'signed-out' || cloud.status === 'disabled'
            ? 'off'
            : 'warn';

  const syncLabel = describeSync(cloud.status, cloud.lastSyncedAt);

  const handleSignOut = () => {
    void auth.signOut();
  };

  // Track online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatic date rollover & archiving daily completion into 75-day heatmap history
  useEffect(() => {
    const checkDateRollover = () => {
      const currentISO = getTodayISO();
      if (todayState.date === currentISO) return;

      const scheduleKey = getScheduleKey(todayState.phase, todayState.dayType);
      const prevBlocks = schedules[scheduleKey] ?? [];
      const blocksCompleted = prevBlocks.filter((b) =>
        todayState.completedBlockIds.includes(b.id)
      ).length;
      const blocksTotal = prevBlocks.length;
      const nonNegHit = todayState.completedNonNegotiableIds.length;
      const nonNegTotal = NON_NEGOTIABLES.length;
      const totalItems = blocksTotal + nonNegTotal;
      const completionPct =
        totalItems > 0 ? Math.round(((blocksCompleted + nonNegHit) / totalItems) * 100) : 0;

      setDailyHistory((prev) => ({
        ...prev,
        [todayState.date]: {
          date: todayState.date,
          completionPct,
          blocksCompleted,
          blocksTotal,
          nonNegotiablesHit: nonNegHit,
          nonNegotiablesTotal: nonNegTotal,
        },
      }));

      setTodayState((prev) => ({
        ...prev,
        date: currentISO,
        completedBlockIds: [],
        completedNonNegotiableIds: [],
      }));
    };

    checkDateRollover();
    const intervalId = window.setInterval(checkDateRollover, 60_000);
    return () => window.clearInterval(intervalId);
  }, [todayState, schedules, setDailyHistory, setTodayState]);

  // Live-sync today's completion snapshot into dailyHistory
  useEffect(() => {
    const currentISO = getTodayISO();
    if (todayState.date !== currentISO) return;

    const scheduleKey = getScheduleKey(todayState.phase, todayState.dayType);
    const blocks = schedules[scheduleKey] ?? [];
    const blocksCompleted = blocks.filter((b) =>
      todayState.completedBlockIds.includes(b.id)
    ).length;
    const blocksTotal = blocks.length;
    const nonNegHit = todayState.completedNonNegotiableIds.length;
    const nonNegTotal = NON_NEGOTIABLES.length;
    const totalItems = blocksTotal + nonNegTotal;
    const completionPct =
      totalItems > 0 ? Math.round(((blocksCompleted + nonNegHit) / totalItems) * 100) : 0;

    setDailyHistory((prev) => {
      const existing = prev[currentISO];
      if (
        existing &&
        existing.completionPct === completionPct &&
        existing.blocksCompleted === blocksCompleted &&
        existing.blocksTotal === blocksTotal &&
        existing.nonNegotiablesHit === nonNegHit
      ) {
        return prev;
      }
      return {
        ...prev,
        [currentISO]: {
          date: currentISO,
          completionPct,
          blocksCompleted,
          blocksTotal,
          nonNegotiablesHit: nonNegHit,
          nonNegotiablesTotal: nonNegTotal,
        },
      };
    });
  }, [
    todayState.date,
    todayState.phase,
    todayState.dayType,
    todayState.completedBlockIds,
    todayState.completedNonNegotiableIds,
    schedules,
    setDailyHistory,
  ]);

  // Global keyboard shortcuts: 1-4 to switch views, Esc to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
        return;
      }

      if (e.key === 'Escape' && authOpen) {
        setAuthOpen(false);
        return;
      }

      if (settingsOpen || authOpen) return;

      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1) {
        e.preventDefault();
        setActiveView(NAV_ITEMS[idx].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, authOpen]);

  const daysToGate = daysUntil(GATE_TARGET_DATE);

  const navProps = {
    activeView,
    onSelectView: setActiveView,
    onOpenSettings: () => setSettingsOpen(true),
    isOnline,
    daysToGate,
    accountEmail: auth.email,
    syncLabel,
    syncTone,
    onAccountClick: () => setAuthOpen(true),
    onSignOut: handleSignOut,
  };

  const cloudPanelProps = {
    configured: auth.configured,
    email: auth.email,
    syncLabel,
    syncTone,
    syncError: cloud.error,
    onOpenAuth: () => {
      setSettingsOpen(false);
      setAuthOpen(true);
    },
    onSyncNow: cloud.syncNow,
    onSignOut: handleSignOut,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 md:flex-row">
      <DesktopSidebar {...navProps} />
      <MobileHeaderAndTabs {...navProps} />

      <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-6 sm:px-8 md:px-10 md:pb-14 md:pt-8">
        <div className="mx-auto max-w-4xl">
          {activeView === 'dashboard' && (
            <CommandCenterView
              schedules={schedules}
              setSchedules={setSchedules}
              todayState={todayState}
              setTodayState={setTodayState}
              dailyHistory={dailyHistory}
            />
          )}

          {activeView === 'gate' && (
            <GateTrackerView
              subjects={gateSubjects}
              setSubjects={setGateSubjects}
              mockTests={mockTests}
              setMockTests={setMockTests}
              mistakes={mistakes}
              setMistakes={setMistakes}
            />
          )}

          {activeView === 'habits' && (
            <HabitsView
              sleepLogs={sleepLogs}
              setSleepLogs={setSleepLogs}
              runLogs={runLogs}
              setRunLogs={setRunLogs}
              runChecklist={runChecklist}
              setRunChecklist={setRunChecklist}
            />
          )}

          {activeView === 'career' && (
            <CareerView
              jobs={jobApplications}
              setJobs={setJobApplications}
              projects={weekendProjects}
              setProjects={setWeekendProjects}
            />
          )}
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isOnline={isOnline}
        cloud={cloudPanelProps}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        auth={auth}
        status={cloud.status}
        lastSyncedAt={cloud.lastSyncedAt}
        syncError={cloud.error}
        onSyncNow={cloud.syncNow}
      />
    </div>
  );
};

export default App;
