import { formatShort } from '@/lib/dates';

/**
 * Walk-in appointment rules for the barangay hall.
 *
 * ASSUMPTION: Monday to Friday, 8:00 AM to 5:00 PM with a lunch break from
 * 12:00 to 1:00 PM, one-hour slots, 5 residents per slot. These mirror the
 * checks in supabase/migrations/20261124000000_barangay_events_and_appointments.sql,
 * so change both places together if the hall's real schedule is different.
 */
export const APPOINTMENT_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
] as const;

export const SLOT_CAPACITY = 5;
export const MAX_ADVANCE_DAYS = 45;
export const MAX_ACTIVE_PER_RESIDENT = 3;
export const OFFICE_HOURS_LABEL = 'Monday to Friday, 8:00 AM – 12:00 NN and 1:00 – 5:00 PM';

export const APPOINTMENT_PURPOSES = [
  { value: 'Claim a processed document', needsSlip: true },
  { value: 'Request a document in person', needsSlip: false },
  { value: 'Barangay ID — photo and signing', needsSlip: false },
  { value: 'Talk to a barangay official', needsSlip: false },
  { value: 'Other concern', needsSlip: false },
] as const;

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'Did not show',
};

export function formatSlot(slot: string) {
  const hour = Number(slot.slice(0, 2));
  const label = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
  return `${label(hour)} – ${label(hour + 1)}`;
}

export function formatSlotStart(slot: string) {
  return formatSlot(slot).split(' – ')[0];
}

export function appointmentCode(id: string) {
  return `APT-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

export function describeAppointment(date: string, slot: string) {
  return `${formatShort(date)} · ${formatSlot(slot)}`;
}
