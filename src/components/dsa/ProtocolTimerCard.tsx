import React from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  formatMmSs,
  PROTOCOL_PHASES,
  ProtocolTimerApi,
  TOTAL_PROTOCOL_SECONDS,
} from '../../hooks/useProtocolTimer';

interface ProtocolTimerCardProps {
  timer: ProtocolTimerApi;
  onCaptureMinutes: (mins: number) => void;
}

export const ProtocolTimerCard: React.FC<ProtocolTimerCardProps> = ({
  timer,
  onCaptureMinutes,
}) => {
  const {
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
  } = timer;

  const elapsedMins = Math.max(1, Math.round(elapsedSec / 60));

  return (
    <div className="war-card sticky top-2 z-20 border-zinc-800 bg-[#18181b]/95 p-4 shadow-lg backdrop-blur sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Timer readout & active phase */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                isRunning
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400'
              }`}
            >
              <Timer className={`h-5 w-5 ${isRunning ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
                  {formatMmSs(remainingTotalSec)}
                </span>
                <div className="text-left font-mono text-[11px] leading-tight text-zinc-500">
                  <div>ELAPSED {formatMmSs(elapsedSec)}</div>
                  <div className={activePhase.accentClass}>
                    PHASE -{formatMmSs(phaseRemainingSec)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l border-zinc-800 pl-0 sm:pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                PHASE {activePhase.index + 1}/4
              </span>
              <span className={`text-sm font-semibold ${activePhase.accentClass}`}>
                {isFinished ? 'Protocol Complete!' : activePhase.name}
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                ({activePhase.rangeLabel})
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">{activePhase.description}</p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleRun} className="war-btn-primary text-xs">
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? 'Pause' : isFinished ? 'Restart' : elapsedSec > 0 ? 'Resume' : 'Start 60m'}
            <kbd className="ml-1 hidden rounded bg-zinc-950/30 px-1 py-0.5 font-mono text-[10px] sm:inline">
              Space
            </kbd>
          </button>

          <button
            type="button"
            onClick={skipPhase}
            disabled={isFinished}
            className="war-btn-secondary text-xs disabled:opacity-40"
            title="Skip to next phase"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip Phase
          </button>

          <button
            type="button"
            onClick={reset}
            className="war-btn-secondary px-2.5 text-xs"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className={`war-btn-secondary px-2.5 text-xs ${
              soundEnabled ? 'text-emerald-400' : 'text-zinc-500'
            }`}
            title={soundEnabled ? 'Mute phase chime' : 'Unmute phase chime'}
            aria-label="Toggle phase sound"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {elapsedSec >= 60 && (
            <button
              type="button"
              onClick={() => onCaptureMinutes(elapsedMins)}
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 font-mono text-[11px] font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
            >
              Fill {elapsedMins}m → Log
            </button>
          )}
        </div>
      </div>

      {/* 4-Phase Proportional Segmented Progress Bar */}
      <div className="mt-4 grid grid-cols-12 gap-1.5">
        {PROTOCOL_PHASES.map((phase) => {
          const colSpan =
            phase.durationSec === 20 * 60
              ? 'col-span-4'
              : phase.durationSec === 15 * 60
                ? 'col-span-3'
                : 'col-span-2';

          let fillPct = 0;
          if (elapsedSec >= phase.endSec) {
            fillPct = 100;
          } else if (elapsedSec > phase.startSec) {
            fillPct = ((elapsedSec - phase.startSec) / phase.durationSec) * 100;
          }

          const isCurrent = !isFinished && activePhase.index === phase.index;

          return (
            <button
              key={phase.index}
              type="button"
              onClick={() => jumpToPhase(phase.index)}
              className={`${colSpan} group text-left`}
              title={`Jump to ${phase.name} (${phase.rangeLabel})`}
            >
              <div className="mb-1 flex items-center justify-between gap-1 text-[10px]">
                <span
                  className={`truncate font-medium ${
                    isCurrent ? phase.accentClass : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  {phase.name}
                </span>
                <span className="hidden font-mono text-zinc-600 sm:inline">
                  {Math.round(phase.durationSec / 60)}m
                </span>
              </div>
              <div
                className={`h-2 w-full overflow-hidden rounded-full bg-zinc-900 ${
                  isCurrent ? 'ring-1 ring-zinc-600' : ''
                }`}
              >
                <div
                  className={`h-full transition-all duration-300 ${phase.barClass}`}
                  style={{ width: `${Math.min(100, Math.max(0, fillPct))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-zinc-600">
        <span>00:00</span>
        <span>
          Total Progress: {Math.round((elapsedSec / TOTAL_PROTOCOL_SECONDS) * 100)}%
        </span>
        <span>60:00</span>
      </div>
    </div>
  );
};
