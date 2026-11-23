import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { NON_NEGOTIABLES } from '../../data/seedData';
import {
  BlockCategory,
  DailyHistoryEntry,
  DayTypeId,
  PhaseId,
  ScheduleMap,
  TimeBlock,
  TodayState,
} from '../../types';
import {
  createId,
  daysUntil,
  GATE_TARGET_DATE,
  getScheduleKey,
  isBlockCurrentlyActive,
  LWD_TARGET_DATE,
} from '../../utils/date';
import { Heatmap75 } from './Heatmap75';

interface CommandCenterViewProps {
  schedules: ScheduleMap;
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleMap>>;
  todayState: TodayState;
  setTodayState: React.Dispatch<React.SetStateAction<TodayState>>;
  dailyHistory: Record<string, DailyHistoryEntry>;
}

const CATEGORY_STYLES: Record<BlockCategory, string> = {
  health: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  gate: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  dsa: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  work: 'border-zinc-700 bg-zinc-800/80 text-zinc-300',
  commute: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  personal: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
  project: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  sleep: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
};

const CATEGORY_OPTIONS: BlockCategory[] = [
  'gate',
  'dsa',
  'health',
  'work',
  'commute',
  'project',
  'personal',
  'sleep',
];

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  schedules,
  setSchedules,
  todayState,
  setTodayState,
  dailyHistory,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add / Edit form states
  const [formStart, setFormStart] = useState('18:00');
  const [formEnd, setFormEnd] = useState('19:00');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState<BlockCategory>('gate');

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const scheduleKey = getScheduleKey(todayState.phase, todayState.dayType);
  const blocks = schedules[scheduleKey] ?? [];

  const daysToLwd = daysUntil(LWD_TARGET_DATE, now);
  const daysToGate = daysUntil(GATE_TARGET_DATE, now);

  const todayCompletion = useMemo(() => {
    const completedBlocks = blocks.filter((b) => todayState.completedBlockIds.includes(b.id)).length;
    const totalBlocks = blocks.length;
    const nonNegHit = todayState.completedNonNegotiableIds.length;
    const totalItems = totalBlocks + NON_NEGOTIABLES.length;
    const pct = totalItems > 0 ? Math.round(((completedBlocks + nonNegHit) / totalItems) * 100) : 0;
    return { completedBlocks, totalBlocks, nonNegHit, pct };
  }, [blocks, todayState.completedBlockIds, todayState.completedNonNegotiableIds]);

  const setPhase = (phase: PhaseId) => {
    setTodayState((prev) => ({ ...prev, phase }));
  };

  const setDayType = (dayType: DayTypeId) => {
    setTodayState((prev) => ({ ...prev, dayType }));
  };

  const toggleBlock = (blockId: string) => {
    setTodayState((prev) => {
      const exists = prev.completedBlockIds.includes(blockId);
      return {
        ...prev,
        completedBlockIds: exists
          ? prev.completedBlockIds.filter((id) => id !== blockId)
          : [...prev.completedBlockIds, blockId],
      };
    });
  };

  const toggleNonNegotiable = (id: string) => {
    setTodayState((prev) => {
      const exists = prev.completedNonNegotiableIds.includes(id);
      return {
        ...prev,
        completedNonNegotiableIds: exists
          ? prev.completedNonNegotiableIds.filter((item) => item !== id)
          : [...prev.completedNonNegotiableIds, id],
      };
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    setSchedules((prev) => {
      const updated = [...(prev[scheduleKey] ?? [])];
      const [item] = updated.splice(index, 1);
      updated.splice(targetIdx, 0, item);
      return { ...prev, [scheduleKey]: updated };
    });
  };

  const deleteBlock = (id: string) => {
    setSchedules((prev) => ({
      ...prev,
      [scheduleKey]: (prev[scheduleKey] ?? []).filter((b) => b.id !== id),
    }));
    setTodayState((prev) => ({
      ...prev,
      completedBlockIds: prev.completedBlockIds.filter((cid) => cid !== id),
    }));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditBlock = (block: TimeBlock) => {
    setShowAddForm(false);
    setEditingId(block.id);
    setFormStart(block.startTime);
    setFormEnd(block.endTime);
    setFormTitle(block.title);
    setFormSubtitle(block.subtitle);
    setFormCategory(block.category);
  };

  const saveEditBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formTitle.trim()) return;
    setSchedules((prev) => ({
      ...prev,
      [scheduleKey]: (prev[scheduleKey] ?? []).map((b) =>
        b.id === editingId
          ? {
              ...b,
              startTime: formStart,
              endTime: formEnd,
              title: formTitle.trim(),
              subtitle: formSubtitle.trim(),
              category: formCategory,
            }
          : b
      ),
    }));
    setEditingId(null);
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const newBlock: TimeBlock = {
      id: createId('blk'),
      startTime: formStart,
      endTime: formEnd,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      category: formCategory,
    };
    setSchedules((prev) => ({
      ...prev,
      [scheduleKey]: [...(prev[scheduleKey] ?? []), newBlock],
    }));
    setFormTitle('');
    setFormSubtitle('');
    setShowAddForm(false);
  };

  const formattedClock = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header & Live Countdowns */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
            <Clock className="h-3 w-3 text-emerald-400" />
            <span>{formattedDate}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-200">{formattedClock}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Execute the timetable. Protect sleep & run. Stack daily non-negotiables.
          </p>
        </div>

        {/* Countdown Cards */}
        <div className="grid grid-cols-2 gap-3 sm:w-auto sm:min-w-[360px]">
          <div className="war-card relative overflow-hidden p-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              LWD Countdown
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-amber-400 sm:text-3xl">
                {Math.max(0, daysToLwd)}
              </span>
              <span className="font-mono text-xs text-zinc-400">days</span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-zinc-500">Dec 31, 2026</div>
          </div>

          <div className="war-card relative overflow-hidden border-emerald-500/25 p-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              GATE CSE 2027
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-emerald-400 sm:text-3xl">
                {Math.max(0, daysToGate)}
              </span>
              <span className="font-mono text-xs text-zinc-400">days</span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-zinc-500">Feb 6, 2027</div>
          </div>
        </div>
      </div>

      {/* Mode Switchers */}
      <div className="war-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Transition Phase
          </div>
          <div className="inline-flex flex-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setPhase('phase1')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                todayState.phase === 'phase1'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Phase 1: Notice Period <span className="hidden font-mono text-zinc-400 sm:inline">(Nov 24 – Dec 31)</span>
            </button>
            <button
              type="button"
              onClick={() => setPhase('phase2')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                todayState.phase === 'phase2'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Phase 2: Full-Time Grind <span className="hidden font-mono text-emerald-400/70 sm:inline">(Jan 1 – Feb 5)</span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Day Type
          </div>
          <div className="inline-flex flex-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(
              [
                { id: 'weekday', label: 'Weekday' },
                { id: 'weekend_gf', label: 'Weekend – GF Day' },
                { id: 'weekend_grind', label: 'Weekend – Full Grind' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDayType(option.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  todayState.dayType === option.id
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Non-Negotiables Strip */}
      <div className="war-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Daily Non-Negotiables</h2>
          </div>
          <span className="font-mono text-xs text-zinc-400">
            <span className="font-semibold text-emerald-400">{todayCompletion.nonNegHit}</span>/
            {NON_NEGOTIABLES.length} locked in
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {NON_NEGOTIABLES.map((item) => {
            const checked = todayState.completedNonNegotiableIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleNonNegotiable(item.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.98] ${
                  checked
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-950/50'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    checked
                      ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Daily Timetable */}
      <div className="war-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-4 w-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Interactive Daily Timetable</h2>
              <p className="font-mono text-[11px] text-zinc-500">
                {todayCompletion.completedBlocks}/{todayCompletion.totalBlocks} blocks done · Overall today:{' '}
                <span className="text-emerald-400">{todayCompletion.pct}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormStart('18:00');
                setFormEnd('19:00');
                setFormTitle('');
                setFormSubtitle('');
                setFormCategory('gate');
                setShowAddForm((prev) => !prev);
              }}
              className="war-btn-secondary text-xs"
            >
              {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showAddForm ? 'Cancel' : 'Add Block'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-zinc-900">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${todayCompletion.pct}%` }}
          />
        </div>

        {/* Add Block Inline Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddBlock}
            className="border-b border-zinc-800 bg-zinc-950/70 p-4 sm:px-5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-zinc-500">Start</label>
                <input
                  type="time"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="war-input font-mono text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-zinc-500">End</label>
                <input
                  type="time"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="war-input font-mono text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] text-zinc-500">Title</label>
                <input
                  type="text"
                  placeholder="e.g. PYQ Drill"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="war-input text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] text-zinc-500">Focus / Notes</label>
                <input
                  type="text"
                  placeholder="Optional details"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="war-input text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-zinc-500">Tag</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as BlockCategory)}
                  className="war-select w-full text-xs capitalize"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="war-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="war-btn-primary text-xs">
                Save Block
              </button>
            </div>
          </form>
        )}

        {/* Block Rows */}
        <div className="divide-y divide-zinc-800/70">
          {blocks.map((block, index) => {
            const checked = todayState.completedBlockIds.includes(block.id);
            const isLive = isBlockCurrentlyActive(block.startTime, block.endTime, now);
            const isEditing = editingId === block.id;
            const timeLabel =
              block.startTime === block.endTime
                ? block.startTime
                : `${block.startTime} – ${block.endTime}`;

            if (isEditing) {
              return (
                <form
                  key={block.id}
                  onSubmit={saveEditBlock}
                  className="bg-zinc-950/80 p-4 sm:px-5"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-2">
                      <input
                        type="time"
                        value={formStart}
                        onChange={(e) => setFormStart(e.target.value)}
                        className="war-input font-mono text-xs"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="time"
                        value={formEnd}
                        onChange={(e) => setFormEnd(e.target.value)}
                        className="war-input font-mono text-xs"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="war-input text-xs"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        className="war-input text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as BlockCategory)}
                        className="war-select w-full text-xs capitalize"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="war-btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="war-btn-primary text-xs">
                      Update
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={block.id}
                className={`group flex flex-col gap-2.5 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                  isLive
                    ? 'bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/35'
                    : checked
                      ? 'bg-zinc-950/35'
                      : 'hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-start gap-3 sm:items-center">
                  <button
                    type="button"
                    onClick={() => toggleBlock(block.id)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all sm:mt-0 ${
                      checked
                        ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-950 text-transparent hover:border-zinc-500'
                    }`}
                    aria-label={`Toggle ${block.title}`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-[116px] shrink-0 font-mono text-xs text-zinc-400">
                    {timeLabel}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          checked ? 'text-zinc-500 line-through' : 'text-zinc-100'
                        }`}
                      >
                        {block.title}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${CATEGORY_STYLES[block.category]}`}
                      >
                        {block.category}
                      </span>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    {block.subtitle && (
                      <p className={`mt-0.5 text-xs ${checked ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Block Controls */}
                <div className="flex items-center justify-end gap-1 pl-8 sm:pl-0 sm:opacity-70 sm:transition-opacity sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-25"
                    title="Move up"
                    aria-label="Move block up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 1)}
                    disabled={index === blocks.length - 1}
                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-25"
                    title="Move down"
                    aria-label="Move block down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditBlock(block)}
                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                    title="Edit block"
                    aria-label="Edit block"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id)}
                    className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                    title="Delete block"
                    aria-label="Delete block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
              <CheckCircle2 className="h-8 w-8 text-zinc-700" />
              <p className="mt-2 text-sm">No time blocks in this schedule yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* 75-Day Heatmap */}
      <Heatmap75 history={dailyHistory} />
    </div>
  );
};
