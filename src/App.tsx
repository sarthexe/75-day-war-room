import React, { useEffect, useState } from 'react';
import { CareerView } from './components/career/CareerView';
import { CommandCenterView } from './components/dashboard/CommandCenterView';
import { DsaTrackerView } from './components/dsa/DsaTrackerView';
import { GateTrackerView } from './components/gate/GateTrackerView';
import { HabitsView } from './components/habits/HabitsView';
import {
  DesktopSidebar,
  MobileHeaderAndTabs,
  NAV_ITEMS,
} from './components/layout/Navigation';
import { SettingsModal } from './components/layout/SettingsModal';
import {
  createInitialTodayState,
  NON_NEGOTIABLES,
  SEED_C_TRACING_CHECKLIST,
  SEED_DAILY_HISTORY,
  SEED_DSA_PROBLEMS,
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
import { STORAGE_KEYS, usePersistedState } from './hooks/usePersistedState';
import { useProtocolTimer } from './hooks/useProtocolTimer';
import {
  CTracingGapItem,
  DailyHistoryEntry,
  DsaProblem,
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
  const [cTracingChecklist, setCTracingChecklist] = usePersistedState<CTracingGapItem[]>(
    STORAGE_KEYS.cTracingChecklist,
    SEED_C_TRACING_CHECKLIST
  );
  const [dsaProblems, setDsaProblems] = usePersistedState<DsaProblem[]>(
    STORAGE_KEYS.dsaProblems,
    SEED_DSA_PROBLEMS
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

  // 60-minute DSA Protocol Timer lifted to App so it persists across view switches
  const protocolTimer = useProtocolTimer();

  // Track online/offline state for commute awareness
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

  // Live-sync today's completion snapshot into dailyHistory so Heatmap reflects live progress
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

  // Global keyboard shortcuts: 1-5 to switch views, Space to toggle DSA timer when on DSA view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
        return;
      }

      if (settingsOpen) return;

      const idx = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (idx !== -1) {
        e.preventDefault();
        setActiveView(NAV_ITEMS[idx].id);
        return;
      }

      if (e.code === 'Space' && activeView === 'dsa') {
        // Avoid double-triggering if user focused a button and pressed Space
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        protocolTimer.toggleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, settingsOpen, protocolTimer]);

  const daysToGate = daysUntil(GATE_TARGET_DATE);

  const navProps = {
    activeView,
    onSelectView: setActiveView,
    onOpenSettings: () => setSettingsOpen(true),
    isOnline,
    daysToGate,
    timerRunning: protocolTimer.isRunning,
    timerRemainingSec: protocolTimer.remainingTotalSec,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 md:flex-row">
      <DesktopSidebar {...navProps} />
      <MobileHeaderAndTabs {...navProps} />

      <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
        <div className="mx-auto max-w-6xl">
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

          {activeView === 'dsa' && (
            <DsaTrackerView
              timer={protocolTimer}
              cTracingChecklist={cTracingChecklist}
              setCTracingChecklist={setCTracingChecklist}
              problems={dsaProblems}
              setProblems={setDsaProblems}
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
      />
    </div>
  );
};

export default App;
