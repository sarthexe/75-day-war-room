import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Target,
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
  'Not Started': 'border-zinc-700 bg-zinc-900 text-zinc-400',
  'In Progress': 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  'PYQs Done': 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  Revised: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
};

const TIER_META: Record<GateTier, { label: string; marks: string; note: string }> = {
  1: {
    label: 'Tier 1 — High-Yield Core',
    marks: '~52 marks',
    note: 'Lock down during Phase 1 Notice Period (Weeks 1–5 + Daily 20m Aptitude)',
  },
  2: {
    label: 'Tier 2 — Systems & Core CS',
    marks: '~23 marks',
    note: 'Full-Time Grind Jan 1–21 (OS, DBMS, Computer Networks)',
  },
  3: {
    label: 'Tier 3 — Surgical Cherry-Pick',
    marks: '~12 marks',
    note: 'Jan 22–26 high-ROI topics only (COA Cache/Pipelining + TOC FA/Closure/Decidability)',
  },
};

export const GateTrackerView: React.FC<GateTrackerViewProps> = ({
  subjects,
  setSubjects,
  mockTests,
  setMockTests,
  mistakes,
  setMistakes,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(['gate_aptitude', 'gate_emath']);
  const [newSubtopicBySubject, setNewSubtopicBySubject] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'all' | 'syllabus' | 'mocks' | 'mistakes'>('all');

  const kpis = useMemo(() => {
    const fullMocks = mockTests.filter((m) => m.type === 'Full Mock');
    const avgFullMock =
      fullMocks.length > 0
        ? fullMocks.reduce((acc, m) => acc + m.rawMarks, 0) / fullMocks.length
        : null;

    // Weighted syllabus coverage based on subject weightage, subtopics & revision %
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

    return { avgFullMock, fullMockCount: fullMocks.length, coveragePct, totalPyqs };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            GATE CSE 2027 Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tiered high-yield execution, mock score telemetry, and 1-page mistake distillation.
          </p>
        </div>

        {/* Sub-view quick switcher */}
        <div className="inline-flex flex-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'syllabus', label: 'Syllabus' },
              { id: 'mocks', label: `Mocks (${mockTests.length})` },
              { id: 'mistakes', label: `Mistakes (${mistakes.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === tab.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Score Banner */}
      <div className="war-card relative overflow-hidden border-emerald-500/25 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-emerald-300">
              <Target className="h-3 w-3" />
              OLD IIT / TOP 3 NIT TARGET
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-zinc-100 sm:text-3xl">
                55–60
              </span>
              <span className="font-mono text-xs text-zinc-400">raw marks / 100</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Tier 1 (~52m) + Tier 2 (~23m) + Tier 3 Cherry-Pick (~12m) = ~87 marks coverage.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:col-span-7">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="text-[11px] text-zinc-500">Avg Full Mock</div>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                {kpis.avgFullMock !== null ? kpis.avgFullMock.toFixed(1) : '—'}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                {kpis.avgFullMock !== null
                  ? kpis.avgFullMock >= 55
                    ? 'In target zone'
                    : `${(55 - kpis.avgFullMock).toFixed(1)}m to 55`
                  : 'No full mocks'}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="text-[11px] text-zinc-500">Syllabus Coverage</div>
              <div className="mt-1 font-mono text-xl font-bold text-zinc-100">
                {kpis.coveragePct}%
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${kpis.coveragePct}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="text-[11px] text-zinc-500">PYQs Solved</div>
              <div className="mt-1 font-mono text-xl font-bold text-amber-400">
                {kpis.totalPyqs}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                across {subjects.length} subjects
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Tiered Syllabus */}
      {(activeSection === 'all' || activeSection === 'syllabus') && (
        <div className="space-y-6">
          {([1, 2, 3] as GateTier[]).map((tier) => {
            const tierSubjects = subjects.filter((s) => s.tier === tier);
            const meta = TIER_META[tier];

            return (
              <section key={tier} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-zinc-100">{meta.label}</h2>
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                        {meta.marks}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{meta.note}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {tierSubjects.map((subj) => {
                    const isExpanded = expandedIds.includes(subj.id);
                    const doneSubtopics = subj.subtopics.filter((st) => st.completed).length;

                    return (
                      <div key={subj.id} className="war-card flex flex-col overflow-hidden">
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
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold text-zinc-100">
                                    {subj.name}
                                  </h3>
                                  <span className="font-mono text-[11px] text-zinc-500">
                                    ~{subj.weightageMarks}m
                                  </span>
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                                  {subj.targetWindow} · {doneSubtopics}/{subj.subtopics.length} subtopics
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

                          {/* Revision Slider + PYQ Counter */}
                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-center">
                            <div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-400">Revision Lectures</span>
                                <span className="font-mono font-semibold text-emerald-400">
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
                                className="mt-1.5 h-1.5 w-full cursor-pointer rounded-lg bg-zinc-800"
                              />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5">
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                                  PYQs Solved
                                </div>
                                <div className="font-mono text-sm font-bold text-zinc-100">
                                  {subj.pyqsSolved}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubject(subj.id, (s) => ({
                                      ...s,
                                      pyqsSolved: Math.max(0, s.pyqsSolved - 1),
                                    }))
                                  }
                                  className="rounded border border-zinc-800 bg-zinc-900 p-1 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100"
                                  title="Decrease by 1"
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
                                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-[11px] font-medium text-zinc-100 hover:bg-zinc-700"
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
                                  className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Sub-topics */}
                        {isExpanded && (
                          <div className="border-t border-zinc-800/80 bg-zinc-950/50 px-4 py-3">
                            <div className="space-y-2">
                              {subj.subtopics.map((st) => (
                                <label
                                  key={st.id}
                                  className="flex cursor-pointer items-start gap-2.5 text-xs"
                                >
                                  <button
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
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                      st.completed
                                        ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                                        : 'border-zinc-700 bg-zinc-900 text-transparent hover:border-zinc-500'
                                    }`}
                                  >
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </button>
                                  <span
                                    className={
                                      st.completed
                                        ? 'text-zinc-500 line-through'
                                        : 'text-zinc-300'
                                    }
                                  >
                                    {st.title}
                                  </span>
                                </label>
                              ))}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                placeholder="Add high-yield sub-topic..."
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

      {/* Section: Mock Tests */}
      {(activeSection === 'all' || activeSection === 'mocks') && (
        <MockTrendChart mockTests={mockTests} setMockTests={setMockTests} />
      )}

      {/* Section: 1-Page Mistake Notebook */}
      {(activeSection === 'all' || activeSection === 'mistakes') && (
        <MistakeNotebook subjects={subjects} mistakes={mistakes} setMistakes={setMistakes} />
      )}
    </div>
  );
};
