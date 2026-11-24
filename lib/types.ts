export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface PublicStats {
  verified_residents: number;
  requests_served: number;
  announcements: number;
}

export interface ResidentRow {
  id: string;
  profile_id: string | null;
  full_name: string;
  address: string;
  age: number | null;
  gender: string | null;
  is_verified: boolean;
  bid_number?: string | null;
}

export interface ServiceRequestRow {
  id: string;
  resident_id: string;
  full_name: string;
  service_type: string;
  purpose: string;
  status: string;
  rejection_reason?: string | null;
  age: number | null;
  address?: string | null;
  sex?: string | null;
  civil_status?: string | null;
  birthday?: string | null;
  birth_place?: string | null;
  height?: string | null;
  weight?: string | null;
  business?: string | null;
  capital?: string | null;
  cp_no?: string | null;
  slip_number?: string | null;
  request_for?: string | null;
  created_at: string;
  received_at?: string | null;
  resident_hidden_at?: string | null;
}

export type BarangayEventKind = 'event' | 'closure' | 'notice';

export interface BarangayEvent {
  id: string;
  title: string;
  description: string | null;
  kind: BarangayEventKind;
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface AppointmentRow {
  id: string;
  resident_id: string;
  full_name: string;
  contact_no: string | null;
  purpose: string;
  slip_number: string | null;
  notes: string | null;
  appt_date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  admin_note: string | null;
  created_at: string;
}
