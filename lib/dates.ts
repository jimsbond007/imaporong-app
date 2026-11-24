/**
 * Date helpers that work on plain `YYYY-MM-DD` strings so a date never shifts
 * by a day because of the browser's timezone. "Today" is always read in
 * Philippine time (Asia/Manila) to match the database.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** `month` is zero-based, like `Date`. */
export function keyOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function parseKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month: month - 1, day };
}

export function addDays(key: string, amount: number) {
  const { year, month, day } = parseKey(key);
  const date = new Date(Date.UTC(year, month, day + amount));
  return keyOf(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** 0 = Sunday ... 6 = Saturday */
export function weekdayOf(key: string) {
  const { year, month, day } = parseKey(key);
  return new Date(Date.UTC(year, month, day)).getUTCDay();
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function todayInManila() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function hourInManila() {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  return Number(hour) % 24;
}

export function formatShort(key: string) {
  const { month, day } = parseKey(key);
  return `${MONTHS[month].slice(0, 3)} ${day}`;
}

export function formatLong(key: string) {
  const { year, month, day } = parseKey(key);
  return `${WEEKDAYS[weekdayOf(key)]}, ${MONTHS[month]} ${day}, ${year}`;
}

export function formatRange(start: string, end: string) {
  return start === end ? formatShort(start) : `${formatShort(start)} – ${formatShort(end)}`;
}
