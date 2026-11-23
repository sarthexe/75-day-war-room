import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
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
  const [activeTab, setActiveTab] = useState<'sleep' | 'runs'>('sleep');

  // Sleep form
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [sleepDate, setSleepDate] = useState(getTodayISO());
  const [bedtime, setBedtime] = useState('00:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepNotes, setSleepNotes] = useState('');

  // Run form
  const [showRunForm, setShowRunForm] = useState(false);
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
      return { avgHours: 0, latestWake: '—' };
    }
    const sorted = [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date));
    const totalHours = sorted.reduce(
      (acc, entry) => acc + computeSleepHours(entry.bedtime, entry.wakeTime),
      0
    );
    return {
      avgHours: Math.round((totalHours / sorted.length) * 10) / 10,
      latestWake: formatTime12h(sorted[0].wakeTime),
    };
  }, [sleepLogs]);

  const runStats = useMemo(() => {
    const totalMins = runLogs.reduce((acc, r) => acc + r.totalMinutes, 0);
    return { sessions: runLogs.length, totalMins };
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
    setShowSleepForm(false);
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
    setShowRunForm(false);
  };

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

  const saveRenameChecklist = (id: string) => {
    const cleaned = editingCheckText.trim();
    if (!cleaned) return;
    setRunChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label: cleaned } : item))
    );
    setEditingCheckId(null);
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
      {/* Header + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Run & Sleep</h1>

        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('sleep')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'sleep'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sleep Shift
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('runs')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'runs'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Runs & Checklist
          </button>
        </div>
      </div>

      {/* Compact 3-Stat Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="war-card px-4 py-3">
          <div className="text-[11px] text-zinc-500">Latest Wake</div>
          <div className="mt-1 font-mono text-lg font-semibold text-amber-300">
            {sleepStats.latestWake}
          </div>
        </div>
        <div className="war-card px-4 py-3">
          <div className="text-[11px] text-zinc-500">Avg Sleep (Target 7h+)</div>
          <div
            className={`mt-1 font-mono text-lg font-semibold ${
              sleepStats.avgHours >= 7 ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {sleepStats.avgHours}h
          </div>
        </div>
        <div className="war-card px-4 py-3">
          <div className="text-[11px] text-zinc-500">Runs Logged</div>
          <div className="mt-1 font-mono text-lg font-semibold text-zinc-100">
            {runStats.sessions}{' '}
            <span className="text-xs font-normal text-zinc-500">({runStats.totalMins}m)</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Sleep Shift */}
      {activeTab === 'sleep' && (
        <div className="space-y-4">
          <WakeRampChart sleepLogs={sleepLogs} />

          <div className="war-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-medium text-zinc-100">Sleep Log ({sortedSleep.length})</h2>
              <button
                type="button"
                onClick={() => setShowSleepForm((prev) => !prev)}
                className={showSleepForm ? 'war-btn-secondary text-xs' : 'war-btn-primary text-xs'}
              >
                {showSleepForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showSleepForm ? 'Cancel' : 'Log Sleep'}
              </button>
            </div>

            {showSleepForm && (
              <form
                onSubmit={handleAddSleep}
                className="border-b border-zinc-800 bg-zinc-950/60 p-4 sm:px-5"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-[11px] text-zinc-500">Date</label>
                    <input
                      type="date"
                      value={sleepDate}
                      onChange={(e) => setSleepDate(e.target.value)}
                      className="war-input font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-zinc-500">Bedtime</label>
                    <input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="war-input font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-zinc-500">Wake-Up</label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="war-input font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Notes</span>
                      <span
                        className={`font-mono ${
                          previewSleepHours >= 7 ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {previewSleepHours}h {previewSleepHours >= 7 ? '✓' : '(<7h)'}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={sleepNotes}
                      onChange={(e) => setSleepNotes(e.target.value)}
                      className="war-input text-xs"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="submit" className="war-btn-primary text-xs">
                    Save Entry
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-zinc-800/60">
              {sortedSleep.map((entry) => {
                const hrs = computeSleepHours(entry.bedtime, entry.wakeTime);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-900/40 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                        <span className="text-zinc-400">{formatShortDate(entry.date)}</span>
                        <span className="text-zinc-500">
                          {entry.bedtime} → <strong className="text-amber-300">{entry.wakeTime}</strong>
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
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
                        <p className="mt-0.5 truncate text-xs text-zinc-500">{entry.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSleepLogs((prev) => prev.filter((item) => item.id !== entry.id))
                      }
                      className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      aria-label="Delete sleep log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {sortedSleep.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No sleep entries yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Runs & Checklist */}
      {activeTab === 'runs' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Run Log */}
          <div className="war-card overflow-hidden lg:col-span-7">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-medium text-zinc-100">
                Run / Walk Log ({sortedRuns.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowRunForm((prev) => !prev)}
                className={showRunForm ? 'war-btn-secondary text-xs' : 'war-btn-primary text-xs'}
              >
                {showRunForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showRunForm ? 'Cancel' : 'Log Run'}
              </button>
            </div>

            {showRunForm && (
              <form
                onSubmit={handleAddRun}
                className="border-b border-zinc-800 bg-zinc-950/60 p-4 sm:px-5"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[11px] text-zinc-500">Date</label>
                    <input
                      type="date"
                      value={runDate}
                      onChange={(e) => setRunDate(e.target.value)}
                      className="war-input font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-[11px] text-zinc-500">Minutes</label>
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
                  <div className="col-span-2 sm:col-span-5">
                    <label className="mb-1 block text-[11px] text-zinc-500">Protocol</label>
                    <input
                      type="text"
                      value={runProtocol}
                      onChange={(e) => setRunProtocol(e.target.value)}
                      className="war-input text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-5">
                    <label className="mb-1 block text-[11px] text-zinc-500">Effort (1–5)</label>
                    <div className="grid grid-cols-5 gap-1">
                      {([1, 2, 3, 4, 5] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setRunEffort(lvl)}
                          className={`rounded-md border py-1.5 font-mono text-xs font-medium ${
                            runEffort === lvl
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-7">
                    <label className="mb-1 block text-[11px] text-zinc-500">Notes</label>
                    <input
                      type="text"
                      placeholder="Pace, breathing, knees..."
                      value={runNotes}
                      onChange={(e) => setRunNotes(e.target.value)}
                      className="war-input text-xs"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="submit" className="war-btn-primary text-xs">
                    Save Run
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-zinc-800/60">
              {sortedRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-zinc-900/40 sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-zinc-400">{formatShortDate(run.date)}</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {run.totalMinutes}m
                      </span>
                      <span className="text-zinc-300">{run.protocol}</span>
                      <span className="font-mono text-[11px] text-amber-300">
                        RPE {run.effort}/5
                      </span>
                    </div>
                    {run.notes && <p className="mt-1 text-xs text-zinc-500">{run.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRunLogs((prev) => prev.filter((item) => item.id !== run.id))}
                    className="rounded p-1 text-zinc-500 hover:text-rose-400"
                    aria-label="Delete run log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {sortedRuns.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500">No runs logged yet.</div>
              )}
            </div>
          </div>

          {/* Pre/Post-Run Checklist */}
          <div className="war-card flex flex-col overflow-hidden lg:col-span-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-medium text-zinc-100">Pre / Post-Run Checklist</h2>
              <button
                type="button"
                onClick={() =>
                  setRunChecklist((prev) => prev.map((item) => ({ ...item, checked: false })))
                }
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <div className="flex-1 divide-y divide-zinc-800/60">
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
                          className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-zinc-950"
                        >
                          Save
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

                        <div className="flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCheckId(item.id);
                              setEditingCheckText(item.label);
                            }}
                            className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                            aria-label="Rename checklist item"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRunChecklist((prev) => prev.filter((c) => c.id !== item.id))
                            }
                            className="rounded p-1 text-zinc-500 hover:text-rose-400"
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
            </div>

            <form
              onSubmit={addChecklistItem}
              className="flex gap-2 border-t border-zinc-800/80 bg-zinc-950/50 p-3"
            >
              <input
                type="text"
                placeholder="Add item..."
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                className="war-input py-1.5 text-xs"
              />
              <button type="submit" className="war-btn-secondary shrink-0 px-2.5 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
