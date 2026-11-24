'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { buttonClasses } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AlertIcon, ChevronLeftIcon, TrashIcon } from '@/components/ui/icons';
import { addDays, formatLong, formatRange, todayInManila } from '@/lib/dates';
import {
  APPOINTMENT_STATUS_LABEL,
  appointmentCode,
  formatSlot,
  type AppointmentStatus,
} from '@/lib/appointments';
import type { AppointmentRow, BarangayEvent, BarangayEventKind } from '@/lib/types';
import imapMark from '@/assets/illustrations/imap.svg';

const APPT_FIELDS =
  'id, resident_id, full_name, contact_no, purpose, slip_number, notes, appt_date, time_slot, status, admin_note, created_at';

type Range = 'today' | 'upcoming' | 'past' | 'all';

const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past 30 days' },
  { key: 'all', label: 'All' },
];

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: 'border-pending-line bg-pending-bg text-pending-ink',
  confirmed: 'border-ready-line bg-ready-bg text-ready-ink',
  completed: 'border-line bg-received-bg text-received-ink',
  cancelled: 'border-rejected-line bg-rejected-bg text-rejected-ink',
  no_show: 'border-rejected-line bg-rejected-bg text-rejected-ink',
};

const KIND_LABEL: Record<BarangayEventKind, string> = {
  event: 'Event',
  notice: 'Notice',
  closure: 'Hall closed',
};

