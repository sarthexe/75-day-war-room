import React, { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { DailyHistoryEntry } from '../../types';
import { formatShortDate, generate75DayDates, getTodayISO } from '../../utils/date';

interface Heatmap75Props {
  history: Record<string, DailyHistoryEntry>;
}

function getCellClass(pct: number | undefined, isToday: boolean, isFuture: boolean): string {
  const ring = isToday ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-[#18181b]' : '';
  if (isFuture && pct === undefined) {
    return `bg-zinc-900/50 border-zinc-800/60 ${ring}`;
  }
  if (pct === undefined || pct === 0) {
    return `bg-zinc-900 border-zinc-800 ${ring}`;
  }
  if (pct < 35) {
    return `bg-emerald-950/90 border-emerald-900 ${ring}`;
  }
  if (pct < 65) {
    return `bg-emerald-800/80 border-emerald-700/80 ${ring}`;
  }
  if (pct < 85) {
    return `bg-emerald-600/85 border-emerald-500/80 ${ring}`;
  }
  return `bg-emerald-400 border-emerald-300 ${ring}`;
}

export const Heatmap75: React.FC<Heatmap75Props> = ({ history }) => {
  const today = getTodayISO();
  const allDates = useMemo(() => generate75DayDates(), []);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const stats = useMemo(() => {
    const loggedEntries = Object.values(history).filter((e) => e.completionPct > 0);
    const avgPct =
      loggedEntries.length > 0
        ? Math.round(
            loggedEntries.reduce((acc, item) => acc + item.completionPct, 0) / loggedEntries.length
          )
        : 0;

    // Calculate active streak ending today (or yesterday if today not yet logged)
    let streak = 0;
    const todayDate = new Date();
    const checkDate = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      todayDate.getDate()
    );

    const todayEntry = history[getTodayISO(checkDate)];
    if (!todayEntry || todayEntry.completionPct < 50) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const iso = getTodayISO(checkDate);
      const entry = history[iso];
      if (entry && entry.completionPct >= 50) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      loggedDays: loggedEntries.length,
      avgPct,
      streak,
    };
  }, [history]);

  const activeDate = hoveredDate ?? today;
  const activeEntry = history[activeDate];

  return (
    <div className="war-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">75-Day War Room Heatmap</h3>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              Nov 24 → Feb 6
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Auto-archives daily timetable + non-negotiable completion at date rollover.
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-zinc-400">Streak</span>
            <span className="font-semibold text-zinc-100">{stats.streak}d</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5">
            <span className="text-zinc-400">Avg </span>
            <span className="font-semibold text-emerald-400">{stats.avgPct}%</span>
          </div>
        </div>
      </div>

      {/* 75-day grid: crisp 15 x 5 matrix */}
      <div
        className="mt-4 grid gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
      >
        {allDates.map((iso, index) => {
          const entry = history[iso];
          const isToday = iso === today;
          const isFuture = iso > today;
          return (
            <button
              key={iso}
              type="button"
              onMouseEnter={() => setHoveredDate(iso)}
              onFocus={() => setHoveredDate(iso)}
              onClick={() => setHoveredDate(iso)}
              title={`Day ${index + 1} (${formatShortDate(iso)}): ${entry ? `${entry.completionPct}%` : 'No data'}`}
              className={`aspect-square w-full rounded-[4px] border transition-transform hover:scale-110 ${getCellClass(
                entry?.completionPct,
                isToday,
                isFuture
              )}`}
            />
          );
        })}
      </div>

      {/* Footer detail + legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/70 pt-3 text-xs">
        <div className="font-mono text-zinc-400">
          <span className="text-zinc-200">{formatShortDate(activeDate)}</span>
          {activeDate === today && (
            <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
              TODAY
            </span>
          )}
          <span className="mx-2 text-zinc-600">·</span>
          {activeEntry ? (
            <span>
              <span className="text-emerald-400">{activeEntry.completionPct}%</span> ({activeEntry.blocksCompleted}/
              {activeEntry.blocksTotal} blocks, {activeEntry.nonNegotiablesHit}/{activeEntry.nonNegotiablesTotal} core)
            </span>
          ) : (
            <span className="text-zinc-500">No completion logged yet</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>0%</span>
          <span className="h-2.5 w-2.5 rounded-[3px] border border-zinc-800 bg-zinc-900" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-emerald-900 bg-emerald-950" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-emerald-700 bg-emerald-800" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-emerald-500 bg-emerald-600" />
          <span className="h-2.5 w-2.5 rounded-[3px] border border-emerald-300 bg-emerald-400" />
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
