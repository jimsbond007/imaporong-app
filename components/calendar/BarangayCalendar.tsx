'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { buttonClasses } from '@/components/ui/Button';
import {
  AlertIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
} from '@/components/ui/icons';
import {
  addDays,
  daysInMonth,
  formatLong,
  formatRange,
  hourInManila,
  keyOf,
  MONTHS,
  parseKey,
  todayInManila,
  weekdayOf,
} from '@/lib/dates';
import {
  getHoliday,
  getHolidayMap,
  HOLIDAY_KIND_LABEL,
  isNonWorkingHoliday,
  type Holiday,
} from '@/lib/holidays';
import {
  APPOINTMENT_PURPOSES,
  APPOINTMENT_SLOTS,
  APPOINTMENT_STATUS_LABEL,
  appointmentCode,
  describeAppointment,
  formatSlot,
  formatSlotStart,
  MAX_ADVANCE_DAYS,
  OFFICE_HOURS_LABEL,
  SLOT_CAPACITY,
} from '@/lib/appointments';
import type { AppointmentRow, BarangayEvent } from '@/lib/types';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Marker colours. All of them are theme tokens, so they follow dark mode. */
const HOLIDAY_BAR: Record<Holiday['kind'], string> = {
  regular: 'bg-rejected-ink',
  special: 'bg-gold',
  working: 'bg-leaf',
};

const EVENT_BAR: Record<BarangayEvent['kind'], string> = {
  event: 'bg-river',
  notice: 'bg-pine',
  closure: 'bg-forest',
};

const EVENT_LABEL: Record<BarangayEvent['kind'], string> = {
  event: 'Barangay event',
  notice: 'Notice',
  closure: 'Barangay hall closed',
};

type Clock = { today: string; hour: number };
type View = 'calendar' | 'book' | 'done';

/** Why a day cannot be booked, or null when it can. */
function bookingBlocker(key: string, clock: Clock, events: BarangayEvent[]): string | null {
  if (key < clock.today) return 'That date has already passed.';
  if (key > addDays(clock.today, MAX_ADVANCE_DAYS)) {
    return `Appointments open up to ${MAX_ADVANCE_DAYS} days ahead.`;
  }
  const weekday = weekdayOf(key);
  if (weekday === 0 || weekday === 6) return 'The barangay hall accepts walk-ins on weekdays only.';
  const holiday = getHoliday(key);
  if (isNonWorkingHoliday(holiday)) return `The hall is closed for ${holiday?.name}.`;
  const closure = events.find(
    (event) => event.kind === 'closure' && key >= event.start_date && key <= event.end_date,
  );
  if (closure) return `The hall is closed: ${closure.title}.`;
  return null;
}

