import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { MockShift, MockTestEntry, MockTestType } from '../../types';
import { createId, formatShortDate, getTodayISO } from '../../utils/date';

interface MockTrendChartProps {
  mockTests: MockTestEntry[];
  setMockTests: React.Dispatch<React.SetStateAction<MockTestEntry[]>>;
}

export const MockTrendChart: React.FC<MockTrendChartProps> = ({ mockTests, setMockTests }) => {
  const [date, setDate] = useState(getTodayISO());
  const [testName, setTestName] = useState('');
  const [type, setType] = useState<MockTestType>('Full Mock');
  const [rawMarks, setRawMarks] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [negativeMarksLost, setNegativeMarksLost] = useState('');
  const [shift, setShift] = useState<MockShift>('9:30 AM');
  const [filterType, setFilterType] = useState<'All' | MockTestType>('All');

  const fullMockChartData = useMemo(() => {
    return [...mockTests]
      .filter((t) => t.type === 'Full Mock')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        ...t,
        shortDate: formatShortDate(t.date),
      }));
  }, [mockTests]);

  const filteredList = useMemo(() => {
    return [...mockTests]
      .filter((t) => (filterType === 'All' ? true : t.type === filterType))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [mockTests, filterType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const marksNum = parseFloat(rawMarks);
    const accNum = parseFloat(accuracy);
    const negNum = parseFloat(negativeMarksLost || '0');
    if (!testName.trim() || Number.isNaN(marksNum)) return;

    const entry: MockTestEntry = {
      id: createId('mock'),
      date,
      testName: testName.trim(),
      type,
      rawMarks: Math.max(-33, Math.min(100, marksNum)),
      accuracy: Number.isNaN(accNum) ? 0 : Math.max(0, Math.min(100, accNum)),
      negativeMarksLost: Number.isNaN(negNum) ? 0 : Math.max(0, negNum),
      shift,
    };

    setMockTests((prev) => [entry, ...prev]);
    setTestName('');
    setRawMarks('');
    setAccuracy('');
    setNegativeMarksLost('');
  };

  const handleDelete = (id: string) => {
    setMockTests((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Recharts Full Mock Trend */}
        <div className="war-card flex flex-col p-4 sm:p-5 xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Full Mock Raw Score Trend</h3>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Tracking progression toward the 55–60 raw marks Old IIT / Top 3 NIT zone.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
              Target Line: 55.0
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            {fullMockChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fullMockChartData} margin={{ top: 12, right: 16, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="shortDate"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as MockTestEntry & { shortDate: string };
                      return (
                        <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 text-xs shadow-xl">
                          <div className="font-semibold text-zinc-100">{item.testName}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                            {item.shortDate} · Shift {item.shift}
                          </div>
                          <div className="mt-2 space-y-1 font-mono">
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Raw Marks:</span>
                              <span className="font-semibold text-emerald-400">
                                {item.rawMarks.toFixed(2)} / 100
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Accuracy:</span>
                              <span className="text-zinc-200">{item.accuracy}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-zinc-400">Neg. Lost:</span>
                              <span className="text-rose-400">-{item.negativeMarksLost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={55}
                    stroke="#10b981"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{
                      value: '55 Target',
                      position: 'insideTopRight',
                      fill: '#34d399',
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rawMarks"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', stroke: '#09090b', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#34d399', stroke: '#09090b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
                Log your first Full Mock test to see the score trend chart.
              </div>
            )}
          </div>
        </div>

        {/* Log Mock Form */}
        <form onSubmit={handleSubmit} className="war-card p-4 sm:p-5 xl:col-span-5">
          <h3 className="text-sm font-semibold text-zinc-100">Log Subject Test / Full Mock</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Track raw marks, accuracy, negative bleed, and exam shift stamina.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="war-input font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Test Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MockTestType)}
                className="war-select w-full text-xs"
              >
                <option value="Full Mock">Full Mock</option>
                <option value="Subject">Subject Test</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-[11px] text-zinc-400">Test Name</label>
              <input
                type="text"
                placeholder="e.g. GO Classes AIMT #3 / MadeEasy OS Test"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="war-input text-xs"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Raw Marks (/100)</label>
              <input
                type="number"
                step="0.01"
                min="-33"
                max="100"
                placeholder="52.67"
                value={rawMarks}
                onChange={(e) => setRawMarks(e.target.value)}
                className="war-input font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Accuracy (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="82"
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)}
                className="war-input font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Neg. Marks Lost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="50"
                placeholder="3.33"
                value={negativeMarksLost}
                onChange={(e) => setNegativeMarksLost(e.target.value)}
                className="war-input font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">Exam Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as MockShift)}
                className="war-select w-full font-mono text-xs"
              >
                <option value="9:30 AM">9:30 AM</option>
                <option value="2:30 PM">2:30 PM</option>
              </select>
            </div>
          </div>

          <button type="submit" className="war-btn-primary mt-4 w-full text-xs">
            <Plus className="h-3.5 w-3.5" />
            Log Test Result
          </button>
        </form>
      </div>

      {/* Logged Tests Table */}
      <div className="war-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-zinc-100">Logged Test History ({filteredList.length})</h3>
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs">
            {(['All', 'Full Mock', 'Subject'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  filterType === tab
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Test</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Shift</th>
                <th className="px-4 py-2.5 text-right">Raw / 100</th>
                <th className="px-4 py-2.5 text-right">Accuracy</th>
                <th className="px-4 py-2.5 text-right">Neg. Lost</th>
                <th className="px-4 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredList.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-900/50">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-zinc-400">
                    {formatShortDate(entry.date)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-zinc-200">{entry.testName}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                        entry.type === 'Full Mock'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-zinc-400">
                    {entry.shift}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-2.5 text-right font-mono font-semibold ${
                      entry.rawMarks >= 55
                        ? 'text-emerald-400'
                        : entry.rawMarks >= 45
                          ? 'text-amber-300'
                          : 'text-zinc-200'
                    }`}
                  >
                    {entry.rawMarks.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-zinc-300">
                    {entry.accuracy}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-rose-400">
                    -{entry.negativeMarksLost.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="rounded p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label="Delete mock test"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    No test results match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
