import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isCloudConfigured, supabase, SYNC_TABLE } from '../lib/supabase';
import { writeAllWarRoomData } from './usePersistedState';
import { stableStringify } from '../utils/stableStringify';
import type { WarRoomBackup } from '../types';

export type CloudSyncStatus = 'disabled' | 'signed-out' | 'idle' | 'syncing' | 'synced' | 'error';

const META_KEY = 'warroom:syncMeta';
const PUSH_DEBOUNCE_MS = 1600;
const POLL_INTERVAL_MS = 45_000;

interface SyncMeta {
  deviceId: string;
  lastCloudUpdatedAt: string | null;
  lastSyncedAt: string | null;
}

function readSyncMeta(): SyncMeta {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SyncMeta>;
      if (parsed.deviceId) {
        return {
          deviceId: parsed.deviceId,
          lastCloudUpdatedAt: parsed.lastCloudUpdatedAt ?? null,
          lastSyncedAt: parsed.lastSyncedAt ?? null,
        };
      }
    }
  } catch {
    // Corrupt meta; fall through and recreate it.
  }

  const fresh: SyncMeta = {
    deviceId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev_${Math.random().toString(36).slice(2)}`,
    lastCloudUpdatedAt: null,
    lastSyncedAt: null,
  };
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(fresh));
  } catch {
    // ignore
  }
  return fresh;
}

function writeSyncMeta(meta: SyncMeta): void {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function deviceLabel(): string {
  const platform = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
  return `${platform} · ${navigator.platform || 'web'}`;
}

export interface CloudSyncApi {
  status: CloudSyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  syncNow: () => void;
}

export function useCloudSync(user: User | null, data: WarRoomBackup['data']): CloudSyncApi {
  const dataHash = useMemo(() => stableStringify(data), [data]);

  const dataRef = useRef(data);
  const hashRef = useRef(dataHash);
  useEffect(() => {
    dataRef.current = data;
    hashRef.current = dataHash;
  }, [data, dataHash]);

  const [status, setStatus] = useState<CloudSyncStatus>(() => {
    if (!isCloudConfigured) return 'disabled';
    return user ? 'idle' : 'signed-out';
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => readSyncMeta().lastSyncedAt
  );
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const pushedHashRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const push = useCallback(async (userId: string) => {
    if (!supabase || inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus('syncing');
    setError(null);

    const payloadHash = hashRef.current;
    const nowIso = new Date().toISOString();

    const { data: row, error: upsertError } = await supabase
      .from(SYNC_TABLE)
      .upsert(
        {
          user_id: userId,
          data: dataRef.current,
          updated_at: nowIso,
          device_label: deviceLabel(),
        },
        { onConflict: 'user_id' }
      )
      .select('updated_at')
      .single();

    inFlightRef.current = false;

    if (upsertError) {
      setError(upsertError.message);
      setStatus('error');
      return;
    }

    const serverTime = (row as { updated_at?: string } | null)?.updated_at ?? nowIso;
    pushedHashRef.current = payloadHash;

    const meta = readSyncMeta();
    writeSyncMeta({ ...meta, lastCloudUpdatedAt: serverTime, lastSyncedAt: serverTime });

    setLastSyncedAt(serverTime);
    setStatus('synced');
  }, []);

  const adopt = useCallback((remote: WarRoomBackup['data'], remoteUpdatedAt: string) => {
    writeAllWarRoomData(remote);
    pushedHashRef.current = stableStringify(remote);

    const meta = readSyncMeta();
    writeSyncMeta({
      ...meta,
      lastCloudUpdatedAt: remoteUpdatedAt,
      lastSyncedAt: remoteUpdatedAt,
    });

    setLastSyncedAt(remoteUpdatedAt);
    setStatus('synced');
    setError(null);
  }, []);

  // Initial reconciliation when a user signs in (auth token refresh does not re-run it).
  useEffect(() => {
    if (!isCloudConfigured || !supabase) return;
    if (!user) {
      setStatus('signed-out');
      setReady(false);
      setActiveUserId(null);
      pushedHashRef.current = null;
      return;
    }
    if (activeUserId === user.id) return;

    setActiveUserId(user.id);
    let cancelled = false;
    const client = supabase;
    if (!client) return;

    const run = async () => {
      setStatus('syncing');
      setError(null);

      const { data: row, error: selectError } = await client
        .from(SYNC_TABLE)
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (selectError) {
        setError(selectError.message);
        setStatus('error');
        setReady(true);
        return;
      }

      if (!row) {
        await push(user.id);
        if (!cancelled) setReady(true);
        return;
      }

      const remote = row.data as WarRoomBackup['data'];
      const remoteUpdatedAt = row.updated_at as string;
      const sameContent = stableStringify(remote) === hashRef.current;
      const remoteTime = new Date(remoteUpdatedAt).getTime();
      const meta = readSyncMeta();
      const lastKnown = meta.lastCloudUpdatedAt
        ? new Date(meta.lastCloudUpdatedAt).getTime()
        : 0;

      if (sameContent) {
        pushedHashRef.current = hashRef.current;
        writeSyncMeta({
          ...meta,
          lastCloudUpdatedAt: remoteUpdatedAt,
          lastSyncedAt: remoteUpdatedAt,
        });
        setLastSyncedAt(remoteUpdatedAt);
        setStatus('synced');
      } else if (remoteTime > lastKnown) {
        adopt(remote, remoteUpdatedAt);
      } else {
        await push(user.id);
      }

      if (!cancelled) setReady(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [user, activeUserId, push, adopt]);

  // Debounced auto-push whenever local state changes.
  useEffect(() => {
    if (!isCloudConfigured || !user || !ready) return;
    if (dataHash === pushedHashRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void push(user.id);
    }, PUSH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [dataHash, user, ready, push]);

  // Periodic + on-focus pull so the other device's edits arrive without a reload.
  const pullIfNewer = useCallback(async () => {
    if (!supabase || !user) return;
    if (inFlightRef.current) return;
    // Local unsynced edits win; the debounced push handles them.
    if (hashRef.current !== pushedHashRef.current) return;

    const { data: row, error: selectError } = await supabase
      .from(SYNC_TABLE)
      .select('data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError || !row) return;

    const meta = readSyncMeta();
    const lastKnown = meta.lastCloudUpdatedAt
      ? new Date(meta.lastCloudUpdatedAt).getTime()
      : 0;

    if (new Date(row.updated_at as string).getTime() > lastKnown + 500) {
      adopt(row.data as WarRoomBackup['data'], row.updated_at as string);
    }
  }, [user, adopt]);

  useEffect(() => {
    if (!isCloudConfigured || !user || !ready) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pullIfNewer();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void pullIfNewer();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [user, ready, pullIfNewer]);

  const syncNow = useCallback(() => {
    if (!user || !ready) return;
    if (hashRef.current !== pushedHashRef.current) {
      void push(user.id);
    } else {
      void pullIfNewer();
    }
  }, [user, ready, push, pullIfNewer]);

  return { status, lastSyncedAt, error, syncNow };
}

export function describeSync(status: CloudSyncStatus, lastSyncedAt: string | null): string {
  switch (status) {
    case 'disabled':
      return 'Cloud not configured';
    case 'signed-out':
      return 'Sign in to sync';
    case 'idle':
      return 'Ready to sync';
    case 'syncing':
      return 'Syncing…';
    case 'synced':
      return lastSyncedAt ? `Synced ${formatRelative(lastSyncedAt)}` : 'Synced';
    case 'error':
      return 'Sync failed — retrying';
    default:
      return 'Sync idle';
  }
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'just now';
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 45) return 'just now';
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