export function BarangayCalendar({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState<Clock | null>(null);
  const [view, setView] = useState<View>('calendar');
  const [cursor, setCursor] = useState({ year: 2026, month: 0 });
  const [selected, setSelected] = useState('');

  const [loaded, setLoaded] = useState(false);
  const [eventsOnline, setEventsOnline] = useState(true);
  const [events, setEvents] = useState<BarangayEvent[]>([]);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [mine, setMine] = useState<AppointmentRow[]>([]);
  const [taken, setTaken] = useState<Record<string, number>>({});
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  // Booking form
  const [bookDate, setBookDate] = useState('');
  const [slot, setSlot] = useState('');
  const [purpose, setPurpose] = useState<string>(APPOINTMENT_PURPOSES[0].value);
  const [contact, setContact] = useState('');
  const [slipNo, setSlipNo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [booked, setBooked] = useState<AppointmentRow | null>(null);

  const loadData = async (todayKey: string) => {
    let nextUser: { id: string; name: string } | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single();
        nextUser = {
          id: data.user.id,
          name: (profile?.full_name as string | null) ?? data.user.email ?? 'Resident',
        };
      }
    } catch {
      nextUser = null;
    }
    setUser(nextUser);

    try {
      const { data, error } = await supabase
        .from('barangay_events')
        .select('id, title, description, kind, start_date, end_date')
        .gte('end_date', addDays(todayKey, -62))
        .order('start_date', { ascending: true })
        .limit(500);
      if (error) throw error;
      setEvents((data ?? []) as BarangayEvent[]);
      setEventsOnline(true);
    } catch {
      setEvents([]);
      setEventsOnline(false);
    }

    if (nextUser) {
      try {
        const { data } = await supabase
          .from('appointments')
          .select(
            'id, resident_id, full_name, contact_no, purpose, slip_number, notes, appt_date, time_slot, status, admin_note, created_at',
          )
          .gte('appt_date', todayKey)
          .in('status', ['pending', 'confirmed'])
          .order('appt_date', { ascending: true })
          .order('time_slot', { ascending: true });
        setMine((data ?? []) as AppointmentRow[]);
      } catch {
        setMine([]);
      }
      await loadSlotCounts(todayKey);
    }
    setLoaded(true);
  };

  const loadSlotCounts = async (todayKey: string) => {
    try {
      const { data } = await supabase.rpc('appointment_slot_counts', {
        p_from: todayKey,
        p_to: addDays(todayKey, MAX_ADVANCE_DAYS),
      });
      const next: Record<string, number> = {};
      for (const row of (data ?? []) as { appt_date: string; time_slot: string; taken: number }[]) {
        next[`${row.appt_date}|${row.time_slot}`] = row.taken;
      }
      setTaken(next);
    } catch {
      setTaken({});
    }
  };

  const openPanel = () => {
    const today = todayInManila();
    const { year, month } = parseKey(today);
    setClock({ today, hour: hourInManila() });
    setCursor({ year, month });
    setSelected(today);
    setView('calendar');
    setOpen(true);
    void loadData(today);
  };

  const closePanel = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // ------------------------------------------------------------ month data
  const holidays = useMemo(() => getHolidayMap(cursor.year), [cursor.year]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, BarangayEvent[]> = {};
    const total = daysInMonth(cursor.year, cursor.month);
    const first = keyOf(cursor.year, cursor.month, 1);
    const last = keyOf(cursor.year, cursor.month, total);
    for (const event of events) {
      if (event.end_date < first || event.start_date > last) continue;
      const from = event.start_date < first ? first : event.start_date;
      const to = event.end_date > last ? last : event.end_date;
      for (let key = from; key <= to; key = addDays(key, 1)) {
        (map[key] ??= []).push(event);
      }
    }
    return map;
  }, [events, cursor.year, cursor.month]);

  const mineByDay = useMemo(() => {
    const map: Record<string, AppointmentRow[]> = {};
    for (const row of mine) (map[row.appt_date] ??= []).push(row);
    return map;
  }, [mine]);

  const cells = useMemo(() => {
    const total = daysInMonth(cursor.year, cursor.month);
    const lead = weekdayOf(keyOf(cursor.year, cursor.month, 1));
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: total }, (_, index) => index + 1),
    ];
  }, [cursor.year, cursor.month]);

  const shiftMonth = (delta: number) => {
    setCursor((value) => {
      const index = value.year * 12 + value.month + delta;
      return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
    });
  };

  const goToday = () => {
    if (!clock) return;
    const { year, month } = parseKey(clock.today);
    setCursor({ year, month });
    setSelected(clock.today);
  };

  // ---------------------------------------------------------- booking flow
  const startBooking = (dateKey?: string) => {
    if (!clock) return;
    let candidate = dateKey && dateKey >= clock.today ? dateKey : clock.today;
    // Jump to the next day the hall is actually open.
    for (let guard = 0; guard < 60; guard += 1) {
      if (!bookingBlocker(candidate, clock, events)) break;
      candidate = addDays(candidate, 1);
    }
    setBookDate(candidate);
    setSlot('');
    setFormError('');
    setBooked(null);
    setView('book');
  };

  const dateProblem = clock && bookDate ? bookingBlocker(bookDate, clock, events) : null;
  const needsSlip = APPOINTMENT_PURPOSES.find((item) => item.value === purpose)?.needsSlip ?? false;

  const slotState = (time: string) => {
    const used = taken[`${bookDate}|${time}`] ?? 0;
    const left = Math.max(SLOT_CAPACITY - used, 0);
    const passed = clock !== null && bookDate === clock.today && Number(time.slice(0, 2)) <= clock.hour;
    return { left, passed, disabled: left === 0 || passed };
  };

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !clock) return;
    setFormError('');

    if (dateProblem) return setFormError(dateProblem);
    if (!slot) return setFormError('Please pick a time.');
    const cleanContact = contact.trim();
    if (cleanContact && !/^[0-9+()\-\s]{7,20}$/.test(cleanContact)) {
      return setFormError('Please enter a valid mobile number, or leave it blank.');
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        resident_id: user.id,
        full_name: user.name,
        contact_no: cleanContact || null,
        purpose,
        slip_number: needsSlip && slipNo.trim() ? slipNo.trim() : null,
        notes: notes.trim() || null,
        appt_date: bookDate,
        time_slot: slot,
      })
      .select(
        'id, resident_id, full_name, contact_no, purpose, slip_number, notes, appt_date, time_slot, status, admin_note, created_at',
      )
      .single();
    setSaving(false);

    if (error || !data) {
      const message = error?.message ?? 'We could not save your appointment.';
      setFormError(
        /relation .* does not exist|schema cache/i.test(message)
          ? 'Appointments are not set up yet. Ask the barangay to run the latest database migration.'
          : message,
      );
      void loadSlotCounts(clock.today);
      return;
    }

    setBooked(data as AppointmentRow);
    setMine((rows) =>
      [...rows, data as AppointmentRow].sort((a, b) =>
        `${a.appt_date}${a.time_slot}`.localeCompare(`${b.appt_date}${b.time_slot}`),
      ),
    );
    setNotes('');
    setSlipNo('');
    setView('done');
    void loadSlotCounts(clock.today);
  };

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    setConfirmCancel(null);
    if (error) return;
    setMine((rows) => rows.filter((row) => row.id !== id));
    if (clock) void loadSlotCounts(clock.today);
  };

  // ---------------------------------------------------------------- render
  const selectedHoliday = selected ? getHoliday(selected) : undefined;
  const selectedEvents = selected
    ? events.filter((event) => selected >= event.start_date && selected <= event.end_date)
    : [];
  const selectedMine = selected ? (mineByDay[selected] ?? []) : [];
  const hasDayContent = Boolean(selectedHoliday) || selectedEvents.length > 0 || selectedMine.length > 0;

  const panel =
    open && clock
      ? createPortal(
          <div className="fixed inset-0 z-[90]">
            <button
              type="button"
              aria-label="Close calendar"
              onClick={closePanel}
              className="absolute inset-0 cursor-default bg-ink-solid/40 sm:bg-transparent"
            />
            <div
              ref={panelRef}
              id="barangay-calendar-panel"
              role="dialog"
              aria-label="Barangay calendar"
              tabIndex={-1}
              className="animate-fade-up absolute inset-x-3 top-[76px] max-h-[calc(100dvh-92px)] overflow-y-auto rounded-[24px] border-2 border-line bg-surface p-4 shadow-raised outline-none sm:inset-x-auto sm:right-5 sm:w-[390px] sm:p-5"
            >
              {/* ------------------------------------------------ top bar */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="eyebrow flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Barangay calendar
                </p>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Retract calendar"
                  className="rounded-full p-1.5 text-muted transition hover:bg-mist hover:text-forest"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              {view === 'calendar' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-bold text-forest">
                      {MONTHS[cursor.month]} {cursor.year}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => shiftMonth(-1)}
                        aria-label="Previous month"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-line bg-surface text-forest transition hover:border-leaf hover:bg-mist"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={goToday}
                        className="h-9 rounded-xl border-2 border-line bg-surface px-3 text-xs font-bold text-forest transition hover:border-leaf hover:bg-mist"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftMonth(1)}
                        aria-label="Next month"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-line bg-surface text-forest transition hover:border-leaf hover:bg-mist"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Month grid */}
                  <div className="mt-4 grid grid-cols-7 gap-y-1 text-center" role="grid">
                    {DAY_LABELS.map((label) => (
                      <div key={label} className="pb-1 text-[0.6875rem] font-bold text-muted">
                        {label}
                      </div>
                    ))}
                    {cells.map((day, index) => {
                      if (day === null) return <div key={`blank-${index}`} />;
                      const key = keyOf(cursor.year, cursor.month, day);
                      const holiday = holidays[key];
                      const dayEvents = eventsByDay[key] ?? [];
                      const isSelected = key === selected;
                      const isToday = key === clock.today;
                      const bars = [
                        ...(holiday ? [HOLIDAY_BAR[holiday.kind]] : []),
                        ...dayEvents.map((event) => EVENT_BAR[event.kind]),
                      ].slice(0, 3);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelected(key)}
                          aria-label={`${formatLong(key)}${holiday ? `, ${holiday.name}` : ''}${
                            dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''
                          }`}
                          aria-pressed={isSelected}
                          className="group flex h-12 flex-col items-center justify-start gap-0.5 pt-0.5"
                        >
                          <span className="flex h-[3px] items-center gap-0.5" aria-hidden="true">
                            {bars.map((bar, barIndex) => (
                              <span key={barIndex} className={`h-[3px] w-3 rounded-full ${bar}`} />
                            ))}
                          </span>
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold transition ${
                              isSelected
                                ? 'bg-pine text-white ring-2 ring-gold'
                                : isToday
                                  ? 'text-forest ring-2 ring-pine/70'
                                  : 'text-forest group-hover:bg-mist'
                            }`}
                          >
                            {day}
                          </span>
                          <span
                            className={`h-1 w-1 rounded-full ${mineByDay[key] ? 'bg-pine-ink' : 'bg-transparent'}`}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.6875rem] font-semibold text-muted">
                    <li className="flex items-center gap-1.5"><span className="h-[3px] w-3 rounded-full bg-rejected-ink" />Holiday</li>
                    <li className="flex items-center gap-1.5"><span className="h-[3px] w-3 rounded-full bg-gold" />Special day</li>
                    <li className="flex items-center gap-1.5"><span className="h-[3px] w-3 rounded-full bg-river" />Barangay event</li>
                    <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-pine-ink" />My appointment</li>
                  </ul>

                  {/* Selected day */}
                  <div className="mt-4 border-t-2 border-line pt-4">
                    <p className="font-display text-base font-bold text-forest">{formatLong(selected)}</p>

                    <div className="mt-3 space-y-2">
                      {selectedHoliday && (
                        <DayItem
                          bar={HOLIDAY_BAR[selectedHoliday.kind]}
                          title={selectedHoliday.name}
                          sub={HOLIDAY_KIND_LABEL[selectedHoliday.kind]}
                        />
                      )}
                      {selectedEvents.map((event) => (
                        <DayItem
                          key={event.id}
                          bar={EVENT_BAR[event.kind]}
                          title={event.title}
                          sub={`${EVENT_LABEL[event.kind]} · ${formatRange(event.start_date, event.end_date)}`}
                          body={event.description}
                        />
                      ))}
                      {selectedMine.map((row) => (
                        <DayItem
                          key={row.id}
                          bar="bg-pine-ink"
                          title="Your walk-in appointment"
                          sub={`${formatSlot(row.time_slot)} · ${row.purpose}`}
                        />
                      ))}
                      {!hasDayContent && (
                        <p className="rounded-xl bg-mist px-3.5 py-3 text-sm font-semibold text-muted">
                          No holidays or events on this date.
                        </p>
                      )}
                    </div>
                  </div>

                  {!eventsOnline && loaded && (
                    <p className="mt-3 text-xs font-semibold text-muted">
                      Barangay events could not be loaded right now. Holidays are still shown.
                    </p>
                  )}

                  {/* Appointment call to action */}
                  <div className="mt-4 rounded-2xl border-2 border-ready-line bg-mint/60 p-3.5">
                    <p className="flex items-center gap-1.5 text-sm font-extrabold text-pine-ink">
                      <ClockIcon className="h-4 w-4" />
                      Visiting the barangay hall?
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                      Reserve a walk-in time so you can claim a document or talk to an official
                      without long waits. Open {OFFICE_HOURS_LABEL}.
                    </p>
                    <button
                      type="button"
                      onClick={() => startBooking(selected)}
                      className={`${buttonClasses('primary', 'md')} mt-3 w-full`}
                    >
                      Set a walk-in appointment
                    </button>
                  </div>

                  {/* My appointments */}
                  {mine.length > 0 && (
                    <div className="mt-4">
                      <p className="eyebrow">My upcoming appointments</p>
                      <ul className="mt-2 space-y-2">
                        {mine.map((row) => (
                          <li
                            key={row.id}
                            className="rounded-xl border-2 border-line bg-subtle px-3.5 py-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-forest">
                                  {describeAppointment(row.appt_date, row.time_slot)}
                                </p>
                                <p className="truncate text-xs font-semibold text-muted">{row.purpose}</p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em] ${
                                  row.status === 'confirmed'
                                    ? 'border-ready-line bg-ready-bg text-ready-ink'
                                    : 'border-pending-line bg-pending-bg text-pending-ink'
                                }`}
                              >
                                {APPOINTMENT_STATUS_LABEL[row.status]}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-[0.6875rem] font-bold text-muted">
                              {appointmentCode(row.id)}
                            </p>
                            {row.admin_note && (
                              <p className="mt-1 text-xs font-semibold text-muted">Staff note: {row.admin_note}</p>
                            )}
                            <div className="mt-2">
                              {confirmCancel === row.id ? (
                                <span className="flex items-center gap-2 text-xs font-bold">
                                  <span className="text-muted">Cancel this visit?</span>
                                  <button
                                    type="button"
                                    onClick={() => void cancelAppointment(row.id)}
                                    className="rounded-lg bg-rejected-bg px-2.5 py-1 text-rejected-ink"
                                  >
                                    Yes, cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCancel(null)}
                                    className="rounded-lg bg-mist px-2.5 py-1 text-forest"
                                  >
                                    Keep
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancel(row.id)}
                                  className="text-xs font-bold text-muted underline-offset-4 hover:text-rejected-ink hover:underline"
                                >
                                  Cancel appointment
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-4 text-[0.6875rem] font-semibold leading-relaxed text-muted">
                    Holiday dates follow Malacañang proclamations (2026: No. 1006; 2027: No. 1427) and can
                    change if a new proclamation is issued.
                  </p>
                </>
              )}

              {view === 'book' && (
                <form onSubmit={submitBooking} noValidate>
                  <button
                    type="button"
                    onClick={() => setView('calendar')}
                    className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-pine-ink hover:underline"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                    Back to calendar
                  </button>
                  <h2 className="font-display text-xl font-bold text-forest">Walk-in appointment</h2>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">
                    Pick a time to visit the barangay hall in person. Please bring a valid ID.
                  </p>

                  {user === null && (
                    <div className="mt-4 rounded-2xl border-2 border-pending-line bg-pending-bg p-4">
                      <p className="text-sm font-extrabold text-pending-ink">Sign in to book</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">
                        Appointments are tied to your resident account so staff know who is coming.
                      </p>
                      <Link
                        href={`/auth?next=${encodeURIComponent(pathname || '/')}`}
                        className={`${buttonClasses('primary', 'md')} mt-3 w-full`}
                      >
                        Sign in or register
                      </Link>
                    </div>
                  )}

                  {user && (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="label-sm text-forest">What is your visit for?</span>
                        <select
                          value={purpose}
                          onChange={(event) => setPurpose(event.target.value)}
                          className="input-base mt-1.5"
                        >
                          {APPOINTMENT_PURPOSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.value}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="label-sm text-forest">Date</span>
                        <input
                          type="date"
                          value={bookDate}
                          min={clock.today}
                          max={addDays(clock.today, MAX_ADVANCE_DAYS)}
                          onChange={(event) => {
                            setBookDate(event.target.value);
                            setSlot('');
                          }}
                          className="input-base mt-1.5"
                        />
                        {bookDate && (
                          <span
                            className={`mt-1.5 flex items-start gap-1.5 text-xs font-semibold ${
                              dateProblem ? 'text-rejected-ink' : 'text-muted'
                            }`}
                          >
                            {dateProblem ? <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : null}
                            {dateProblem ?? formatLong(bookDate)}
                          </span>
                        )}
                      </label>

                      <fieldset disabled={Boolean(dateProblem)} className="min-w-0 disabled:opacity-50">
                        <legend className="label-sm text-forest">Time</legend>
                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                          {APPOINTMENT_SLOTS.map((time) => {
                            const state = slotState(time);
                            const active = slot === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={state.disabled}
                                aria-pressed={active}
                                onClick={() => setSlot(time)}
                                className={`rounded-xl border-2 px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                                  active
                                    ? 'border-pine bg-pine text-white'
                                    : 'border-line bg-surface text-forest hover:border-leaf hover:bg-mist'
                                }`}
                              >
                                <span className="block text-sm font-extrabold">{formatSlotStart(time)}</span>
                                <span className={`block text-[0.6875rem] font-semibold ${active ? 'text-white/85' : 'text-muted'}`}>
                                  {state.passed ? 'Passed' : state.left === 0 ? 'Full' : `${state.left} spot${state.left > 1 ? 's' : ''} left`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      {needsSlip && (
                        <label className="block">
                          <span className="label-sm text-forest">Request slip number (optional)</span>
                          <input
                            value={slipNo}
                            onChange={(event) => setSlipNo(event.target.value)}
                            maxLength={40}
                            placeholder="From your request in the portal"
                            className="input-base mt-1.5"
                          />
                        </label>
                      )}

                      <label className="block">
                        <span className="label-sm text-forest">Mobile number (optional)</span>
                        <input
                          type="tel"
                          value={contact}
                          onChange={(event) => setContact(event.target.value)}
                          maxLength={20}
                          placeholder="09XX XXX XXXX"
                          className="input-base mt-1.5"
                        />
                      </label>

                      <label className="block">
                        <span className="label-sm text-forest">Notes for the staff (optional)</span>
                        <textarea
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          maxLength={500}
                          rows={3}
                          className="input-base mt-1.5 resize-none"
                        />
                      </label>

                      {formError && (
                        <p
                          role="alert"
                          className="flex items-start gap-2 rounded-xl border-2 border-rejected-line bg-rejected-bg px-3 py-2.5 text-xs font-bold text-rejected-ink"
                        >
                          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                          {formError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={saving}
                        className={`${buttonClasses('primary', 'lg')} w-full`}
                      >
                        {saving ? 'Saving…' : 'Confirm appointment'}
                      </button>
                      <p className="text-center text-[0.6875rem] font-semibold text-muted">
                        Staff will confirm your slot. You can cancel it anytime from the calendar.
                      </p>
                    </div>
                  )}
                </form>
              )}

              {view === 'done' && booked && (
                <div className="py-2 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint text-pine-ink">
                    <CheckCircleIcon className="h-8 w-8" />
                  </span>
                  <h2 className="mt-3 font-display text-xl font-bold text-forest">Appointment requested</h2>
                  <p className="mt-1 text-sm font-semibold text-muted">
                    Show this code at the barangay hall.
                  </p>
                  <p className="mx-auto mt-3 w-fit rounded-xl border-2 border-dashed border-pine/50 bg-mint/60 px-4 py-2 font-mono text-lg font-extrabold tracking-widest text-pine-ink">
                    {appointmentCode(booked.id)}
                  </p>
                  <dl className="mx-auto mt-4 max-w-[280px] space-y-1.5 text-left text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="font-bold text-muted">Date</dt>
                      <dd className="text-right font-extrabold text-forest">{formatLong(booked.appt_date)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="font-bold text-muted">Time</dt>
                      <dd className="text-right font-extrabold text-forest">{formatSlot(booked.time_slot)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="font-bold text-muted">Purpose</dt>
                      <dd className="text-right font-extrabold text-forest">{booked.purpose}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(booked.appt_date);
                      const { year, month } = parseKey(booked.appt_date);
                      setCursor({ year, month });
                      setView('calendar');
                    }}
                    className={`${buttonClasses('secondary', 'md')} mt-5 w-full`}
                  >
                    Back to calendar
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-controls="barangay-calendar-panel"
        aria-label="Barangay calendar"
        title="Barangay calendar & appointments"
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-forest shadow-subtle transition hover:border-leaf hover:bg-mist active:translate-x-[2px] active:translate-y-[2px] ${
          open ? 'border-pine bg-mint' : 'border-line bg-surface/80'
        } ${className}`}
      >
        <CalendarIcon className="h-5 w-5" />
      </button>
      {panel}
    </>
  );
}

function DayItem({
  bar,
  title,
  sub,
  body,
}: {
  bar: string;
  title: string;
  sub: string;
  body?: string | null;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl bg-mist">
      <span className={`w-1.5 shrink-0 ${bar}`} aria-hidden="true" />
      <div className="min-w-0 px-3.5 py-2.5">
        <p className="text-sm font-extrabold uppercase tracking-wide text-forest">{title}</p>
        <p className="text-xs font-semibold text-muted">{sub}</p>
        {body ? <p className="mt-1 text-xs font-medium leading-relaxed text-muted">{body}</p> : null}
      </div>
    </div>
  );
}
