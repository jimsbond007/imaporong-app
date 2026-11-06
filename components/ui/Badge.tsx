import type { ReactNode } from 'react';

export type RequestStatus = 'pending' | 'ready' | 'received' | 'rejected' | string;

const statusStyles: Record<string, string> = {
  pending: 'bg-pending-bg text-pending-ink border-[#f2dfb6]',
  ready: 'bg-ready-bg text-ready-ink border-[#c4e3d5]',
  received: 'bg-received-bg text-received-ink border-line',
  rejected: 'bg-rejected-bg text-rejected-ink border-[#f1cccc]',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending review',
  ready: 'Ready for pickup',
  received: 'Received',
  rejected: 'Needs attention',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const key = (status || 'pending').toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] ${
        statusStyles[key] ?? statusStyles.pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusLabels[key] ?? key}
    </span>
  );
}

export type BadgeTone = 'neutral' | 'green' | 'sky' | 'gold' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-mist text-muted border-line',
  green: 'bg-mint text-pine border-[#c4e3d5]',
  sky: 'bg-sky text-[#3a6478] border-[#cfe7f1]',
  gold: 'bg-[#fdf3de] text-[#8a6116] border-[#f2dfb6]',
  danger: 'bg-rejected-bg text-rejected-ink border-[#f1cccc]',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
