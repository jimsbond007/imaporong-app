import type { ReactNode } from 'react';

export type RequestStatus = 'pending' | 'ready' | 'received' | 'rejected' | string;

const statusStyles: Record<string, string> = {
  pending: 'bg-pending-bg text-pending-ink border-pending-line',
  ready: 'bg-ready-bg text-ready-ink border-ready-line',
  received: 'bg-received-bg text-received-ink border-line',
  rejected: 'bg-rejected-bg text-rejected-ink border-rejected-line',
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
  green: 'bg-mint text-pine-ink border-ready-line',
  sky: 'bg-sky text-sky-ink border-sky-line',
  gold: 'bg-pending-bg text-pending-ink border-pending-line',
  danger: 'bg-rejected-bg text-rejected-ink border-rejected-line',
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
