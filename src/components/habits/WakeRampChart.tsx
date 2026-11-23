import React, { useMemo } from 'react';
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
import { Sunrise } from 'lucide-react';
import { SleepLogEntry } from '../../types';
import {
  computeSleepHours,
  formatDecimalHour,
  formatShortDate,
  formatTime12h,
  timeToDecimalHours,
} from '../../utils/date';

interface WakeRampChartProps {
  sleepLogs: SleepLogEntry[];
}

export const WakeRampChart: React.FC<WakeRampChartProps> = ({ sleepLogs }) => {
  const chartData = useMemo(() => {
    return [...sleepLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        ...entry,
        shortDate: formatShortDate(entry.date),
        wakeDecimal: timeToDecimalHours(entry.wakeTime),
        sleepHours: computeSleepHours(entry.bedtime, entry.wakeTime),
      }));
  }, [sleepLogs]);

  return (
    <div className="war-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-zinc-100">Wake-Up Ramp</h3>
        </div>
        <span className="font-mono text-[11px] text-emerald-400">Target 7:00 AM</span>
      </div>

      <div className="mt-4 h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 6, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="shortDate"
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                domain={[6, 12.5]}
                ticks={[6, 7, 8, 9, 10, 11, 12]}
                tickFormatter={(val: number) => formatDecimalHour(val)}
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                width={62}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as SleepLogEntry & {
                    shortDate: string;
                    sleepHours: number;
                  };
                  const sleepOk = item.sleepHours >= 7;
                  return (
                    <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 text-xs shadow-xl">
                      <div className="font-mono font-semibold text-zinc-100">{item.shortDate}</div>
                      <div className="mt-2 space-y-1 font-mono">
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-400">Wake-Up:</span>
                          <span className="font-semibold text-amber-300">
                            {formatTime12h(item.wakeTime)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-400">Bedtime:</span>
                          <span className="text-zinc-200">{formatTime12h(item.bedtime)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-400">Duration:</span>
                          <span className={sleepOk ? 'text-emerald-400' : 'text-rose-400'}>
                            {item.sleepHours}h {sleepOk ? '(≥7h ✓)' : '(<7h)'}
                          </span>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="mt-2 max-w-[200px] border-t border-zinc-800 pt-1.5 text-[11px] text-zinc-400">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={7}
                stroke="#10b981"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: '7:00 AM Target',
                  position: 'insideTopRight',
                  fill: '#34d399',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Line
                type="monotone"
                dataKey="wakeDecimal"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b', stroke: '#09090b', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#09090b', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
            Log bedtime & wake-up times to visualize your circadian shift.
          </div>
        )}
      </div>
    </div>
  );
};
