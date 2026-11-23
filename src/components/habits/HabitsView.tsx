import React, { useMemo, useState } from 'react';
import {
  Activity,
  Check,
  Edit3,
  Footprints,
  Moon,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { RunChecklistItem, RunLogEntry, SleepLogEntry } from '../../types';
import {
  computeSleepHours,
  createId,
  formatShortDate,
  formatTime12h,
  getTodayISO,
} from '../../utils/date';
import { WakeRampChart } from './WakeRampChart';

interface HabitsViewProps {
  sleepLogs: SleepLogEntry[];
  setSleepLogs: React.Dispatch<React.SetStateAction<SleepLogEntry[]>>;
  runLogs: RunLogEntry[];
  setRunLogs: React.Dispatch<React.SetStateAction<RunLogEntry[]>>;
  runChecklist: RunChecklistItem[];
  setRunChecklist: React.Dispatch<React.SetStateAction<RunChecklistItem[]>>;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  sleepLogs,
  setSleepLogs,
  runLogs,
  setRunLogs,
  runChecklist,
  setRunChecklist,
}) => {
  // Sleep form
  const [sleepDate, setSleepDate] = useState(getTodayISO());
  const [bedtime, setBedtime] = useState('00:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepNotes, setSleepNotes] = useState('');

  // Run form
  const [runDate, setRunDate] = useState(getTodayISO());
  const [runMinutes, setRunMinutes] = useState('45');
  const [runProtocol, setRunProtocol] = useState('2m run / 2m walk');
  const [runEffort, setRunEffort] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [runNotes, setRunNotes] = useState('');

  // Customizable checklist state
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [editingCheckId, setEditingCheckId] = useState<string | null>(null);
  const [editingCheckText, setEditingCheckText] = useState('');

  const previewSleepHours = useMemo(
    () => computeSleepHours(bedtime, wakeTime),
    [bedtime, wakeTime]
  );

  const sleepStats = useMemo(() => {
    if (sleepLogs.length === 0) {
      return { avgHours: 0, latestWake: '—', targetHitDays: 0 };
    }
    const sorted = [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date));
    const totalHours = sorted.reduce(
      (acc, entry) => acc + computeSleepHours(entry.bedtime, entry.wakeTime),
      0
    );
    const targetHitDays = sorted.filter(
      (entry) => computeSleepHours(entry.bedtime, entry.wakeTime) >= 7
    ).length;

    return {
      avgHours: Math.round((totalHours / sorted.length) * 10) / 10,
      latestWake: formatTime12h(sorted[0].wakeTime),
      targetHitDays,
    };
  }, [sleepLogs]);

  const runStats = useMemo(() => {
    const totalMins = runLogs.reduce((acc, r) => acc + r.totalMinutes, 0);
    const avgEffort =
      runLogs.length > 0
        ? (runLogs.reduce((acc, r) => acc + r.effort, 0) / runLogs.length).toFixed(1)
        : '—';
    return {
      sessions: runLogs.length,
      totalMins,
      avgEffort,
    };
  }, [runLogs]);

  const handleAddSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: SleepLogEntry = {
      id: createId('slp'),
      date: sleepDate,
      bedtime,
      wakeTime,
      notes: sleepNotes.trim(),
    };
    setSleepLogs((prev) => [entry, ...prev.filter((item) => item.date !== sleepDate)]);
    setSleepNotes('');
  };

  const handleAddRun = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Math.max(1, parseInt(runMinutes, 10) || 1);
    const entry: RunLogEntry = {
      id: createId('run'),
      date: runDate,
      totalMinutes: mins,
      protocol: runProtocol.trim() || '2m run / 2m walk',
      effort: runEffort,
      notes: runNotes.trim(),
    };
    setRunLogs((prev) => [entry, ...prev]);
    setRunNotes('');
  };

  // Checklist actions
  const toggleChecklist = (id: string) => {
    setRunChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newChecklistLabel.trim();
    if (!label) return;
    setRunChecklist((prev) => [...prev, { id: createId('chk'), label, checked: false }]);
    setNewChecklistLabel('');
  };

  const startRenameChecklist = (item: RunChecklistItem) => {
    setEditingCheckId(item.id);
    setEditingCheckText(item.label);
  };

  const saveRenameChecklist = (id: string) => {
    const cleaned = editingCheckText.trim();
    if (!cleaned) return;
    setRunChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label: cleaned } : item))
    );
    setEditingCheckId(null);
  };

  const deleteChecklistItem = (id: string) => {
    setRunChecklist((prev) => prev.filter((item) => item.id !== id));
    if (editingCheckId === id) setEditingCheckId(null);
  };

  const resetChecklistChecks = () => {
    setRunChecklist((prev) => prev.map((item) => ({ ...item, checked: false })));
  };

  const sortedSleep = useMemo(
    () => [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date)),
    [sleepLogs]
  );

  const sortedRuns = useMemo(
    () => [...runLogs].sort((a, b) => b.date.localeCompare(a.date)),
    [runLogs]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            Morning Run & Sleep Shift
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Lock in the 7:00 AM wake-up ramp, protect 7+ hours of sleep, and build aerobic base.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2">
            <span className="text-zinc-500">LATEST WAKE </span>
            <span className="font-semibold text-amber-300">{sleepStats.latestWake}</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2">
            <span className="text-zinc-500">AVG SLEEP </span>
            <span
              className={`font-semibold ${
                sleepStats.avgHours >= 7 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {sleepStats.avgHours}h
            </span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2">
            <span className="text-zinc-500">RUNS </span>
            <span className="font-semibold text-emerald-400">
              {runStats.sessions} ({runStats.totalMins}m)
            </span>
          </div>
        </div>
      </div>

      {/* Wake-Up Ramp Chart + Sleep Logger */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <WakeRampChart sleepLogs={sleepLogs} />
        </div>

        <form onSubmit={handleAddSleep} className="war-card p-4 sm:p-5 xl:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Log Sleep & Wake-Up</h3>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                previewSleepHours >= 7
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : previewSleepHours >= 6
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
              }`}
            >
              {previewSleepHours}h {previewSleepHours >= 7 ? '· 7h+ OK' : '· Under 7h'}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Logging for an existing date updates that day&apos;s entry cleanly.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] text-zinc-400">Date</label>
              <input
                type="date"
                value={sleepDate}
                onChange={(e) => setSleepDate(e.target.value)}
                className="war-input font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Bedtime</label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="war-input font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Wake-Up Time</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="war-input font-mono text-xs"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] text-zinc-400">Notes</label>
              <input
                type="text"
                placeholder="Energy level, caffeine cutoff, grogginess..."
                value={sleepNotes}
                onChange={(e) => setSleepNotes(e.target.value)}
                className="war-input text-xs"
              />
            </div>
          </div>

          <button type="submit" className="war-btn-primary mt-4 w-full text-xs">
            <Plus className="h-3.5 w-3.5" />
            Save Sleep Entry
          </button>

          {/* Compact Recent Sleep Entries */}
          <div className="mt-4 border-t border-zinc-800 pt-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Recent Sleep Log
            </div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {sortedSleep.map((entry) => {
                const hrs = computeSleepHours(entry.bedtime, entry.wakeTime);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-2.5 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 font-mono">
                        <span className="text-zinc-400">{formatShortDate(entry.date)}</span>
                        <span className="text-zinc-500">
                          {entry.bedtime} → <strong className="text-amber-300">{entry.wakeTime}</strong>
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            hrs >= 7
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : hrs >= 6
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {hrs}h
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="mt-0.5 truncate text-[11px] text-zinc-500">{entry.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSleepLogs((prev) => prev.filter((item) => item.id !== entry.id))
                      }
                      className="shrink-0 rounded p-1 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label="Delete sleep log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Row: Run/Walk Interval Log + Customizable Pre/Post-Run Checklist */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Run/Walk Interval Log */}
        <div className="war-card overflow-hidden xl:col-span-7">
          <div className="border-b border-zinc-800 px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Run / Walk Interval Log</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                <span>Sessions: <strong className="text-zinc-100">{runStats.sessions}</strong></span>
                <span>Avg Effort: <strong className="text-amber-300">{runStats.avgEffort}/5</strong></span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddRun} className="border-b border-zinc-800 bg-zinc-950/60 p-4 sm:px-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] text-zinc-400">Date</label>
                <input
                  type="date"
                  value={runDate}
                  onChange={(e) => setRunDate(e.target.value)}
                  className="war-input font-mono text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-zinc-400">Minutes</label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={runMinutes}
                  onChange={(e) => setRunMinutes(e.target.value)}
                  className="war-input font-mono text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <label className="mb-1 block text-[11px] text-zinc-400">Protocol</label>
                <input
                  type="text"
                  value={runProtocol}
                  onChange={(e) => setRunProtocol(e.target.value)}
                  placeholder="2m run / 2m walk"
                  className="war-input text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] text-zinc-400">Effort (1–5)</label>
                <div className="grid grid-cols-5 gap-1">
                  {([1, 2, 3, 4, 5] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setRunEffort(lvl)}
                      className={`rounded-md border py-1.5 font-mono text-xs font-semibold transition-colors ${
                        runEffort === lvl
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-9">
                <input
                  type="text"
                  placeholder="Session notes (breathing, knees, pace, intervals)..."
                  value={runNotes}
                  onChange={(e) => setRunNotes(e.target.value)}
                  className="war-input text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" className="war-btn-primary w-full text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Log Run
                </button>
              </div>
            </div>
          </form>

          <div className="divide-y divide-zinc-800/70">
            {sortedRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-zinc-900/40 sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400">
                      {formatShortDate(run.date)}
                    </span>
                    <span className="font-mono text-sm font-semibold text-emerald-400">
                      {run.totalMinutes}m
                    </span>
                    <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300">
                      {run.protocol}
                    </span>
                    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                      RPE {run.effort}/5
                    </span>
                  </div>
                  {run.notes && <p className="mt-1 text-xs text-zinc-400">{run.notes}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => setRunLogs((prev) => prev.filter((item) => item.id !== run.id))}
                  className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                  aria-label="Delete run log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {sortedRuns.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                No morning run sessions logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Customizable Pre/Post-Run Checklist */}
        <div className="war-card flex flex-col overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Pre / Post-Run Checklist</h3>
                <p className="text-[11px] text-zinc-500">
                  Editable & persisted locally. Rename, add, or remove items.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetChecklistChecks}
              className="war-btn-secondary px-2 py-1 text-[11px]"
              title="Uncheck all items for next run"
            >
              <RotateCcw className="h-3 w-3" />
              Uncheck All
            </button>
          </div>

          <div className="flex-1 divide-y divide-zinc-800/70">
            {runChecklist.map((item) => {
              const isEditing = editingCheckId === item.id;
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-2 px-4 py-3 hover:bg-zinc-900/40 sm:px-5"
                >
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="text"
                        value={editingCheckText}
                        onChange={(e) => setEditingCheckText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRenameChecklist(item.id);
                          if (e.key === 'Escape') setEditingCheckId(null);
                        }}
                        className="war-input py-1 text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveRenameChecklist(item.id)}
                        className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-zinc-950"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCheckId(null)}
                        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            item.checked
                              ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                              : 'border-zinc-700 bg-zinc-950 text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                        <span
                          className={`truncate text-sm ${
                            item.checked ? 'text-zinc-500 line-through' : 'text-zinc-200'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startRenameChecklist(item)}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                          aria-label="Rename checklist item"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteChecklistItem(item.id)}
                          className="rounded p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                          aria-label="Delete checklist item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {runChecklist.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                Checklist is empty. Add your own pre/post-run items below.
              </div>
            )}
          </div>

          <form
            onSubmit={addChecklistItem}
            className="flex gap-2 border-t border-zinc-800 bg-zinc-950/60 p-3.5"
          >
            <input
              type="text"
              placeholder="Add custom checklist item..."
              value={newChecklistLabel}
              onChange={(e) => setNewChecklistLabel(e.target.value)}
              className="war-input py-1.5 text-xs"
            />
            <button type="submit" className="war-btn-primary shrink-0 px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
