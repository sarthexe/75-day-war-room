import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { DSA_WEEKS } from '../../data/seedData';
import { ProtocolTimerApi } from '../../hooks/useProtocolTimer';
import {
  CTracingGapItem,
  DsaProblem,
  ProblemDifficulty,
  SolvedMode,
} from '../../types';
import { createId, formatShortDate, getTodayISO } from '../../utils/date';
import { ProtocolTimerCard } from './ProtocolTimerCard';

interface DsaTrackerViewProps {
  timer: ProtocolTimerApi;
  cTracingChecklist: CTracingGapItem[];
  setCTracingChecklist: React.Dispatch<React.SetStateAction<CTracingGapItem[]>>;
  problems: DsaProblem[];
  setProblems: React.Dispatch<React.SetStateAction<DsaProblem[]>>;
}

const STL_PRESETS = [
  'unordered_map',
  'vector',
  'priority_queue',
  'stack',
  'queue',
  'deque',
  'set',
  'sort+lambda',
  'lower_bound',
  'pair',
];

const DIFF_STYLES: Record<ProblemDifficulty, string> = {
  Easy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Hard: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

export function needsReattempt(problem: DsaProblem): boolean {
  if (problem.reattemptResolved) return false;
  return problem.solvedSolo === 'With Hint' || problem.timeTakenMins > 35;
}

export const DsaTrackerView: React.FC<DsaTrackerViewProps> = ({
  timer,
  cTracingChecklist,
  setCTracingChecklist,
  problems,
  setProblems,
}) => {
  const [cGapOpen, setCGapOpen] = useState(true);
  const logFormRef = useRef<HTMLFormElement>(null);

  // Quick-add form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [weekId, setWeekId] = useState(DSA_WEEKS[0].id);
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>('Medium');
  const [timeTakenMins, setTimeTakenMins] = useState('25');
  const [solvedSolo, setSolvedSolo] = useState<SolvedMode>('Yes');
  const [selectedStl, setSelectedStl] = useState<string[]>(['unordered_map']);
  const [customStl, setCustomStl] = useState('');
  const [patternTrigger, setPatternTrigger] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filters
  const [filterWeek, setFilterWeek] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | ProblemDifficulty>('All');
  const [onlyReattempt, setOnlyReattempt] = useState(false);
  const [search, setSearch] = useState('');

  const weekStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of DSA_WEEKS) counts[w.id] = 0;
    for (const p of problems) {
      counts[p.weekId] = (counts[p.weekId] ?? 0) + 1;
    }
    return counts;
  }, [problems]);

  const totalTarget = useMemo(
    () => DSA_WEEKS.reduce((acc, w) => acc + w.targetCount, 0),
    []
  );

  const reattemptCount = useMemo(
    () => problems.filter((p) => needsReattempt(p)).length,
    [problems]
  );

  const cTracingDoneCount = useMemo(
    () => cTracingChecklist.filter((item) => item.checked).length,
    [cTracingChecklist]
  );

  const toggleStlPreset = (tag: string) => {
    setSelectedStl((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const addCustomStl = () => {
    const cleaned = customStl.trim();
    if (!cleaned) return;
    if (!selectedStl.includes(cleaned)) {
      setSelectedStl((prev) => [...prev, cleaned]);
    }
    setCustomStl('');
  };

  const handleCaptureMinutes = (mins: number) => {
    setTimeTakenMins(String(mins));
    logFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Problem name is required.');
      return;
    }
    if (!patternTrigger.trim()) {
      setFormError('Pattern Trigger (1-sentence note) is required to cement recall.');
      return;
    }

    const minsNum = Math.max(1, parseInt(timeTakenMins, 10) || 1);
    const entry: DsaProblem = {
      id: createId('dsa'),
      date: getTodayISO(),
      name: name.trim(),
      url: url.trim(),
      weekId,
      difficulty,
      timeTakenMins: minsNum,
      solvedSolo,
      stlUsed: selectedStl,
      patternTrigger: patternTrigger.trim(),
      reattemptResolved: false,
    };

    setProblems((prev) => [entry, ...prev]);
    setName('');
    setUrl('');
    setPatternTrigger('');
    setFormError(null);
  };

  const toggleTracingItem = (id: string) => {
    setCTracingChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const toggleReattemptResolved = (id: string) => {
    setProblems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, reattemptResolved: !p.reattemptResolved } : p
      )
    );
  };

  const deleteProblem = (id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id));
  };

  const filteredProblems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      if (filterWeek !== 'All' && p.weekId !== filterWeek) return false;
      if (filterDifficulty !== 'All' && p.difficulty !== filterDifficulty) return false;
      if (onlyReattempt && !needsReattempt(p)) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.patternTrigger.toLowerCase().includes(q) &&
        !p.stlUsed.some((s) => s.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [problems, filterWeek, filterDifficulty, onlyReattempt, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            C++ DSA & AlgoHunt Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            60-minute interview protocol, 5-week synced curriculum, and pattern-trigger retention.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2">
            <span className="text-zinc-500">SOLVED </span>
            <span className="font-bold text-emerald-400">{problems.length}</span>
            <span className="text-zinc-500"> / {totalTarget}</span>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <span className="text-amber-300/80">RE-ATTEMPT </span>
            <span className="font-bold text-amber-300">{reattemptCount}</span>
          </div>
        </div>
      </div>

      {/* Sticky 60-Minute Protocol Timer */}
      <ProtocolTimerCard timer={timer} onCaptureMinutes={handleCaptureMinutes} />

      {/* 5-Week Synced Roadmap */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">5-Week Synced Roadmap</h2>
          {filterWeek !== 'All' && (
            <button
              type="button"
              onClick={() => setFilterWeek('All')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Clear week filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {DSA_WEEKS.map((w) => {
            const solved = weekStats[w.id] ?? 0;
            const pct = Math.min(100, Math.round((solved / w.targetCount) * 100));
            const isSelected = filterWeek === w.id;

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setFilterWeek(isSelected ? 'All' : w.id)}
                className={`war-card flex flex-col justify-between p-4 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/[0.06]'
                    : 'hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      WEEK {w.weekNumber}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">{w.dateRange}</span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-zinc-200">
                    {w.title}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-zinc-400">Progress</span>
                    <span className="font-semibold text-zinc-100">
                      {solved} / {w.targetCount}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Week 2 Collapsible: GATE C-Tracing 10% Gap Checklist */}
        <div className="war-card overflow-hidden border-amber-500/25">
          <button
            type="button"
            onClick={() => setCGapOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/50 sm:px-5"
          >
            <div className="flex items-center gap-2.5">
              {cGapOpen ? (
                <ChevronDown className="h-4 w-4 text-amber-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-amber-400" />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">
                    Week 2 Sync: GATE C-Tracing 10% Gap Checklist
                  </span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                    {cTracingDoneCount}/{cTracingChecklist.length} mastered
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Bridge C++ STL interview habits with raw C exam-tracing pitfalls.
                </p>
              </div>
            </div>
          </button>

          {cGapOpen && (
            <div className="grid grid-cols-1 gap-2 border-t border-zinc-800/80 bg-zinc-950/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {cTracingChecklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleTracingItem(item.id)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                    item.checked
                      ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                      : 'border-zinc-800 bg-[#18181b] hover:border-zinc-700'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      item.checked
                        ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                        : 'border-zinc-700 bg-zinc-900 text-transparent'
                    }`}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <div>
                    <div
                      className={`text-xs font-medium ${
                        item.checked ? 'text-zinc-500 line-through' : 'text-zinc-100'
                      }`}
                    >
                      {item.label}
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{item.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Problem Log Quick-Add Form */}
      <form ref={logFormRef} onSubmit={handleAddProblem} className="war-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Log Solved Problem</h2>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          Problems solved With Hint or taking &gt;35 mins are automatically flagged for re-attempt.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-[11px] text-zinc-400">Problem Name *</label>
            <input
              type="text"
              placeholder="e.g. LRU Cache"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="war-input text-xs"
              required
            />
          </div>

          <div className="md:col-span-4">
            <label className="mb-1 block text-[11px] text-zinc-400">AlgoHunt / LeetCode URL</label>
            <input
              type="url"
              placeholder="https://leetcode.com/problems/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="war-input text-xs"
            />
          </div>

          <div className="md:col-span-4">
            <label className="mb-1 block text-[11px] text-zinc-400">Week / Topic</label>
            <select
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              className="war-select w-full text-xs"
            >
              {DSA_WEEKS.map((w) => (
                <option key={w.id} value={w.id}>
                  W{w.weekNumber}: {w.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] text-zinc-400">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
              className="war-select w-full text-xs"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] text-zinc-400">Time (mins)</label>
            <input
              type="number"
              min={1}
              max={240}
              value={timeTakenMins}
              onChange={(e) => setTimeTakenMins(e.target.value)}
              className="war-input font-mono text-xs"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-[11px] text-zinc-400">Solved Solo?</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['Yes', 'With Hint'] as SolvedMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSolvedSolo(mode)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                    solvedSolo === mode
                      ? mode === 'Yes'
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="mb-1 block text-[11px] text-zinc-400">
              Pattern Trigger (1-sentence required) *
            </label>
            <input
              type="text"
              placeholder="When you see X constraint, trigger Y data structure / invariant..."
              value={patternTrigger}
              onChange={(e) => setPatternTrigger(e.target.value)}
              className="war-input text-xs"
              required
            />
          </div>

          {/* C++ STL Tags */}
          <div className="md:col-span-12">
            <label className="mb-1.5 block text-[11px] text-zinc-400">C++ STL Used</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {STL_PRESETS.map((tag) => {
                const active = selectedStl.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleStlPreset(tag)}
                    className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                      active
                        ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}

              {selectedStl
                .filter((t) => !STL_PRESETS.includes(t))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    onClick={() => toggleStlPreset(custom)}
                    className="rounded-md border border-sky-500/40 bg-sky-500/15 px-2 py-1 font-mono text-[11px] text-sky-300"
                  >
                    {custom} ×
                  </button>
                ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="+ custom STL"
                  value={customStl}
                  onChange={(e) => setCustomStl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomStl();
                    }
                  }}
                  className="w-28 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500/60"
                />
                <button
                  type="button"
                  onClick={addCustomStl}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {formError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {formError}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button type="submit" className="war-btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" />
            Save Problem & Pattern Trigger
          </button>
        </div>
      </form>

      {/* Problem Log List + Filters */}
      <div className="war-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-800 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="war-select text-xs"
            >
              <option value="All">All Weeks</option>
              {DSA_WEEKS.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.weekNumber}: {w.title}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setFilterDifficulty(diff)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    filterDifficulty === diff
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOnlyReattempt((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                onlyReattempt
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RefreshCw className="h-3 w-3" />
              Needs Re-attempt ({reattemptCount})
            </button>
          </div>

          <div className="relative w-full lg:w-60">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search problem, trigger, STL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="war-input pl-8 text-xs"
            />
          </div>
        </div>

        <div className="divide-y divide-zinc-800/70">
          {filteredProblems.map((problem) => {
            const flagged = needsReattempt(problem);
            const weekObj = DSA_WEEKS.find((w) => w.id === problem.weekId);

            return (
              <div
                key={problem.id}
                className="flex flex-col gap-3 px-4 py-4 hover:bg-zinc-900/40 sm:px-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {problem.url ? (
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-100 hover:text-emerald-400"
                        >
                          {problem.name}
                          <ExternalLink className="h-3 w-3 text-zinc-500" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-zinc-100">{problem.name}</span>
                      )}

                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${DIFF_STYLES[problem.difficulty]}`}
                      >
                        {problem.difficulty}
                      </span>

                      {weekObj && (
                        <span className="rounded border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                          W{weekObj.weekNumber}
                        </span>
                      )}

                      <span className="font-mono text-[11px] text-zinc-400">
                        {problem.timeTakenMins}m
                      </span>

                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                          problem.solvedSolo === 'Yes'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {problem.solvedSolo === 'Yes' ? 'Solo' : 'With Hint'}
                      </span>

                      {flagged && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                          <RefreshCw className="h-2.5 w-2.5" />
                          Needs Re-attempt
                        </span>
                      )}

                      {problem.reattemptResolved && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Re-attempt Mastered
                        </span>
                      )}
                    </div>

                    <p className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-200">
                      <span className="font-mono font-semibold text-violet-400">TRIGGER:</span>{' '}
                      {problem.patternTrigger}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {problem.stlUsed.map((stl) => (
                        <span
                          key={stl}
                          className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-sky-300"
                        >
                          {stl}
                        </span>
                      ))}
                      <span className="ml-auto font-mono text-[10px] text-zinc-500">
                        {formatShortDate(problem.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {(flagged || problem.reattemptResolved) && (
                      <button
                        type="button"
                        onClick={() => toggleReattemptResolved(problem.id)}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300"
                      >
                        {problem.reattemptResolved ? 'Re-flag' : 'Mark Mastered'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteProblem(problem.id)}
                      className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label="Delete problem"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProblems.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-zinc-500">
              No problems match the current filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
