import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { createSeedBackup } from '../data/seedData';
import { WarRoomBackup } from '../types';

export const STORAGE_KEYS = {
  schedules: 'warroom:schedules',
  todayState: 'warroom:todayState',
  dailyHistory: 'warroom:dailyHistory',
  gateSubjects: 'warroom:gateSubjects',
  mockTests: 'warroom:mockTests',
  mistakes: 'warroom:mistakes',
  cTracingChecklist: 'warroom:cTracingChecklist',
  dsaProblems: 'warroom:dsaProblems',
  sleepLogs: 'warroom:sleepLogs',
  runLogs: 'warroom:runLogs',
  runChecklist: 'warroom:runChecklist',
  jobApplications: 'warroom:jobApplications',
  weekendProjects: 'warroom:weekendProjects',
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

const SYNC_EVENT = 'warroom:storage-sync';

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function usePersistedState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const initialRef = useRef<T>(
    typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
  );

  const [state, setState] = useState<T>(() => readFromStorage<T>(key, initialRef.current));

  const setPersistedState: Dispatch<SetStateAction<T>> = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore quota exceeded or private browsing write errors gracefully.
        }
        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    const handleSync = () => {
      setState(readFromStorage<T>(key, initialRef.current));
    };

    const handleCrossTab = (e: StorageEvent) => {
      if (e.key === null || e.key === key) {
        handleSync();
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleCrossTab);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleCrossTab);
    };
  }, [key]);

  return [state, setPersistedState];
}

export function exportAllWarRoomData(): WarRoomBackup {
  const seed = createSeedBackup();
  const data = {
    schedules: readFromStorage(STORAGE_KEYS.schedules, seed.data.schedules),
    todayState: readFromStorage(STORAGE_KEYS.todayState, seed.data.todayState),
    dailyHistory: readFromStorage(STORAGE_KEYS.dailyHistory, seed.data.dailyHistory),
    gateSubjects: readFromStorage(STORAGE_KEYS.gateSubjects, seed.data.gateSubjects),
    mockTests: readFromStorage(STORAGE_KEYS.mockTests, seed.data.mockTests),
    mistakes: readFromStorage(STORAGE_KEYS.mistakes, seed.data.mistakes),
    cTracingChecklist: readFromStorage(STORAGE_KEYS.cTracingChecklist, seed.data.cTracingChecklist),
    dsaProblems: readFromStorage(STORAGE_KEYS.dsaProblems, seed.data.dsaProblems),
    sleepLogs: readFromStorage(STORAGE_KEYS.sleepLogs, seed.data.sleepLogs),
    runLogs: readFromStorage(STORAGE_KEYS.runLogs, seed.data.runLogs),
    runChecklist: readFromStorage(STORAGE_KEYS.runChecklist, seed.data.runChecklist),
    jobApplications: readFromStorage(STORAGE_KEYS.jobApplications, seed.data.jobApplications),
    weekendProjects: readFromStorage(STORAGE_KEYS.weekendProjects, seed.data.weekendProjects),
  };

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function importAllWarRoomData(parsed: unknown): { ok: true } | { ok: false; error: string } {
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Invalid JSON file format.' };
  }

  const candidate = parsed as Partial<WarRoomBackup>;
  if (!candidate.data || typeof candidate.data !== 'object') {
    return { ok: false, error: 'Missing top-level "data" object in backup JSON.' };
  }

  const seed = createSeedBackup().data;
  const keys = Object.keys(STORAGE_KEYS) as StorageKeyName[];

  let importedKeys = 0;
  for (const k of keys) {
    if (k in candidate.data && candidate.data[k] !== undefined) {
      window.localStorage.setItem(STORAGE_KEYS[k], JSON.stringify(candidate.data[k]));
      importedKeys++;
    } else {
      window.localStorage.setItem(STORAGE_KEYS[k], JSON.stringify(seed[k]));
    }
  }

  if (importedKeys === 0) {
    return { ok: false, error: 'No recognized 75-Day War Room data keys found in file.' };
  }

  window.dispatchEvent(new Event(SYNC_EVENT));
  return { ok: true };
}

export function resetAllToSeedData(): void {
  const seed = createSeedBackup().data;
  const keys = Object.keys(STORAGE_KEYS) as StorageKeyName[];
  for (const k of keys) {
    window.localStorage.setItem(STORAGE_KEYS[k], JSON.stringify(seed[k]));
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function getWarRoomStorageBytes(): number {
  let bytes = 0;
  for (const storageKey of Object.values(STORAGE_KEYS)) {
    const val = window.localStorage.getItem(storageKey);
    if (val) {
      bytes += val.length * 2;
    }
  }
  return bytes;
}
