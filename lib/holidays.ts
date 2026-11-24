import { addDays, keyOf, parseKey } from '@/lib/dates';

export type HolidayKind = 'regular' | 'special' | 'working';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  kind: HolidayKind;
}

export const HOLIDAY_KIND_LABEL: Record<HolidayKind, string> = {
  regular: 'Regular holiday',
  special: 'Special non-working day',
  working: 'Special working day',
};

/**
 * Philippine national holidays.
 *
 * Fixed-date and Easter-based holidays are calculated for any year. Holidays
 * that depend on the lunar calendar, plus the extra special days the
 * Palace adds each year, are listed per year because they only exist once a
 * proclamation is signed:
 *   - 2026: Proclamation No. 1006 (Eid'l Fitr and Eid'l Adha were set later)
 *   - 2027: Proclamation No. 1427 (Islamic holidays not yet proclaimed)
 * Add the next year's entries to PROCLAIMED when the Palace publishes them.
 */
const PROCLAIMED: Record<number, Holiday[]> = {
  2026: [
    { date: '2026-02-17', name: 'Chinese New Year', kind: 'special' },
    { date: '2026-02-25', name: 'EDSA People Power Anniversary', kind: 'working' },
    { date: '2026-03-20', name: "Eid'l Fitr", kind: 'regular' },
    { date: '2026-05-27', name: "Eid'l Adha", kind: 'regular' },
    { date: '2026-11-02', name: "All Souls' Day", kind: 'special' },
    { date: '2026-12-24', name: 'Christmas Eve', kind: 'special' },
  ],
  2027: [
    { date: '2027-02-06', name: 'Chinese New Year', kind: 'special' },
    { date: '2027-02-25', name: 'EDSA People Power Anniversary', kind: 'special' },
    { date: '2027-11-02', name: "All Souls' Day", kind: 'special' },
  ],
};

/** Western Easter Sunday (Meeus/Jones/Butcher algorithm). */
function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return keyOf(year, month - 1, day);
}

/** National Heroes Day: last Monday of August (Republic Act 9492). */
function lastMondayOfAugust(year: number) {
  for (let day = 31; day >= 25; day -= 1) {
    const date = new Date(Date.UTC(year, 7, day));
    if (date.getUTCDay() === 1) return keyOf(year, 7, day);
  }
  return keyOf(year, 7, 31);
}

const holidayCache = new Map<number, Record<string, Holiday>>();

/** All holidays of one year, keyed by `YYYY-MM-DD`. */
export function getHolidayMap(year: number): Record<string, Holiday> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const list: Holiday[] = [
    { date: keyOf(year, 0, 1), name: "New Year's Day", kind: 'regular' },
    { date: addDays(easter, -3), name: 'Maundy Thursday', kind: 'regular' },
    { date: addDays(easter, -2), name: 'Good Friday', kind: 'regular' },
    { date: addDays(easter, -1), name: 'Black Saturday', kind: 'special' },
    { date: keyOf(year, 3, 9), name: 'Araw ng Kagitingan', kind: 'regular' },
    { date: keyOf(year, 4, 1), name: 'Labor Day', kind: 'regular' },
    { date: keyOf(year, 5, 12), name: 'Independence Day', kind: 'regular' },
    { date: keyOf(year, 7, 21), name: 'Ninoy Aquino Day', kind: 'special' },
    { date: lastMondayOfAugust(year), name: 'National Heroes Day', kind: 'regular' },
    { date: keyOf(year, 10, 1), name: "All Saints' Day", kind: 'special' },
    { date: keyOf(year, 10, 30), name: 'Bonifacio Day', kind: 'regular' },
    { date: keyOf(year, 11, 8), name: 'Feast of the Immaculate Conception of Mary', kind: 'special' },
    { date: keyOf(year, 11, 25), name: 'Christmas Day', kind: 'regular' },
    { date: keyOf(year, 11, 30), name: 'Rizal Day', kind: 'regular' },
    { date: keyOf(year, 11, 31), name: 'Last Day of the Year', kind: 'special' },
    ...(PROCLAIMED[year] ?? []),
  ];

  const map: Record<string, Holiday> = {};
  for (const holiday of list) {
    // Only keep entries that belong to this year (Easter math stays in-year).
    if (parseKey(holiday.date).year === year) map[holiday.date] = holiday;
  }
  holidayCache.set(year, map);
  return map;
}

export function getHoliday(dateKey: string): Holiday | undefined {
  return getHolidayMap(parseKey(dateKey).year)[dateKey];
}

/** The barangay hall is closed on regular and special non-working days. */
export function isNonWorkingHoliday(holiday: Holiday | undefined) {
  return holiday !== undefined && holiday.kind !== 'working';
}
