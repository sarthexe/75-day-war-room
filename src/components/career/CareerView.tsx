import React, { useMemo, useState } from 'react';
import {
  Check,
  Columns3,
  ExternalLink,
  Plus,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { JobApplication, JobStatus, WeekendProject } from '../../types';
import { createId, formatShortDate, getTodayISO, isDateInCurrentWeek } from '../../utils/date';

interface CareerViewProps {
  jobs: JobApplication[];
  setJobs: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  projects: WeekendProject[];
  setProjects: React.Dispatch<React.SetStateAction<WeekendProject[]>>;
}

const JOB_STATUSES: JobStatus[] = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

const STATUS_BADGE: Record<JobStatus, string> = {
  Applied: 'border-zinc-700 bg-zinc-900 text-zinc-200',
  OA: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
  Interview: 'border-sky-500/35 bg-sky-500/15 text-sky-300',
  Offer: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  Rejected: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

const ROLE_PRESETS = ['AI Engineer', 'ML Engineer', 'SDE', 'SDE-2 (Backend)'];

export const CareerView: React.FC<CareerViewProps> = ({
  jobs,
  setJobs,
  projects,
  setProjects,
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'projects'>('jobs');

  // Job form
  const [showJobForm, setShowJobForm] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('AI Engineer');
  const [link, setLink] = useState('');
  const [dateApplied, setDateApplied] = useState(getTodayISO());
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [notes, setNotes] = useState('');

  // Job display controls
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [filterStatus, setFilterStatus] = useState<'All' | JobStatus>('All');
  const [search, setSearch] = useState('');

  // Project form
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projName, setProjName] = useState('');
  const [projRepoUrl, setProjRepoUrl] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projTargetWeekend, setProjTargetWeekend] = useState('');
  const [newDeliverableByProj, setNewDeliverableByProj] = useState<Record<string, string>>({});

  const jobMetrics = useMemo(() => {
    const thisWeek = jobs.filter((j) => isDateInCurrentWeek(j.dateApplied)).length;
    const activePipeline = jobs.filter(
      (j) => j.status === 'OA' || j.status === 'Interview'
    ).length;
    const offers = jobs.filter((j) => j.status === 'Offer').length;
    return { total: jobs.length, thisWeek, activePipeline, offers };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...jobs]
      .filter((j) => {
        if (filterStatus !== 'All' && j.status !== filterStatus) return false;
        if (
          q &&
          !j.company.toLowerCase().includes(q) &&
          !j.role.toLowerCase().includes(q) &&
          !j.notes.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
  }, [jobs, filterStatus, search]);

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    const entry: JobApplication = {
      id: createId('job'),
      company: company.trim(),
      role: role.trim(),
      link: link.trim(),
      dateApplied,
      status,
      notes: notes.trim(),
    };
    setJobs((prev) => [entry, ...prev]);
    setCompany('');
    setLink('');
    setNotes('');
    setShowJobForm(false);
  };

  const updateJobStatus = (id: string, nextStatus: JobStatus) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: nextStatus } : j)));
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    const project: WeekendProject = {
      id: createId('proj'),
      name: projName.trim(),
      repoUrl: projRepoUrl.trim(),
      stack: projStack.trim() || 'TypeScript / Python',
      targetWeekend: projTargetWeekend.trim() || 'Upcoming Sunday',
      deliverables: [],
    };
    setProjects((prev) => [project, ...prev]);
    setProjName('');
    setProjRepoUrl('');
    setProjStack('');
    setProjTargetWeekend('');
    setShowProjectForm(false);
  };

  const addDeliverable = (projectId: string) => {
    const title = (newDeliverableByProj[projectId] ?? '').trim();
    if (!title) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              deliverables: [
                ...p.deliverables,
                { id: createId('del'), title, completed: false },
              ],
            }
          : p
      )
    );
    setNewDeliverableByProj((prev) => ({ ...prev, [projectId]: '' }));
  };

  const toggleDeliverable = (projectId: string, deliverableId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              deliverables: p.deliverables.map((d) =>
                d.id === deliverableId ? { ...d, completed: !d.completed } : d
              ),
            }
          : p
      )
    );
  };

  const deleteDeliverable = (projectId: string, deliverableId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              deliverables: p.deliverables.filter((d) => d.id !== deliverableId),
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Career</h1>

        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Applications ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Weekend Projects ({projects.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Job Applications */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="war-card border-emerald-500/20 px-4 py-3">
              <div className="text-[11px] text-zinc-500">Sent This Week</div>
              <div className="mt-1 font-mono text-lg font-semibold text-emerald-400">
                {jobMetrics.thisWeek}
              </div>
            </div>
            <div className="war-card px-4 py-3">
              <div className="text-[11px] text-zinc-500">Total Applied</div>
              <div className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                {jobMetrics.total}
              </div>
            </div>
            <div className="war-card px-4 py-3">
              <div className="text-[11px] text-zinc-500">OA / Interview</div>
              <div className="mt-1 font-mono text-lg font-semibold text-sky-400">
                {jobMetrics.activePipeline}
              </div>
            </div>
            <div className="war-card px-4 py-3">
              <div className="text-[11px] text-zinc-500">Offers</div>
              <div className="mt-1 font-mono text-lg font-semibold text-amber-400">
                {jobMetrics.offers}
              </div>
            </div>
          </div>

          <div className="war-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800/80 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'All' | JobStatus)}
                  className="war-select py-1.5 text-xs"
                >
                  <option value="All">All Statuses</option>
                  {JOB_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <div className="relative w-44 sm:w-52">
                  <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="war-input py-1.5 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === 'table'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                    title="Table view"
                    aria-label="Table view"
                  >
                    <Table2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                    title="Mini-Kanban view"
                    aria-label="Mini-Kanban view"
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowJobForm((prev) => !prev)}
                  className={showJobForm ? 'war-btn-secondary text-xs' : 'war-btn-primary text-xs'}
                >
                  {showJobForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {showJobForm ? 'Cancel' : 'Add App'}
                </button>
              </div>
            </div>

            {showJobForm && (
              <form
                onSubmit={handleAddJob}
                className="border-b border-zinc-800 bg-zinc-950/60 p-4 sm:px-5"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-[11px] text-zinc-500">Company *</label>
                    <input
                      type="text"
                      placeholder="Stripe, Perplexity..."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="war-input text-xs"
                      required
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-[11px] text-zinc-500">Role *</label>
                    <input
                      type="text"
                      list="role-presets"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="war-input text-xs"
                      required
                    />
                    <datalist id="role-presets">
                      {ROLE_PRESETS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-zinc-500">Date</label>
                    <input
                      type="date"
                      value={dateApplied}
                      onChange={(e) => setDateApplied(e.target.value)}
                      className="war-input font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-zinc-500">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as JobStatus)}
                      className="war-select w-full text-xs"
                    >
                      {JOB_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-zinc-500">Link</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="war-input text-xs"
                    />
                  </div>
                  <div className="md:col-span-10">
                    <input
                      type="text"
                      placeholder="Notes (referral, OA deadline, feedback...)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="war-input text-xs"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className="war-btn-primary w-full text-xs">
                      Save
                    </button>
                  </div>
                </div>
              </form>
            )}

            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800/70 bg-zinc-950/40 text-[11px] text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Company</th>
                      <th className="px-4 py-2.5 font-medium">Role</th>
                      <th className="px-4 py-2.5 font-medium">Applied</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Notes</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-zinc-900/40">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-100">
                          {job.link ? (
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-emerald-400"
                            >
                              {job.company}
                              <ExternalLink className="h-3 w-3 text-zinc-500" />
                            </a>
                          ) : (
                            job.company
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{job.role}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-500">
                          {formatShortDate(job.dateApplied)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <select
                            value={job.status}
                            onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                            className={`rounded-md border px-2 py-1 font-mono text-[11px] font-medium outline-none ${STATUS_BADGE[job.status]}`}
                          >
                            {JOB_STATUSES.map((s) => (
                              <option key={s} value={s} className="bg-zinc-950 text-zinc-100">
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-zinc-400">
                          {job.notes || <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => deleteJob(job.id)}
                            className="rounded p-1 text-zinc-500 hover:text-rose-400"
                            aria-label="Delete application"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredJobs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                          No applications match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">
                {JOB_STATUSES.map((colStatus) => {
                  const colJobs = filteredJobs.filter((j) => j.status === colStatus);
                  return (
                    <div
                      key={colStatus}
                      className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3"
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-medium ${STATUS_BADGE[colStatus]}`}
                        >
                          {colStatus}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">{colJobs.length}</span>
                      </div>
                      <div className="space-y-2">
                        {colJobs.map((job) => (
                          <div
                            key={job.id}
                            className="rounded-lg border border-zinc-800 bg-[#18181b] p-2.5 text-xs"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-medium text-zinc-100">{job.company}</span>
                              <button
                                type="button"
                                onClick={() => deleteJob(job.id)}
                                className="text-zinc-600 hover:text-rose-400"
                                aria-label="Delete application"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="mt-0.5 text-[11px] text-zinc-400">{job.role}</div>
                            <select
                              value={job.status}
                              onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-1.5 py-1 font-mono text-[10px] text-zinc-300 outline-none"
                            >
                              {JOB_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  → {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                        {colJobs.length === 0 && (
                          <div className="py-5 text-center text-[11px] text-zinc-600">Empty</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Weekend Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Portfolio repos & Sunday sprint milestones</span>
            <button
              type="button"
              onClick={() => setShowProjectForm((prev) => !prev)}
              className={showProjectForm ? 'war-btn-secondary text-xs' : 'war-btn-primary text-xs'}
            >
              {showProjectForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showProjectForm ? 'Cancel' : 'Add Project'}
            </button>
          </div>

          {showProjectForm && (
            <form onSubmit={handleAddProject} className="war-card p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-[11px] text-zinc-500">Project Name *</label>
                  <input
                    type="text"
                    placeholder="Distributed KV Store"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="war-input text-xs"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-[11px] text-zinc-500">Stack</label>
                  <input
                    type="text"
                    placeholder="C++20 · gRPC"
                    value={projStack}
                    onChange={(e) => setProjStack(e.target.value)}
                    className="war-input text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] text-zinc-500">Target Sunday</label>
                  <input
                    type="text"
                    placeholder="Dec 13"
                    value={projTargetWeekend}
                    onChange={(e) => setProjTargetWeekend(e.target.value)}
                    className="war-input text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] text-zinc-500">Repo URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projRepoUrl}
                    onChange={(e) => setProjRepoUrl(e.target.value)}
                    className="war-input text-xs"
                  />
                </div>
                <div className="flex items-end md:col-span-2">
                  <button type="submit" className="war-btn-primary w-full text-xs">
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {projects.map((project) => {
              const doneCount = project.deliverables.filter((d) => d.completed).length;
              const totalCount = project.deliverables.length;
              const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

              return (
                <div key={project.id} className="war-card flex flex-col overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {project.repoUrl ? (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-100 hover:text-emerald-400"
                          >
                            {project.name}
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                          </a>
                        ) : (
                          <h3 className="text-sm font-medium text-zinc-100">{project.name}</h3>
                        )}
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                          {project.stack} · <span className="text-cyan-400">{project.targetWeekend}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setProjects((prev) => prev.filter((p) => p.id !== project.id))
                        }
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full bg-cyan-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {doneCount}/{totalCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 border-t border-zinc-800/70 bg-zinc-950/40 p-4">
                    {project.deliverables.map((del) => (
                      <div key={del.id} className="group flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDeliverable(project.id, del.id)}
                          className="flex flex-1 items-start gap-2.5 text-left text-xs"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              del.completed
                                ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                                : 'border-zinc-700 bg-zinc-900 text-transparent'
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                          <span
                            className={
                              del.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
                            }
                          >
                            {del.title}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteDeliverable(project.id, del.id)}
                          className="rounded p-1 text-zinc-600 hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Delete deliverable"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add Sunday deliverable..."
                        value={newDeliverableByProj[project.id] ?? ''}
                        onChange={(e) =>
                          setNewDeliverableByProj((prev) => ({
                            ...prev,
                            [project.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addDeliverable(project.id);
                          }
                        }}
                        className="war-input py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => addDeliverable(project.id)}
                        className="war-btn-secondary shrink-0 px-2.5 py-1.5 text-xs"
                        aria-label="Add deliverable"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
