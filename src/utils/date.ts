import { DayTypeId, PhaseId, ScheduleKey } from '../types';

export const WAR_ROOM_START_DATE = '2026-11-24';
export const LWD_TARGET_DATE = '2026-12-31';
export const GATE_TARGET_DATE = '2027-02-06';

export function getTodayISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODateLocal(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function daysUntil(targetISO: string, now: Date = new Date()): number {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = parseISODateLocal(targetISO).getTime();
  return Math.ceil((targetStart - todayStart) / (1000 * 60 * 60 * 24));
}

export function generate75DayDates(): string[] {
  const dates: string[] = [];
  const start = parseISODateLocal(WAR_ROOM_START_DATE);
  for (let i = 0; i < 75; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    dates.push(getTodayISO(d));
  }
  return dates;
}

export function formatShortDate(isoDate: string): string {
  const d = parseISODateLocal(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getScheduleKey(phase: PhaseId, dayType: DayTypeId): ScheduleKey {
  if (dayType === 'weekend_gf') return 'weekend_gf';
  if (dayType === 'weekend_grind') return 'weekend_grind';
  return phase === 'phase1' ? 'phase1_weekday' : 'phase2_weekday';
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Checks whether current local time falls inside a time block.
 * Handles midnight endTime ("00:00" treated as 24:00 = 1440 when startTime > 0).
 */
export function isBlockCurrentlyActive(startTime: string, endTime: string, now: Date = new Date()): boolean {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = parseTimeToMinutes(startTime);
  let endMins = parseTimeToMinutes(endTime);

  // Milestone cutoff like 00:00 - 00:00 (highlight between 23:55 and 00:30)
  if (startMins === endMins) {
    if (startMins === 0) {
      return nowMins >= 23 * 60 + 55 || nowMins <= 30;
    }
    return Math.abs(nowMins - startMins) <= 15;
  }

  if (endMins === 0 && startMins > 0) {
    endMins = 24 * 60;
  }

  if (endMins > startMins) {
    return nowMins >= startMins && nowMins < endMins;
  }

  // Overnight wrap (e.g., 22:00 - 02:00)
  return nowMins >= startMins || nowMins < endMins;
}

/**
 * Computes sleep duration in hours between bedtime (HH:MM) and wakeTime (HH:MM).
 */
export function computeSleepHours(bedtime: string, wakeTime: string): number {
  const bedMins = parseTimeToMinutes(bedtime);
  let wakeMins = parseTimeToMinutes(wakeTime);
  if (wakeMins <= bedMins) {
    wakeMins += 24 * 60;
  }
  return Math.round(((wakeMins - bedMins) / 60) * 10) / 10;
}

/**
 * Converts HH:MM to decimal hour (e.g., "07:30" -> 7.5, "11:15" -> 11.25).
 */
export function timeToDecimalHours(timeStr: string): number {
  const mins = parseTimeToMinutes(timeStr);
  return Math.round((mins / 60) * 100) / 100;
}

export function formatDecimalHour(decimalHour: number): string {
  const totalMinutes = Math.round(decimalHour * 60);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

export function formatTime12h(timeStr: string): string {
  return formatDecimalHour(timeToDecimalHours(timeStr));
}

export function isDateInCurrentWeek(isoDate: string, now: Date = new Date()): boolean {
  const target = parseISODateLocal(isoDate);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = startOfWeek.getDay(); // 0=Sun, 1=Mon
  const diffToMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return target >= startOfWeek && target < endOfWeek;
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
