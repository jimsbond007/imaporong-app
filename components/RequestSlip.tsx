import type { ReactNode } from 'react';

export interface RequestSlipData {
  id?: string;
  slip_number?: string | null;
  full_name?: string | null;
  address?: string | null;
  age?: number | string | null;
  sex?: string | null;
  civil_status?: string | null;
  birthday?: string | null;
  birth_place?: string | null;
  height?: string | null;
  weight?: string | null;
  business?: string | null;
  capital?: string | null;
  cp_no?: string | null;
  service_type?: string | null;
  purpose?: string | null;
  created_at?: string | null;
}

export function getRequestSlipNumber(request: RequestSlipData): string {
  const savedNumber = request.slip_number?.trim();
  if (savedNumber && /^RQS-[0-9A-F]{8}$/i.test(savedNumber)) {
    return savedNumber.toUpperCase();
  }

  // UUIDs are hexadecimal, so the first 8 characters make a short, stable code.
  const requestId = request.id?.replace(/-/g, '').toUpperCase();
  if (requestId && /^[0-9A-F]{8,}$/.test(requestId)) {
    return `RQS-${requestId.slice(0, 8)}`;
  }

  const date = request.created_at ? new Date(request.created_at) : null;
  const fallbackCode = date && !Number.isNaN(date.getTime())
    ? date.getTime().toString(16).toUpperCase().padStart(8, '0').slice(-8)
    : '00000000';

  return `RQS-${fallbackCode}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '';

  // Keep date-only values from shifting a day because of timezone parsing.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SlipField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'col-span-1 sm:col-span-2' : ''}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="min-h-[24px] border-b border-black px-1 pb-0.5 text-sm font-bold uppercase break-words text-slate-900">
        {value || '\u00A0'}
      </p>
    </div>
  );
}

export default function RequestSlip({
  request,
  className = '',
}: {
  request: RequestSlipData;
  className?: string;
}) {
  return (
    <div className={`border-2 border-black bg-white px-6 py-5 font-sans text-black ${className}`}>
      <div className="text-center leading-snug">
        <p className="text-[9px] font-bold uppercase tracking-widest">Republic of the Philippines</p>
        <p className="text-[9px] font-bold uppercase tracking-widest">Province of Albay</p>
        <p className="text-[9px] font-bold uppercase tracking-widest">Municipality of Oas</p>
        <p className="mt-1 text-xl font-black uppercase tracking-tight">Barangay Maporong</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-y-2 border-black py-2">
        <span className="text-xs font-black uppercase tracking-widest">Request Slip No.</span>
        <span className="font-mono text-lg font-black tracking-wider">{getRequestSlipNumber(request)}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <SlipField label="Name" value={request.full_name} />
        <SlipField label="Age" value={request.age} />
        <SlipField label="Address" value={request.address} />
        <SlipField label="Weight" value={request.weight} />
        <SlipField label="Height" value={request.height} />
        <SlipField label="Capital" value={request.capital} />
        <SlipField label="Business" value={request.business} />
        <SlipField label="Birth Place" value={request.birth_place} />
        <SlipField label="CP No." value={request.cp_no} />
        <SlipField label="Birth Date" value={formatDate(request.birthday)} />
        <SlipField label="Civil Status" value={request.civil_status} />
        <SlipField label="Gender" value={request.sex} />
        <SlipField label="Service requested" value={request.service_type} wide />
        <SlipField label="Purpose" value={request.purpose} wide />
        <SlipField label="Date requested" value={formatDate(request.created_at)} />
      </div>

      <div className="mt-6 border-t-2 border-black pt-5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <SlipField label="Received by" />
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">
              Name and signature / Duty Officer
            </p>
          </div>
          <SlipField label="Date & Time Received" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <SlipField label="Request Approved / Disapproved" />
          <SlipField label="Reason for disapproval" />
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full sm:w-64">
            <div className="h-12 border-b border-black" />
            <p className="mt-1 text-center text-[8px] font-black uppercase tracking-widest text-slate-600">
              Name and Signature
            </p>
            <p className="text-center text-[8px] font-bold uppercase tracking-widest text-slate-500">
              Punong Barangay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
