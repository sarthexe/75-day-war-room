import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react';
import {
  GateSubject,
  GateTier,
  MistakeEntry,
  MockTestEntry,
  SubjectStatus,
} from '../../types';
import { createId } from '../../utils/date';
import { MistakeNotebook } from './MistakeNotebook';
import { MockTrendChart } from './MockTrendChart';

interface GateTrackerViewProps {
  subjects: GateSubject[];
  setSubjects: React.Dispatch<React.SetStateAction<GateSubject[]>>;
  mockTests: MockTestEntry[];
  setMockTests: React.Dispatch<React.SetStateAction<MockTestEntry[]>>;
  mistakes: MistakeEntry[];
  setMistakes: React.Dispatch<React.SetStateAction<MistakeEntry[]>>;
}

const STATUS_OPTIONS: SubjectStatus[] = ['Not Started', 'In Progress', 'PYQs Done', 'Revised'];

const STATUS_COLORS: Record<SubjectStatus, string> = {
  'Not Started': 'border-zinc-800 bg-zinc-950 text-zinc-400',
  'In Progress': 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  'PYQs Done': 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  Revised: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
};

const TIER_META: Record<GateTier, { label: string; marks: string }> = {
  1: { label: 'Tier 1 · Core High-Yield', marks: '~52m' },
  2: { label: 'Tier 2 · Systems', marks: '~23m' },
  3: { label: 'Tier 3 · Cherry-Pick', marks: '~12m' },
};