export default function AdminAppointmentsPage() {
  const [range, setRange] = useState<Range>('upcoming');
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const [events, setEvents] = useState<BarangayEvent[]>([]);
  const [eventsError, setEventsError] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<BarangayEventKind>('event');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAppointments = useCallback(async (selected: Range) => {
    const today = todayInManila();
    let query = supabase
      .from('appointments')
      .select(APPT_FIELDS)
      .order('appt_date', { ascending: selected !== 'past' })
      .order('time_slot', { ascending: true })
      .limit(300);

    if (selected === 'today') query = query.eq('appt_date', today);
    if (selected === 'upcoming') query = query.gte('appt_date', today);
    if (selected === 'past') query = query.lt('appt_date', today).gte('appt_date', addDays(today, -30));

    const { data, error } = await query;
    if (error) {
      setApptError(
        /relation .* does not exist|schema cache/i.test(error.message)
          ? 'The appointments table is missing. Run supabase/migrations/20261124000000_barangay_events_and_appointments.sql first.'
          : error.message,
      );
      setRows([]);
    } else {
      setApptError('');
      setRows((data ?? []) as AppointmentRow[]);
    }
    setApptLoading(false);
  }, []);

  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('barangay_events')
      .select('id, title, description, kind, start_date, end_date')
      .gte('end_date', addDays(todayInManila(), -30))
      .order('start_date', { ascending: true })
      .limit(200);
    if (error) {
      setEventsError(error.message);
      setEvents([]);
    } else {
      setEventsError('');
      setEvents((data ?? []) as BarangayEvent[]);
    }
  }, []);

  useEffect(() => {
    void loadAppointments(range);
  }, [range, loadAppointments]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const changeRange = (next: Range) => {
    setApptLoading(true);
    setRange(next);
  };

  const setStatus = async (row: AppointmentRow, status: AppointmentStatus) => {
    setBusyId(row.id);
    const { error } = await supabase.from('appointments').update({ status }).eq('id', row.id);
    setBusyId(null);
    if (error) return setApptError(error.message);
    setRows((list) => list.map((item) => (item.id === row.id ? { ...item, status } : item)));
  };

  const saveNote = async (row: AppointmentRow) => {
    setBusyId(row.id);
    const value = noteText.trim() || null;
    const { error } = await supabase.from('appointments').update({ admin_note: value }).eq('id', row.id);
    setBusyId(null);
    if (error) return setApptError(error.message);
    setRows((list) => list.map((item) => (item.id === row.id ? { ...item, admin_note: value } : item)));
    setNoteFor(null);
  };

  const addEvent = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (title.trim().length < 3) return setFormError('Give the entry a title (at least 3 letters).');
    if (!startDate) return setFormError('Choose a start date.');
    const end = endDate || startDate;
    if (end < startDate) return setFormError('The end date cannot be before the start date.');

    setSavingEvent(true);
    const { error } = await supabase.from('barangay_events').insert({
      title: title.trim(),
      kind,
      start_date: startDate,
      end_date: end,
      description: description.trim() || null,
    });
    setSavingEvent(false);
    if (error) return setFormError(error.message);

    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setKind('event');
    void loadEvents();
  };

  const removeEvent = async (id: string) => {
    const { error } = await supabase.from('barangay_events').delete().eq('id', id);
    if (error) return setEventsError(error.message);
    setEvents((list) => list.filter((item) => item.id !== id));
  };

  const grouped = rows.reduce<Record<string, AppointmentRow[]>>((acc, row) => {
    (acc[row.appt_date] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b-2 border-line bg-surface">
        <div className="page-shell flex h-[68px] items-center justify-between gap-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-mist p-1">
              <Image src={imapMark} alt="iMaporong" priority className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-extrabold tracking-tight text-forest">
                iMaporong
              </span>
              <span className="block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
                Staff · Appointments &amp; events
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin" className={`${buttonClasses('quiet', 'sm')} px-2.5 text-xs`}>
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Workspace</span>
            </Link>
            <ThemeToggle className="!h-10 !w-10" />
          </div>
        </div>
      </header>

      <main className="page-shell mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* ------------------------------------------------ Appointments */}
        <section className="rounded-[20px] border-2 border-line bg-surface p-5 shadow-card sm:p-6">
          <h1 className="heading-2">Walk-in appointments</h1>
          <p className="body-sm mt-1">
            Residents book a time from the calendar. Confirm the visit, then mark it completed when
            they have been served.
          </p>

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Appointment range">
            {RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={range === item.key}
                onClick={() => changeRange(item.key)}
                className={`rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition ${
                  range === item.key
                    ? 'border-pine bg-pine text-white'
                    : 'border-line bg-surface text-muted hover:border-leaf hover:text-forest'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {apptError && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border-2 border-rejected-line bg-rejected-bg px-3.5 py-3 text-sm font-bold text-rejected-ink"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {apptError}
            </p>
          )}

          {apptLoading ? (
            <div className="skeleton mt-5 h-24 rounded-2xl" aria-label="Loading appointments" />
          ) : rows.length === 0 && !apptError ? (
            <p className="mt-5 rounded-2xl bg-mist px-4 py-6 text-center text-sm font-semibold text-muted">
              No appointments in this view.
            </p>
          ) : (
            <div className="mt-5 space-y-6">
              {Object.entries(grouped).map(([date, list]) => (
                <div key={date}>
                  <h2 className="font-display text-base font-bold text-forest">{formatLong(date)}</h2>
                  <ul className="mt-2 space-y-2.5">
                    {list.map((row) => (
                      <li key={row.id} className="rounded-2xl border-2 border-line bg-subtle p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-forest">
                              {formatSlot(row.time_slot)} · {row.full_name}
                            </p>
                            <p className="text-xs font-semibold text-muted">{row.purpose}</p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.06em] ${STATUS_STYLE[row.status]}`}
                          >
                            {APPOINTMENT_STATUS_LABEL[row.status]}
                          </span>
                        </div>

                        <p className="mt-1.5 font-mono text-[0.6875rem] font-bold text-muted">
                          {appointmentCode(row.id)}
                          {row.contact_no ? ` · ${row.contact_no}` : ''}
                          {row.slip_number ? ` · Slip ${row.slip_number}` : ''}
                        </p>
                        {row.notes && (
                          <p className="mt-1 text-xs font-medium leading-relaxed text-muted">
                            Resident note: {row.notes}
                          </p>
                        )}
                        {row.admin_note && noteFor !== row.id && (
                          <p className="mt-1 text-xs font-bold text-pine-ink">Staff note: {row.admin_note}</p>
                        )}

                        {noteFor === row.id ? (
                          <div className="mt-2 flex gap-2">
                            <input
                              value={noteText}
                              onChange={(event) => setNoteText(event.target.value)}
                              maxLength={500}
                              placeholder="Note shown to the resident"
                              className="input-base !py-2 text-sm"
                            />
                            <button
                              type="button"
                              disabled={busyId === row.id}
                              onClick={() => void saveNote(row)}
                              className={buttonClasses('primary', 'sm')}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setNoteFor(null)}
                              className={buttonClasses('quiet', 'sm')}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {row.status === 'pending' && (
                              <ActionButton
                                disabled={busyId === row.id}
                                onClick={() => void setStatus(row, 'confirmed')}
                                tone="primary"
                              >
                                Confirm
                              </ActionButton>
                            )}
                            {(row.status === 'pending' || row.status === 'confirmed') && (
                              <>
                                <ActionButton
                                  disabled={busyId === row.id}
                                  onClick={() => void setStatus(row, 'completed')}
                                >
                                  Mark completed
                                </ActionButton>
                                <ActionButton
                                  disabled={busyId === row.id}
                                  onClick={() => void setStatus(row, 'no_show')}
                                >
                                  No-show
                                </ActionButton>
                                <ActionButton
                                  disabled={busyId === row.id}
                                  onClick={() => void setStatus(row, 'cancelled')}
                                  tone="danger"
                                >
                                  Cancel
                                </ActionButton>
                              </>
                            )}
                            <ActionButton
                              onClick={() => {
                                setNoteFor(row.id);
                                setNoteText(row.admin_note ?? '');
                              }}
                            >
                              {row.admin_note ? 'Edit note' : 'Add note'}
                            </ActionButton>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ------------------------------------------------ Calendar events */}
        <section className="h-fit rounded-[20px] border-2 border-line bg-surface p-5 shadow-card sm:p-6">
          <h2 className="heading-2">Calendar events</h2>
          <p className="body-sm mt-1">
            Entries here appear on every resident&rsquo;s barangay calendar. Use{' '}
            <strong className="text-forest">Hall closed</strong> to stop bookings on those dates.
          </p>

          <form onSubmit={addEvent} noValidate className="mt-4 space-y-3">
            <label className="block">
              <span className="label-sm text-forest">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                placeholder="e.g. Barangay assembly"
                className="input-base mt-1.5"
              />
            </label>
            <label className="block">
              <span className="label-sm text-forest">Type</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as BarangayEventKind)}
                className="input-base mt-1.5"
              >
                <option value="event">Event</option>
                <option value="notice">Notice</option>
                <option value="closure">Hall closed (no appointments)</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label-sm text-forest">Starts</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="input-base mt-1.5"
                />
              </label>
              <label className="block">
                <span className="label-sm text-forest">Ends (optional)</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="input-base mt-1.5"
                />
              </label>
            </div>
            <label className="block">
              <span className="label-sm text-forest">Details (optional)</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={3}
                className="input-base mt-1.5 resize-none"
              />
            </label>
            {formError && (
              <p role="alert" className="text-xs font-bold text-rejected-ink">
                {formError}
              </p>
            )}
            <button type="submit" disabled={savingEvent} className={`${buttonClasses('primary', 'md')} w-full`}>
              {savingEvent ? 'Saving…' : 'Add to calendar'}
            </button>
          </form>

          {eventsError && (
            <p role="alert" className="mt-4 text-xs font-bold text-rejected-ink">
              {/relation .* does not exist|schema cache/i.test(eventsError)
                ? 'The events table is missing. Run the latest migration first.'
                : eventsError}
            </p>
          )}

          <ul className="mt-5 space-y-2">
            {events.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-xl border-2 border-line bg-subtle px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-forest">{item.title}</p>
                  <p className="text-xs font-semibold text-muted">
                    {KIND_LABEL[item.kind]} · {formatRange(item.start_date, item.end_date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeEvent(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-rejected-bg hover:text-rejected-ink"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
            {events.length === 0 && !eventsError && (
              <li className="rounded-xl bg-mist px-3.5 py-4 text-center text-xs font-semibold text-muted">
                No barangay events yet.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'primary' | 'danger';
}) {
  const styles = {
    neutral: 'border-line bg-surface text-forest hover:border-leaf hover:bg-mist',
    primary: 'border-pine bg-pine text-white hover:bg-pine-deep',
    danger: 'border-rejected-line bg-rejected-bg text-rejected-ink hover:bg-rejected-line/60',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}
