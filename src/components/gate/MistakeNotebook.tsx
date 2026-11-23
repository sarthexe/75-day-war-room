import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { GateSubject, MistakeEntry, MistakeTag } from '../../types';
import { createId, formatShortDate, getTodayISO } from '../../utils/date';

interface MistakeNotebookProps {
  subjects: GateSubject[];
  mistakes: MistakeEntry[];
  setMistakes: React.Dispatch<React.SetStateAction<MistakeEntry[]>>;
}

const MISTAKE_TAGS: MistakeTag[] = [
  'Formula Gap',
  'Silly Error',
  'MSQ Edge Case',
  'Concept Gap',
];

const TAG_STYLES: Record<MistakeTag, string> = {
  'Formula Gap': 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  'Silly Error': 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  'MSQ Edge Case': 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  'Concept Gap': 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  subjects,
  mistakes,
  setMistakes,
}) => {
  const subjectNames = useMemo(() => subjects.map((s) => s.name), [subjects]);

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState(subjectNames[0] ?? 'Engineering Mathematics');
  const [topic, setTopic] = useState('');
  const [tag, setTag] = useState<MistakeTag>('Concept Gap');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [ruleToRemember, setRuleToRemember] = useState('');

  const [filterSubject, setFilterSubject] = useState('All');
  const [filterTag, setFilterTag] = useState<'All' | MistakeTag>('All');
  const [search, setSearch] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !whatWentWrong.trim() || !ruleToRemember.trim()) return;

    const entry: MistakeEntry = {
      id: createId('mis'),
      createdAt: getTodayISO(),
      subject,
      topic: topic.trim(),
      tag,
      whatWentWrong: whatWentWrong.trim(),
      ruleToRemember: ruleToRemember.trim(),
    };

    setMistakes((prev) => [entry, ...prev]);
    setTopic('');
    setWhatWentWrong('');
    setRuleToRemember('');
    setShowForm(false);
  };

  const filteredMistakes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mistakes.filter((m) => {
      if (filterSubject !== 'All' && m.subject !== filterSubject) return false;
      if (filterTag !== 'All' && m.tag !== filterTag) return false;
      if (
        q &&
        !m.topic.toLowerCase().includes(q) &&
        !m.whatWentWrong.toLowerCase().includes(q) &&
        !m.ruleToRemember.toLowerCase().includes(q) &&
        !m.subject.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [mistakes, filterSubject, filterTag, search]);

  return (
    <div className="war-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-zinc-100">1-Page Mistake Notebook</h3>
          <span className="font-mono text-xs text-zinc-500">
            {filteredMistakes.length}/{mistakes.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={showForm ? 'war-btn-secondary text-xs' : 'war-btn-primary text-xs'}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {/* Collapsible Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border-b border-zinc-800 bg-zinc-950/60 p-4 sm:px-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="mb-1 block text-[11px] text-zinc-500">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="war-select w-full text-xs"
              >
                {subjectNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-5">
              <label className="mb-1 block text-[11px] text-zinc-500">Topic</label>
              <input
                type="text"
                placeholder="e.g. Cache Tag Bits / Fork() count"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="war-input text-xs"
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-[11px] text-zinc-500">Tag</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as MistakeTag)}
                className="war-select w-full text-xs"
              >
                {MISTAKE_TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-6">
              <label className="mb-1 block text-[11px] text-zinc-500">What went wrong</label>
              <input
                type="text"
                placeholder="Missed edge case or misapplied formula..."
                value={whatWentWrong}
                onChange={(e) => setWhatWentWrong(e.target.value)}
                className="war-input text-xs"
                required
              />
            </div>
            <div className="md:col-span-6">
              <label className="mb-1 block text-[11px] text-zinc-500">Rule to remember</label>
              <input
                type="text"
                placeholder="One crisp rule for final-week revision..."
                value={ruleToRemember}
                onChange={(e) => setRuleToRemember(e.target.value)}
                className="war-input text-xs"
                required
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="war-btn-primary text-xs">
              Save Rule
            </button>
          </div>
        </form>
      )}

      {/* Compact Filters */}
      <div className="flex flex-col gap-2.5 border-b border-zinc-800/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="war-select py-1.5 text-xs"
          >
            <option value="All">All Subjects</option>
            {subjectNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value as 'All' | MistakeTag)}
            className="war-select py-1.5 text-xs"
          >
            <option value="All">All Tags</option>
            {MISTAKE_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="war-input py-1.5 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-zinc-800/60">
        {filteredMistakes.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-zinc-900/40 sm:px-5"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-200">{item.subject}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-xs text-zinc-400">{item.topic}</span>
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${TAG_STYLES[item.tag]}`}>
                  {item.tag}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {formatShortDate(item.createdAt)}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{item.whatWentWrong}</p>
              <p className="text-xs text-emerald-300">
                <span className="font-mono text-[11px] font-semibold text-emerald-400">RULE:</span>{' '}
                {item.ruleToRemember}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMistakes((prev) => prev.filter((m) => m.id !== item.id))}
              className="rounded p-1.5 text-zinc-500 hover:text-rose-400"
              aria-label="Delete mistake entry"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {filteredMistakes.length === 0 && (
          <div className="px-4 py-10 text-center text-xs text-zinc-500">
            No mistakes logged for this filter.
          </div>
        )}
      </div>
    </div>
  );
};