export const GateTrackerView: React.FC<GateTrackerViewProps> = ({
  subjects,
  setSubjects,
  mockTests,
  setMockTests,
  mistakes,
  setMistakes,
}) => {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'mocks' | 'mistakes'>('syllabus');
  const [tierFilter, setTierFilter] = useState<'all' | GateTier>('all');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [newSubtopicBySubject, setNewSubtopicBySubject] = useState<Record<string, string>>({});

  const kpis = useMemo(() => {
    const fullMocks = mockTests.filter((m) => m.type === 'Full Mock');
    const avgFullMock =
      fullMocks.length > 0
        ? fullMocks.reduce((acc, m) => acc + m.rawMarks, 0) / fullMocks.length
        : null;

    const totalWeight = subjects.reduce((acc, s) => acc + s.weightageMarks, 0);
    const weightedSum = subjects.reduce((acc, s) => {
      const subPct =
        s.subtopics.length > 0
          ? (s.subtopics.filter((st) => st.completed).length / s.subtopics.length) * 100
          : 0;
      const combined = s.revisionPct * 0.5 + subPct * 0.5;
      return acc + combined * s.weightageMarks;
    }, 0);
    const coveragePct = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const totalPyqs = subjects.reduce((acc, s) => acc + s.pyqsSolved, 0);

    return { avgFullMock, coveragePct, totalPyqs };
  }, [subjects, mockTests]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const updateSubject = (id: string, updater: (subject: GateSubject) => GateSubject) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  };

  const handleAddSubtopic = (subjectId: string) => {
    const text = (newSubtopicBySubject[subjectId] ?? '').trim();
    if (!text) return;
    updateSubject(subjectId, (s) => ({
      ...s,
      subtopics: [...s.subtopics, { id: createId('sub'), title: text, completed: false }],
    }));
    setNewSubtopicBySubject((prev) => ({ ...prev, [subjectId]: '' }));
  };

  const visibleTiers: GateTier[] = tierFilter === 'all' ? [1, 2, 3] : [tierFilter];

  return (
    <div className="space-y-6">
      {/* Header + Focused Sub-Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">GATE CSE 2027</h1>

        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          {(
            [
              { id: 'syllabus', label: 'Syllabus' },
              { id: 'mocks', label: `Mocks (${mockTests.length})` },
              { id: 'mistakes', label: `Mistakes (${mistakes.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact 4-Stat Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="war-card border-emerald-500/20 px-4 py-3">
          <div className="text-[11px] text-zinc-500">Target (Old IIT / Top NIT)</div>
          <div className="mt-1 font-mono text-lg font-semibold text-zinc-100">
            55–60 <span className="text-xs font-normal text-zinc-500">/100</span>
          </div>
        </div>
        <div className="war-card px-4 py-3">
          <div className="text-[11px] text-zinc-500">Avg Full Mock</div>
          <div className="mt-1 font-mono text-lg font-semibold text-emerald-400">
            {kpis.avgFullMock !== null ? kpis.avgFullMock.toFixed(1) : '—'}
          </div>
        </div>
        <div className="war-card px-4 py-3">
          <div className="text-[11px] text-zinc-500">Syllabus Coverage</div>
          <div className="mt-1 font-mono text-lg font-semibold text-zinc-100">
            {kpis.coveragePct}%
          </div>
        </div>
        <div className="war-card px-4 py-3">
          <div className="text-[11px] text-zinc-500">PYQs Solved</div>
          <div className="mt-1 font-mono text-lg font-semibold text-amber-400">
            {kpis.totalPyqs}
          </div>
        </div>
      </div>

      {/* Tab 1: Syllabus */}
      {activeTab === 'syllabus' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Tiers' },
                { id: 1, label: 'Tier 1 (~52m)' },
                { id: 2, label: 'Tier 2 (~23m)' },
                { id: 3, label: 'Tier 3 (~12m)' },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => setTierFilter(opt.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tierFilter === opt.id
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {visibleTiers.map((tier) => {
            const tierSubjects = subjects.filter((s) => s.tier === tier);
            const meta = TIER_META[tier];

            return (
              <section key={tier} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {meta.label}
                  </h2>
                  <span className="font-mono text-xs text-zinc-500">{meta.marks}</span>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {tierSubjects.map((subj) => {
                    const isExpanded = expandedIds.includes(subj.id);
                    const doneSubtopics = subj.subtopics.filter((st) => st.completed).length;

                    return (
                      <div key={subj.id} className="war-card overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleExpand(subj.id)}
                              className="flex min-w-0 flex-1 items-start gap-2 text-left"
                            >
                              {isExpanded ? (
                                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                              ) : (
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <h3 className="truncate text-sm font-medium text-zinc-100">
                                    {subj.name}
                                  </h3>
                                  <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                                    ~{subj.weightageMarks}m
                                  </span>
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                                  {subj.targetWindow} · {doneSubtopics}/{subj.subtopics.length} topics
                                </div>
                              </div>
                            </button>

                            <select
                              value={subj.status}
                              onChange={(e) =>
                                updateSubject(subj.id, (s) => ({
                                  ...s,
                                  status: e.target.value as SubjectStatus,
                                }))
                              }
                              className={`rounded-md border px-2 py-1 text-[11px] font-medium outline-none ${STATUS_COLORS[subj.status]}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  className="bg-zinc-950 text-zinc-100"
                                >
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-500">Lectures</span>
                                <span className="font-mono text-emerald-400">
                                  {subj.revisionPct}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={subj.revisionPct}
                                onChange={(e) =>
                                  updateSubject(subj.id, (s) => ({
                                    ...s,
                                    revisionPct: Number(e.target.value),
                                  }))
                                }
                                className="mt-1 h-1.5 w-full cursor-pointer rounded-lg bg-zinc-800"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950 px-2.5 py-1.5 sm:justify-end">
                              <span className="font-mono text-xs text-zinc-400">
                                PYQs <strong className="text-zinc-100">{subj.pyqsSolved}</strong>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubject(subj.id, (s) => ({
                                      ...s,
                                      pyqsSolved: Math.max(0, s.pyqsSolved - 1),
                                    }))
                                  }
                                  className="rounded border border-zinc-800 p-1 text-zinc-500 hover:text-zinc-200"
                                  aria-label="Decrease PYQs by 1"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubject(subj.id, (s) => ({
                                      ...s,
                                      pyqsSolved: s.pyqsSolved + 1,
                                    }))
                                  }
                                  className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200 hover:bg-zinc-800"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubject(subj.id, (s) => ({
                                      ...s,
                                      pyqsSolved: s.pyqsSolved + 5,
                                    }))
                                  }
                                  className="rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300 hover:bg-emerald-500/25"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-zinc-800/70 bg-zinc-950/50 px-4 py-3">
                            <div className="space-y-2">
                              {subj.subtopics.map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() =>
                                    updateSubject(subj.id, (s) => ({
                                      ...s,
                                      subtopics: s.subtopics.map((item) =>
                                        item.id === st.id
                                          ? { ...item, completed: !item.completed }
                                          : item
                                      ),
                                    }))
                                  }
                                  className="flex w-full items-start gap-2.5 text-left text-xs"
                                >
                                  <span
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                      st.completed
                                        ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                                        : 'border-zinc-700 bg-zinc-900 text-transparent'
                                    }`}
                                  >
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </span>
                                  <span
                                    className={
                                      st.completed
                                        ? 'text-zinc-500 line-through'
                                        : 'text-zinc-300'
                                    }
                                  >
                                    {st.title}
                                  </span>
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                placeholder="Add sub-topic..."
                                value={newSubtopicBySubject[subj.id] ?? ''}
                                onChange={(e) =>
                                  setNewSubtopicBySubject((prev) => ({
                                    ...prev,
                                    [subj.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSubtopic(subj.id);
                                  }
                                }}
                                className="war-input py-1.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSubtopic(subj.id)}
                                className="war-btn-secondary shrink-0 px-2.5 py-1.5 text-xs"
                                aria-label="Add sub-topic"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Tab 2: Mocks */}
      {activeTab === 'mocks' && (
        <MockTrendChart mockTests={mockTests} setMockTests={setMockTests} />
      )}

      {/* Tab 3: Mistakes */}
      {activeTab === 'mistakes' && (
        <MistakeNotebook subjects={subjects} mistakes={mistakes} setMistakes={setMistakes} />
      )}
    </div>
  );
};
