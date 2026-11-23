import { useCallback, useEffect, useRef, useState } from 'react';
import { playPhaseBeep } from '../utils/audio';

export interface ProtocolPhase {
  index: number;
  name: string;
  rangeLabel: string;
  description: string;
  startSec: number; // inclusive
  endSec: number;   // exclusive
  durationSec: number;
  accentClass: string;
  barClass: string;
}

export const TOTAL_PROTOCOL_SECONDS = 60 * 60; // 3600s

export const PROTOCOL_PHASES: ProtocolPhase[] = [
  {
    index: 0,
    name: 'Pure Attempt',
    rangeLabel: '00:00 – 20:00',
    description: 'Read constraints, brute force → optimal intuition (zero hints)',
    startSec: 0,
    endSec: 20 * 60,
    durationSec: 20 * 60,
    accentClass: 'text-emerald-400',
    barClass: 'bg-emerald-500',
  },
  {
    index: 1,
    name: 'Unblock & Code',
    rangeLabel: '20:00 – 35:00',
    description: 'Read intuition only if stuck, implement clean C++ solution',
    startSec: 20 * 60,
    endSec: 35 * 60,
    durationSec: 15 * 60,
    accentClass: 'text-sky-400',
    barClass: 'bg-sky-500',
  },
  {
    index: 2,
    name: 'STL Optimize',
    rangeLabel: '35:00 – 50:00',
    description: 'Refactor to idiomatic C++ STL (unordered_map, priority_queue, lambdas)',
    startSec: 35 * 60,
    endSec: 50 * 60,
    durationSec: 15 * 60,
    accentClass: 'text-amber-400',
    barClass: 'bg-amber-500',
  },
  {
    index: 3,
    name: 'Pattern Trigger Log',
    rangeLabel: '50:00 – 60:00',
    description: 'Write the 1-sentence Pattern Trigger and log complexity & STL tags',
    startSec: 50 * 60,
    endSec: 60 * 60,
    durationSec: 10 * 60,
    accentClass: 'text-violet-400',
    barClass: 'bg-violet-500',
  },
];

export function getPhaseForElapsed(elapsedSec: number): ProtocolPhase {
  if (elapsedSec >= TOTAL_PROTOCOL_SECONDS) {
    return PROTOCOL_PHASES[PROTOCOL_PHASES.length - 1];
  }
  return (
    PROTOCOL_PHASES.find((p) => elapsedSec >= p.startSec && elapsedSec < p.endSec) ??
    PROTOCOL_PHASES[0]
  );
}

export interface ProtocolTimerApi {
  elapsedSec: number;
  remainingTotalSec: number;
  phaseRemainingSec: number;
  activePhase: ProtocolPhase;
  isRunning: boolean;
  isFinished: boolean;
  soundEnabled: boolean;
  toggleRun: () => void;
  reset: () => void;
  skipPhase: () => void;
  jumpToPhase: (phaseIndex: number) => void;
  toggleSound: () => void;
}

export function useProtocolTimer(): ProtocolTimerApi {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPhaseIdxRef = useRef(0);

  const isFinished = elapsedSec >= TOTAL_PROTOCOL_SECONDS;
  const activePhase = getPhaseForElapsed(elapsedSec);
  const remainingTotalSec = Math.max(0, TOTAL_PROTOCOL_SECONDS - elapsedSec);
  const phaseRemainingSec = isFinished ? 0 : Math.max(0, activePhase.endSec - elapsedSec);

  useEffect(() => {
    if (!isRunning || isFinished) return;

    const timerId = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = Math.min(TOTAL_PROTOCOL_SECONDS, prev + 1);
        if (next >= TOTAL_PROTOCOL_SECONDS) {
          setIsRunning(false);
          if (soundEnabled) {
            playPhaseBeep(true);
          }
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRunning, isFinished, soundEnabled]);

  useEffect(() => {
    if (activePhase.index !== prevPhaseIdxRef.current) {
      if (isRunning && soundEnabled && activePhase.index > prevPhaseIdxRef.current) {
        playPhaseBeep(false);
      }
      prevPhaseIdxRef.current = activePhase.index;
    }
  }, [activePhase.index, isRunning, soundEnabled]);

  const toggleRun = useCallback(() => {
    setElapsedSec((prev) => {
      if (prev >= TOTAL_PROTOCOL_SECONDS) {
        prevPhaseIdxRef.current = 0;
        return 0;
      }
      return prev;
    });
    setIsRunning((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSec(0);
    prevPhaseIdxRef.current = 0;
  }, []);

  const skipPhase = useCallback(() => {
    setElapsedSec((prev) => {
      const current = getPhaseForElapsed(prev);
      const nextPhase = PROTOCOL_PHASES[current.index + 1];
      if (!nextPhase) {
        setIsRunning(false);
        if (soundEnabled) playPhaseBeep(true);
        return TOTAL_PROTOCOL_SECONDS;
      }
      prevPhaseIdxRef.current = nextPhase.index;
      if (soundEnabled) playPhaseBeep(false);
      return nextPhase.startSec;
    });
  }, [soundEnabled]);

  const jumpToPhase = useCallback((phaseIndex: number) => {
    const target = PROTOCOL_PHASES[phaseIndex];
    if (!target) return;
    prevPhaseIdxRef.current = target.index;
    setElapsedSec(target.startSec);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return {
    elapsedSec,
    remainingTotalSec,
    phaseRemainingSec,
    activePhase,
    isRunning,
    isFinished,
    soundEnabled,
    toggleRun,
    reset,
    skipPhase,
    jumpToPhase,
    toggleSound,
  };
}

export function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
